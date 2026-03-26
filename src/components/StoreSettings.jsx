import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, Tag, Save, CheckCircle2, AlertCircle, Building2, Package, Coins } from 'lucide-react';
import { supabase } from '../supabaseClient';

const OptionCard = ({ selected, onClick, title, desc }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-blue-600 bg-blue-50/50 shadow-md transform -translate-y-0.5' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
  >
    <div className="flex justify-between items-start mb-1">
      <h4 className={`font-bold text-sm ${selected ? 'text-blue-700' : 'text-slate-700'}`}>{title}</h4>
      {selected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1"></div>}
    </div>
    <p className={`text-xs ${selected ? 'text-blue-600/80' : 'text-slate-500'}`}>{desc}</p>
  </div>
);

const StoreSettings = ({ smeProfile }) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Default selections mapping the 9 variables
  const [answers, setAnswers] = useState({
    // Reliability
    r_type: 'none', r_capital: 'low', r_exp: 'low',
    // Logistics
    l_warehouse: 'dropship', l_cond: 'actual', l_sla: 'slow',
    // Price
    p_status: 'retailer', p_scale: 'retail', p_credit: 'cash'
  });

  // Calculate scores on the fly
  const calculateScores = () => {
    let rel = 0;
    if (answers.r_type === 'corp') rel += 40; else if (answers.r_type === 'commercial') rel += 20;
    if (answers.r_capital === 'high') rel += 30; else if (answers.r_capital === 'mid') rel += 15; else rel += 5;
    if (answers.r_exp === 'high') rel += 30; else if (answers.r_exp === 'mid') rel += 15; else rel += 5;

    let log = 0;
    if (answers.l_warehouse === 'wms') log += 40; else if (answers.l_warehouse === 'store') log += 20;
    if (answers.l_cond === 'free') log += 30; else if (answers.l_cond === 'min') log += 15;
    if (answers.l_sla === 'fast') log += 30; else if (answers.l_sla === 'mid') log += 15; else log += 5;

    let pri = 0;
    if (answers.p_status === 'import') pri += 40; else if (answers.p_status === 'auth') pri += 20;
    if (answers.p_scale === 'big') pri += 30; else if (answers.p_scale === 'mid') pri += 15; else pri += 5;
    if (answers.p_credit === 'credit') pri += 30;

    return { reliability: rel, logistics: log, price: pri, location: 50 };
  };

  const scores = calculateScores();

  useEffect(() => {
    const fetchExisting = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const meta = session?.user?.user_metadata?.assessment_answers;
      if (meta) setAnswers(meta);
    };
    fetchExisting();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          assessment_answers: answers,
          features: scores
        }
      });

      if (error) throw error;
      setSuccessMsg("อัปเดต Business Profile ระดับ Enterprise สำเร็จ! พร้อมสำหรับการจับคู่ระดับสูง");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const setAns = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="bg-slate-900 justify-between items-center p-8 rounded-3xl shadow-xl border border-slate-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">KYC & Business Verification Onboarding</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            ระบบจับคู่ B2B อัจฉริยะประเมินคะแนนของคุณตามศักยภาพจริง กรุณาระบุรายละเอียดองค์กร โลจิสติกส์ และโครงสร้างราคาเพื่อสะท้อนความสามารถในการแข่งขันของร้านคุณในกราฟเครือข่ายธุรกิจ
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 animate-in fade-in shadow-sm">
          <CheckCircle2 size={24} className="text-green-600" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in shadow-sm">
          <AlertCircle size={24} />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Set (2 Columns wide) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Section 1: Reliability */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-10"></div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800 border-b pb-4">
              <ShieldCheck className="text-purple-600 bg-purple-100 p-1.5 rounded-lg" size={32} /> หมวดที่ 1: ความน่าเชื่อถือองค์กร (Reliability & Trust)
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">1.1 รูปแบบการจดทะเบียนนิติบุคคล</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <OptionCard selected={answers.r_type === 'corp'} onClick={() => setAns('r_type', 'corp')} title="บจก. / บมจ." desc="นิติบุคคลเต็มรูปแบบ มีรายงานงบการเงิน" />
                  <OptionCard selected={answers.r_type === 'commercial'} onClick={() => setAns('r_type', 'commercial')} title="ทะเบียนพาณิชย์" desc="บุคคลธรรมดาจดทะเบียนการค้าถูกต้อง" />
                  <OptionCard selected={answers.r_type === 'none'} onClick={() => setAns('r_type', 'none')} title="บุคคลธรรมดาทั่วไป" desc="เปิดร้านขายอิสระ ไม่ได้จดทะเบียน" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">1.2 ขนาดทุนจดทะเบียน / รายได้ต่อปี</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <OptionCard selected={answers.r_capital === 'high'} onClick={() => setAns('r_capital', 'high')} title="มากกว่า 5 ล้านบาท" desc="สเกลธุรกิจขนาดกลาง-ใหญ่ (Medium-Enterprise)" />
                  <OptionCard selected={answers.r_capital === 'mid'} onClick={() => setAns('r_capital', 'mid')} title="1 - 5 ล้านบาท" desc="ธุรกิจขนาดเล็กมาตรฐาน (Small Business)" />
                  <OptionCard selected={answers.r_capital === 'low'} onClick={() => setAns('r_capital', 'low')} title="ต่ำกว่า 1 ล้านบาท" desc="ธุรกิจเกิดใหม่ / ร้านค้าย่อย (Micro)" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">1.3 ประสบการณ์และสถิติการเปิดกิจการ</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <OptionCard selected={answers.r_exp === 'high'} onClick={() => setAns('r_exp', 'high')} title="มากกว่า 5 ปี" desc="ร้านเก่าแก่ มีคอนเนคชั่นรากฐานมั่นคง" />
                  <OptionCard selected={answers.r_exp === 'mid'} onClick={() => setAns('r_exp', 'mid')} title="1 ถึง 5 ปี" desc="ร้านค้าตั้งหลักได้ มีประสบการณ์ประเมินตลาด" />
                  <OptionCard selected={answers.r_exp === 'low'} onClick={() => setAns('r_exp', 'low')} title="ต่ำกว่า 1 ปี" desc="ร้านค้าเกิดใหม่ กำลังสร้างเครือข่าย" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Logistics */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10"></div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800 border-b pb-4">
              <Truck className="text-orange-500 bg-orange-100 p-1.5 rounded-lg" size={32} /> หมวดที่ 2: ศักยภาพคลังสินค้าและการจัดส่ง (Logistics)
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">2.1 พื้นที่จัดการสต็อก (Warehouse System)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <OptionCard selected={answers.l_warehouse === 'wms'} onClick={() => setAns('l_warehouse', 'wms')} title="คลังกระจายสินค้า + WMS" desc="จัดการสต็อกปริมาณมหาศาลอัตโนมัติ" />
                  <OptionCard selected={answers.l_warehouse === 'store'} onClick={() => setAns('l_warehouse', 'store')} title="มีสต็อกเก็บที่หน้าร้าน" desc="รองรับปริมาณขายรอบ-ต่อ-รอบได้ปกติ" />
                  <OptionCard selected={answers.l_warehouse === 'dropship'} onClick={() => setAns('l_warehouse', 'dropship')} title="Pre-order / Dropship" desc="เน้นออเดอร์แล้วสั่งของ ไม่เก็บสต็อกเอง" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">2.2 เงื่อนไขโปรโมชั่นการจัดส่ง</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <OptionCard selected={answers.l_cond === 'free'} onClick={() => setAns('l_cond', 'free')} title="ส่งฟรีรอบประเทศ ครอบคลุม" desc="มีรถบริษัทวิ่งเอง (Fleet) ไม่มีข้อจำกัด" />
                  <OptionCard selected={answers.l_cond === 'min'} onClick={() => setAns('l_cond', 'min')} title="ส่งฟรีเมื่อยอดถึงกำหนด" desc="ทำดีลกับขนส่งไว้บางส่วน ช่วยซับค่าส่งให้คู่ค้า" />
                  <OptionCard selected={answers.l_cond === 'actual'} onClick={() => setAns('l_cond', 'actual')} title="คิดค่าบริการส่งตามจริง" desc="ใช้บริการขนส่งเอกชนปกติ ไม่ซัพพอร์ตค่าส่ง" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">2.3 ระยะเวลาดำเนินการจัดส่งเฉลี่ย (SLA)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <OptionCard selected={answers.l_sla === 'fast'} onClick={() => setAns('l_sla', 'fast')} title="Same-day / 1 วันทำการ" desc="ตัดรอบไว สินค้าถึงมือคู่ค้าฉับไว" />
                  <OptionCard selected={answers.l_sla === 'mid'} onClick={() => setAns('l_sla', 'mid')} title="2 ถึง 3 วันทำการ" desc="ระยะเวลาจัดเตรียมและนำจ่ายมาตรฐาน" />
                  <OptionCard selected={answers.l_sla === 'slow'} onClick={() => setAns('l_sla', 'slow')} title="รอสินค้า 3 วันขึ้นไป" desc="มีเวลาแพ็คช้า หรือเป็นสินค้าติดประกอบ/นำเข้า" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Price */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-10"></div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800 border-b pb-4">
              <Tag className="text-green-600 bg-green-100 p-1.5 rounded-lg" size={32} /> หมวดที่ 3: โครงสร้างราคาและแหล่งที่มา (Sourcing Edge)
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">3.1 สถานะต้นทางของสินค้า (Sourcing Tier)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <OptionCard selected={answers.p_status === 'import'} onClick={() => setAns('p_status', 'import')} title="Distributor หลัก / นำเข้าเอง" desc="ได้ราคาหน้าโรงงาน ต้นทุนถูกที่สุดในสายพาน" />
                  <OptionCard selected={answers.p_status === 'auth'} onClick={() => setAns('p_status', 'auth')} title="Authorized Dealer" desc="ดีลเลอร์แบรนด์ทางการ ได้ส่วนลดตามเป้า" />
                  <OptionCard selected={answers.p_status === 'retailer'} onClick={() => setAns('p_status', 'retailer')} title="Retailer อิสระ" desc="รับจากร้านส่ง/ยี่ปั๊ว ต้นทุนสูงตามกลไกตลาด" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">3.2 สเกลขีดความสามารถในการสั่งซื้อ (MOQ Limit)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <OptionCard selected={answers.p_scale === 'big'} onClick={() => setAns('p_scale', 'big')} title="สั่งล็อตใหญ่ / ยกตู้คอนเทนเนอร์" desc="ตัดล็อตใหญ่ทำราคาได้ต่ำพิเศษ (Volume Discount)" />
                  <OptionCard selected={answers.p_scale === 'mid'} onClick={() => setAns('p_scale', 'mid')} title="ยกลัง / ขายส่งปกติ (Wholesale)" desc="ตัดสต็อกตามขั้นต่ำทั่วไป (Tier 1-2)" />
                  <OptionCard selected={answers.p_scale === 'retail'} onClick={() => setAns('p_scale', 'retail')} title="ซื้อ-ขายปลีกรายชิ้น" desc="ไม่มีส่วนลด Volume" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">3.3 รูปแบบเครดิตเทอมการให้คะแนน</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <OptionCard selected={answers.p_credit === 'credit'} onClick={() => setAns('p_credit', 'credit')} title="อนุมัติเครดิต 30-60 วัน" desc="ให้เครดิตการค้าคู่ค้า (Credit Term) เพื่อหมุนเงิน" />
                  <OptionCard selected={answers.p_credit === 'cash'} onClick={() => setAns('p_credit', 'cash')} title="Cash Only / โอนจ่ายทันที" desc="ไม่มีระบบเครดิต หรือเก็บเงินสดล้วน" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Preview Card (Sticky) */}
        <div className="relative">
          <div className="bg-slate-900 text-white rounded-[2rem] p-8 sticky top-6 shadow-2xl border-4 border-slate-800">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-white">AI Profile Card</h3>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">Real-time Computation</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
                <Building2 size={24} className="text-blue-400" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-slate-300 group-hover:text-purple-400 transition">Reliability Score</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">{scores.reliability}</span>
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full ${getScoreColor(scores.reliability)} transition-all duration-700 shadow-[0_0_10px_rgba(255,255,255,0.2)]`} style={{ width: `${scores.reliability}%` }}></div>
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-slate-300 group-hover:text-orange-400 transition">Logistics Capability</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">{scores.logistics}</span>
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full ${getScoreColor(scores.logistics)} transition-all duration-700 shadow-[0_0_10px_rgba(255,255,255,0.2)]`} style={{ width: `${scores.logistics}%` }}></div>
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-slate-300 group-hover:text-green-400 transition">Sourcing & Pricing</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">{scores.price}</span>
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full ${getScoreColor(scores.price)} transition-all duration-700 shadow-[0_0_10px_rgba(255,255,255,0.2)]`} style={{ width: `${scores.price}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <div className="flex justify-between text-xs text-slate-400 font-mono mb-6">
                <span>VERIFICATION STATUS:</span>
                <span className={scores.reliability + scores.logistics + scores.price > 180 ? 'text-green-400 font-bold' : 'text-orange-400 font-bold'}>
                  {scores.reliability + scores.logistics + scores.price > 180 ? 'OPTIMAL' : 'PENDING ENHANCEMENT'}
                </span>
              </div>
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_-10px_rgba(37,99,235,0.6)] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "PROCESSING..." : <><Save size={20} /> ยืนยันข้อมูล (VERIFY PROFILE)</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreSettings;
