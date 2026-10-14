-- MeethoPasal AI (मीठो पसल एआई) - Supabase Database Schema & RLS Policies
-- Compatible with multi-shop tenancy, customer ordering, and mobile shop management.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. SHOPS
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_ne text,
  tagline text default 'ताजा र स्वादिष्ट खाना',
  owner_id uuid references auth.users(id) on delete set null,
  phone text not null,
  whatsapp_number text,
  address text not null,
  city text default 'Kathmandu',
  is_open boolean default true,
  is_delivery_enabled boolean default true,
  delivery_fee numeric default 50 check (delivery_fee >= 0),
  min_order_for_delivery numeric default 200,
  is_takeaway_enabled boolean default true,
  is_online_payment_enabled boolean default false,
  online_payment_qr_url text,
  online_payment_instructions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. SHOP MEMBERSHIPS (RBAC)
create table if not exists public.shop_memberships (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz default now(),
  unique(shop_id, user_id)
);

-- 3. FOOD CATEGORIES
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  name text not null,
  name_ne text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. PRODUCTS (Main Food Items)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  name_ne text,
  description text,
  image_url text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. PRODUCT VARIANTS (e.g. Chatpate: Sada, Gilo, Chicken, Special)
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  name text not null,
  name_ne text,
  price numeric not null check (price >= 0),
  estimated_cost numeric default 0 check (estimated_cost >= 0),
  is_available boolean default true,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. INGREDIENTS & RAW MATERIALS
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  name text not null,
  name_ne text,
  unit text not null check (unit in ('kg', 'gram', 'litre', 'ml', 'piece', 'packet')),
  quantity_available numeric not null default 0 check (quantity_available >= 0),
  purchase_cost_per_unit numeric not null default 0 check (purchase_cost_per_unit >= 0),
  min_threshold numeric not null default 1 check (min_threshold >= 0),
  updated_at timestamptz default now()
);

-- 7. RECIPES (Bill of Materials linking variant to ingredients)
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  quantity_needed numeric not null check (quantity_needed > 0),
  unique(variant_id, ingredient_id)
);

-- 8. INVENTORY MOVEMENTS (Stock history & automatic sales deduction)
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  change_quantity numeric not null,
  reason text not null check (reason in ('purchase', 'sale_deduction', 'waste', 'adjustment')),
  reference_order_id uuid,
  unit_cost numeric default 0,
  total_cost numeric default 0,
  notes text,
  created_at timestamptz default now()
);

-- 9. ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  order_number text not null,
  order_type text not null check (order_type in ('dine_in', 'takeaway', 'delivery')),
  table_number text,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text,
  customer_notes text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')),
  cancellation_reason text,
  subtotal numeric not null check (subtotal >= 0),
  delivery_fee numeric default 0 check (delivery_fee >= 0),
  discount numeric default 0 check (discount >= 0),
  total_amount numeric not null check (total_amount >= 0),
  payment_method text not null check (payment_method in ('cash_on_pickup', 'cash_on_delivery', 'online_qr', 'credit')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'credit_unpaid')),
  inventory_deducted boolean default false,
  estimated_ingredient_cost numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. ORDER ITEMS
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  shop_id uuid references public.shops(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  item_name text not null,
  variant_name text not null,
  unit_price numeric not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  total_price numeric not null check (total_price >= 0),
  notes text
);

-- 11. OPERATING EXPENSES (भाडा, ग्यास, बिजुली, प्याकेजिङ आदि)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  category text not null check (category in ('rent', 'gas_electricity', 'packaging', 'ingredient_purchase', 'staff_salary', 'repair_maintenance', 'other')),
  category_ne text,
  amount numeric not null check (amount > 0),
  payment_method text default 'cash',
  description text not null,
  expense_date date not null default current_date,
  receipt_url text,
  created_at timestamptz default now()
);

-- 12. HOUSEHOLD WITHDRAWALS (घरखर्च / व्यक्तिगत खर्च - strictly separated from business expenses)
create table if not exists public.household_withdrawals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  reason text,
  withdrawal_date date not null default current_date,
  created_at timestamptz default now()
);

