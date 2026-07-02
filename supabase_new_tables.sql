-- ============================================================
-- Business Matching System — New Tables (Phase 2 Extension)
-- รันใน: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ============================================================
-- 5. MATCH_REQUESTS TABLE
-- คำขอจับคู่ธุรกิจ (ต้องยืนยันทั้งสองฝ่าย)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.match_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id        UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,

  -- ข้อมูลคำขอ
  message           TEXT NOT NULL DEFAULT '',         -- ข้อความแนะนำตัว / เหตุผลที่ต้องการจับคู่
  business_purpose  TEXT NOT NULL DEFAULT '',         -- วัตถุประสงค์ทางธุรกิจ
  match_score       INT NOT NULL DEFAULT 0,

  -- สถานะ: pending -> accepted | rejected
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  reject_reason     TEXT DEFAULT '',                  -- เหตุผลปฏิเสธ (ถ้า rejected)

  -- น้ำหนัก AI ที่ใช้ตอนส่งคำขอ
  weight_price        INT NOT NULL DEFAULT 50,
  weight_location     INT NOT NULL DEFAULT 50,
  weight_logistics    INT NOT NULL DEFAULT 50,
  weight_reliability  INT NOT NULL DEFAULT 50,

  -- เวลา
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ป้องกัน duplicate: user ส่งคำขอไปหา partner เดิมได้แค่ครั้งเดียวที่ยัง pending/accepted
  UNIQUE (sender_id, partner_id)
);

DROP TRIGGER IF EXISTS set_match_requests_updated_at ON public.match_requests;
CREATE TRIGGER set_match_requests_updated_at
  BEFORE UPDATE ON public.match_requests
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS สำหรับ match_requests
ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;

-- ผู้ส่งเห็น request ของตัวเอง
DROP POLICY IF EXISTS "Sender can manage own requests" ON public.match_requests;
CREATE POLICY "Sender can manage own requests"
  ON public.match_requests FOR ALL
  USING (auth.uid() = sender_id);

-- ทุก user ที่ login อ่านได้ (เพื่อให้ "พาร์ทเนอร์" เห็นคำขอที่มาหาตน)
DROP POLICY IF EXISTS "Authenticated users can view requests" ON public.match_requests;
CREATE POLICY "Authenticated users can view requests"
  ON public.match_requests FOR SELECT
  TO authenticated
  USING (TRUE);


-- ============================================================
-- 6. CHAT_MESSAGES TABLE
-- ข้อความแชท B2B (เฉพาะ match_request ที่ accepted)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_request_id  UUID NOT NULL REFERENCES public.match_requests(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index เพื่อ query เร็ว
CREATE INDEX IF NOT EXISTS idx_chat_messages_request
  ON public.chat_messages(match_request_id, created_at);

-- RLS สำหรับ chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- เฉพาะ user ที่เป็นส่วนหนึ่งของ match_request นั้น ถึงจะอ่าน/เขียนได้
DROP POLICY IF EXISTS "Chat participants can access messages" ON public.chat_messages;
CREATE POLICY "Chat participants can access messages"
  ON public.chat_messages FOR ALL
  TO authenticated
  USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM public.match_requests mr
      WHERE mr.id = match_request_id
        AND (mr.sender_id = auth.uid())
        AND mr.status = 'accepted'
    )
  );

-- อนุญาตให้ insert ข้อความใน accepted request
DROP POLICY IF EXISTS "Insert chat in accepted requests" ON public.chat_messages;
CREATE POLICY "Insert chat in accepted requests"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.match_requests mr
      WHERE mr.id = match_request_id
        AND mr.status = 'accepted'
        AND mr.sender_id = auth.uid()
    )
  );


-- ============================================================
-- 7. NOTIFICATIONS TABLE
-- การแจ้งเตือนจริงสำหรับแต่ละ User
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'info'
              CHECK (type IN ('info', 'match_request', 'accepted', 'rejected', 'chat', 'system')),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  link_id     UUID DEFAULT NULL,  -- อ้างอิง match_request_id หรือ chat_messages id
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);


-- ============================================================
-- Function: สร้าง notification อัตโนมัติเมื่อมี match_request ใหม่
-- ============================================================
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
  SELECT name INTO partner_name FROM public.partners WHERE id = NEW.partner_id;
  -- ดึงชื่อร้านผู้ส่ง
  SELECT COALESCE(raw_user_meta_data->>'storeName', 'ร้านค้า') INTO sender_store
    FROM auth.users WHERE id = NEW.sender_id;

  -- แจ้งผู้รับ (ปัจจุบัน notification ไปหา sender ว่าส่งแล้ว - จะ upgrade เป็น real partner user ในอนาคต)
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

DROP TRIGGER IF EXISTS on_match_request_created ON public.match_requests;
CREATE TRIGGER on_match_request_created
  AFTER INSERT ON public.match_requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_match_request();


-- ============================================================
-- Function: แจ้งเตือนเมื่อมีการอัปเดตสถานะ match_request
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_match_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  partner_name TEXT;
BEGIN
  SELECT name INTO partner_name FROM public.partners WHERE id = NEW.partner_id;

  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, description, type, link_id)
    VALUES (
      NEW.sender_id,
      '🎉 คำขอได้รับการยอมรับ!',
      '"' || partner_name || '" ยอมรับข้อเสนอธุรกิจของคุณแล้ว เปิดแชทได้เลย!',
      'accepted',
      NEW.id
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, description, type, link_id)
    VALUES (
      NEW.sender_id,
      'คำขอถูกปฏิเสธ',
      '"' || partner_name || '" ปฏิเสธข้อเสนอ: ' || COALESCE(NEW.reject_reason, 'ไม่ระบุเหตุผล'),
      'rejected',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_match_request_status_change ON public.match_requests;
CREATE TRIGGER on_match_request_status_change
  AFTER UPDATE OF status ON public.match_requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_match_request_status_change();


-- ============================================================
-- AI Feedback TABLE (สำหรับปุ่ม ThumbsUp/Down)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id  UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  feedback    TEXT NOT NULL CHECK (feedback IN ('positive', 'negative')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.ai_feedback;
CREATE POLICY "Users can insert own feedback"
  ON public.ai_feedback FOR ALL
  USING (auth.uid() = user_id);


-- ============================================================
-- ✅ DONE! New tables created:
-- 5. match_requests  — คำขอจับคู่พร้อม accept/reject
-- 6. chat_messages   — แชท B2B real-time
-- 7. notifications   — การแจ้งเตือนจริง
-- 8. ai_feedback     — บันทึก ThumbsUp/Down
-- Triggers: handle_new_match_request, handle_match_request_status_change
-- ============================================================
