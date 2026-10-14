import {
  Shop,
  Category,
  Product,
  ProductVariant,
  Ingredient,
  Recipe,
  Order,
  OrderItem,
  Expense,
  HouseholdWithdrawal,
  CustomerCredit,
  FinancialMetrics,
  OrderStatus,
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  SHOP: 'meethopasal_shop',
  CATEGORIES: 'meethopasal_categories',
  PRODUCTS: 'meethopasal_products',
  VARIANTS: 'meethopasal_variants',
  INGREDIENTS: 'meethopasal_ingredients',
  RECIPES: 'meethopasal_recipes',
  ORDERS: 'meethopasal_orders',
  EXPENSES: 'meethopasal_expenses',
  WITHDRAWALS: 'meethopasal_withdrawals',
  CREDITS: 'meethopasal_credits',
  INITIALIZED: 'meethopasal_seed_initialized_v2',
};

// Initial realistic Nepali street-food shop seed data
const DEFAULT_SHOP: Shop = {
  id: 'shop-ktm-001',
  slug: 'mamako-chatpate',
  name: "Mama's Momo & Chatpate Center",
  name_ne: 'मामाको मम तथा चटपटे सेन्टर',
  tagline: 'काठमाडौँको प्रख्यात स्वादिलो चटपटे, पानीपुरी र तात्तातो मम!',
  phone: '9841234567',
  whatsapp_number: '9779841234567',
  address: 'Basantapur Chowk, Kathmandu',
  city: 'Kathmandu',
  is_open: true,
  is_delivery_enabled: true,
  delivery_fee: 50,
  min_order_for_delivery: 150,
  is_takeaway_enabled: true,
  is_online_payment_enabled: true,
  online_payment_qr_url: 'https://images.unsplash.com/photo-1595079672139-54710474aa04?auto=format&fit=crop&w=400&q=80',
  online_payment_instructions: 'eSewa वा Khalti बाट QR स्क्यान गरी अर्डर नम्बर लेखेर पठाउनुहोस्।',
  created_at: new Date().toISOString(),
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', shop_id: 'shop-ktm-001', name: 'Chatpate & Pani Puri', name_ne: 'चटपटे र पानीपुरी', sort_order: 1, is_active: true },
  { id: 'cat-2', shop_id: 'shop-ktm-001', name: 'Steaming Momo', name_ne: 'तातो मम', sort_order: 2, is_active: true },
  { id: 'cat-3', shop_id: 'shop-ktm-001', name: 'Chowmein & Khaja', name_ne: 'चाउमिन र खाजा', sort_order: 3, is_active: true },
  { id: 'cat-4', shop_id: 'shop-ktm-001', name: 'Tea & Cold Drinks', name_ne: 'चिया र पेय पदार्थ', sort_order: 4, is_active: true },
];

