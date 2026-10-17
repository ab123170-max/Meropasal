import {
  Shop,
  Category,
  Product,
  ProductVariant,
  Ingredient,
  Order,
  OrderItem,
  Expense,
  HouseholdWithdrawal,
  CustomerCredit,
  FinancialMetrics,
  OrderStatus,
  RecipeItem,
  LpgCylinder,
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

function ensureSupabase() {
  if (!isSupabaseConfigured() || !supabase) {
    throw new DatabaseError(
      'Supabase क्लाउड डाटाबेस जडान भएको छैन। कृपया .env मा VITE_SUPABASE_URL र VITE_SUPABASE_ANON_KEY कन्फिगर गर्नुहोस्।'
    );
  }
  return supabase;
}

// -------------------------------------------------------------
// 1. SHOPS & MEMBERS
// -------------------------------------------------------------

export async function getShop(shopIdOrSlug?: string): Promise<Shop | null> {
  const sb = ensureSupabase();

  let query = sb.from('shops').select('*');
  if (shopIdOrSlug) {
    query = query.or(`id.eq.${shopIdOrSlug},slug.eq.${shopIdOrSlug}`);
  }

  const { data, error } = await query.order('created_at', { ascending: true }).limit(1).maybeSingle();

  if (error) {
    console.error('Error fetching shop:', error);
    throw new DatabaseError(`पसल विवरण तान्न सकिएन: ${error.message}`, error);
  }

  return (data as Shop) || null;
}

export async function getUserShop(userId: string): Promise<Shop | null> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('shop_members')
    .select('shop:shops(*)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user shop:', error);
    return null;
  }

  return (data?.shop as unknown as Shop) || null;
}

