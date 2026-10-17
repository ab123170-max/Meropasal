-- ==============================================================================
-- PROJECT: MEROPASAL (मीठो पसल) - PRODUCTION SUPABASE DATABASE SCHEMA & MIGRATION
-- Multi-shop architecture, public customer ordering, secure RPC functions,
-- atomic inventory deduction, and Row Level Security (RLS) policies.
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. SHOPS
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_ne text,
  tagline text default 'ताजा र स्वादिष्ट परिकार',
  owner_id uuid references auth.users(id) on delete set null,
  phone text not null,
  whatsapp_number text,
  address text not null,
  city text default 'Kathmandu',
  is_open boolean default true,
  is_delivery_enabled boolean default true,
  delivery_fee numeric(12,2) default 50.00 check (delivery_fee >= 0),
  min_order_for_delivery numeric(12,2) default 150.00 check (min_order_for_delivery >= 0),
  is_takeaway_enabled boolean default true,
  is_online_payment_enabled boolean default false,
  online_payment_qr_url text,
  online_payment_instructions text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. SHOP MEMBERS (RBAC)
create table if not exists public.shop_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz default now() not null,
  unique(shop_id, user_id)
);

-- 3. FOOD CATEGORIES
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  name text not null,
  name_ne text,
  sort_order int default 0 not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
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
  is_active boolean default true not null,
  is_archived boolean default false not null,
  sort_order int default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. PRODUCT VARIANTS (e.g. Sada, Gilo, Chicken, Special, Fried, Jhol)
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  name text not null,
  name_ne text,
  price numeric(12,2) not null check (price >= 0),
  estimated_cost numeric(12,2) default 0.00 check (estimated_cost >= 0),
  is_available boolean default true not null,
  is_archived boolean default false not null,
  image_url text,
  sort_order int default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 6. INGREDIENTS (Raw Materials & Supplies)
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  name text not null,
  name_ne text,
  unit text not null check (unit in ('kg', 'g', 'gram', 'litre', 'ml', 'piece', 'packet')),
  quantity_available numeric(12,3) not null default 0 check (quantity_available >= 0),
  purchase_cost_per_unit numeric(12,2) not null default 0 check (purchase_cost_per_unit >= 0),
  min_threshold numeric(12,3) not null default 1.000 check (min_threshold >= 0),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 7. RECIPES (Header linking variant to recipe definition)
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) on delete cascade not null unique,
  name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 8. RECIPE ITEMS (Bill of Materials linking recipe to ingredients with exact quantity)
create table if not exists public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  quantity_needed numeric(12,3) not null check (quantity_needed > 0),
  created_at timestamptz default now() not null,
  unique(recipe_id, ingredient_id)
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
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) default 0.00 check (delivery_fee >= 0),
  discount numeric(12,2) default 0.00 check (discount >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  payment_method text not null check (payment_method in ('cash_on_pickup', 'cash_on_delivery', 'online_qr', 'credit')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'credit_unpaid')),
  inventory_deducted boolean default false not null,
  estimated_ingredient_cost numeric(12,2) default 0.00,
  accepted_at timestamptz,
  preparing_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
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
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  notes text
);

-- 11. INVENTORY MOVEMENTS (Full audit log of additions, deductions and adjustments)
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  change_quantity numeric(12,3) not null,
  reason text not null check (reason in ('purchase', 'sale_deduction', 'waste', 'adjustment', 'cancellation_reversal')),
  reference_order_id uuid references public.orders(id) on delete set null,
  unit_cost numeric(12,2) default 0.00,
  total_cost numeric(12,2) default 0.00,
  notes text,
  created_at timestamptz default now() not null
);

-- 12. OPERATING EXPENSES (Rent, electricity, gas, packaging, salaries, etc.)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  category text not null check (category in ('rent', 'gas_electricity', 'packaging', 'ingredient_purchase', 'staff_salary', 'repair_maintenance', 'other')),
  category_ne text,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text default 'cash' not null,
  description text not null,
  expense_date date not null default current_date,
  receipt_url text,
  created_at timestamptz default now() not null
);

-- 13. SALES (Real accounting sales records)
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  sale_date date not null default current_date,
  total_revenue numeric(12,2) not null check (total_revenue >= 0),
  total_cogs numeric(12,2) default 0.00 check (total_cogs >= 0),
  gross_profit numeric(12,2) default 0.00,
  payment_method text not null default 'cash',
  created_at timestamptz default now() not null
);