const DEFAULT_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', shop_id: 'shop-ktm-001', name: 'Potatoes (आलु)', name_ne: 'आलु', unit: 'kg', quantity_available: 18.5, purchase_cost_per_unit: 45, min_threshold: 5, updated_at: new Date().toISOString() },
  { id: 'ing-2', shop_id: 'shop-ktm-001', name: 'Onions (प्याज)', name_ne: 'प्याज', unit: 'kg', quantity_available: 12.0, purchase_cost_per_unit: 80, min_threshold: 4, updated_at: new Date().toISOString() },
  { id: 'ing-3', shop_id: 'shop-ktm-001', name: 'Chicken (कुखुराको मासु)', name_ne: 'कुखुराको मासु', unit: 'kg', quantity_available: 4.5, purchase_cost_per_unit: 340, min_threshold: 3, updated_at: new Date().toISOString() },
  { id: 'ing-4', shop_id: 'shop-ktm-001', name: 'Cooking Oil (तोरीको तेल)', name_ne: 'तोरीको तेल', unit: 'litre', quantity_available: 8.0, purchase_cost_per_unit: 260, min_threshold: 3, updated_at: new Date().toISOString() },
  { id: 'ing-5', shop_id: 'shop-ktm-001', name: 'Puffed Rice (भुजा/मुरै)', name_ne: 'भुजा', unit: 'kg', quantity_available: 7.0, purchase_cost_per_unit: 90, min_threshold: 2, updated_at: new Date().toISOString() },
  { id: 'ing-6', shop_id: 'shop-ktm-001', name: 'Flour (मैदा/आटा)', name_ne: 'मैदा', unit: 'kg', quantity_available: 15.0, purchase_cost_per_unit: 75, min_threshold: 5, updated_at: new Date().toISOString() },
  { id: 'ing-7', shop_id: 'shop-ktm-001', name: 'Chowmein Noodles (चाउमिन)', name_ne: 'काँचो चाउमिन', unit: 'kg', quantity_available: 9.0, purchase_cost_per_unit: 110, min_threshold: 3, updated_at: new Date().toISOString() },
  { id: 'ing-8', shop_id: 'shop-ktm-001', name: 'Spices Mix (चटपटे मसला/धनिया)', name_ne: 'मसला र खुर्सानी', unit: 'packet', quantity_available: 14.0, purchase_cost_per_unit: 35, min_threshold: 5, updated_at: new Date().toISOString() },
  { id: 'ing-9', shop_id: 'shop-ktm-001', name: 'Takeaway Box & Bag (प्याकिङ सामान)', name_ne: 'प्याकेजिङ बक्स', unit: 'piece', quantity_available: 65, purchase_cost_per_unit: 8, min_threshold: 20, updated_at: new Date().toISOString() },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    shop_id: 'shop-ktm-001',
    category_id: 'cat-1',
    name: 'Special Chatpate',
    name_ne: 'चटपटे',
    description: 'भुजा, आलु, प्याज, चना, कागती र स्पेशल मसला मिसाइएको कुरकुरे नेपाली स्वाद।',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'prod-2',
    shop_id: 'shop-ktm-001',
    category_id: 'cat-1',
    name: 'Crispy Pani Puri',
    name_ne: 'पानीपुरी',
    description: 'क्रन्ची पुरीमा पिरो-अमिलो पुदिना र जिरा पानीको उत्कृष्ट स्वाद।',
    image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'prod-3',
    shop_id: 'shop-ktm-001',
    category_id: 'cat-2',
    name: 'Steamed & Jhol Momo',
    name_ne: 'मम (Momo)',
    description: 'घरमा हातले बनाइएको स्वादिलो किमा र स्पेशल तिल-टमाटरको अचार/झोल।',
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    sort_order: 3,
  },
  {
    id: 'prod-4',
    shop_id: 'shop-ktm-001',
    category_id: 'cat-3',
    name: 'Nepali Street Chowmein',
    name_ne: 'चाउमिन',
    description: 'तातो कराहीमा भुटिएको ताजा तरकारी र चिकेनसहितको चाउमिन।',
    image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    sort_order: 4,
  },
  {
    id: 'prod-5',
    shop_id: 'shop-ktm-001',
    category_id: 'cat-4',
    name: 'Masala Milk Tea',
    name_ne: 'स्पेशल मसला चिया',
    description: 'ल्वाङ, सुकमेल, अदुवा र ताजा दूध हालेर पकाइएको तातो चिया।',
    image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    sort_order: 5,
  },
];

const DEFAULT_VARIANTS: ProductVariant[] = [
  // Chatpate variants
  { id: 'var-1', shop_id: 'shop-ktm-001', product_id: 'prod-1', name: 'Sada Chatpate', name_ne: 'सादा चटपटे', price: 60, estimated_cost: 16, is_available: true, sort_order: 1 },
  { id: 'var-2', shop_id: 'shop-ktm-001', product_id: 'prod-1', name: 'Gilo Chatpate', name_ne: 'गिलो चटपटे (स्पेशल झोल)', price: 70, estimated_cost: 18, is_available: true, sort_order: 2 },
  { id: 'var-3', shop_id: 'shop-ktm-001', product_id: 'prod-1', name: 'Chicken Chatpate', name_ne: 'चिकेन चटपटे', price: 110, estimated_cost: 38, is_available: true, sort_order: 3 },
  { id: 'var-4', shop_id: 'shop-ktm-001', product_id: 'prod-1', name: 'Special Dry Fruits Chatpate', name_ne: 'स्पेशल बदाम/ड्राईफ्रूट चटपटे', price: 120, estimated_cost: 42, is_available: true, sort_order: 4 },

  // Pani Puri variants
  { id: 'var-5', shop_id: 'shop-ktm-001', product_id: 'prod-2', name: 'Regular Pani Puri (8 pcs)', name_ne: 'साधारण पानीपुरी (८ पिस)', price: 60, estimated_cost: 15, is_available: true, sort_order: 1 },
  { id: 'var-6', shop_id: 'shop-ktm-001', product_id: 'prod-2', name: 'Dahi Puri (6 pcs)', name_ne: 'दही पुरी (६ पिस)', price: 100, estimated_cost: 28, is_available: true, sort_order: 2 },

  // Momo variants
  { id: 'var-7', shop_id: 'shop-ktm-001', product_id: 'prod-3', name: 'Veg Steam Momo (10 pcs)', name_ne: 'भेज स्टिम मम (१० पिस)', price: 110, estimated_cost: 32, is_available: true, sort_order: 1 },
  { id: 'var-8', shop_id: 'shop-ktm-001', product_id: 'prod-3', name: 'Chicken Steam Momo (10 pcs)', name_ne: 'चिकेन स्टिम मम (१० पिस)', price: 160, estimated_cost: 58, is_available: true, sort_order: 2 },
  { id: 'var-9', shop_id: 'shop-ktm-001', product_id: 'prod-3', name: 'Chicken Fried Momo (10 pcs)', name_ne: 'चिकेन फ्राइड मम (१० पिस)', price: 180, estimated_cost: 68, is_available: true, sort_order: 3 },
  { id: 'var-10', shop_id: 'shop-ktm-001', product_id: 'prod-3', name: 'Chicken Jhol Momo (10 pcs)', name_ne: 'चिकेन झोल मम (१० पिस)', price: 190, estimated_cost: 72, is_available: true, sort_order: 4 },

  // Chowmein variants
  { id: 'var-11', shop_id: 'shop-ktm-001', product_id: 'prod-4', name: 'Veg Chowmein', name_ne: 'भेज चाउमिन', price: 100, estimated_cost: 28, is_available: true, sort_order: 1 },
  { id: 'var-12', shop_id: 'shop-ktm-001', product_id: 'prod-4', name: 'Chicken Chowmein', name_ne: 'चिकेन चाउमिन', price: 160, estimated_cost: 55, is_available: true, sort_order: 2 },

  // Tea
  { id: 'var-13', shop_id: 'shop-ktm-001', product_id: 'prod-5', name: 'Full Cup Masala Tea', name_ne: 'स्पेशल कप मसला चिया', price: 30, estimated_cost: 9, is_available: true, sort_order: 1 },
];

