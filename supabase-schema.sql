-- SQL Schema for Studio ACOM Migration to Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid TEXT UNIQUE,
  email TEXT UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Studio ACOM Categories
CREATE TABLE IF NOT EXISTS studio_acom_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sub TEXT,
  icon TEXT,
  color TEXT,
  cover_image TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Studio ACOM Products
CREATE TABLE IF NOT EXISTS studio_acom_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES studio_acom_categories(id) ON DELETE CASCADE,
  description TEXT,
  cover_image TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Variants
CREATE TABLE IF NOT EXISTS variants (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES studio_acom_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  shape TEXT,
  format TEXT,
  finish TEXT,
  template_id TEXT,
  preview_image TEXT,
  price NUMERIC,
  min_quantity INTEGER,
  max_quantity INTEGER,
  template_svg TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Designs
CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  data JSONB,
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  items JSONB,
  total_price NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  category TEXT,
  author TEXT,
  cover_image TEXT,
  date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio
CREATE TABLE IF NOT EXISTS portfolio (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  category TEXT,
  image TEXT,
  client TEXT,
  date TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT,
  amount NUMERIC,
  category TEXT,
  date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchants
CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  name TEXT,
  description TEXT,
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant Products
CREATE TABLE IF NOT EXISTS merchant_products (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  price NUMERIC,
  stock_quantity INTEGER,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant Sales
CREATE TABLE IF NOT EXISTS merchant_sales (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
  items JSONB,
  total_amount NUMERIC,
  processed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant Expenses
CREATE TABLE IF NOT EXISTS merchant_expenses (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
  title TEXT,
  amount NUMERIC,
  category TEXT,
  date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant Suppliers
CREATE TABLE IF NOT EXISTS merchant_suppliers (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT,
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES merchant_products(id) ON DELETE CASCADE,
  type TEXT,
  quantity INTEGER,
  previous_quantity INTEGER,
  new_quantity INTEGER,
  reason TEXT,
  reference_id TEXT,
  performed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant Stats
CREATE TABLE IF NOT EXISTS merchant_stats (
  merchant_id TEXT PRIMARY KEY REFERENCES merchants(id) ON DELETE CASCADE,
  revenue JSONB,
  expenses JSONB,
  last_update TEXT,
  last_month TEXT,
  last_year TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  price NUMERIC,
  category TEXT,
  image TEXT,
  image_url TEXT,
  features JSONB,
  promotion JSONB,
  merchant_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Simplified - Enable RLS and allow all for now, but should be hardened)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public users are viewable by everyone." ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON users FOR INSERT WITH CHECK (auth.uid()::text = uid);
CREATE POLICY "Users can update own profile." ON users FOR UPDATE USING (auth.uid()::text = uid);

-- Studio ACOM RLS
ALTER TABLE studio_acom_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON studio_acom_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON studio_acom_categories FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE studio_acom_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON studio_acom_products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON studio_acom_products FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variants are viewable by everyone" ON variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage variants" ON variants FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Admins can manage services" ON services FOR ALL USING (auth.role() = 'authenticated');

-- Storage Policies (To be run in Supabase SQL Editor)
/*
-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('services', 'services', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('studio-acom', 'studio-acom', true) ON CONFLICT DO NOTHING;

-- Allow public access to read
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id IN ('services', 'studio-acom') );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id IN ('services', 'studio-acom') AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (
  bucket_id IN ('services', 'studio-acom') AND auth.role() = 'authenticated'
);
*/