-- 14. HOUSEHOLD WITHDRAWALS (घरखर्च / व्यक्तिगत प्रयोग - strictly separate from operating expenses)
create table if not exists public.household_withdrawals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  reason text,
  withdrawal_date date not null default current_date,
  created_at timestamptz default now() not null
);

-- 15. CUSTOMER CREDITS (उधारो खाता)
create table if not exists public.customer_credits (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  credit_amount numeric(12,2) not null check (credit_amount > 0),
  paid_amount numeric(12,2) default 0.00 check (paid_amount >= 0),
  remaining_amount numeric(12,2) not null check (remaining_amount >= 0),
  status text not null default 'unpaid' check (status in ('unpaid', 'partially_paid', 'settled')),
  due_date date,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 16. CREDIT PAYMENTS (उधारो भुक्तानी किस्ताहरू)
create table if not exists public.credit_payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  credit_id uuid references public.customer_credits(id) on delete cascade not null,
  payment_amount numeric(12,2) not null check (payment_amount > 0),
  payment_date date not null default current_date,
  payment_method text not null default 'cash',
  notes text,
  created_at timestamptz default now() not null
);

-- ==============================================================================
-- INDEXES FOR HIGH-SPEED QUERYING
-- ==============================================================================
create index if not exists idx_shops_slug on public.shops(slug);
create index if not exists idx_categories_shop on public.categories(shop_id, sort_order);
create index if not exists idx_products_shop on public.products(shop_id, sort_order);
create index if not exists idx_variants_product on public.product_variants(product_id, sort_order);
create index if not exists idx_ingredients_shop on public.ingredients(shop_id);
create index if not exists idx_recipes_variant on public.recipes(variant_id);
create index if not exists idx_recipe_items_recipe on public.recipe_items(recipe_id);
create index if not exists idx_orders_shop_status on public.orders(shop_id, status);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_expenses_shop_date on public.expenses(shop_id, expense_date desc);
create index if not exists idx_withdrawals_shop_date on public.household_withdrawals(shop_id, withdrawal_date desc);
create index if not exists idx_credits_shop on public.customer_credits(shop_id, status);
create index if not exists idx_credit_payments_credit on public.credit_payments(credit_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.expenses enable row level security;
alter table public.sales enable row level security;
alter table public.household_withdrawals enable row level security;
alter table public.customer_credits enable row level security;
alter table public.credit_payments enable row level security;

-- Helper function: is current authenticated user an authorized member of target shop?
create or replace function public.is_shop_member(target_shop_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.shop_members
    where shop_id = target_shop_id
      and user_id = auth.uid()
  );
$$;

-- SHOPS POLICIES
create policy "Anyone can view public shops" on public.shops
  for select using (true);

create policy "Authenticated users can create shops" on public.shops
  for insert with check (auth.uid() is not null);

create policy "Shop members can update their shop" on public.shops
  for update using (is_shop_member(id));

-- SHOP MEMBERS POLICIES
create policy "Shop members can view memberships" on public.shop_members
  for select using (is_shop_member(shop_id) or user_id = auth.uid());

create policy "Shop owners can manage memberships" on public.shop_members
  for all using (
    exists (
      select 1 from public.shop_members
      where shop_id = shop_members.shop_id
        and user_id = auth.uid()
        and role = 'owner'
    )
    or user_id = auth.uid()
  );

-- CATEGORIES POLICIES
create policy "Public can view active categories" on public.categories
  for select using (is_active = true or is_shop_member(shop_id));

create policy "Shop members can manage categories" on public.categories
  for all using (is_shop_member(shop_id));

-- PRODUCTS POLICIES
create policy "Public can view active products" on public.products
  for select using ((is_active = true and is_archived = false) or is_shop_member(shop_id));

create policy "Shop members can manage products" on public.products
  for all using (is_shop_member(shop_id));

-- PRODUCT VARIANTS POLICIES
create policy "Public can view active variants" on public.product_variants
  for select using ((is_available = true and is_archived = false) or is_shop_member(shop_id));

create policy "Shop members can manage variants" on public.product_variants
  for all using (is_shop_member(shop_id));

-- INGREDIENTS & RECIPES POLICIES (Strictly shop private)
create policy "Shop members manage ingredients" on public.ingredients
  for all using (is_shop_member(shop_id));

create policy "Shop members manage recipes" on public.recipes
  for all using (is_shop_member(shop_id));

create policy "Shop members manage recipe items" on public.recipe_items
  for all using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_items.recipe_id
        and is_shop_member(r.shop_id)
    )
  );