// Recipes mapping
const DEFAULT_RECIPES: Recipe[] = [
  // Sada Chatpate -> Puffed rice, onion, potato, spices
  { id: 'rec-1', shop_id: 'shop-ktm-001', variant_id: 'var-1', ingredient_id: 'ing-5', quantity_needed: 0.08 }, // 80g bhuja
  { id: 'rec-2', shop_id: 'shop-ktm-001', variant_id: 'var-1', ingredient_id: 'ing-2', quantity_needed: 0.04 }, // 40g onion
  { id: 'rec-3', shop_id: 'shop-ktm-001', variant_id: 'var-1', ingredient_id: 'ing-1', quantity_needed: 0.05 }, // 50g potato
  { id: 'rec-4', shop_id: 'shop-ktm-001', variant_id: 'var-1', ingredient_id: 'ing-8', quantity_needed: 0.1 },  // spices packet
  // Chicken Chatpate
  { id: 'rec-5', shop_id: 'shop-ktm-001', variant_id: 'var-3', ingredient_id: 'ing-5', quantity_needed: 0.08 },
  { id: 'rec-6', shop_id: 'shop-ktm-001', variant_id: 'var-3', ingredient_id: 'ing-3', quantity_needed: 0.06 }, // 60g chicken
  { id: 'rec-7', shop_id: 'shop-ktm-001', variant_id: 'var-3', ingredient_id: 'ing-2', quantity_needed: 0.04 },
  // Chicken Steam Momo
  { id: 'rec-8', shop_id: 'shop-ktm-001', variant_id: 'var-8', ingredient_id: 'ing-3', quantity_needed: 0.12 }, // 120g chicken
  { id: 'rec-9', shop_id: 'shop-ktm-001', variant_id: 'var-8', ingredient_id: 'ing-2', quantity_needed: 0.05 }, // 50g onion
  { id: 'rec-10', shop_id: 'shop-ktm-001', variant_id: 'var-8', ingredient_id: 'ing-6', quantity_needed: 0.10 }, // 100g flour
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord-101',
    shop_id: 'shop-ktm-001',
    order_number: 'MP-101',
    order_type: 'takeaway',
    customer_name: 'Bikash Shrestha',
    customer_phone: '9801234567',
    status: 'pending',
    subtotal: 350,
    delivery_fee: 0,
    discount: 0,
    total_amount: 350,
    payment_method: 'cash_on_pickup',
    payment_status: 'pending',
    inventory_deducted: false,
    estimated_ingredient_cost: 110,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    items: [
      { id: 'item-1', order_id: 'ord-101', shop_id: 'shop-ktm-001', product_id: 'prod-3', variant_id: 'var-8', item_name: 'Steamed & Jhol Momo', variant_name: 'Chicken Steam Momo (10 pcs)', unit_price: 160, quantity: 1, total_price: 160 },
      { id: 'item-2', order_id: 'ord-101', shop_id: 'shop-ktm-001', product_id: 'prod-3', variant_id: 'var-10', item_name: 'Steamed & Jhol Momo', variant_name: 'Chicken Jhol Momo (10 pcs)', unit_price: 190, quantity: 1, total_price: 190 },
    ],
  },
  {
    id: 'ord-102',
    shop_id: 'shop-ktm-001',
    order_number: 'MP-102',
    order_type: 'delivery',
    customer_name: 'Anita Gurung',
    customer_phone: '9847123987',
    delivery_address: 'New Road, Near Pipal Bot, Flat 2B',
    customer_notes: 'अलि बढी पिरो र अमिलो बनाइदिनुहोला।',
    status: 'preparing',
    subtotal: 230,
    delivery_fee: 50,
    discount: 0,
    total_amount: 280,
    payment_method: 'cash_on_delivery',
    payment_status: 'pending',
    inventory_deducted: false,
    estimated_ingredient_cost: 56,
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    items: [
      { id: 'item-3', order_id: 'ord-102', shop_id: 'shop-ktm-001', product_id: 'prod-1', variant_id: 'var-3', item_name: 'Special Chatpate', variant_name: 'Chicken Chatpate', unit_price: 110, quantity: 1, total_price: 110 },
      { id: 'item-4', order_id: 'ord-102', shop_id: 'shop-ktm-001', product_id: 'prod-2', variant_id: 'var-5', item_name: 'Crispy Pani Puri', variant_name: 'Regular Pani Puri (8 pcs)', unit_price: 60, quantity: 2, total_price: 120 },
    ],
  },
  {
    id: 'ord-103',
    shop_id: 'shop-ktm-001',
    order_number: 'MP-103',
    order_type: 'dine_in',
    table_number: '3',
    customer_name: 'Ramesh Thapa',
    customer_phone: '9812984512',
    status: 'completed',
    subtotal: 420,
    delivery_fee: 0,
    discount: 0,
    total_amount: 420,
    payment_method: 'online_qr',
    payment_status: 'paid',
    inventory_deducted: true,
    estimated_ingredient_cost: 135,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: 'item-5', order_id: 'ord-103', shop_id: 'shop-ktm-001', product_id: 'prod-4', variant_id: 'var-12', item_name: 'Nepali Street Chowmein', variant_name: 'Chicken Chowmein', unit_price: 160, quantity: 2, total_price: 320 },
      { id: 'item-6', order_id: 'ord-103', shop_id: 'shop-ktm-001', product_id: 'prod-2', variant_id: 'var-6', item_name: 'Crispy Pani Puri', variant_name: 'Dahi Puri (6 pcs)', unit_price: 100, quantity: 1, total_price: 100 },
    ],
  },
];

