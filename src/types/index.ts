// Core Data Models for Meropasal Production Application

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash_on_pickup' | 'cash_on_delivery' | 'online_qr' | 'credit';

export type PaymentStatus = 'pending' | 'paid' | 'credit_unpaid';

export type ExpenseCategory =
  | 'rent'
  | 'gas_electricity'
  | 'packaging'
  | 'ingredient_purchase'
  | 'staff_salary'
  | 'repair_maintenance'
  | 'other';

export type IngredientUnit = 'kg' | 'g' | 'gram' | 'litre' | 'ml' | 'piece' | 'packet';

export interface Shop {
  id: string;
  slug: string;
  name: string;
  name_ne?: string;
  tagline?: string;
  owner_id?: string;
  phone: string;
  whatsapp_number?: string;
  address: string;
  city: string;
  is_open: boolean;
  is_delivery_enabled: boolean;
  delivery_fee: number;
  min_order_for_delivery: number;
  is_takeaway_enabled: boolean;
  is_online_payment_enabled: boolean;
  online_payment_qr_url?: string;
  online_payment_instructions?: string;
  created_at: string;
  updated_at?: string;
}

export interface ShopMember {
  id: string;
  shop_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff';
  created_at: string;
}

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  name_ne?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  shop_id: string;
  category_id?: string;
  name: string;
  name_ne?: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  is_archived?: boolean;
  sort_order: number;
  variants?: ProductVariant[];
  created_at?: string;
  updated_at?: string;
}

export interface RecipeItem {
  id?: string;
  recipe_id?: string;
  ingredient_id: string;
  ingredient_name?: string;
  unit?: string;
  quantity_needed: number;
}

export interface ProductVariant {
  id: string;
  shop_id: string;
  product_id: string;
  name: string;
  name_ne?: string;
  price: number;
  estimated_cost: number;
  is_available: boolean;
  is_archived?: boolean;
  image_url?: string;
  sort_order: number;
  recipe?: {
    id: string;
    items: RecipeItem[];
  };
  created_at?: string;
  updated_at?: string;
}

export interface Ingredient {
  id: string;
  shop_id: string;
  name: string;
  name_ne?: string;
  unit: IngredientUnit;
  quantity_available: number;
  purchase_cost_per_unit: number;
  min_threshold: number;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMovement {
  id: string;
  shop_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  change_quantity: number;
  reason: 'purchase' | 'sale_deduction' | 'waste' | 'adjustment' | 'cancellation_reversal';
  reference_order_id?: string;
  unit_cost: number;
  total_cost: number;
  notes?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  shop_id: string;
  product_id?: string;
  variant_id?: string;
  item_name: string;
  variant_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  notes?: string;
}

export interface Order {
  id: string;
  shop_id: string;
  order_number: string;
  order_type: OrderType;
  table_number?: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  customer_notes?: string;
  status: OrderStatus;
  cancellation_reason?: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  inventory_deducted: boolean;
  estimated_ingredient_cost: number;
  items: OrderItem[];
  accepted_at?: string;
  preparing_at?: string;
  ready_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  shop_id: string;
  category: ExpenseCategory;
  category_ne?: string;
  amount: number;
  payment_method: string;
  description: string;
  expense_date: string;
  receipt_url?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  shop_id: string;
  order_id?: string;
  sale_date: string;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  payment_method: string;
  created_at: string;
}

export interface HouseholdWithdrawal {
  id: string;
  shop_id: string;
  amount: number;
  reason?: string;
  withdrawal_date: string;
  created_at: string;
}

export interface CustomerCredit {
  id: string;
  shop_id: string;
  order_id?: string;
  customer_name: string;
  customer_phone: string;
  credit_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'unpaid' | 'partially_paid' | 'settled';
  due_date?: string;
  notes?: string;
  payments?: CreditPayment[];
  created_at: string;
  updated_at?: string;
}

export interface CreditPayment {
  id: string;
  shop_id: string;
  credit_id: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  created_at: string;
}

export interface LpgCylinder {
  id: string;
  shop_id: string;
  purchase_date: string;
  finished_date?: string | null;
  refill_cost: number;
  cylinder_size_kg: number;
  quantity_purchased: number;
  notes?: string;
  created_at: string;
}


export interface FinancialMetrics {
  totalSales: number;
  cogs: number;
  isCogsIncomplete: boolean;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  operatingProfit: number;
  operatingMargin: number;
  householdWithdrawals: number;
  actualCashReceived: number;
  actualCashPaidOut: number;
  netCashMovement: number;
  unpaidCreditTotal: number;
  ordersCount: number;
}
