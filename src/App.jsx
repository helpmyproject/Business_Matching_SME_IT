import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Handshake,
  Settings,
  Search,
  Bell,
  Filter,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Cpu,
  Store,
  Network,
  Share2,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Info,
  ShoppingCart,
  Zap
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMatching, setIsMatching] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const smeProfile = {
    id: "001",
    name: "Natdanai IT",
    type: "Retailer (ร้านค้าปลีก)",
    location: "ขอนแก่น",
    specialty: "PC Components & Gaming Gear",
    matchingScore: 85,
    connections: 12
  };

  // ข้อมูลความต้องการของลูกค้า (Customer Demand) - ฟังก์ชันที่ขอเพิ่มกลับมา
  const customerDemands = [
    { id: "d1", item: "NVIDIA RTX 50 Series", demandLevel: "High", gap: "ขาดแคลนสต็อก", urgency: 95 },
    { id: "d2", item: "Mechanical Keyboard (Custom)", demandLevel: "Medium", gap: "ราคาต้นทุนสูง", urgency: 60 },
    { id: "d3", item: "Gaming Monitor 2K 144Hz", demandLevel: "High", gap: "ค่าขนส่งแพง", urgency: 85 }
  ];

  const recommendedPartners = [
    {
      id: 1,
      name: "Global Tech Wholesale",
      type: "Supplier (ผู้ผลิต/นำเข้า)",
      score: 98,
      matchReason: "มีโควต้าสินค้ากลุ่ม RTX 50 Series สำหรับร้านค้าในเขตอีสาน",
      features: { inventory: 95, price: 90, reliability: 98, location: 60 },
      tags: ["Import", "Graphic Cards", "Bulk Price"],
      targetDemand: "d1"
    },
    {
      id: 2,
      name: "Safe Delivery Logis",
      type: "Logistics (ขนส่ง)",
      score: 92,
      matchReason: "ช่วยลดต้นทุนการขนส่งสินค้าขนาดใหญ่ (Monitor) ลง 15%",
      features: { speed: 95, cost: 70, insurance: 100, coverage: 90 },
      tags: ["Express", "Insured", "Regional"],
      targetDemand: "d3"
    },
    {
      id: 3,
      name: "FinTech for SME",
      type: "Financial (สินเชื่อ)",
      score: 88,
      matchReason: "วงเงินกู้ระยะสั้นเพื่อสต็อกสินค้าตามกระแสตลาด",
      features: { interest: 90, process: 85, limit: 80, support: 95 },
      tags: ["Credit Line", "Low Interest"],
      targetDemand: "d1"
    }
  ];

  const handleRunMatch = () => {
    setIsMatching(true);
    setTimeout(() => setIsMatching(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-4 shadow-xl">
        <div className="flex items-center gap-3 mb-10 px-2 py-4 border-b border-slate-800">
          <div className="bg-blue-500 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <Handshake size={24} />
          </div>
          <h1 className="text-xl font-bold leading-tight">SME IT<br /><span className="text-blue-400">Matchmaking</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> แผงควบคุม (Dashboard)
          </button>
          <button onClick={() => setActiveTab('matching')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'matching' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}>
            <Cpu size={20} /> ระบบจับคู่ (AI Engine)
          </button>
          <button onClick={() => setActiveTab('network')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'network' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}>
            <Network size={20} /> โครงข่ายธุรกิจ (Graph)
          </button>
          <div className="pt-4 pb-2 px-3 text-[15px] font-bold text-slate-500 uppercase tracking-widest">การจัดการ</div>
          <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition text-slate-400">
            <ShoppingCart size={20} /> ความต้องการลูกค้า
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition text-slate-400">
            <Users size={20} /> รายชื่อคู่ค้า
          </button>
        </nav>

        <div className="mt-auto border-t border-slate-700 pt-4">
          <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition text-slate-400">
            <Settings size={20} /> ตั้งค่าระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h2 className="text-xl font-bold">สวัสดี, {smeProfile.name}</h2>
            <p className="text-sm text-slate-500">Node ID: {smeProfile.id} | <span className="text-green-600 font-medium">System Ready</span></p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-2 rounded-full relative">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">IT</div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-2">Match Rate</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">85%</span>
                  <span className="text-green-500 text-xs font-bold mb-1 flex items-center"><TrendingUp size={12} /> +2.4%</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-2">ความต้องการที่รอการแก้ไข</p>
                <span className="text-3xl font-bold text-orange-500">{customerDemands.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-2">พาร์ทเนอร์แนะนำ</p>
                <span className="text-3xl font-bold text-blue-600">{recommendedPartners.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-2">System Health</p>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase">Optimal</span>
              </div>
            </div>

            {/* Customer Demand Section - Added Back */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><ShoppingCart className="text-orange-500" size={20} /> ความต้องการจากลูกค้าในร้าน (Live Demand)</h3>
                <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-bold">อัปเดตแบบ Real-time</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {customerDemands.map(demand => (
                  <div key={demand.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition group">
                    <div className="flex justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${demand.demandLevel === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {demand.demandLevel} Demand
                      </span>
                      <Zap size={14} className={demand.urgency > 80 ? 'text-orange-500 fill-orange-500' : 'text-slate-300'} />
                    </div>
                    <h4 className="font-bold text-slate-800">{demand.item}</h4>
                    <p className="text-xs text-slate-500 mt-1">ปัญหา: {demand.gap}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden mr-4">
                        <div className="h-full bg-orange-500" style={{ width: `${demand.urgency}%` }}></div>
                      </div>
                      <button onClick={() => setActiveTab('matching')} className="text-blue-600 opacity-0 group-hover:opacity-100 transition"><ChevronRight size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold">ขยายขอบเขตธุรกิจด้วย AI</h3>
                  <p className="text-slate-300 max-w-md">ระบบ GNN กำลังประมวลผลความสัมพันธ์แบบหลายมิติ เพื่อค้นหา Supplier และ Partner ที่เหมาะสมที่สุดสำหรับร้านค้าของคุณในไตรมาสนี้</p>
                  <div className="flex gap-4">
                    <button onClick={() => setActiveTab('matching')} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition flex items-center gap-2">
                      <BarChart3 size={18} /> ดูการวิเคราะห์การจับคู่
                    </button>
                  </div>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md text-center">
                  <p className="text-xs text-slate-400 mb-2 uppercase font-bold">Trust Score</p>
                  <p className="text-4xl font-bold text-green-400">9.2</p>
                  <p className="text-[10px] text-slate-500 mt-2 tracking-widest">RANKED #1 IN KHON KAEN</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matching' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold flex items-center gap-2"><Cpu size={18} className="text-blue-600" /> รายการแนะนำที่ตอบโจทย์ความต้องการลูกค้า</h3>
                <button onClick={handleRunMatch} className={`text-sm font-bold ${isMatching ? 'text-slate-400' : 'text-blue-600'}`} disabled={isMatching}>
                  {isMatching ? 'ประมวลผลโครงข่าย...' : 'รีเฟรชการจับคู่'}
                </button>
              </div>

              <div className="space-y-4">
                {recommendedPartners.map((partner) => (
                  <div
                    key={partner.id}
                    onClick={() => setSelectedMatch(partner)}
                    className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer ${selectedMatch?.id === partner.id ? 'border-blue-500 ring-4 ring-blue-50 shadow-md' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                    <div className="flex justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl">{partner.name[0]}</div>
                        <div>
                          <h4 className="font-bold">{partner.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">{partner.type}</span>
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                              <ShoppingCart size={10} /> แก้ไขปัญหา: {customerDemands.find(d => d.id === partner.targetDemand)?.item}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-blue-600 leading-none">{partner.score}%</div>
                        <p className="text-[8px] text-slate-400 uppercase font-black mt-1">Match Score</p>
                      </div>
                    </div>
                    {selectedMatch?.id === partner.id && (
                      <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-sm font-bold text-slate-700 mb-3">AI Analysis Features:</p>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(partner.features).map(([key, val]) => (
                            <div key={key}>
                              <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                                <span>{key}</span>
                                <span>{val}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${val}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 flex gap-3">
                          <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">สร้างความร่วมมือธุรกิจ</button>
                          <button className="px-5 py-3 border rounded-xl hover:bg-slate-50 text-slate-400 transition"><Share2 size={20} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Insight Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold mb-4 flex items-center gap-2"><Info size={18} className="text-blue-500" /> AI Matching Insight</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl text-sm border-l-4 border-blue-500">
                    <p className="text-slate-700 leading-relaxed font-medium">
                      "จากการวิเคราะห์ Demand ของลูกค้า พบว่ามีความต้องการ <strong>NVIDIA RTX 50 Series</strong> สูงมากในกลุ่มลูกค้าขอนแก่น แต่พาร์ทเนอร์ปัจจุบันของคุณไม่มีโควต้าสินค้า เราจึงดึงข้อมูลจาก Node: <strong>Global Tech</strong> ซึ่งมี Edge ความสัมพันธ์ที่แข็งแกร่งกับแบรนด์โดยตรงมาแนะนำครับ"
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-4">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">พึงพอใจไหม?</span>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-600 transition"><ThumbsUp size={18} /></button>
                      <button className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><ThumbsDown size={18} /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Graph Visualization */}
              <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-start mb-2 z-10">
                  <h4 className="font-bold flex items-center gap-2 text-blue-400 uppercase text-xs tracking-widest">
                    <Network size={16} /> Topological Matchmaking
                  </h4>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-6 z-10">Real-time graph neural network connecting you with optimal business nodes.</p>

                <div className="flex-1 flex items-center justify-center relative min-h-[220px]">
                  {/* Glowing Background Effect */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  {/* SVG Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    <defs>
                      <linearGradient id="gradTopRight" x1="50%" y1="50%" x2="80%" y2="25%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                      </linearGradient>
                      <linearGradient id="gradBottomLeft" x1="50%" y1="50%" x2="25%" y2="80%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.4" />
                      </linearGradient>
                      <linearGradient id="gradTopLeft" x1="50%" y1="50%" x2="25%" y2="20%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="url(#gradTopRight)" strokeWidth="2" strokeDasharray="4,4" className="animate-[pulse_3s_ease-in-out_infinite]" />
                    <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="url(#gradBottomLeft)" strokeWidth="2" strokeDasharray="4,4" className="animate-[pulse_2.5s_ease-in-out_infinite]" />
                    <line x1="50%" y1="50%" x2="25%" y2="20%" stroke="url(#gradTopLeft)" strokeWidth="2" strokeDasharray="4,4" className="animate-[pulse_4s_ease-in-out_infinite]" />
                  </svg>

                  {/* Central Node (Your Store) */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center border-4 border-slate-900 shadow-[0_0_20px_rgba(59,130,246,0.5)] z-20 relative">
                      <Store size={26} className="text-white" />
                      <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-slate-900"></div>
                    </div>
                    <span className="mt-2 text-[10px] font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-md border border-slate-700">Central Node</span>
                  </div>

                  {/* Partner 1 Node (Supplier - Green) */}
                  <div className="absolute top-[25%] left-[80%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group cursor-pointer hover:z-30">
                    <div className="w-10 h-10 bg-slate-800 rounded-full border-2 border-green-500/50 flex items-center justify-center text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:bg-green-500/20 group-hover:border-green-400 group-hover:scale-110 transition-all duration-300">
                      <ShoppingCart size={16} />
                    </div>
                    <div className="mt-2 text-[10px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full whitespace-nowrap opacity-70 group-hover:opacity-100 group-hover:text-green-300 group-hover:-translate-y-1 transition-all duration-300 border border-transparent group-hover:border-green-500/30 shadow-lg">
                      Supplier (98%)
                    </div>
                  </div>

                  {/* Partner 2 Node (Logistics - Orange) */}
                  <div className="absolute top-[80%] left-[25%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group cursor-pointer hover:z-30">
                    <div className="w-10 h-10 bg-slate-800 rounded-full border-2 border-orange-500/50 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)] group-hover:bg-orange-500/20 group-hover:border-orange-400 group-hover:scale-110 transition-all duration-300">
                      <Zap size={16} />
                    </div>
                    <div className="mt-2 text-[10px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full whitespace-nowrap opacity-70 group-hover:opacity-100 group-hover:text-orange-300 group-hover:-translate-y-1 transition-all duration-300 border border-transparent group-hover:border-orange-500/30 shadow-lg">
                      Logistics (92%)
                    </div>
                  </div>

                  {/* Partner 3 Node (Financial - Purple) */}
                  <div className="absolute top-[20%] left-[25%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group cursor-pointer hover:z-30">
                    <div className="w-9 h-9 bg-slate-800 rounded-full border-2 border-purple-500/50 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:bg-purple-500/20 group-hover:border-purple-400 group-hover:scale-110 transition-all duration-300">
                      <Users size={14} />
                    </div>
                    <div className="mt-2 text-[10px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full whitespace-nowrap opacity-70 group-hover:opacity-100 group-hover:text-purple-300 group-hover:-translate-y-1 transition-all duration-300 border border-transparent group-hover:border-purple-500/30 shadow-lg">
                      FinTech (88%)
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                  <div className="flex flex-col">
                    <span className="uppercase text-slate-500 mb-0.5">Algorithm</span>
                    <span className="text-blue-400 font-bold">GNN-LinkPredict</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="uppercase text-slate-500 mb-0.5">Edges Processed</span>
                    <span className="text-white font-bold tracking-wider">2.4M / SEC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="h-[650px] bg-white rounded-3xl border border-slate-200 shadow-inner flex items-center justify-center relative overflow-hidden">
            <div className="text-center space-y-4 z-10 p-8 bg-white/80 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl max-w-md">
              <div className="bg-blue-600 p-5 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto text-white shadow-2xl shadow-blue-200 animate-bounce">
                <Network size={48} />
              </div>
              <h3 className="text-2xl font-bold">Business Network Topology</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                แสดงโครงสร้างเครือข่ายความสัมพันธ์ระหว่างร้านค้าของคุณและพาร์ทเนอร์ในระบบ GNN<br />
                <span className="text-blue-600 font-bold italic mt-2 block">กำลังโหลดข้อมูลกราฟความสัมพันธ์...</span>
              </p>
              <div className="pt-4">
                <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition transform hover:scale-105 active:scale-95">ดูโครงข่ายแบบ Full Graph</button>
              </div>
            </div>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#3b82f6 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;