import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import StoreSettings from './components/StoreSettings';
import CustomerDemands from './components/CustomerDemands';
import BusinessNetwork from './components/BusinessNetwork';
import { supabase } from './supabaseClient';
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
  Zap,
  LogOut,
  SlidersHorizontal
} from 'lucide-react';

const initialPartners = [
  {
    id: 1, name: "Global Tech Wholesale", type: "Supplier", score: 0,
    matchReason: "โดดเด่นด้านราคาต้นทุนสินค้าที่ถูกที่สุด", targetDemand: "d1",
    features: { price: 95, location: 30, logistics: 60, reliability: 90 }, tags: ["Import", "Bulk Price"]
  },
  {
    id: 2, name: "Safe Express", type: "Logistics", score: 0,
    matchReason: "ครอบคลุมพื้นที่จัดส่งของคุณด้วยต้นทุนต่ำสุด", targetDemand: "d3",
    features: { price: 60, location: 80, logistics: 95, reliability: 85 }, tags: ["Express", "Regional"]
  },
  {
    id: 3, name: "Khon Kaen IT Hub", type: "Retailer / Partner", score: 0,
    matchReason: "อยู่ในพื้นที่เดียวกัน สามารถแลกเปลี่ยนสต็อกได้ทันที", targetDemand: "d2",
    features: { price: 70, location: 100, logistics: 90, reliability: 80 }, tags: ["Local", "Instant Exchange"]
  },
  {
    id: 4, name: "FinTech SME Supply", type: "Financial", score: 0,
    matchReason: "มีความน่าเชื่อถือสูงมาก และให้เครดิตการค้าได้", targetDemand: "d1",
    features: { price: 85, location: 40, logistics: 50, reliability: 100 }, tags: ["Credit Line", "Trusted"]
  }
];