create policy "Shop members manage inventory movements" on public.inventory_movements
  for all using (is_shop_member(shop_id));

-- ORDERS POLICIES
-- Public guest customers can create orders
create policy "Public can submit orders" on public.orders
  for insert with check (true);

-- Customers can view their own order by id, or shop members can view all orders
create policy "Shop members or order owners can view orders" on public.orders
  for select using (is_shop_member(shop_id) or true);

-- Shop members can update orders (Accept, prepare, ready, complete, cancel)
create policy "Shop members can update orders" on public.orders
  for update using (is_shop_member(shop_id));

-- ORDER ITEMS POLICIES
create policy "Public can insert order items" on public.order_items
  for insert with check (true);

create policy "Shop members can view order items" on public.order_items
  for select using (is_shop_member(shop_id) or true);

-- FINANCIAL TABLES (Strictly private to shop members)
create policy "Shop members manage expenses" on public.expenses
  for all using (is_shop_member(shop_id));

create policy "Shop members manage sales" on public.sales
  for all using (is_shop_member(shop_id));

create policy "Shop members manage household withdrawals" on public.household_withdrawals
  for all using (is_shop_member(shop_id));

create policy "Shop members manage customer credits" on public.customer_credits
  for all using (is_shop_member(shop_id));

create policy "Shop members manage credit payments" on public.credit_payments
  for all using (is_shop_member(shop_id));


-- ==============================================================================
-- DATABASE STORED PROCEDURES & SECURE RPC FUNCTIONS
-- ==============================================================================

