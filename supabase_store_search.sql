-- ============================================================
-- Store Search Feature — SQL Fix
-- รันใน: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. อนุญาตให้ทุก user ที่ login แล้ว มองเห็น profiles ของคนอื่นได้ (Read-only)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (TRUE);

-- 2. อนุญาตให้ทุก user ที่ login แล้ว มองเห็น store_assessments ของคนอื่นได้ (Read-only scores)
DROP POLICY IF EXISTS "Authenticated users can view all assessments" ON public.store_assessments;
CREATE POLICY "Authenticated users can view all assessments"
  ON public.store_assessments FOR SELECT
  TO authenticated
  USING (TRUE);

-- 3. เพิ่ม column receiver_user_id ใน match_requests สำหรับ user-to-user matching
-- (ทำให้ทั้ง partner_id และ receiver_user_id เป็น nullable)
ALTER TABLE public.match_requests
  ALTER COLUMN partner_id DROP NOT NULL;

ALTER TABLE public.match_requests
  ADD COLUMN IF NOT EXISTS receiver_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.match_requests
  DROP CONSTRAINT IF EXISTS match_requests_sender_id_fkey,
  ADD CONSTRAINT match_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ลบ unique constraint เก่า แล้วสร้างใหม่ที่ครอบคลุมทั้ง 2 กรณี
ALTER TABLE public.match_requests
  DROP CONSTRAINT IF EXISTS match_requests_sender_id_partner_id_key;

-- 4. View สำหรับ query ร้านค้าที่สมัครพร้อม KYC scores
CREATE OR REPLACE VIEW public.store_profiles AS
SELECT
  p.id,
  p.store_name,
  p.store_type,
  p.location,
  p.created_at,
  COALESCE(sa.score_reliability, 0) AS score_reliability,
  COALESCE(sa.score_logistics, 0)   AS score_logistics,
  COALESCE(sa.score_price, 0)       AS score_price,
  COALESCE(sa.score_location, 50)   AS score_location,
  sa.r_type,
  sa.l_warehouse,
  sa.p_status
FROM public.profiles p
LEFT JOIN public.store_assessments sa ON sa.user_id = p.id;

-- Grant select on view
GRANT SELECT ON public.store_profiles TO authenticated;

-- 5. แก้ไข Trigger function ให้รองรับกรณี user-to-user matching (ป้องกัน description เป็น NULL)
CREATE OR REPLACE FUNCTION public.handle_new_match_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  partner_name TEXT;
  sender_store TEXT;
BEGIN
  -- ดึงชื่อพาร์ทเนอร์
  IF NEW.receiver_user_id IS NOT NULL THEN
    -- กรณีเป็นผู้ใช้จริง (user-to-user)
    SELECT store_name INTO partner_name FROM public.profiles WHERE id = NEW.receiver_user_id;
  ELSE
    -- กรณีเป็นข้อมูลจำลองจาก partners
    SELECT name INTO partner_name FROM public.partners WHERE id = NEW.partner_id;
  END IF;

  -- ป้องกันกรณีไม่พบชื่อ
  partner_name := COALESCE(partner_name, 'พาร์ทเนอร์');

  -- ดึงชื่อร้านผู้ส่ง
  SELECT COALESCE(raw_user_meta_data->>'storeName', 'ร้านค้า') INTO sender_store
    FROM auth.users WHERE id = NEW.sender_id;

  -- แจ้งผู้รับ (สามารถส่งไปหา receiver_user_id ได้แล้วในอนาคต แต่ตอนนี้เอาตาม flow เดิมคือแจ้งเตือนฝั่งคนส่ง)
  INSERT INTO public.notifications (user_id, title, description, type, link_id)
  VALUES (
    NEW.sender_id,
    'ส่งคำขอจับคู่สำเร็จ',
    'คำขอของคุณถึง "' || partner_name || '" อยู่ระหว่างรอการตอบรับ',
    'match_request',
    NEW.id
  );

  RETURN NEW;
END;
$$;


-- ============================================================
-- ✅ DONE!
-- - profiles: ทุก user เห็นกันได้
-- - store_assessments: ทุก user เห็น scores กันได้
-- - match_requests: รองรับ user-to-user matching
-- - store_profiles view: query ร้านค้าพร้อม KYC scores ได้ง่าย
-- - Trigger: รองรับ notification เมื่อเป็น user-to-user (แก้ปัญหา description null)
-- ============================================================