const DEFAULT_EXPENSES: Expense[] = [
  { id: 'exp-1', shop_id: 'shop-ktm-001', category: 'gas_electricity', category_ne: 'ग्यास र बत्ती', amount: 1900, payment_method: 'cash', description: 'सुगम ग्यास सिलिन्डर १ थान', expense_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'exp-2', shop_id: 'shop-ktm-001', category: 'packaging', category_ne: 'प्याकेजिङ', amount: 480, payment_method: 'cash', description: 'टेकअवे बक्स ५० वटा र प्लास्टिक झोला', expense_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'exp-3', shop_id: 'shop-ktm-001', category: 'rent', category_ne: 'पसल सटर भाडा', amount: 8000, payment_method: 'bank', description: 'साप्ताहिक सटर भाडा किस्ता', expense_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], created_at: new Date().toISOString() },
];

const DEFAULT_WITHDRAWALS: HouseholdWithdrawal[] = [
  { id: 'wth-1', shop_id: 'shop-ktm-001', amount: 800, reason: 'घरको तरकारी र नानीको दूध खर्च', withdrawal_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
];

const DEFAULT_CREDITS: CustomerCredit[] = [
  {
    id: 'crd-1',
    shop_id: 'shop-ktm-001',
    customer_name: 'Suresh Dai (Pharmacy)',
    customer_phone: '9841009988',
    credit_amount: 320,
    paid_amount: 100,
    remaining_amount: 220,
    status: 'partially_paid',
    due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    notes: '२ प्लेट मम र १ बोतल पानी',
    created_at: new Date().toISOString(),
  },
];

// Initialize LocalStorage with default seeds if empty
export function initLocalStorageDemo() {
  if (typeof window === 'undefined') return;

  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInitialized) {
    localStorage.setItem(STORAGE_KEYS.SHOP, JSON.stringify(DEFAULT_SHOP));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.VARIANTS, JSON.stringify(DEFAULT_VARIANTS));
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(DEFAULT_INGREDIENTS));
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(DEFAULT_RECIPES));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(DEFAULT_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(DEFAULT_WITHDRAWALS));
    localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(DEFAULT_CREDITS));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