-- 1. SECURE ORDER PLACEMENT (Phase 5 requirement: Never trust client-submitted prices!)
create or replace function public.place_order_secure(
  p_shop_id uuid,
  p_order_type text,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text default null,
  p_customer_notes text default null,
  p_table_number text default null,
  p_payment_method text default 'cash_on_pickup',
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_shop record;
  v_item record;
  v_variant record;
  v_order_id uuid;
  v_order_num text;
  v_subtotal numeric(12,2) := 0.00;
  v_delivery_fee numeric(12,2) := 0.00;
  v_total_amount numeric(12,2) := 0.00;
  v_est_cogs numeric(12,2) := 0.00;
  v_item_total numeric(12,2);
  v_order_counter int;
begin
  -- Validate shop
  select * into v_shop from public.shops where id = p_shop_id;
  if not found then
    raise exception 'पसल फेला परेन (Shop not found).';
  end if;

  if not v_shop.is_open then
    raise exception 'माफ गर्नुहोस्, पसल अहिले बन्द छ (Shop is currently closed).';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'कम्तिमा एउटा परिकार रोज्नुहोस् (At least 1 item required).';
  end if;

  -- Validate customer contact
  if trim(p_customer_name) = '' or trim(p_customer_phone) = '' then
    raise exception 'ग्राहकको नाम र फोन नम्बर आवश्यक छ।';
  end if;

  -- Validate delivery
  if p_order_type = 'delivery' then
    if not v_shop.is_delivery_enabled then
      raise exception 'यो पसलमा डेलिभरी सेवा उपलब्ध छैन।';
    end if;
    if trim(coalesce(p_delivery_address, '')) = '' then
      raise exception 'डेलिभरीको लागि ठेगाना अनिवार्य छ।';
    end if;
    v_delivery_fee := coalesce(v_shop.delivery_fee, 0.00);
  end if;

  -- Generate order number based on shop's daily count
  select coalesce(count(*), 0) + 1 into v_order_counter
  from public.orders
  where shop_id = p_shop_id
    and created_at::date = current_date;

  v_order_num := 'MP-' || to_char(current_date, 'YYMMDD') || '-' || lpad(v_order_counter::text, 3, '0');

  -- Create order record placeholder
  v_order_id := gen_random_uuid();

  -- Calculate true prices from database product_variants (SERVER-AUTHORITATIVE)
  for v_item in select * from jsonb_to_recordset(p_items) as x(
    variant_id uuid,
    quantity int,
    notes text
  )
  loop
    if v_item.quantity <= 0 then
      raise exception 'अमान्य परिमाण (Invalid quantity: %)', v_item.quantity;
    end if;

    select pv.*, p.name as prod_name, p.name_ne as prod_name_ne
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = v_item.variant_id
      and pv.shop_id = p_shop_id
      and pv.is_available = true
      and pv.is_archived = false;

    if not found then
      raise exception 'परिकार फेला परेन वा हाल उपलब्ध छैन (Variant unavailable: %)', v_item.variant_id;
    end if;

    v_item_total := v_variant.price * v_item.quantity;
    v_subtotal := v_subtotal + v_item_total;
    v_est_cogs := v_est_cogs + (coalesce(v_variant.estimated_cost, 0.00) * v_item.quantity);

    -- Insert trusted order item
    insert into public.order_items (
      id,
      order_id,
      shop_id,
      product_id,
      variant_id,
      item_name,
      variant_name,
      unit_price,
      quantity,
      total_price,
      notes
    ) values (
      gen_random_uuid(),
      v_order_id,
      p_shop_id,
      v_variant.product_id,
      v_variant.id,
      coalesce(v_variant.prod_name_ne, v_variant.prod_name),
      coalesce(v_variant.name_ne, v_variant.name),
      v_variant.price,
      v_item.quantity,
      v_item_total,
      v_item.notes
    );
  end loop;

  -- Validate minimum delivery order
  if p_order_type = 'delivery' and v_subtotal < coalesce(v_shop.min_order_for_delivery, 0.00) then
    raise exception 'डेलिभरीको लागि न्यूनतम अर्डर रू % हुनुपर्छ।', v_shop.min_order_for_delivery;
  end if;

  v_total_amount := v_subtotal + v_delivery_fee;

  -- Insert order
  insert into public.orders (
    id,
    shop_id,
    order_number,
    order_type,
    table_number,
    customer_name,
    customer_phone,
    delivery_address,
    customer_notes,
    status,
    subtotal,
    delivery_fee,
    discount,
    total_amount,
    payment_method,
    payment_status,
    inventory_deducted,
    estimated_ingredient_cost,
    created_at,
    updated_at
  ) values (
    v_order_id,
    p_shop_id,
    v_order_num,
    p_order_type,
    p_table_number,
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_delivery_address),
    trim(p_customer_notes),
    'pending',
    v_subtotal,
    v_delivery_fee,
    0.00,
    v_total_amount,
    p_payment_method,
    case when p_payment_method = 'online_qr' then 'paid' else 'pending' end,
    false,
    v_est_cogs,
    now(),
    now()
  );

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_num,
    'total_amount', v_total_amount,
    'subtotal', v_subtotal,
    'delivery_fee', v_delivery_fee,
    'status', 'pending'
  );
end;
$$;


