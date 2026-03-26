import React, { useState } from 'react';
import { Mail, Lock, Handshake, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Login = ({ onNavigateRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setErrorMsg("เข้าสู่ระบบไม่สำเร็จ: อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in duration-500">
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30 mb-4 animate-bounce">
            <Handshake size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold leading-tight text-center">
            SME IT<br />
            <span className="text-blue-600">Matchmaking</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">เข้าสู่ระบบเพื่อเชื่อมต่อเครือข่ายธุรกิจของคุณ</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold animate-in fade-in">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">อีเมล (Email)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-700"
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700">รหัสผ่าน (Password)</label>
                <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">ลืมรหัสผ่าน?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : <>เข้าสู่ระบบ <ChevronRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            ยังไม่มีบัญชีผู้ใช้?{' '}
            <button onClick={onNavigateRegister} className="text-blue-600 font-bold hover:underline transition-all">
              สมัครสมาชิกที่นี่
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