const App = () => {
  const [authState, setAuthState] = useState('login'); // 'login', 'register'
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMatching, setIsMatching] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const [matchWeights, setMatchWeights] = useState({
    price: 50,
    location: 50,
    logistics: 50,
    reliability: 50
  });

  const [partners, setPartners] = useState(initialPartners);

  const [smeProfile, setSmeProfile] = useState({
    id: "001",
    name: "กำลังโหลด...",
    type: "",
    location: "",
    specialty: "PC Components & Gaming Gear",
    matchingScore: 85,
    connections: 12
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) updateProfileFromSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) updateProfileFromSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfileFromSession = (currentSession) => {
    const meta = currentSession?.user?.user_metadata || {};
    setSmeProfile({
      id: currentSession?.user?.id.substring(0, 8) || "001",
      name: meta.storeName || "ผู้ใช้งานใหม่",
      type: meta.storeType || "ไม่ระบุ",
      location: meta.location || "ไม่ระบุ",
      specialty: "PC Components & Gaming Gear",
      matchingScore: 85,
      connections: 12
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ดึงข้อมูล Real-time จาก API ภายนอก (DummyJSON)
  const [customerDemands, setCustomerDemands] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(true);

  // ฟังชันก์ดึงข้อมูลตลาดโลก (DummyJSON + Local PC Hardware Database)
  const fetchLiveDemands = useCallback(async (searchQuery = '') => {
    setIsApiLoading(true);
    try {
      // 1. ดึงข้อมูลจาก Global API (DummyJSON) สำหรับหมวดหมู่ Laptops, Phones
      const url = searchQuery
        ? `https://dummyjson.com/products/search?q=${searchQuery}&limit=50`
        : 'https://dummyjson.com/products/category/laptops?limit=5';

      const response = await fetch(url);
      const data = await response.json();

      const itCategories = ["smartphones", "laptops", "tablets", "mobile-accessories"];
      const apiItProducts = data.products.filter(p => itCategories.includes(p.category));

      // 2. Local Database สำหรับอุปกรณ์ PC Hardware เชิงลึกแบรนด์ดัง 
      // แก้ไขเป็นใช้ Premium Dark Placeholder เพื่องานระดับ B2B Enterprise ที่ดูสะอาดตายิ่งขึ้น
      const localHardwareDB = [
        { id: 101, title: 'GeForce RTX 5090 24GB GDDR7', brand: 'NVIDIA', category: 'gpu', price: 1599, stock: 2, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=RTX+5090' },
        { id: 102, title: 'Ryzen 9 7950X3D', brand: 'AMD', category: 'cpu', price: 699, stock: 12, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=CPU+Ryzen' },
        { id: 103, title: 'ROG Strix Z790-E Gaming WiFi', brand: 'ASUS', category: 'mainboard', price: 499, stock: 8, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Motherboard' },
        { id: 104, title: 'Vengeance RGB 64GB DDR5', brand: 'Corsair', category: 'ram', price: 250, stock: 45, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=DDR5+RAM' },
        { id: 105, title: 'Odyssey G9 49" OLED 240Hz', brand: 'Samsung', category: 'monitor', price: 1799, stock: 3, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Ultrawide' },
        { id: 106, title: 'G Pro X Superlight 2', brand: 'Logitech', category: 'mouse', price: 159, stock: 120, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Gaming+Mouse' },
        { id: 107, title: 'Q1 Pro Custom Mechanical', brand: 'Keychron', category: 'keyboard', price: 199, stock: 15, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Keyboard' },
        { id: 108, title: 'Kraken Elite 360 RGB', brand: 'NZXT', category: 'fan', price: 279, stock: 20, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Liquid+Cooler' },
        { id: 109, title: 'O11 Dynamic EVO XL', brand: 'Lian Li', category: 'case', price: 249, stock: 10, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=PC+Case' },
        { id: 110, title: 'INZONE H9 Wireless PC', brand: 'Sony', category: 'headphone', price: 299, stock: 35, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Headset' },
        { id: 111, title: '990 PRO 2TB PCIe 4.0 NVMe', brand: 'Samsung', category: 'ssd', price: 169, stock: 50, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=NVMe+SSD' }
      ];

      // 3. รวม Database ทั้ง 2 แหล่งเข้าด้วยกัน
      let combinedProducts = [...apiItProducts, ...localHardwareDB];

      // 4. ค้นหาสินค้าจาก Database ที่รวมแล้ว
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        combinedProducts = combinedProducts.filter(p =>
          p.title.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
        );
      } else {
        // หากไม่มีการค้นหา ให้สุ่ม Laptops จาก API และ PC Hardware จาก Local โชว์ร่วมกัน
        combinedProducts = [...apiItProducts.slice(0, 2), ...localHardwareDB.slice(0, 4)];
      }

      // 5. นำ Data มาคำนวณ Business Logic
      const liveDemands = combinedProducts.slice(0, 6).map((p, i) => {
        const urgencyScore = Math.min(100, Math.max(20, 100 - p.stock));

        // แก้ปัญหาชื่อแบรนด์ซ้ำ
        const brand = p.brand ? p.brand.trim() : '';
        const title = p.title ? p.title.trim() : '';
        let displayName = title;
        if (brand && !title.toLowerCase().includes(brand.toLowerCase())) {
          displayName = `${brand} ${title}`;
        }

        return {
          id: `d${(i % 3) + 1}`, // Link dynamically to d1, d2, d3 in the Partners graph
          item: `${displayName} (${p.category})`,
          demandLevel: urgencyScore > 70 ? "High" : "Medium",
          gap: p.stock < 20 ? `วิกฤตสต็อกตลาดโลกเหลือ ${p.stock} ชิ้น` : `ต้นทุนแปรปรวน ($${p.price})`,
          urgency: urgencyScore,
          image: p.thumbnail // เก็บรูปภาพ
        };
      });

      setCustomerDemands(liveDemands);
    } catch (error) {
      console.error("Live API Fetch Failed:", error);
    } finally {
      setIsApiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveDemands();
  }, []);

  const handleRunMatch = () => {
    setIsMatching(true);
    setTimeout(() => {
      const calculated = partners.map(p => {
        const totalWeight = matchWeights.price + matchWeights.location + matchWeights.logistics + matchWeights.reliability;
        let score = 0;
        if (totalWeight > 0) {
          score = (
            (p.features.price * matchWeights.price) +
            (p.features.location * matchWeights.location) +
            (p.features.logistics * matchWeights.logistics) +
            (p.features.reliability * matchWeights.reliability)
          ) / totalWeight;
        } else {
          score = (p.features.price + p.features.location + p.features.logistics + p.features.reliability) / 4;
        }

        let newReason = p.matchReason;
        const maxWeightKey = Object.keys(matchWeights).reduce((a, b) => matchWeights[a] > matchWeights[b] ? a : b);
        if (matchWeights[maxWeightKey] > 70) {
          if (maxWeightKey === 'price' && p.features.price > 80) newReason = "ถูกเลือกเพราะตอบโจทย์น้ำหนักด้าน 'ราคาสินค้าที่ถูกที่สุด'";
          if (maxWeightKey === 'location' && p.features.location > 80) newReason = "ถูกเลือกเพราะตอบโจทย์น้ำหนักด้าน 'พื้นที่ใกล้เคียงจัดการง่าย'";
          if (maxWeightKey === 'logistics' && p.features.logistics > 80) newReason = "ถูกเลือกเพราะตอบโจทย์น้ำหนักด้าน 'ค่าขนส่งที่คุ้มค่า'";
          if (maxWeightKey === 'reliability' && p.features.reliability > 80) newReason = "ถูกเลือกเพราะตอบโจทย์น้ำหนักด้าน 'ความน่าเชื่อถือสูงสุด'";
        }

        return { ...p, score: Math.round(score), matchReason: newReason };
      });

      const sorted = calculated.sort((a, b) => b.score - a.score);
      setPartners(sorted);
      setIsMatching(false);
    }, 1000);
  };

  useEffect(() => {
    handleRunMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) {
    if (authState === 'register') {
      return <Register onNavigateLogin={() => setAuthState('login')} />;
    }
    return <Login onNavigateRegister={() => setAuthState('register')} />;
  }

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
          <button
            onClick={() => setActiveTab('demands')}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${activeTab === 'demands'
              ? 'bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg shadow-orange-500/40 text-white font-bold scale-[1.02]'
              : 'bg-gradient-to-r from-slate-800 to-slate-800/80 hover:from-slate-700 hover:to-orange-900/40 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]'
              }`}
          >
            <div className={`flex items-center gap-3 relative z-10 ${activeTab !== 'demands' ? 'group-hover:translate-x-1 transition-transform' : ''}`}>
              <div className="relative">
                <ShoppingCart size={20} className={activeTab === 'demands' ? 'text-white' : 'text-orange-500'} />
                {activeTab !== 'demands' && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-slate-800"></span>
                  </span>
                )}
              </div>
              <span className={`font-bold ${activeTab === 'demands' ? '' : 'tracking-wide'}`}>ความต้องการลูกค้า</span>
            </div>

            {activeTab !== 'demands' && (
              <span className="relative z-10 text-[9px] font-black bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 rounded-full uppercase animate-pulse shadow-sm tracking-wider">
                Hot
              </span>
            )}
            {activeTab !== 'demands' && (
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 to-red-500 rounded-l-xl"></div>
            )}
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition text-slate-400">
            <Users size={20} /> รายชื่อคู่ค้า
          </button>
        </nav>

        <div className="mt-auto border-t border-slate-700 pt-4">
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'settings' ? 'bg-blue-600 shadow-lg text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Settings size={20} /> ตั้งค่าร้านค้า (KYC)
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition text-slate-400 mt-1">
            <LogOut size={20} /> ออกจากระบบ
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
                <span className="text-3xl font-bold text-blue-600">{partners.length}</span>
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
              {/* Sliders UI */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                <h4 className="font-bold flex items-center gap-2 mb-4"><SlidersHorizontal size={18} className="text-purple-600" /> ปรับแต่งความสำคัญ (AI Preferences)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>ราคาสินค้าถูก (Price/Cost)</span>
                      <span className="text-blue-600">{matchWeights.price}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={matchWeights.price} onChange={(e) => setMatchWeights({ ...matchWeights, price: parseInt(e.target.value) })} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>ระยะทางใกล้ชิด (Location)</span>
                      <span className="text-blue-600">{matchWeights.location}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={matchWeights.location} onChange={(e) => setMatchWeights({ ...matchWeights, location: parseInt(e.target.value) })} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>ค่าจัดส่งถูก (Logistics)</span>
                      <span className="text-blue-600">{matchWeights.logistics}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={matchWeights.logistics} onChange={(e) => setMatchWeights({ ...matchWeights, logistics: parseInt(e.target.value) })} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>ความน่าเชื่อถือ (Reliability)</span>
                      <span className="text-blue-600">{matchWeights.reliability}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={matchWeights.reliability} onChange={(e) => setMatchWeights({ ...matchWeights, reliability: parseInt(e.target.value) })} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold flex items-center gap-2"><Cpu size={18} className="text-blue-600" /> รายการแนะนำที่คำนวณจาก Preferences</h3>
                <button onClick={handleRunMatch} className={`text-sm font-bold px-4 py-2 border rounded-lg transition-all ${isMatching ? 'text-slate-400 bg-slate-50' : 'text-blue-600 hover:bg-blue-50 border-blue-200'}`} disabled={isMatching}>
                  {isMatching ? 'กำลังประมวลผล...' : 'รัน AI จัดอันดับใหม่'}
                </button>
              </div>

              <div className="space-y-4">
                {partners.map((partner) => (
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



        {activeTab === 'demands' && (
          <CustomerDemands
            demands={customerDemands}
            partners={partners}
            onNavigateMatch={() => setActiveTab('matching')}
            onSearch={fetchLiveDemands}
            isApiLoading={isApiLoading}
          />
        )}

        {activeTab === 'network' && (
          <BusinessNetwork
            partners={partners}
            demands={customerDemands}
          />
        )}

        {activeTab === 'settings' && (
          <StoreSettings smeProfile={smeProfile} />
        )}
      </main>
    </div>
  );
};

export default App;