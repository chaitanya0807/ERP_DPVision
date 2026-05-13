-- Wrap everything in a transaction to ensure integrity
BEGIN;

-- 1. Create the User Role Enum safely
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'user', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create Tables (Order matters for Foreign Keys)
CREATE TABLE IF NOT EXISTS companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  domain      text,
  country     text NOT NULL DEFAULT 'India',
  currency    text NOT NULL DEFAULT 'INR',
  user_count  int  NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  company_id  uuid REFERENCES companies (id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'user',
  full_name   text,
  phone       text,
  is_primary  boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS modules (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  slug           text NOT NULL UNIQUE,
  price_per_user numeric NOT NULL DEFAULT 0,
  parent_slug    text,
  is_active      boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  module_id      uuid NOT NULL REFERENCES modules (id) ON DELETE CASCADE,
  user_count     int  NOT NULL DEFAULT 1,
  status         text NOT NULL DEFAULT 'trial',
  trial_ends_at  timestamptz,
  activated_at   timestamptz
);

CREATE TABLE IF NOT EXISTS payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  razorpay_order_id    text,
  razorpay_payment_id  text,
  razorpay_signature   text,
  amount               numeric NOT NULL,
  status               text NOT NULL DEFAULT 'pending',
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS and Create Policies
ALTER TABLE companies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Companies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'companies_select_own') THEN
        CREATE POLICY "companies_select_own" ON companies FOR SELECT USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'companies_update_own') THEN
        CREATE POLICY "companies_update_own" ON companies FOR UPDATE USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_own') THEN
        CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_company_admin') THEN
        CREATE POLICY "profiles_select_company_admin" ON profiles FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
    END IF;

    -- Subscriptions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'subscriptions_select_own_company') THEN
        CREATE POLICY "subscriptions_select_own_company" ON subscriptions FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Payments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payments_select_own_company') THEN
        CREATE POLICY "payments_select_own_company" ON payments FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
END $$;

-- 4. Seed Modules Catalog
INSERT INTO modules (id, name, slug, price_per_user, parent_slug, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'CRM', 'crm', 0, NULL, true),
  ('00000000-0000-0000-0000-000000000004', 'HRMS', 'hrms', 0, NULL, true),
  ('00000000-0000-0000-0000-000000000007', 'LMS', 'lms', 150, NULL, true),
  ('00000000-0000-0000-0000-000000000008', 'Bill Book', 'bill-book', 100, NULL, true),
  ('00000000-0000-0000-0000-000000000009', 'Finance', 'finance', 200, NULL, true),
  ('00000000-0000-0000-0000-000000000010', 'Fleet Management', 'fleet-management', 150, NULL, true),
  ('00000000-0000-0000-0000-000000000002', 'WhatsApp API Integration', 'whatsapp-api', 200, 'crm', true),
  ('00000000-0000-0000-0000-000000000003', 'Lead Management', 'lead-management', 100, 'crm', true),
  ('00000000-0000-0000-0000-000000000005', 'Attendance', 'attendance', 100, 'hrms', true),
  ('00000000-0000-0000-0000-000000000006', 'Payroll', 'payroll', 250, 'hrms', true)
ON CONFLICT (slug) DO NOTHING;

COMMIT;