// Ensure demo data is loaded
initLocalStorageDemo();

// Helper to read from local storage safely
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

// -------------------------------------------------------------
// REPOSITORY METHODS (Transparent fallback to LocalStorage if Supabase unavailable)
// -------------------------------------------------------------

export async function getShop(): Promise<Shop> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('shops').select('*').limit(1).single();
    if (!error && data) return data as Shop;
  }
  return getLocalItem<Shop>(STORAGE_KEYS.SHOP, DEFAULT_SHOP);
}

export async function updateShop(updated: Partial<Shop>): Promise<Shop> {
  if (isSupabaseConfigured() && supabase) {
    const current = await getShop();
    const { data, error } = await supabase
      .from('shops')
      .update(updated)
      .eq('id', current.id)
      .select()
      .single();
    if (!error && data) return data as Shop;
  }
  const current = getLocalItem<Shop>(STORAGE_KEYS.SHOP, DEFAULT_SHOP);
  const next = { ...current, ...updated, updated_at: new Date().toISOString() };
  setLocalItem(STORAGE_KEYS.SHOP, next);
  return next;
}

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    if (!error && data && data.length > 0) return data as Category[];
  }
  return getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
}

export async function getProductsWithVariants(): Promise<Product[]> {
  let products: Product[] = [];
  let variants: ProductVariant[] = [];

  if (isSupabaseConfigured() && supabase) {
    const { data: pData } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
    const { data: vData } = await supabase.from('product_variants').select('*').order('sort_order', { ascending: true });
    if (pData && pData.length > 0) {
      products = pData as Product[];
      variants = (vData || []) as ProductVariant[];
    }
  }

  if (products.length === 0) {
    products = getLocalItem<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    variants = getLocalItem<ProductVariant[]>(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
  }

  // Nest variants into products
  return products.map((prod) => ({
    ...prod,
    variants: variants.filter((v) => v.product_id === prod.id),
  }));
}

export async function saveProduct(product: Partial<Product>, variants: Partial<ProductVariant>[]): Promise<Product> {
  const currentProducts = getLocalItem<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  const currentVariants = getLocalItem<ProductVariant[]>(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);

  let targetProduct: Product;
  let updatedProducts: Product[];

  if (product.id) {
    targetProduct = { ...currentProducts.find(p => p.id === product.id)!, ...product } as Product;
    updatedProducts = currentProducts.map(p => (p.id === product.id ? targetProduct : p));
  } else {
    targetProduct = {
      id: `prod-${Date.now()}`,
      shop_id: product.shop_id || 'shop-ktm-001',
      name: product.name || 'नयाँ परिकार',
      name_ne: product.name_ne || product.name || 'नयाँ परिकार',
      category_id: product.category_id,
      description: product.description || '',
      image_url: product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      is_active: product.is_active ?? true,
      sort_order: (currentProducts.length + 1),
    };
    updatedProducts = [targetProduct, ...currentProducts];
  }

  // Save product
  setLocalItem(STORAGE_KEYS.PRODUCTS, updatedProducts);

  // Update or insert variants
  const remainingVariants = currentVariants.filter(v => v.product_id !== targetProduct.id);
  const savedVariants: ProductVariant[] = variants.map((v, idx) => ({
    id: v.id || `var-${Date.now()}-${idx}`,
    shop_id: targetProduct.shop_id,
    product_id: targetProduct.id,
    name: v.name || 'सादा',
    name_ne: v.name_ne || v.name,
    price: Number(v.price) || 0,
    estimated_cost: Number(v.estimated_cost) || 0,
    is_available: v.is_available ?? true,
    sort_order: idx + 1,
  }));

  setLocalItem(STORAGE_KEYS.VARIANTS, [...remainingVariants, ...savedVariants]);

  targetProduct.variants = savedVariants;
  return targetProduct;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const products = getLocalItem<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  const variants = getLocalItem<ProductVariant[]>(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);

  setLocalItem(STORAGE_KEYS.PRODUCTS, products.filter(p => p.id !== productId));
  setLocalItem(STORAGE_KEYS.VARIANTS, variants.filter(v => v.product_id !== productId));
  return true;
}

export async function getIngredients(): Promise<Ingredient[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('ingredients').select('*').order('name', { ascending: true });
    if (!error && data && data.length > 0) return data as Ingredient[];
  }
  return getLocalItem<Ingredient[]>(STORAGE_KEYS.INGREDIENTS, DEFAULT_INGREDIENTS);
}