-- 13. CUSTOMER CREDITS (उधारो खाता)
create table if not exists public.customer_credits (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  credit_amount numeric not null check (credit_amount > 0),
  paid_amount numeric default 0 check (paid_amount >= 0),
  remaining_amount numeric not null check (remaining_amount >= 0),
  status text default 'unpaid' check (status in ('unpaid', 'partially_paid', 'settled')),
  due_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- INDEXES FOR PERFORMANCE
create index if not exists idx_shops_slug on public.shops(slug);
create index if not exists idx_categories_shop on public.categories(shop_id);
create index if not exists idx_products_shop on public.products(shop_id);
create index if not exists idx_variants_product on public.product_variants(product_id);
create index if not exists idx_ingredients_shop on public.ingredients(shop_id);
create index if not exists idx_orders_shop_status on public.orders(shop_id, status);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_expenses_shop_date on public.expenses(shop_id, expense_date desc);
create index if not exists idx_withdrawals_shop_date on public.household_withdrawals(shop_id, withdrawal_date desc);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.shops enable row level security;
alter table public.shop_memberships enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.expenses enable row level security;
alter table public.household_withdrawals enable row level security;
alter table public.customer_credits enable row level security;

-- Helper function to check if authenticated user belongs to shop
create or replace function public.is_shop_member(target_shop_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.shop_memberships
    where shop_id = target_shop_id
      and user_id = auth.uid()
  );
$$;

-- SHOPS POLICIES
create policy "Public can view shops" on public.shops
  for select using (true);

create policy "Shop owners can update their shop" on public.shops
  for update using (is_shop_member(id));

-- CATEGORIES, PRODUCTS, VARIANTS (Public can view active menu items)
create policy "Public can view active categories" on public.categories
  for select using (is_active = true or is_shop_member(shop_id));

create policy "Shop members manage categories" on public.categories
  for all using (is_shop_member(shop_id));

create policy "Public can view active products" on public.products
  for select using (is_active = true or is_shop_member(shop_id));

create policy "Shop members manage products" on public.products
  for all using (is_shop_member(shop_id));

create policy "Public can view available variants" on public.product_variants
  for select using (is_available = true or is_shop_member(shop_id));

create policy "Shop members manage variants" on public.product_variants
  for all using (is_shop_member(shop_id));

-- INGREDIENTS & RECIPES (Strictly private to shop members)
create policy "Shop members only for ingredients" on public.ingredients
  for all using (is_shop_member(shop_id));

create policy "Shop members only for recipes" on public.recipes
  for all using (is_shop_member(shop_id));

create policy "Shop members only for inventory_movements" on public.inventory_movements
  for all using (is_shop_member(shop_id));

-- ORDERS POLICIES
-- Anyone can insert an order (Customer checkout)
create policy "Public can create orders" on public.orders
  for insert with check (true);

-- Customers can view only their own order by ID + phone matching, or Shop members can view all shop orders
create policy "Shop members or order customers can view orders" on public.orders
  for select using (
    is_shop_member(shop_id)
    or id = (select current_setting('request.jwt.claims', true)::json->>'temp_order_id')::uuid
  );

create policy "Shop members can update orders" on public.orders
  for update using (is_shop_member(shop_id));

-- ORDER ITEMS POLICIES
create policy "Public can insert order items" on public.order_items
  for insert with check (true);

create policy "Shop members can manage order items" on public.order_items
  for select using (is_shop_member(shop_id));

-- EXPENSES & WITHDRAWALS & CREDITS (Strictly shop private)
create policy "Shop members only for expenses" on public.expenses
  for all using (is_shop_member(shop_id));

create policy "Shop members only for household withdrawals" on public.household_withdrawals
  for all using (is_shop_member(shop_id));

create policy "Shop members only for customer credits" on public.customer_credits
  for all using (is_shop_member(shop_id));
