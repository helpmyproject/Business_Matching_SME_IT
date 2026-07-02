-- ============================================================
-- Business Matching System for SME IT Stores
-- Supabase SQL Setup Script
-- รันใน: Supabase Dashboard > SQL Editor > New Query
-- ============================================================


-- ============================================================
-- 1. PROFILES TABLE
-- เก็บข้อมูลร้านค้าที่ Link กับ Supabase Auth User
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name   TEXT NOT NULL DEFAULT '',
  store_type   TEXT NOT NULL DEFAULT 'Retailer',  -- Retailer, Supplier, Logistics, Financial
  location     TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile เมื่อมี user ใหม่ signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, store_name, store_type, location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'storeName', ''),
    COALESCE(NEW.raw_user_meta_data->>'storeType', 'Retailer'),
    COALESCE(NEW.raw_user_meta_data->>'location', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger: รันทุกครั้งที่มี user ใหม่
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ============================================================
-- 2. STORE_ASSESSMENTS TABLE
-- เก็บผลการทำ KYC Assessment (StoreSettings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reliability Section
  r_type      TEXT NOT NULL DEFAULT 'none',     -- corp, commercial, none
  r_capital   TEXT NOT NULL DEFAULT 'low',      -- high, mid, low
  r_exp       TEXT NOT NULL DEFAULT 'low',      -- high, mid, low

  -- Logistics Section
  l_warehouse TEXT NOT NULL DEFAULT 'dropship', -- wms, store, dropship
  l_cond      TEXT NOT NULL DEFAULT 'actual',   -- free, min, actual
  l_sla       TEXT NOT NULL DEFAULT 'slow',     -- fast, mid, slow

  -- Price / Sourcing Section
  p_status    TEXT NOT NULL DEFAULT 'retailer', -- import, auth, retailer
  p_scale     TEXT NOT NULL DEFAULT 'retail',   -- big, mid, retail
  p_credit    TEXT NOT NULL DEFAULT 'cash',     -- credit, cash

  -- Computed Scores (0-100)
  score_reliability  INT NOT NULL DEFAULT 0,
  score_logistics    INT NOT NULL DEFAULT 0,
  score_price        INT NOT NULL DEFAULT 0,
  score_location     INT NOT NULL DEFAULT 50,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- แต่ละ user มีแค่ 1 assessment
  UNIQUE(user_id)
);

DROP TRIGGER IF EXISTS set_assessments_updated_at ON public.store_assessments;
CREATE TRIGGER set_assessments_updated_at
  BEFORE UPDATE ON public.store_assessments
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ============================================================
-- 3. PARTNERS TABLE
-- คู่ค้าที่ระบบแนะนำ (Static + Dynamic จาก Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'Supplier', -- Supplier, Logistics, Retailer/Partner, Financial
  match_reason  TEXT NOT NULL DEFAULT '',
  target_demand TEXT NOT NULL DEFAULT 'd1',

  -- Feature Scores สำหรับ AI Matching
  feature_price        INT NOT NULL DEFAULT 50 CHECK (feature_price BETWEEN 0 AND 100),
  feature_location     INT NOT NULL DEFAULT 50 CHECK (feature_location BETWEEN 0 AND 100),
  feature_logistics    INT NOT NULL DEFAULT 50 CHECK (feature_logistics BETWEEN 0 AND 100),
  feature_reliability  INT NOT NULL DEFAULT 50 CHECK (feature_reliability BETWEEN 0 AND 100),

  tags        TEXT[] DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- เพิ่มข้อมูลพาร์ทเนอร์เริ่มต้น
INSERT INTO public.partners (name, type, match_reason, target_demand, feature_price, feature_location, feature_logistics, feature_reliability, tags)
VALUES
  ('Global Tech Wholesale',  'Supplier',          'โดดเด่นด้านราคาต้นทุนสินค้าที่ถูกที่สุด',                  'd1', 95, 30, 60, 90,  ARRAY['Import', 'Bulk Price']),
  ('Safe Express',           'Logistics',          'ครอบคลุมพื้นที่จัดส่งของคุณด้วยต้นทุนต่ำสุด',              'd3', 60, 80, 95, 85,  ARRAY['Express', 'Regional']),
  ('Khon Kaen IT Hub',       'Retailer / Partner', 'อยู่ในพื้นที่เดียวกัน สามารถแลกเปลี่ยนสต็อกได้ทันที',    'd2', 70, 100, 90, 80, ARRAY['Local', 'Instant Exchange']),
  ('FinTech SME Supply',     'Financial',          'มีความน่าเชื่อถือสูงมาก และให้เครดิตการค้าได้',            'd1', 85, 40, 50, 100, ARRAY['Credit Line', 'Trusted'])
ON CONFLICT DO NOTHING;


-- ============================================================
-- 4. MATCH_HISTORY TABLE
-- บันทึกประวัติการจับคู่ของแต่ละ User
-- ============================================================
CREATE TABLE IF NOT EXISTS public.match_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id  UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,

  -- น้ำหนักที่ User ตั้งตอนนั้น
  weight_price        INT NOT NULL DEFAULT 50,
  weight_location     INT NOT NULL DEFAULT 50,
  weight_logistics    INT NOT NULL DEFAULT 50,
  weight_reliability  INT NOT NULL DEFAULT 50,

  match_score INT NOT NULL DEFAULT 0,
  action      TEXT NOT NULL DEFAULT 'view',  -- view, connect, share

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ป้องกัน User อื่นเข้าถึงข้อมูลของคนอื่น
-- ============================================================

-- Profiles: User เห็นแค่ของตัวเอง, ทุกคนมองเห็นได้แต่แก้ไขของตัวเองเท่านั้น
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Store Assessments: เห็นและแก้ไขของตัวเองเท่านั้น
ALTER TABLE public.store_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own assessment" ON public.store_assessments;
CREATE POLICY "Users can manage their own assessment"
  ON public.store_assessments FOR ALL
  USING (auth.uid() = user_id);

-- Partners: ทุกคนที่ Login แล้วมองเห็นได้ (Read-only)
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view partners" ON public.partners;
CREATE POLICY "Authenticated users can view partners"
  ON public.partners FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Match History: User เห็นประวัติของตัวเองเท่านั้น
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own match history" ON public.match_history;
CREATE POLICY "Users can manage their own match history"
  ON public.match_history FOR ALL
  USING (auth.uid() = user_id);


-- ============================================================
-- ✅ DONE! ระบบพร้อมใช้งาน
-- Tables: profiles, store_assessments, partners, match_history
-- Functions: handle_new_user (trigger), set_updated_at (trigger)
-- RLS: เปิดทุกตาราง
-- ============================================================