export async function saveIngredient(ingredient: Partial<Ingredient>): Promise<Ingredient> {
  const current = getLocalItem<Ingredient[]>(STORAGE_KEYS.INGREDIENTS, DEFAULT_INGREDIENTS);
  let saved: Ingredient;

  if (ingredient.id) {
    saved = { ...current.find(i => i.id === ingredient.id)!, ...ingredient, updated_at: new Date().toISOString() } as Ingredient;
    const next = current.map(i => (i.id === ingredient.id ? saved : i));
    setLocalItem(STORAGE_KEYS.INGREDIENTS, next);
  } else {
    saved = {
      id: `ing-${Date.now()}`,
      shop_id: 'shop-ktm-001',
      name: ingredient.name || 'नयाँ सामान',
      name_ne: ingredient.name_ne || ingredient.name,
      unit: ingredient.unit || 'kg',
      quantity_available: Number(ingredient.quantity_available) || 0,
      purchase_cost_per_unit: Number(ingredient.purchase_cost_per_unit) || 0,
      min_threshold: Number(ingredient.min_threshold) || 1,
      updated_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.INGREDIENTS, [saved, ...current]);
  }
  return saved;
}

export async function restockIngredient(params: {
  ingredientId: string;
  addedQuantity: number;
  unitCost: number;
  totalCost: number;
  recordAsExpense: boolean;
}): Promise<void> {
  const ingredients = getLocalItem<Ingredient[]>(STORAGE_KEYS.INGREDIENTS, DEFAULT_INGREDIENTS);
  const target = ingredients.find(i => i.id === params.ingredientId);
  if (!target) return;

  target.quantity_available = Number((Number(target.quantity_available) + Number(params.addedQuantity)).toFixed(2));
  target.purchase_cost_per_unit = Number(params.unitCost);
  target.updated_at = new Date().toISOString();

  setLocalItem(STORAGE_KEYS.INGREDIENTS, ingredients);

  // If owner chose to record as expense, add to expenses
  if (params.recordAsExpense && params.totalCost > 0) {
    await addExpense({
      category: 'ingredient_purchase',
      category_ne: 'कच्चा पदार्थ खरिद',
      amount: params.totalCost,
      description: `${target.name} (${params.addedQuantity} ${target.unit}) खरिद`,
      payment_method: 'cash',
      expense_date: new Date().toISOString().split('T')[0],
    });
  }
}

export async function getRecipes(): Promise<Recipe[]> {
  return getLocalItem<Recipe[]>(STORAGE_KEYS.RECIPES, DEFAULT_RECIPES);
}

// -------------------------------------------------------------
// ORDERS & STOCK AUTOMATION (Prevents duplicate deductions!)
// -------------------------------------------------------------

export async function getOrders(): Promise<Order[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map((o: any) => ({
        ...o,
        items: o.order_items || [],
      })) as Order[];
    }
  }
  return getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
}

export async function createOrder(orderInput: {
  shop_id?: string;
  order_type: Order['order_type'];
  table_number?: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  customer_notes?: string;
  items: {
    product_id: string;
    variant_id: string;
    item_name: string;
    variant_name: string;
    unit_price: number;
    quantity: number;
  }[];
  payment_method: Order['payment_method'];
}): Promise<Order> {
  const currentOrders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  const shop = await getShop();

  const subtotal = orderInput.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const delivery_fee = orderInput.order_type === 'delivery' ? shop.delivery_fee : 0;
  const total_amount = subtotal + delivery_fee;

  // Calculate estimated ingredient cost from variants
  const variants = getLocalItem<ProductVariant[]>(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
  let estCogs = 0;
  orderInput.items.forEach((item) => {
    const v = variants.find(variant => variant.id === item.variant_id);
    if (v && v.estimated_cost) {
      estCogs += v.estimated_cost * item.quantity;
    }
  });

  const orderNumCode = Math.floor(100 + Math.random() * 900);
  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    shop_id: orderInput.shop_id || shop.id,
    order_number: `MP-${orderNumCode}`,
    order_type: orderInput.order_type,
    table_number: orderInput.table_number,
    customer_name: orderInput.customer_name.trim(),
    customer_phone: orderInput.customer_phone.trim(),
    delivery_address: orderInput.delivery_address?.trim(),
    customer_notes: orderInput.customer_notes?.trim(),
    status: 'pending',
    subtotal,
    delivery_fee,
    discount: 0,
    total_amount,
    payment_method: orderInput.payment_method,
    payment_status: orderInput.payment_method === 'online_qr' ? 'paid' : 'pending',
    inventory_deducted: false,
    estimated_ingredient_cost: estCogs,
    created_at: new Date().toISOString(),
    items: orderInput.items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      order_id: `ord-${Date.now()}`,
      shop_id: shop.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      item_name: item.item_name,
      variant_name: item.variant_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      total_price: item.unit_price * item.quantity,
    })),
  };

  const updatedOrders = [newOrder, ...currentOrders];
  setLocalItem(STORAGE_KEYS.ORDERS, updatedOrders);

  return newOrder;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  cancellationReason?: string
): Promise<{ success: boolean; error?: string; order?: Order }> {
  try {
    const orders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
    const target = orders.find(o => o.id === orderId);

    if (!target) {
      return { success: false, error: 'अर्डर फेला परेन (Order not found).' };
    }

    target.status = newStatus;
    if (cancellationReason) {
      target.cancellation_reason = cancellationReason;
    }

    // If order is completed, mark as paid if not already
    if (newStatus === 'completed') {
      if (target.payment_status === 'pending') {
        target.payment_status = 'paid';
      }

      // CRITICAL: Deduct inventory stock according to recipe ONLY ONCE!
      if (!target.inventory_deducted) {
        deductStockForOrder(target);
        target.inventory_deducted = true;
      }
    }

    setLocalItem(STORAGE_KEYS.ORDERS, orders);
    return { success: true, order: target };
  } catch (err: any) {
    console.error('Failed to update order status:', err);
    return { success: false, error: err.message || 'अर्डर स्थिति अपडेट गर्न असफल भयो।' };
  }
}

