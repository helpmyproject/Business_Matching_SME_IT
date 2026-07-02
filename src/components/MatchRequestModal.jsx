import React, { useState } from 'react';
import { X, Send, Handshake, Building2, Tag, MessageSquare, Target } from 'lucide-react';

const MatchRequestModal = ({ partner, session, matchWeights, onClose, onSent, showToast }) => {
  const [message, setMessage] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);

  const purposeOptions = [
    { value: 'supplier', label: '📦 ต้องการซัพพลายเออร์สินค้า', desc: 'หาแหล่งสินค้าต้นทุนต่ำ' },
    { value: 'logistics', label: '🚚 ต้องการพาร์ทเนอร์ขนส่ง', desc: 'ลดค่าส่ง / เพิ่มความเร็ว' },
    { value: 'co-sell', label: '🤝 ต้องการขายร่วมกัน (Co-sell)', desc: 'แบ่งตลาด / แลกเปลี่ยนสต็อก' },
    { value: 'credit', label: '💳 ต้องการวงเงินเครดิต', desc: 'ขยายกำลังซื้อสินค้า' },
    { value: 'other', label: '📋 อื่นๆ (ระบุในข้อความ)', desc: 'เจรจาโดยตรง' },
  ];

  const handleSubmit = async () => {
    if (!message.trim() || !purpose) {
      showToast('กรุณาเลือกวัตถุประสงค์และใส่ข้อความก่อน', 'error');
      return;
    }
    setLoading(true);
    try {
      const { supabase } = await import('../supabaseClient');

      // ตรวจสอบว่าเป็น UUID ของผู้ใช้จริง หรือ Partner จำลอง
      const isReal = partner.isRealUser === true;
      let pId = null;
      let receiverId = null;

      if (isReal) {
        receiverId = partner.id;
      } else {
        pId = partner.id;
        if (!pId || String(pId).startsWith('p')) {
          const { data: dbP } = await supabase
            .from('partners')
            .select('id')
            .eq('name', partner.name)
            .limit(1);
          if (dbP && dbP.length > 0) pId = dbP[0].id;
          else {
            showToast('ไม่พบข้อมูลพาร์ทเนอร์ในฐานข้อมูล กรุณาลองใหม่', 'error');
            setLoading(false);
            return;
          }
        }
      }

      // ตรวจสอบว่ามีคำขอที่เกิดขึ้นอยู่แล้วหรือไม่ ป้องกันการส่งซ้ำ
      const checkQuery = supabase
        .from('match_requests')
        .select('id, status')
        .eq('sender_id', session.user.id);
      
      if (receiverId) {
        checkQuery.eq('receiver_user_id', receiverId);
      } else {
        checkQuery.eq('partner_id', pId);
      }

      const { data: existingRequests } = await checkQuery;

      if (existingRequests && existingRequests.length > 0) {
        const dup = existingRequests[0];
        if (dup.status === 'accepted') {
          showToast('คุณเชื่อมต่อกับคู่ค้ารายนี้แล้วในรายชื่อคู่ค้า', 'error');
          setLoading(false);
          return;
        } else if (dup.status === 'pending') {
          showToast('คุณส่งคำขอไปหาพาร์ทเนอร์นี้แล้ว กรุณารอการตอบรับ', 'error');
          setLoading(false);
          return;
        } else {
          // หากเคสเดิมเป็น rejected หรือ cancelled ให้อัปเดตสถานะกลับมาเป็น pending (ป้องการ unique constraint error)
          const { error: updateError } = await supabase
            .from('match_requests')
            .update({
              status: 'pending',
              message: message.trim(),
              business_purpose: purpose,
              match_score: partner.score || 0,
              weight_price: matchWeights.price,
              weight_location: matchWeights.location,
              weight_logistics: matchWeights.logistics,
              weight_reliability: matchWeights.reliability,
            })
            .eq('id', dup.id);

          if (!updateError) {
            showToast(`✅ ส่งคำขอจับคู่ไปยัง "${partner.name}" สำเร็จ! รอการยืนยัน`);
            onSent();
          } else {
            showToast(`เกิดข้อผิดพลาด: ${updateError.message}`, 'error');
          }
          setLoading(false);
          return;
        }
      }

      let payload = {
        sender_id: session.user.id,
        message: message.trim(),
        business_purpose: purpose,
        match_score: partner.score || 0,
        weight_price: matchWeights.price,
        weight_location: matchWeights.location,
        weight_logistics: matchWeights.logistics,
        weight_reliability: matchWeights.reliability,
        status: 'pending',
      };

      if (receiverId) {
        payload.receiver_user_id = receiverId;
      } else {
        payload.partner_id = pId;
      }

      const { error } = await supabase.from('match_requests').insert(payload);

      if (error) {
        if (error.code === '23505') {
          showToast('คุณส่งคำขอไปหาพาร์ทเนอร์นี้แล้ว กรุณารอการตอบรับ', 'error');
        } else {
          throw error;
        }
      } else {
        showToast(`✅ ส่งคำขอจับคู่ไปยัง "${partner.name}" สำเร็จ! รอการยืนยัน`);
        onSent();
      }
    } catch (err) {
      showToast(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/70">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-center">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-1">
              <Handshake size={20} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-300">ส่งคำขอจับคู่ธุรกิจ</span>
            </div>
            <h2 className="text-xl font-black">{partner.name}</h2>
            <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">{partner.type}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-white">
              <div className="text-3xl font-black text-blue-400">{partner.score}%</div>
              <div className="text-[10px] text-slate-400 uppercase">Match Score</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Partner Info */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl flex-shrink-0">
              {partner.name[0]}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{partner.matchReason}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {(partner.tags || []).map((tag, i) => (
                  <span key={i} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
              <Target size={14} className="text-blue-600" /> วัตถุประสงค์ทางธุรกิจ *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {purposeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPurpose(opt.value)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    purpose === opt.value
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`font-bold text-sm ${purpose === opt.value ? 'text-blue-700' : 'text-slate-700'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <MessageSquare size={14} className="text-blue-600" /> ข้อความแนะนำตัวและข้อเสนอ *
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={`สวัสดีครับ ผมเป็นเจ้าของร้าน IT ในพื้นที่ขอนแก่น สนใจร่วมมือกับ ${partner.name} เพราะ...`}
              rows={4}
              className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm resize-none transition-colors"
            />
            <div className="text-right text-xs text-slate-400 mt-1">{message.length} / 500 ตัวอักษร</div>
          </div>

          {/* Info box */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700 font-medium">
              ⚠️ <strong>หมายเหตุ:</strong> พาร์ทเนอร์จะต้องยืนยันรับข้อเสนอก่อน จึงจะเริ่มแชทได้ ทั้งสองฝ่ายสามารถปฏิเสธได้ตลอดเวลา
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !message.trim() || !purpose}
            className="flex-2 flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={16} />
                ส่งคำขอจับคู่
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchRequestModal;
