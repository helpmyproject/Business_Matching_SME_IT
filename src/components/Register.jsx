import React, { useState } from 'react';
import { Mail, Lock, Store, Handshake, ChevronRight, MapPin } from 'lucide-react';
import { supabase } from '../supabaseClient';

const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี",
  "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง",
  "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์",
  "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี",
  "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี",
  "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา",
  "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ",
  "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี",
  "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู",
  "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

const Register = ({ onNavigateLogin }) => {
  const [formData, setFormData] = useState({
    storeName: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeType: 'Retailer',
    location: ''
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLocationChange = (e) => {
    setFormData({ ...formData, location: e.target.value });
    setShowDropdown(true);
  };

  const selectProvince = (province) => {
    setFormData({ ...formData, location: province });
    setShowDropdown(false);
  };

  const filteredProvinces = PROVINCES.filter(p => p.includes(formData.location));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: {
          storeName: formData.storeName,
          storeType: formData.storeType,
          location: formData.location
        }
      }
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    alert("สร้างบัญชีสำเร็จ! (หากขึ้นข้อความยืนยันล้มเหลว กรุณาตรวจสอบอีเมลหรือจำกัดการสมัครซ้ำ)");
    onNavigateLogin();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 items-center justify-center p-4 py-12">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/30 mb-3">
            <Handshake size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold leading-tight text-center">
            สร้างบัญชีเครือข่าย
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">เข้าร่วม Ecosystem ของธุรกิจ IT ทั่วประเทศ</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold animate-in fade-in">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อร้านค้า / บริษัท (Store Name)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Store size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  name="storeName"
                  required
                  value={formData.storeName}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-700"
                  placeholder="เช่น Natdanai IT"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ประเภทธุรกิจ (Business Type)</label>
              <select
                name="storeType"
                value={formData.storeType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-slate-700"
              >
                <option value="Retailer">ร้านค้าปลีก (Retailer)</option>
                <option value="Supplier">ผู้ผลิต/นำเข้า (Supplier)</option>
                <option value="Logistics">ขนส่ง (Logistics)</option>
                <option value="Financial">สินเชื่อ (Financial)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ที่ตั้ง (Location)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleLocationChange}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  autoComplete="off"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-700"
                  placeholder="พิมพ์เพื่อค้นหาจังหวัด เช่น ขอนแก่น"
                />
                {showDropdown && filteredProvinces.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {filteredProvinces.map(province => (
                      <li
                        key={province}
                        onMouseDown={() => selectProvince(province)}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm font-bold text-slate-600 transition-colors border-b border-slate-50 last:border-b-0"
                      >
                        {province}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">อีเมล (Email)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-700"
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">รหัสผ่าน (Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ยืนยันรหัสผ่าน (Confirm Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98] mt-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? "กำลังลงทะเบียน..." : <>ลงทะเบียนพาร์ทเนอร์ <ChevronRight size={18} /></>}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 pt-6 border-t border-slate-100">
            มีบัญชีผู้ใช้แล้ว?{' '}
            <button onClick={onNavigateLogin} className="text-blue-600 font-bold hover:underline transition-all">
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