// Deduct inventory ingredients based on recipes
function deductStockForOrder(order: Order) {
  const recipes = getLocalItem<Recipe[]>(STORAGE_KEYS.RECIPES, DEFAULT_RECIPES);
  const ingredients = getLocalItem<Ingredient[]>(STORAGE_KEYS.INGREDIENTS, DEFAULT_INGREDIENTS);

  let modified = false;

  order.items.forEach((item) => {
    if (!item.variant_id) return;
    const itemRecipes = recipes.filter(r => r.variant_id === item.variant_id);

    itemRecipes.forEach((recipe) => {
      const ing = ingredients.find(i => i.id === recipe.ingredient_id);
      if (ing) {
        const requiredQty = recipe.quantity_needed * item.quantity;
        // Reduce stock without letting it become negative or capping at 0
        ing.quantity_available = Math.max(0, Number((Number(ing.quantity_available) - requiredQty).toFixed(2)));
        ing.updated_at = new Date().toISOString();
        modified = true;
      }
    });
  });

  if (modified) {
    setLocalItem(STORAGE_KEYS.INGREDIENTS, ingredients);
  }
}

// -------------------------------------------------------------
// EXPENSES & CASH WITHDRAWALS (MODULE 4)
// -------------------------------------------------------------

export async function getExpenses(): Promise<Expense[]> {
  return getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
}

export async function addExpense(expenseInput: Omit<Expense, 'id' | 'created_at' | 'shop_id'>): Promise<Expense> {
  const current = getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  const newExp: Expense = {
    id: `exp-${Date.now()}`,
    shop_id: 'shop-ktm-001',
    category: expenseInput.category,
    category_ne: expenseInput.category_ne || getCategoryNepali(expenseInput.category),
    amount: Number(expenseInput.amount),
    payment_method: expenseInput.payment_method || 'cash',
    description: expenseInput.description.trim(),
    expense_date: expenseInput.expense_date || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  };

  const next = [newExp, ...current];
  setLocalItem(STORAGE_KEYS.EXPENSES, next);
  return newExp;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const current = getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  setLocalItem(STORAGE_KEYS.EXPENSES, current.filter(e => e.id !== id));
  return true;
}

export async function getHouseholdWithdrawals(): Promise<HouseholdWithdrawal[]> {
  return getLocalItem<HouseholdWithdrawal[]>(STORAGE_KEYS.WITHDRAWALS, DEFAULT_WITHDRAWALS);
}

export async function addHouseholdWithdrawal(amount: number, reason?: string, date?: string): Promise<HouseholdWithdrawal> {
  const current = getLocalItem<HouseholdWithdrawal[]>(STORAGE_KEYS.WITHDRAWALS, DEFAULT_WITHDRAWALS);
  const newW: HouseholdWithdrawal = {
    id: `wth-${Date.now()}`,
    shop_id: 'shop-ktm-001',
    amount: Number(amount),
    reason: reason?.trim() || 'व्यक्तिगत/घरखर्च',
    withdrawal_date: date || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  };

  const next = [newW, ...current];
  setLocalItem(STORAGE_KEYS.WITHDRAWALS, next);
  return newW;
}

// -------------------------------------------------------------
// CUSTOMER CREDITS (उधारो खाता)
// -------------------------------------------------------------

export async function getCustomerCredits(): Promise<CustomerCredit[]> {
  return getLocalItem<CustomerCredit[]>(STORAGE_KEYS.CREDITS, DEFAULT_CREDITS);
}