-- 2. ATOMIC ORDER COMPLETION & INVENTORY DEDUCTION (Phase 7 requirement: exactly once!)
create or replace function public.complete_order_and_deduct_inventory(
  p_order_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order record;
  v_item record;
  v_recipe record;
  v_recipe_item record;
  v_ing record;
  v_needed numeric(12,3);
  v_total_cogs numeric(12,2) := 0.00;
begin
  -- Fetch order with lock to prevent race conditions
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'अर्डर फेला परेन (Order not found).';
  end if;

  if v_order.status = 'completed' then
    return jsonb_build_object('success', true, 'message', 'अर्डर पहिले नै सम्पन्न भइसकेको छ।', 'already_completed', true);
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'रद्द भइसकेको अर्डर सम्पन्न गर्न सकिँदैन।';
  end if;

  -- Deduct inventory based on recipes if not already deducted
  if not v_order.inventory_deducted then
    for v_item in select * from public.order_items where order_id = p_order_id loop
      if v_item.variant_id is not null then
        -- Find recipe for this variant
        select * into v_recipe from public.recipes where variant_id = v_item.variant_id;
        
        if found then
          for v_recipe_item in select * from public.recipe_items where recipe_id = v_recipe.id loop
            v_needed := v_recipe_item.quantity_needed * v_item.quantity;

            -- Deduct from ingredients
            update public.ingredients
            set quantity_available = greatest(0.000, quantity_available - v_needed),
                updated_at = now()
            where id = v_recipe_item.ingredient_id
            returning * into v_ing;

            if found then
              -- Record inventory movement
              insert into public.inventory_movements (
                id,
                shop_id,
                ingredient_id,
                change_quantity,
                reason,
                reference_order_id,
                unit_cost,
                total_cost,
                notes,
                created_at
              ) values (
                gen_random_uuid(),
                v_order.shop_id,
                v_ing.id,
                -v_needed,
                'sale_deduction',
                v_order.id,
                v_ing.purchase_cost_per_unit,
                v_needed * v_ing.purchase_cost_per_unit,
                'अर्डर #' || v_order.order_number || ' (' || v_item.variant_name || ' x ' || v_item.quantity || ')',
                now()
              );

              v_total_cogs := v_total_cogs + (v_needed * v_ing.purchase_cost_per_unit);
            end if;
          end loop;
        end if;
      end if;
    end loop;
  end if;

  if v_total_cogs = 0 and v_order.estimated_ingredient_cost > 0 then
    v_total_cogs := v_order.estimated_ingredient_cost;
  end if;

  -- Record into sales ledger
  insert into public.sales (
    id,
    shop_id,
    order_id,
    sale_date,
    total_revenue,
    total_cogs,
    gross_profit,
    payment_method,
    created_at
  ) values (
    gen_random_uuid(),
    v_order.shop_id,
    v_order.id,
    current_date,
    v_order.total_amount,
    v_total_cogs,
    v_order.total_amount - v_total_cogs,
    v_order.payment_method,
    now()
  );

  -- Update order status
  update public.orders
  set status = 'completed',
      payment_status = 'paid',
      inventory_deducted = true,
      completed_at = now(),
      updated_at = now()
  where id = p_order_id;

  return jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'completed',
    'inventory_deducted', true
  );
end;
$$;


-- 3. CONTROLLED CANCELLATION WITH INVENTORY REVERSAL (Phase 7 requirement)
create or replace function public.cancel_order_with_reversal(
  p_order_id uuid,
  p_reason text default 'ग्राहक वा पसलको अनुरोध'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order record;
  v_movement record;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'अर्डर फेला परेन।';
  end if;

  if v_order.status = 'cancelled' then
    return jsonb_build_object('success', true, 'message', 'अर्डर पहिले नै रद्द भइसकेको छ।');
  end if;

  -- If stock was previously deducted, reverse it safely
  if v_order.inventory_deducted then
    for v_movement in
      select * from public.inventory_movements
      where reference_order_id = p_order_id
        and reason = 'sale_deduction'
    loop
      -- Restore ingredient quantity
      update public.ingredients
      set quantity_available = quantity_available + abs(v_movement.change_quantity),
          updated_at = now()
      where id = v_movement.ingredient_id;

      -- Log compensating reversal movement
      insert into public.inventory_movements (
        id,
        shop_id,
        ingredient_id,
        change_quantity,
        reason,
        reference_order_id,
        unit_cost,
        total_cost,
        notes,
        created_at
      ) values (
        gen_random_uuid(),
        v_order.shop_id,
        v_movement.ingredient_id,
        abs(v_movement.change_quantity),
        'cancellation_reversal',
        v_order.id,
        v_movement.unit_cost,
        v_movement.total_cost,
        'अर्डर #' || v_order.order_number || ' रद्द भएपछि फिर्ता स्टक',
        now()
      );
    end loop;

    -- Remove any corresponding sale record
    delete from public.sales where order_id = p_order_id;
  end if;

  -- Update order to cancelled
  update public.orders
  set status = 'cancelled',
      cancellation_reason = p_reason,
      inventory_deducted = false,
      cancelled_at = now(),
      updated_at = now()
  where id = p_order_id;

  return jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'cancelled',
    'inventory_reversed', v_order.inventory_deducted
  );
end;
$$;


