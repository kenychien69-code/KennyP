-- ==============================================================================
-- KENNY Brew Intelligence - Supabase PostgreSQL Database Schema
-- Project: KENNY Brew Intelligence: An AI-Integrated Point-of-Sale System
-- Tables: USERS, CATEGORIES, PRODUCTS, INGREDIENTS, ORDERS, ORDERS_ITEMS, HISTORICAL_SALES
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Accounts Table (USERS & PROFILES)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'manager', 'cashier')),
    role_title TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    last_login TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alias view for profiles if used
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.users;

-- 3. Product Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    display_order INT DEFAULT 0
);

-- 4. Raw Materials & Ingredients Inventory
CREATE TABLE IF NOT EXISTS public.ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL, -- 'g', 'ml', 'pcs'
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(12, 2) NOT NULL DEFAULT 20,
    cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0,
    supplier TEXT,
    last_restocked_at TEXT
);

-- 5. Products Table (Menu Items)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    sales_weight NUMERIC(4, 2) DEFAULT 0.15,
    recipe JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Orders & Transactions Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number INT NOT NULL,
    cashier_name TEXT NOT NULL,
    customer_name TEXT DEFAULT 'Walk-in Guest',
    order_type TEXT NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_type TEXT DEFAULT 'None',
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    vat_amount NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    change_amount NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'Completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Order Items (Line Items)
CREATE TABLE IF NOT EXISTS public.orders_items (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT,
    product_name TEXT NOT NULL,
    quantity INT NOT NULL,
    size TEXT DEFAULT '16oz Regular',
    sweetness TEXT DEFAULT '100%',
    ice TEXT DEFAULT 'Regular Ice',
    addons TEXT[] DEFAULT '{}',
    unit_price NUMERIC(10, 2) NOT NULL,
    line_total NUMERIC(10, 2) NOT NULL
);

-- Compatibility view so both `orders_items` and `order_items` work
CREATE OR REPLACE VIEW public.order_items AS SELECT * FROM public.orders_items;

-- 8. Daily Sales Records (for AI predictive engine)
CREATE TABLE IF NOT EXISTS public.historical_sales (
    date TEXT PRIMARY KEY, -- YYYY-MM-DD
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    orders_count INT NOT NULL DEFAULT 0
);

-- 9. AI Sales Forecasts Table (persists full 7-day predictive models)
CREATE TABLE IF NOT EXISTS public.sales_forecasts (
    id TEXT PRIMARY KEY, -- 'latest' or timestamp identifier
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    engine TEXT NOT NULL,
    average_recent_daily NUMERIC(12, 2) DEFAULT 0,
    next_7_day_expected_avg NUMERIC(12, 2) DEFAULT 0,
    total_7_day_forecast NUMERIC(12, 2) DEFAULT 0,
    top_expected_product TEXT,
    trend_signal_pct NUMERIC(6, 2) DEFAULT 0,
    demand_level TEXT DEFAULT 'STABLE',
    planning_suggestion TEXT,
    next_7_days JSONB DEFAULT '[]'::jsonb,
    product_forecasts JSONB DEFAULT '[]'::jsonb,
    ingredient_reorders JSONB DEFAULT '[]'::jsonb,
    staffing_schedule JSONB DEFAULT '[]'::jsonb,
    anomalies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - Safe for Anon / Service Keys
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on ingredients" ON public.ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on orders_items" ON public.orders_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on historical_sales" ON public.historical_sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on sales_forecasts" ON public.sales_forecasts FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- SEED INITIAL DATA (Coffee & Tea Shop)
-- ==============================================================================

INSERT INTO public.categories (id, name, icon, display_order) VALUES
('cat-espresso', 'Espresso & Coffee', 'Coffee', 1),
('cat-tea', 'Specialty Tea', 'Leaf', 2),
('cat-fruit', 'Fruit Teas', 'Sparkles', 3),
('cat-pastry', 'Pastries & Snacks', 'Cookie', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, username, full_name, role, role_title, status) VALUES
('usr-owner', 'owner', 'Keny Chien', 'owner', 'Shop Owner & Administrator', 'Active'),
('usr-manager', 'manager', 'Store Operations Manager', 'manager', 'Store Manager', 'Active'),
('usr-cashier', 'cashier', 'Alexander Rivera', 'cashier', 'Cashier / Barista', 'Active')
ON CONFLICT (id) DO NOTHING;