export async function addCustomerCredit(credit: Omit<CustomerCredit, 'id' | 'created_at' | 'shop_id' | 'remaining_amount' | 'status'>): Promise<CustomerCredit> {
  const current = getLocalItem<CustomerCredit[]>(STORAGE_KEYS.CREDITS, DEFAULT_CREDITS);
  const remaining = Number(credit.credit_amount) - Number(credit.paid_amount || 0);

  const newCredit: CustomerCredit = {
    id: `crd-${Date.now()}`,
    shop_id: 'shop-ktm-001',
    customer_name: credit.customer_name.trim(),
    customer_phone: credit.customer_phone.trim(),
    credit_amount: Number(credit.credit_amount),
    paid_amount: Number(credit.paid_amount || 0),
    remaining_amount: Math.max(0, remaining),
    status: remaining <= 0 ? 'settled' : credit.paid_amount > 0 ? 'partially_paid' : 'unpaid',
    due_date: credit.due_date,
    notes: credit.notes?.trim(),
    created_at: new Date().toISOString(),
  };

  const next = [newCredit, ...current];
  setLocalItem(STORAGE_KEYS.CREDITS, next);
  return newCredit;
}

export async function settleCreditPayment(creditId: string, payAmount: number): Promise<CustomerCredit | null> {
  const current = getLocalItem<CustomerCredit[]>(STORAGE_KEYS.CREDITS, DEFAULT_CREDITS);
  const target = current.find(c => c.id === creditId);
  if (!target) return null;

  target.paid_amount = Number((Number(target.paid_amount) + Number(payAmount)).toFixed(2));
  target.remaining_amount = Math.max(0, Number((Number(target.credit_amount) - target.paid_amount).toFixed(2)));
  target.status = target.remaining_amount <= 0 ? 'settled' : 'partially_paid';

  setLocalItem(STORAGE_KEYS.CREDITS, current);
  return target;
}

// -------------------------------------------------------------
// FINANCIAL ENGINE (MODULE 4)
// -------------------------------------------------------------

export function calculateFinancialSummary(period: 'day' | 'week' | 'month' | 'all'): FinancialMetrics {
  const orders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  const expenses = getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  const withdrawals = getLocalItem<HouseholdWithdrawal[]>(STORAGE_KEYS.WITHDRAWALS, DEFAULT_WITHDRAWALS);
  const credits = getLocalItem<CustomerCredit[]>(STORAGE_KEYS.CREDITS, DEFAULT_CREDITS);

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

  // Filter completed sales
  const completedOrders = orders.filter(o => o.status === 'completed' && filterDate(o.created_at));
  const totalSales = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  // Cost of ingredients used (COGS)
  let cogs = 0;
  let missingRecipeCount = 0;

  completedOrders.forEach((o) => {
    if (o.estimated_ingredient_cost && o.estimated_ingredient_cost > 0) {
      cogs += Number(o.estimated_ingredient_cost);
    } else {
      missingRecipeCount++;
    }
  });

  const isCogsIncomplete = missingRecipeCount > 0;

  // Operating Expenses (rent, gas, packing, other) - excludes ingredient_purchase to avoid double counting!
  // Note: MODULE 4 strictly says: "Do not subtract the same ingredient cost twice."
  // COGS covers ingredients of food sold. Operating expenses cover rent, gas, electricity, packaging, etc.
  const filteredExpenses = expenses.filter(e => filterDate(e.expense_date || e.created_at));
  const operatingExpenses = filteredExpenses
    .filter(e => e.category !== 'ingredient_purchase')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Household withdrawals (घरखर्च - tracked separately!)
  const filteredWithdrawals = withdrawals.filter(w => filterDate(w.withdrawal_date || w.created_at));
  const householdWithdrawals = filteredWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  // Gross profit = Net sales - Cost of ingredients used
  const grossProfit = totalSales - cogs;
  const grossMargin = totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0;

  // Operating profit = Gross profit - Operating expenses
  const operatingProfit = grossProfit - operatingExpenses;
  const operatingMargin = totalSales > 0 ? Math.round((operatingProfit / totalSales) * 100) : 0;

  // Actual Cash In and Cash Out
  // Actual cash received: paid orders + customer credit recoveries
  const actualCashReceived = completedOrders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  // Actual cash paid out = ALL expenses (including ingredient purchases) + household withdrawals
  const allExpensesCash = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const actualCashPaidOut = allExpensesCash + householdWithdrawals;

  // Net cash movement = Actual cash received - Actual cash paid out
  const netCashMovement = actualCashReceived - actualCashPaidOut;

  // Unpaid credit
  const unpaidCreditTotal = credits
    .filter(c => c.status !== 'settled')
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