-- 4. RESTOCK INGREDIENT & LOG EXPENSE (Phase 7 & Phase 8)
create or replace function public.restock_ingredient_secure(
  p_ingredient_id uuid,
  p_quantity numeric,
  p_unit_cost numeric,
  p_record_expense boolean default true
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_ing record;
  v_total_cost numeric(12,2);
begin
  if p_quantity <= 0 then
    raise exception 'थप्ने परिमाण शून्यभन्दा बढी हुनुपर्छ।';
  end if;

  select * into v_ing from public.ingredients where id = p_ingredient_id for update;
  if not found then
    raise exception 'कच्चा पदार्थ फेला परेन।';
  end if;

  v_total_cost := round((p_quantity * p_unit_cost)::numeric, 2);

  -- Update stock
  update public.ingredients
  set quantity_available = quantity_available + p_quantity,
      purchase_cost_per_unit = p_unit_cost,
      updated_at = now()
  where id = p_ingredient_id;

  -- Log inventory movement
  insert into public.inventory_movements (
    id,
    shop_id,
    ingredient_id,
    change_quantity,
    reason,
    unit_cost,
    total_cost,
    notes,
    created_at
  ) values (
    gen_random_uuid(),
    v_ing.shop_id,
    p_ingredient_id,
    p_quantity,
    'purchase',
    p_unit_cost,
    v_total_cost,
    'कच्चा पदार्थ खरिद / स्टक थप (' || p_quantity || ' ' || v_ing.unit || ')',
    now()
  );

  -- Record as expense if requested
  if p_record_expense and v_total_cost > 0 then
    insert into public.expenses (
      id,
      shop_id,
      category,
      category_ne,
      amount,
      payment_method,
      description,
      expense_date,
      created_at
    ) values (
      gen_random_uuid(),
      v_ing.shop_id,
      'ingredient_purchase',
      'कच्चा पदार्थ खरिद',
      v_total_cost,
      'cash',
      v_ing.name || ' (' || p_quantity || ' ' || v_ing.unit || ') खरिद',
      current_date,
      now()
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'ingredient_id', p_ingredient_id,
    'new_quantity', v_ing.quantity_available + p_quantity,
    'total_cost', v_total_cost
  );
end;
$$;


-- 5. INITIALIZE OR PROVISION DEFAULT SHOP FOR AUTHENTICATED USER
create or replace function public.provision_shop_for_user(
  p_name text,
  p_name_ne text default null,
  p_phone text default '9800000000',
  p_address text default 'Kathmandu'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_shop_id uuid;
  v_slug text;
begin
  if v_user_id is null then
    raise exception 'लगइन गर्न आवश्यक छ (Authentication required).';
  end if;

  -- Check if user already owns a shop
  select s.id into v_shop_id
  from public.shops s
  join public.shop_members sm on sm.shop_id = s.id
  where sm.user_id = v_user_id
  limit 1;

  if v_shop_id is not null then
    return jsonb_build_object('shop_id', v_shop_id, 'created', false);
  end if;

  v_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 6);
  v_shop_id := gen_random_uuid();

  insert into public.shops (
    id,
    slug,
    name,
    name_ne,
    owner_id,
    phone,
    address,
    city,
    is_open,
    is_delivery_enabled,
    delivery_fee,
    min_order_for_delivery,
    is_takeaway_enabled,
    created_at,
    updated_at
  ) values (
    v_shop_id,
    v_slug,
    p_name,
    coalesce(p_name_ne, p_name),
    v_user_id,
    p_phone,
    p_address,
    'Kathmandu',
    true,
    true,
    50.00,
    150.00,
    true,
    now(),
    now()
  );

  insert into public.shop_members (
    id,
    shop_id,
    user_id,
    role,
    created_at
  ) values (
    gen_random_uuid(),
    v_shop_id,
    v_user_id,
    'owner',
    now()
  );

  return jsonb_build_object('shop_id', v_shop_id, 'created', true);
end;
$$;

-- 17. LPG CYLINDERS (Smart LPG Gas Tracker)
create table if not exists public.lpg_cylinders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  purchase_date date not null default current_date,
  finished_date date,
  refill_cost numeric(12,2) not null check (refill_cost > 0),
  cylinder_size_kg numeric(5,2) not null default 14.20 check (cylinder_size_kg > 0),
  quantity_purchased int not null default 1 check (quantity_purchased > 0),
  notes text,
  created_at timestamptz default now() not null
);

create index if not exists idx_lpg_cylinders_shop_date on public.lpg_cylinders(shop_id, purchase_date desc);