export async function createShop(shopData: {
  name: string;
  name_ne?: string;
  phone: string;
  address: string;
  city?: string;
  owner_id: string;
}): Promise<Shop> {
  const sb = ensureSupabase();

  const slug = `${shopData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;

  const { data, error } = await sb
    .from('shops')
    .insert({
      name: shopData.name.trim(),
      name_ne: shopData.name_ne?.trim() || shopData.name.trim(),
      slug,
      owner_id: shopData.owner_id,
      phone: shopData.phone.trim(),
      address: shopData.address.trim(),
      city: shopData.city?.trim() || 'Kathmandu',
      is_open: true,
      is_delivery_enabled: true,
      delivery_fee: 50.00,
      min_order_for_delivery: 150.00,
      is_takeaway_enabled: true,
    })
    .select()
    .single();

  if (error || !data) {
    throw new DatabaseError(`पसल दर्ता गर्न सकिएन: ${error?.message}`, error);
  }

  // Grant owner role in shop_members
  await sb.from('shop_members').insert({
    shop_id: data.id,
    user_id: shopData.owner_id,
    role: 'owner',
  });

  return data as Shop;
}

export async function updateShop(shopId: string, updated: Partial<Shop>): Promise<Shop> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('shops')
    .update({
      ...updated,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shopId)
    .select()
    .single();

  if (error || !data) {
    throw new DatabaseError(`पसल अपडेट गर्न सकिएन: ${error?.message}`, error);
  }

  return data as Shop;
}

// -------------------------------------------------------------
// 2. CATEGORIES
// -------------------------------------------------------------

export async function getCategories(shopId: string): Promise<Category[]> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('categories')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new DatabaseError(`क्याटेगोरी सूची लोड हुन सकेन: ${error.message}`, error);
  }

  return (data || []) as Category[];
}

export async function saveCategory(category: {
  id?: string;
  shop_id: string;
  name: string;
  name_ne?: string;
  sort_order?: number;
}): Promise<Category> {
  const sb = ensureSupabase();

  if (category.id) {
    const { data, error } = await sb
      .from('categories')
      .update({
        name: category.name.trim(),
        name_ne: category.name_ne?.trim() || category.name.trim(),
        sort_order: category.sort_order ?? 0,
      })
      .eq('id', category.id)
      .select()
      .single();

    if (error || !data) throw new DatabaseError(`क्याटेगोरी अपडेट भएन: ${error?.message}`, error);
    return data as Category;
  } else {
    const { data, error } = await sb
      .from('categories')
      .insert({
        shop_id: category.shop_id,
        name: category.name.trim(),
        name_ne: category.name_ne?.trim() || category.name.trim(),
        sort_order: category.sort_order ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) throw new DatabaseError(`नयाँ क्याटेगोरी थप्न सकिएन: ${error?.message}`, error);
    return data as Category;
  }
}

// -------------------------------------------------------------
// 3. PRODUCTS & VARIANTS (Phase 4)
// -------------------------------------------------------------

export async function getProductsWithVariants(shopId: string): Promise<Product[]> {
  const sb = ensureSupabase();

  // Fetch products
  const { data: pData, error: pError } = await sb
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_archived', false)
    .order('sort_order', { ascending: true });

  if (pError) throw new DatabaseError(`खानाको सूची तान्न सकिएन: ${pError.message}`, pError);

  if (!pData || pData.length === 0) return [];

  // Fetch variants
  const { data: vData, error: vError } = await sb
    .from('product_variants')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_archived', false)
    .order('sort_order', { ascending: true });

  if (vError) throw new DatabaseError(`भेरियन्ट सूची लोड भएन: ${vError.message}`, vError);

  const variants = (vData || []) as ProductVariant[];

  return pData.map((prod) => ({
    ...prod,
    variants: variants.filter((v) => v.product_id === prod.id),
  })) as Product[];
}

export async function saveProductWithVariants(
  product: Partial<Product>,
  variants: Array<{
    id?: string;
    name: string;
    name_ne?: string;
    price: number;
    estimated_cost?: number;
    is_available?: boolean;
    sort_order?: number;
    recipes?: RecipeItem[];
  }>
): Promise<Product> {
  const sb = ensureSupabase();

  let savedProduct: Product;

  if (product.id) {
    const { data, error } = await sb
      .from('products')
      .update({
        name: product.name?.trim(),
        name_ne: product.name_ne?.trim() || product.name?.trim(),
        category_id: product.category_id || null,
        description: product.description?.trim() || '',
        image_url: product.image_url,
        is_active: product.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product.id)
      .select()
      .single();

    if (error || !data) throw new DatabaseError(`परिकार अपडेट भएन: ${error?.message}`, error);
    savedProduct = data as Product;
  } else {
    const { data, error } = await sb
      .from('products')
      .insert({
        shop_id: product.shop_id,
        category_id: product.category_id || null,
        name: product.name!.trim(),
        name_ne: product.name_ne?.trim() || product.name!.trim(),
        description: product.description?.trim() || '',
        image_url: product.image_url,
        is_active: product.is_active ?? true,
        is_archived: false,
        sort_order: product.sort_order ?? 0,
      })
      .select()
      .single();

    if (error || !data) throw new DatabaseError(`नयाँ परिकार थप्न सकिएन: ${error?.message}`, error);
    savedProduct = data as Product;
  }

  // Handle variants
  const savedVariants: ProductVariant[] = [];

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    if (v.id) {
      const { data, error } = await sb
        .from('product_variants')
        .update({
          name: v.name.trim(),
          name_ne: v.name_ne?.trim() || v.name.trim(),
          price: v.price,
          estimated_cost: v.estimated_cost ?? 0,
          is_available: v.is_available ?? true,
          sort_order: i + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', v.id)
        .select()
        .single();

      if (!error && data) savedVariants.push(data as ProductVariant);
    } else {
      const { data, error } = await sb
        .from('product_variants')
        .insert({
          shop_id: savedProduct.shop_id,
          product_id: savedProduct.id,
          name: v.name.trim(),
          name_ne: v.name_ne?.trim() || v.name.trim(),
          price: v.price,
          estimated_cost: v.estimated_cost ?? 0,
          is_available: v.is_available ?? true,
          is_archived: false,
          sort_order: i + 1,
        })
        .select()
        .single();

      if (!error && data) savedVariants.push(data as ProductVariant);
    }
  }

  savedProduct.variants = savedVariants;
  return savedProduct;
}

export async function deleteProduct(productId: string): Promise<{ success: boolean; archived: boolean }> {
  const sb = ensureSupabase();

  // Phase 4: Do not allow deleting products referenced by historical orders. Archive instead.
  const { count, error: countErr } = await sb
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (count && count > 0) {
    // Has historical order references -> soft delete / archive
    const { error } = await sb
      .from('products')
      .update({ is_archived: true, is_active: false })
      .eq('id', productId);

    if (error) throw new DatabaseError(`परिकार अभिलेख गर्न सकिएन: ${error.message}`, error);
    return { success: true, archived: true };
  }

  // Not referenced -> hard delete
  const { error } = await sb.from('products').delete().eq('id', productId);
  if (error) throw new DatabaseError(`परिकार मेटाउन सकिएन: ${error.message}`, error);

  return { success: true, archived: false };
}

// -------------------------------------------------------------
// 4. INGREDIENTS & INVENTORY (Phase 5 & 7)
// -------------------------------------------------------------

export async function getIngredients(shopId: string): Promise<Ingredient[]> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('ingredients')
    .select('*')
    .eq('shop_id', shopId)
    .order('name', { ascending: true });

  if (error) throw new DatabaseError(`कच्चा पदार्थ लोड हुन सकेन: ${error.message}`, error);

  return (data || []) as Ingredient[];
}

export async function saveIngredient(ingredient: Partial<Ingredient>): Promise<Ingredient> {
  const sb = ensureSupabase();

  if (ingredient.id) {
    const { data, error } = await sb
      .from('ingredients')
      .update({
        name: ingredient.name?.trim(),
        name_ne: ingredient.name_ne?.trim() || ingredient.name?.trim(),
        unit: ingredient.unit,
        quantity_available: ingredient.quantity_available,
        purchase_cost_per_unit: ingredient.purchase_cost_per_unit,
        min_threshold: ingredient.min_threshold,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ingredient.id)
      .select()
      .single();

    if (error || !data) throw new DatabaseError(`कच्चा पदार्थ अपडेट भएन: ${error?.message}`, error);
    return data as Ingredient;
  } else {
    const { data, error } = await sb
      .from('ingredients')
      .insert({
        shop_id: ingredient.shop_id,
        name: ingredient.name!.trim(),
        name_ne: ingredient.name_ne?.trim() || ingredient.name!.trim(),
        unit: ingredient.unit || 'kg',
        quantity_available: ingredient.quantity_available ?? 0,
        purchase_cost_per_unit: ingredient.purchase_cost_per_unit ?? 0,
        min_threshold: ingredient.min_threshold ?? 1,
      })
      .select()
      .single();

    if (error || !data) throw new DatabaseError(`नयाँ कच्चा पदार्थ थप्न सकिएन: ${error?.message}`, error);
    return data as Ingredient;
  }
}

export async function restockIngredient(params: {
  ingredientId: string;
  addedQuantity: number;
  unitCost: number;
  totalCost: number;
  recordAsExpense: boolean;
}): Promise<void> {
  const sb = ensureSupabase();

  // Use atomic RPC function
  const { data, error } = await sb.rpc('restock_ingredient_secure', {
    p_ingredient_id: params.ingredientId,
    p_quantity: params.addedQuantity,
    p_unit_cost: params.unitCost,
    p_record_expense: params.recordAsExpense,
  });

  if (error) {
    throw new DatabaseError(`स्टक थप्न असफल भयो: ${error.message}`, error);
  }
}

// -------------------------------------------------------------
// 5. CUSTOMER ORDERING & ATOMIC ORDER MANAGEMENT (Phase 5, 6, 7)
// -------------------------------------------------------------

export async function createCustomerOrder(orderInput: {
  shop_id: string;
  order_type: Order['order_type'];
  table_number?: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  customer_notes?: string;
  payment_method: Order['payment_method'];
  items: {
    variant_id: string;
    quantity: number;
    notes?: string;
  }[];
}): Promise<{ order_id: string; order_number: string; total_amount: number }> {
  const sb = ensureSupabase();

  // Call the server-authoritative RPC procedure (Never trust browser submitted prices!)
  const { data, error } = await sb.rpc('place_order_secure', {
    p_shop_id: orderInput.shop_id,
    p_order_type: orderInput.order_type,
    p_customer_name: orderInput.customer_name.trim(),
    p_customer_phone: orderInput.customer_phone.trim(),
    p_delivery_address: orderInput.delivery_address?.trim() || null,
    p_customer_notes: orderInput.customer_notes?.trim() || null,
    p_table_number: orderInput.table_number?.trim() || null,
    p_payment_method: orderInput.payment_method,
    p_items: orderInput.items,
  });

  if (error || !data) {
    throw new DatabaseError(`अर्डर पठाउन असफल भयो: ${error?.message || 'अज्ञात त्रुटि'}`, error);
  }

  return data as { order_id: string; order_number: string; total_amount: number };
}

export const createOrder = createCustomerOrder;

export async function createDirectSale(params: {
  shop_id: string;
  amount: number;
  description: string;
  payment_method?: 'cash' | 'online_qr';
}): Promise<{ order_id: string; order_number: string }> {
  const sb = ensureSupabase();
  const orderNum = `CS-${Date.now().toString().slice(-4)}`;

  const { data: order, error: orderErr } = await sb
    .from('orders')
    .insert({
      shop_id: params.shop_id,
      order_number: orderNum,
      order_type: 'takeaway',
      customer_name: 'काउन्टर ग्राहक',
      customer_phone: '9800000000',
      status: 'completed',
      subtotal: params.amount,
      total_amount: params.amount,
      payment_method: params.payment_method === 'online_qr' ? 'online_qr' : 'cash_on_pickup',
      payment_status: 'paid',
      inventory_deducted: false,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderErr || !order) {
    throw new DatabaseError(`बिक्री रेकर्ड गर्न सकिएन: ${orderErr?.message || 'अज्ञात त्रुटि'}`, orderErr);
  }

  // Insert order item
  await sb.from('order_items').insert({
    order_id: order.id,
    shop_id: params.shop_id,
    item_name: params.description || 'काउन्टर बिक्री',
    variant_name: 'नगद बिक्री',
    unit_price: params.amount,
    quantity: 1,
    total_price: params.amount,
  });

  // Insert sales table entry for direct accounting
  await sb.from('sales').insert({
    shop_id: params.shop_id,
    order_id: order.id,
    total_revenue: params.amount,
    gross_profit: params.amount,
    payment_method: params.payment_method || 'cash',
  });

  return { order_id: order.id, order_number: orderNum };
}

export async function getOrders(shopId: string): Promise<Order[]> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new DatabaseError(`अर्डर सूची लोड हुन सकेन: ${error.message}`, error);
  }

  return (data || []) as Order[];
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', orderId)
    .single();

  if (error) return null;
  return data as Order;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  cancellationReason?: string
): Promise<{ success: boolean; error?: string }> {
  const sb = ensureSupabase();

  // If completing order: use secure RPC to deduct inventory exactly once!
  if (newStatus === 'completed') {
    const { data, error } = await sb.rpc('complete_order_and_deduct_inventory', {
      p_order_id: orderId,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // If cancelling order: use secure RPC to reverse inventory if stock was previously deducted!
  if (newStatus === 'cancelled') {
    const { data, error } = await sb.rpc('cancel_order_with_reversal', {
      p_order_id: orderId,
      p_reason: cancellationReason || 'पसल वा ग्राहकबाट रद्द',
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // Other status changes (accepted, preparing, ready)
  const timestampField =
    newStatus === 'accepted'
      ? 'accepted_at'
      : newStatus === 'preparing'
      ? 'preparing_at'
      : newStatus === 'ready'
      ? 'ready_at'
      : null;

  const updatePayload: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (timestampField) {
    updatePayload[timestampField] = new Date().toISOString();
  }

  const { error } = await sb.from('orders').update(updatePayload).eq('id', orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// -------------------------------------------------------------
// 6. EXPENSES & HOUSEHOLD WITHDRAWALS (Phase 8)
// -------------------------------------------------------------

export async function getExpenses(shopId: string): Promise<Expense[]> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('expenses')
    .select('*')
    .eq('shop_id', shopId)
    .order('expense_date', { ascending: false });

  if (error) throw new DatabaseError(`खर्च सूची लोड भएन: ${error.message}`, error);
  return (data || []) as Expense[];
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('expenses')
    .insert({
      shop_id: expense.shop_id,
      category: expense.category,
      category_ne: expense.category_ne || getCategoryNepali(expense.category),
      amount: expense.amount,
      payment_method: expense.payment_method || 'cash',
      description: expense.description.trim(),
      expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error || !data) throw new DatabaseError(`खर्च सेभ हुन सकेन: ${error?.message}`, error);
  return data as Expense;
}

export async function deleteExpense(expenseId: string): Promise<boolean> {
  const sb = ensureSupabase();
  const { error } = await sb.from('expenses').delete().eq('id', expenseId);
  if (error) throw new DatabaseError(`खर्च मेटाउन सकिएन: ${error.message}`, error);
  return true;
}

export async function getHouseholdWithdrawals(shopId: string): Promise<HouseholdWithdrawal[]> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('household_withdrawals')
    .select('*')
    .eq('shop_id', shopId)
    .order('withdrawal_date', { ascending: false });

  if (error) throw new DatabaseError(`घरखर्च सूची लोड भएन: ${error.message}`, error);
  return (data || []) as HouseholdWithdrawal[];
}

export async function addHouseholdWithdrawal(
  shopId: string,
  amount: number,
  reason?: string,
  date?: string
): Promise<HouseholdWithdrawal> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('household_withdrawals')
    .insert({
      shop_id: shopId,
      amount,
      reason: reason?.trim() || 'व्यक्तिगत/घरखर्च',
      withdrawal_date: date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error || !data) throw new DatabaseError(`घरखर्च सेभ हुन सकेन: ${error?.message}`, error);
  return data as HouseholdWithdrawal;
}

// -------------------------------------------------------------
// 7. CUSTOMER CREDITS & REPAYMENTS (Phase 8)
// -------------------------------------------------------------

export async function getCustomerCredits(shopId: string): Promise<CustomerCredit[]> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('customer_credits')
    .select('*, payments:credit_payments(*)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw new DatabaseError(`उधारो खाता लोड भएन: ${error.message}`, error);
  return (data || []) as CustomerCredit[];
}

export async function addCustomerCredit(credit: {
  shop_id: string;
  order_id?: string;
  customer_name: string;
  customer_phone: string;
  credit_amount: number;
  due_date?: string;
  notes?: string;
}): Promise<CustomerCredit> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('customer_credits')
    .insert({
      shop_id: credit.shop_id,
      order_id: credit.order_id || null,
      customer_name: credit.customer_name.trim(),
      customer_phone: credit.customer_phone.trim(),
      credit_amount: credit.credit_amount,
      paid_amount: 0.00,
      remaining_amount: credit.credit_amount,
      status: 'unpaid',
      due_date: credit.due_date || null,
      notes: credit.notes?.trim() || null,
    })
    .select()
    .single();

  if (error || !data) throw new DatabaseError(`उधारो दर्ता भएन: ${error?.message}`, error);
  return data as CustomerCredit;
}

export async function settleCreditPayment(params: {
  shopId: string;
  creditId: string;
  paymentAmount: number;
  paymentMethod?: string;
  notes?: string;
}): Promise<void> {
  const sb = ensureSupabase();

  // 1. Insert credit payment record
  const { error: payErr } = await sb.from('credit_payments').insert({
    shop_id: params.shopId,
    credit_id: params.creditId,
    payment_amount: params.paymentAmount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: params.paymentMethod || 'cash',
    notes: params.notes || null,
  });

  if (payErr) throw new DatabaseError(`भुक्तानी दर्ता भएन: ${payErr.message}`, payErr);

  // 2. Update remaining amount
  const { data: credit } = await sb
    .from('customer_credits')
    .select('credit_amount, paid_amount')
    .eq('id', params.creditId)
    .single();

  if (credit) {
    const newPaid = Number(credit.paid_amount) + Number(params.paymentAmount);
    const newRemaining = Math.max(0, Number(credit.credit_amount) - newPaid);
    const newStatus = newRemaining <= 0 ? 'settled' : 'partially_paid';

    await sb
      .from('customer_credits')
      .update({
        paid_amount: newPaid,
        remaining_amount: newRemaining,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.creditId);
  }
}

// -------------------------------------------------------------
// 8. REAL FINANCIAL REPORTING ENGINE (Phase 8)
// -------------------------------------------------------------

export function calculateRealFinancialMetrics(
  orders: Order[],
  expenses: Expense[],
  withdrawals: HouseholdWithdrawal[],
  credits: CustomerCredit[],
  period: 'day' | 'week' | 'month' | 'all'
): FinancialMetrics {
  const now = new Date();

  const filterDate = (dateStr: string) => {
    if (period === 'all') return true;
    const d = new Date(dateStr);
    if (period === 'day') {
      return d.toDateString() === now.toDateString();
    }
    if (period === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
      return d >= oneWeekAgo;
    }
    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Only consider real completed orders (Never include cancelled, pending, or fake orders!)
  const completedOrders = orders.filter((o) => o.status === 'completed' && filterDate(o.created_at));
  const totalSales = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  // Real Cost of Goods Sold (COGS)
  let cogs = 0;
  let missingRecipeCount = 0;

  completedOrders.forEach((o) => {
    if (o.estimated_ingredient_cost && o.estimated_ingredient_cost > 0) {
      cogs += Number(o.estimated_ingredient_cost);
    } else {
      missingRecipeCount++;
    }
  });

  const isCogsIncomplete = missingRecipeCount > 0 && completedOrders.length > 0;

  // Operating Expenses (rent, gas, electricity, packaging, etc.)
  // Note: MODULE 4 & 8 rule: Exclude ingredient_purchase from operating expenses to prevent double-counting with COGS!
  const filteredExpenses = expenses.filter((e) => filterDate(e.expense_date || e.created_at));
  const operatingExpenses = filteredExpenses
    .filter((e) => e.category !== 'ingredient_purchase')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Household Withdrawals (घरखर्च - strictly separated from operating expenses!)
  const filteredWithdrawals = withdrawals.filter((w) => filterDate(w.withdrawal_date || w.created_at));
  const householdWithdrawals = filteredWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  // Gross profit = Sales - COGS
  const grossProfit = totalSales - cogs;
  const grossMargin = totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0;

  // Operating profit = Gross profit - Operating expenses
  const operatingProfit = grossProfit - operatingExpenses;
  const operatingMargin = totalSales > 0 ? Math.round((operatingProfit / totalSales) * 100) : 0;

  // Actual Cash In and Cash Out
  const actualCashReceived = completedOrders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const allCashOutExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const actualCashPaidOut = allCashOutExpenses + householdWithdrawals;
  const netCashMovement = actualCashReceived - actualCashPaidOut;

  // Unpaid credit
  const unpaidCreditTotal = credits
    .filter((c) => c.status !== 'settled')
    .reduce((sum, c) => sum + Number(c.remaining_amount), 0);

  return {
    totalSales,
    cogs,
    isCogsIncomplete,
    grossProfit,
    grossMargin,
    operatingExpenses,
    operatingProfit,
    operatingMargin,
    householdWithdrawals,
    actualCashReceived,
    actualCashPaidOut,
    netCashMovement,
    unpaidCreditTotal,
    ordersCount: completedOrders.length,
  };
}

function getCategoryNepali(cat: string): string {
  switch (cat) {
    case 'rent': return 'पसल सटर भाडा';
    case 'gas_electricity': return 'ग्यास र बिजुली';
    case 'packaging': return 'प्याकेजिङ सामान';
    case 'ingredient_purchase': return 'कच्चा पदार्थ खरिद';
    case 'staff_salary': return 'कामदारको तलब';
    case 'repair_maintenance': return 'मर्मत तथा सम्भार';
    default: return 'अन्य खर्च';
  }
}

export const calculateFinancialSummary = calculateRealFinancialMetrics;

// -------------------------------------------------------------
// 9. SMART LPG GAS TRACKER
// -------------------------------------------------------------

export async function getLpgCylinders(shopId: string): Promise<LpgCylinder[]> {
  const sb = ensureSupabase();
  const { data, error } = await sb
    .from('lpg_cylinders')
    .select('*')
    .eq('shop_id', shopId)
    .order('purchase_date', { ascending: false });

  if (error) {
    throw new DatabaseError(`ग्यास सिलिन्डर विवरण लोड हुन सकेन: ${error.message}`, error);
  }
  return (data || []) as LpgCylinder[];
}

export async function addLpgCylinder(params: {
  shop_id: string;
  purchase_date: string;
  finished_date?: string | null;
  refill_cost: number;
  cylinder_size_kg: number;
  quantity_purchased: number;
  notes?: string;
}): Promise<LpgCylinder> {
  const sb = ensureSupabase();

  const { data, error } = await sb
    .from('lpg_cylinders')
    .insert({
      shop_id: params.shop_id,
      purchase_date: params.purchase_date,
      finished_date: params.finished_date || null,
      refill_cost: params.refill_cost,
      cylinder_size_kg: params.cylinder_size_kg || 14.2,
      quantity_purchased: params.quantity_purchased || 1,
      notes: params.notes || null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new DatabaseError(`ग्यास सिलिन्डर रेकर्ड थप्न सकिएन: ${error?.message || 'अज्ञात त्रुटि'}`, error);
  }

  // Automatically log as operating expense under gas_electricity
  await sb.from('expenses').insert({
    shop_id: params.shop_id,
    category: 'gas_electricity',
    category_ne: 'ग्यास र बिजुली (LPG Cylinder Purchase)',
    amount: params.refill_cost,
    payment_method: 'cash',
    description: `LPG ग्यास सिलिन्डर खरिद (${params.cylinder_size_kg || 14.2} kg)`,
    expense_date: params.purchase_date,
  });

  return data as LpgCylinder;
}

export async function updateLpgCylinder(
  id: string,
  params: Partial<LpgCylinder>
): Promise<void> {
  const sb = ensureSupabase();
  const { error } = await sb
    .from('lpg_cylinders')
    .update(params)
    .eq('id', id);

  if (error) {
    throw new DatabaseError(`ग्यास सिलिन्डर विवरण अपडेट गर्न सकिएन: ${error.message}`, error);
  }
}

export async function markLpgFinished(
  id: string,
  finishedDate: string
): Promise<void> {
  const sb = ensureSupabase();
  const { error } = await sb
    .from('lpg_cylinders')
    .update({ finished_date: finishedDate })
    .eq('id', id);

  if (error) {
    throw new DatabaseError(`ग्यास सिलिन्डर समाप्त रूपमा चिन्ह लगाउन सकिएन: ${error.message}`, error);
  }
}

export async function deleteLpgCylinder(id: string): Promise<void> {
  const sb = ensureSupabase();
  const { error } = await sb
    .from('lpg_cylinders')
    .delete()
    .eq('id', id);

  if (error) {
    throw new DatabaseError(`ग्यास सिलिन्डर मेटाउन सकिएन: ${error.message}`, error);
  }
}


