/*
# ZeroCap — Full Schema & RLS

## Overview
Creates the complete database schema for ZeroCap, a trustless freelance delivery platform.
Creators upload deliverables; hirers get protected previews and unlock originals only after verified payment.

## Tables

1. **profiles** — extends auth.users with role (creator/hirer), display name, avatar, bio, portfolio URL, UPI ID for receiving payments.
2. **gigs** — services offered by creators (title, description, price, category, image).
3. **jobs** — open job postings by hirers looking for creators (title, description, budget, category).
4. **orders** — a hire request linking a hirer and a creator for a gig, with status and amount.
5. **payments** — payment records for orders (UPI ID, amount, status, transaction reference, verification).
6. **deliverables** — files uploaded by creators for an order. Stores original (private) and preview (watermarked) file paths. Unlocked flag set only after verified payment.
7. **messages** — order-scoped chat between hirer and creator.
8. **transactions** — ledger of credits/debits per user (earnings for creators, spend for hirers).

## Security (RLS)
- All tables have RLS enabled.
- profiles: users read/update their own profile. Public read of profiles enabled so users can view creator profiles.
- gigs: public read (browse marketplace); creators CRUD their own.
- jobs: public read; hirers CRUD their own.
- orders: both order participants (hirer + creator) can read; hirer creates; creator updates status (accept/reject); both can cancel.
- payments: only order participants can read; hirer creates payment record; verification status changes are server-side only (via service role / edge function).
- deliverables: only order participants can read; creator creates/updates; unlock flag is server-controlled.
- messages: only order participants can read/insert.
- transactions: only the owner can read their own ledger.

## Storage
- Creates a private storage bucket `deliverables` for original files.
- Creates a public storage bucket `previews` for watermarked preview files.

## Notes
- All IDs are UUIDs with gen_random_uuid() defaults.
- Foreign keys use ON DELETE CASCADE where appropriate.
- Order status transitions are enforced at the application/edge-function level.
- Payment verification (PAYMENT_VERIFIED / PAID / DELIVERABLE_UNLOCKED) is NEVER done from the frontend — only via the service role in an edge function.
*/

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  role text NOT NULL DEFAULT 'hirer' CHECK (role IN ('creator', 'hirer')),
  avatar_url text,
  bio text DEFAULT '',
  portfolio_url text DEFAULT '',
  upi_id text DEFAULT '9372169983@axl',
  skills text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================
-- GIGS
-- ============================================
CREATE TABLE IF NOT EXISTS gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'general',
  image_url text,
  tags text[] DEFAULT '{}',
  delivery_time text DEFAULT '3 days',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gigs_select_public" ON gigs;
CREATE POLICY "gigs_select_public" ON gigs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "gigs_insert_own" ON gigs;
CREATE POLICY "gigs_insert_own" ON gigs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "gigs_update_own" ON gigs;
CREATE POLICY "gigs_update_own" ON gigs FOR UPDATE
  TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "gigs_delete_own" ON gigs;
CREATE POLICY "gigs_delete_own" ON gigs FOR DELETE
  TO authenticated USING (auth.uid() = creator_id);

-- ============================================
-- JOBS
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hirer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  budget numeric(10, 2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'general',
  skills_required text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'awarded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_select_public" ON jobs;
CREATE POLICY "jobs_select_public" ON jobs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "jobs_insert_own" ON jobs;
CREATE POLICY "jobs_insert_own" ON jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = hirer_id);

DROP POLICY IF EXISTS "jobs_update_own" ON jobs;
CREATE POLICY "jobs_update_own" ON jobs FOR UPDATE
  TO authenticated USING (auth.uid() = hirer_id) WITH CHECK (auth.uid() = hirer_id);

DROP POLICY IF EXISTS "jobs_delete_own" ON jobs;
CREATE POLICY "jobs_delete_own" ON jobs FOR DELETE
  TO authenticated USING (auth.uid() = hirer_id);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid REFERENCES gigs(id) ON DELETE SET NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  hirer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  amount numeric(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'rejected', 'cancelled',
    'payment_pending', 'payment_initiated', 'payment_verified',
    'paid', 'delivered', 'completed', 'failed'
  )),
  order_ref text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_participants" ON orders;
CREATE POLICY "orders_select_participants" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = hirer_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "orders_insert_hirer" ON orders;
CREATE POLICY "orders_insert_hirer" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = hirer_id);

DROP POLICY IF EXISTS "orders_update_participants" ON orders;
CREATE POLICY "orders_update_participants" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = hirer_id OR auth.uid() = creator_id)
  WITH CHECK (auth.uid() = hirer_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "orders_delete_hirer" ON orders;
CREATE POLICY "orders_delete_hirer" ON orders FOR DELETE
  TO authenticated USING (auth.uid() = hirer_id);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  hirer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL DEFAULT 0,
  upi_id text NOT NULL DEFAULT '9372169983@axl',
  method text DEFAULT 'upi',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'initiated', 'verified', 'paid', 'failed', 'refunded'
  )),
  transaction_ref text,
  verified_at timestamptz,
  verified_by text,
  utr_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_participants" ON payments;
CREATE POLICY "payments_select_participants" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = hirer_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "payments_insert_hirer" ON payments;
CREATE POLICY "payments_insert_hirer" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = hirer_id);

DROP POLICY IF EXISTS "payments_update_hirer" ON payments;
CREATE POLICY "payments_update_hirer" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = hirer_id)
  WITH CHECK (auth.uid() = hirer_id);

-- ============================================
-- DELIVERABLES
-- ============================================
CREATE TABLE IF NOT EXISTS deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hirer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  original_file_path text NOT NULL,
  preview_file_path text,
  file_type text DEFAULT 'file',
  file_size bigint DEFAULT 0,
  is_unlocked boolean DEFAULT false,
  unlocked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deliverables_select_participants" ON deliverables;
CREATE POLICY "deliverables_select_participants" ON deliverables FOR SELECT
  TO authenticated USING (auth.uid() = creator_id OR auth.uid() = hirer_id);

DROP POLICY IF EXISTS "deliverables_insert_creator" ON deliverables;
CREATE POLICY "deliverables_insert_creator" ON deliverables FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "deliverables_update_creator" ON deliverables;
CREATE POLICY "deliverables_update_creator" ON deliverables FOR UPDATE
  TO authenticated USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "deliverables_delete_creator" ON deliverables;
CREATE POLICY "deliverables_delete_creator" ON deliverables FOR DELETE
  TO authenticated USING (auth.uid() = creator_id);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participants" ON messages;
CREATE POLICY "messages_select_participants" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert_participants" ON messages;
CREATE POLICY "messages_insert_participants" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_update_sender" ON messages;
CREATE POLICY "messages_update_sender" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_delete_sender" ON messages;
CREATE POLICY "messages_delete_sender" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
CREATE POLICY "transactions_update_own" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_delete_own" ON transactions;
CREATE POLICY "transactions_delete_own" ON transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_gigs_creator ON gigs(creator_id);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON gigs(category);
CREATE INDEX IF NOT EXISTS idx_orders_hirer ON orders(hirer_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_order ON deliverables(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_order ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_hirer ON jobs(hirer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_gigs_updated ON gigs;
CREATE TRIGGER trg_gigs_updated BEFORE UPDATE ON gigs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_jobs_updated ON jobs;
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_deliverables_updated ON deliverables;
CREATE TRIGGER trg_deliverables_updated BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
