-- โปรดนำโค้ดนี้ไปรันใน Supabase SQL Editor
-- เพื่อแก้ปัญหาส่งข้อความแชทไม่ขึ้น, การกดยอมรับสำเร็จ, และเปิดสิทธิ์ลบคู่ค้า

-- 1. อัปเดตความสัมพันธ์ (Foreign Keys)
ALTER TABLE public.match_requests
  DROP CONSTRAINT IF EXISTS match_requests_sender_id_fkey,
  ADD CONSTRAINT match_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.match_requests
  DROP CONSTRAINT IF EXISTS match_requests_receiver_user_id_fkey,
  ADD CONSTRAINT match_requests_receiver_user_id_fkey FOREIGN KEY (receiver_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. อนุญาตให้คนรับคำสามารถ UPDATE (กดยอมรับ/ปฏิเสธ) ได้
DROP POLICY IF EXISTS "Receiver can update requests" ON public.match_requests;
CREATE POLICY "Receiver can update requests"
  ON public.match_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_user_id)
  WITH CHECK (auth.uid() = receiver_user_id);

-- 3. อัปเดต RLS Policies ของ chat_messages เพื่อแก้ไขปัญหาส่งข้อความไม่ไป
DROP POLICY IF EXISTS "Chat participants can access messages" ON public.chat_messages;
CREATE POLICY "Chat participants can access messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Chat participants can insert messages" ON public.chat_messages;
CREATE POLICY "Chat participants can insert messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Insert chat in accepted requests" ON public.chat_messages;

-- 4. เปิด RLS ให้การลบข้อมูล (Delete) ใน match_requests และ match_history ทำได้
DROP POLICY IF EXISTS "Users can delete own requests" ON public.match_requests;
CREATE POLICY "Users can delete own requests"
  ON public.match_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_user_id);

DROP POLICY IF EXISTS "Users can delete own match history" ON public.match_history;
CREATE POLICY "Users can delete own match history"
  ON public.match_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. อัปเดต Trigger สถานะจับคู่ ให้รองรับทังคู่จำลองและคู่จริง
CREATE OR REPLACE FUNCTION public.handle_match_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  partner_name TEXT;
BEGIN
  -- ดึงชื่อพาร์ทเนอร์
  IF NEW.receiver_user_id IS NOT NULL THEN
    SELECT store_name INTO partner_name FROM public.profiles WHERE id = NEW.receiver_user_id;
  ELSE
    SELECT name INTO partner_name FROM public.partners WHERE id = NEW.partner_id;
  END IF;
  
  partner_name := COALESCE(partner_name, 'พาร์ทเนอร์');

  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- แจ้งผู้ส่งคำขอ
    INSERT INTO public.notifications (user_id, title, description, type, link_id)
    VALUES (
      NEW.sender_id,
      '🎉 คำขอได้รับการยอมรับ!',
      '"' || partner_name || '" ยอมรับข้อเสนอธุรกิจของคุณแล้ว เปิดแชทได้เลย!',
      'accepted',
      NEW.id
    );
    -- แจ้งผู้รับคำขอด้วย
    IF NEW.receiver_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, description, type, link_id)
      VALUES (
        NEW.receiver_user_id,
        '🤝 ตอบรับธุรกิจสำเร็จ',
        'คุณได้ตอบรับคำขอจับคู่ธุรกิจ ยินดีต้อนรับพาร์ทเนอร์รายใหม่!',
        'accepted',
        NEW.id
      );
    END IF;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    -- แจ้งผู้ส่งคำขอ
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

-- 6. ลบข้อมูลคำขอที่ซ้ำซ้อนในฐานข้อมูล และล็อกสิทธิ์ไม่ให้ซ้ำกัน
DELETE FROM public.match_requests a
USING public.match_requests b
WHERE a.created_at < b.created_at
  AND a.sender_id = b.sender_id
  AND (
    (a.partner_id = b.partner_id)
    OR (a.receiver_user_id = b.receiver_user_id)
  );

ALTER TABLE public.match_requests
  DROP CONSTRAINT IF EXISTS match_requests_sender_receiver_unique,
  ADD CONSTRAINT match_requests_sender_receiver_unique UNIQUE (sender_id, receiver_user_id);

-- 7. สำเร็จ
SELECT 'หากไม่ติด Error แสดงว่าอัปเดตระบบแชท RLS, สิทธิ์การลบคู่ค้า และระบบป้องกันซ้ำเรียบร้อย!' as status;

