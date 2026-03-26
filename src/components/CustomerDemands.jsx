import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Zap, AlertTriangle, Cpu, CheckCircle2, ChevronRight, PackageSearch, Search } from 'lucide-react';

const CustomerDemands = ({ demands, partners, onNavigateMatch, onSearch, isApiLoading }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // คำค้นหา IT ยอดฮิตสำหรับ Suggestion Dropdown
  const popularKeywords = [
    "GPU", "CPU", "Motherboard", "RAM", "Monitor", "Mouse", "Keyboard",
    "Laptop", "Smartphone", "Tablet", "SSD", "Case", "Cooler", "Headphone",
    "Apple", "Samsung", "Asus", "Nvidia", "AMD", "Logitech", "Corsair"
  ];

  // กรองคำแนะนำตามที่ผู้ใช้พิมพ์
  const filteredSuggestions = query
    ? popularKeywords.filter(k => k.toLowerCase().includes(query.toLowerCase()))
    : popularKeywords.slice(0, 5); // Default โชว์ 5 อันดับแรกถ้ายังไม่พิมพ์

  // Real-time Debounced Search (พิมพ์ปุ๊บ ค้นหาปั๊บ แบบหน่วงเวลา)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(query);
      }
    }, 400); // หน่วงเวลา 400ms เพื่อไม่ให้ยิง API รัวเกินไปขณะกำลังพิมพ์

    return () => clearTimeout(timer);
  }, [query]); // ลบ onSearch ออกจาก Dependency เพื่อป้องกัน Infinite Loop Render

  // ซ่อน Dropdown เมื่อคลิกที่อื่นบนหน้าจอ
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // เมื่อคลิกเลือกคำจาก Dropdown
  const handleSuggestionClick = (keyword) => {
    setQuery(keyword);
    setShowSuggestions(false);
    if (onSearch) onSearch(keyword); // ค้นหาทันทีไม่ต้องรอ Debounce
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (onSearch) onSearch(query);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="bg-slate-900 justify-between items-center p-8 rounded-3xl shadow-xl border border-slate-700 text-white relative z-50">
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-yellow-400">Customer Demand Tracking 🎯</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed mb-4">
            ติดตามความต้องการของลูกค้าในพื้นที่คุณแบบเรียลไทม์ และทำงานร่วมกับ AI Engine เพื่อค้นหาซัพพลายเออร์ที่ตอบสนองความต้องการเหล่านี้อย่างรวดเร็วที่สุด
          </p>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-slate-800/80 w-fit px-4 py-2 rounded-full border border-slate-700 shadow-inner">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold text-green-400 tracking-widest uppercase">Live Global Market API Connected</span>
            </div>

            <form onSubmit={handleSearch} ref={wrapperRef} className="relative w-full md:w-96 group">
              <input
                type="text"
                placeholder="ค้นหาสินค้า IT ทั่วโลก (เช่น smartphone, laptop...)"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-orange-500 focus:bg-slate-800 transition shadow-inner placeholder:text-slate-500 text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition" size={18} />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md hidden sm:block">
                ค้นหา
              </button>

              {/* Suggestion Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {filteredSuggestions.map((suggestion, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer transition border-b border-slate-700/50 last:border-0 flex items-center"
                    >
                      <Search size={14} className="mr-3 text-slate-500" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isApiLoading ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-slate-200">
            <div className="mx-auto w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-slate-600">กำลังดึงข้อมูล Live Market Data จากเซิร์ฟเวอร์ต่างประเทศ...</p>
          </div>
        ) : demands.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 flex flex-col items-center">
            <PackageSearch size={48} className="text-slate-300 mb-4" />
            <p className="font-bold text-slate-600 text-lg">ไม่พบข้อมูลสินค้า "{query}" ในตลาดโลก</p>
            <p className="text-slate-400 text-sm mt-1">ลองค้นหาคำใหม่ เช่น "laptop", "phone", "macbook", "tablet"</p>
          </div>
        ) : demands.map(demand => {
          // Find the AI-matched partners for this specific demand
          const matchingPartners = partners.filter(p => p.targetDemand === demand.id);
          const hasMatch = matchingPartners.length > 0;
          // Pre-sort or just pick the first best match found in the graph
          const bestMatch = hasMatch ? matchingPartners[0] : null;

          return (
            <div key={demand.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row relative group hover:border-orange-200 transition-colors">
              {/* Left Side: Demand Info */}
              <div className="p-8 md:w-2/5 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${demand.demandLevel === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {demand.demandLevel} Demand
                  </span>
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                    <Zap size={14} className={demand.urgency > 80 ? 'text-orange-500 fill-orange-500' : 'text-slate-400'} />
                    <span className="text-[10px] font-black text-slate-600">Urgency: {demand.urgency}%</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-2">
                  {demand.image && (
                    <div className="shrink-0 w-24 h-24 bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex items-center justify-center">
                      <img
                        src={demand.image}
                        alt={demand.item}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/200x200/f1f5f9/94a3b8.png?text=IT+Product';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight">{demand.item}</h3>

                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 bg-white p-2 rounded-xl border border-slate-100 w-fit">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="font-medium">ปัญหาตลาด: <span className="text-amber-600 font-bold">{demand.gap}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: AI Tracker Details */}
              <div className="p-8 md:w-3/5 flex flex-col justify-between">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-slate-400 mb-4">
                    <Cpu size={16} /> AI Supply Match Tracking
                  </h4>

                  {hasMatch ? (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 relative overflow-hidden group-hover:bg-blue-50 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
                      <div className="relative z-10 flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center font-black text-xl text-blue-600 shrink-0">
                          {bestMatch.name[0]}
                        </div>
                        <div className="flex-1 w-full">
                          <div className="flex justify-between items-center mb-1">
                            <h5 className="font-bold text-slate-800 text-lg truncate pr-2">{bestMatch.name}</h5>
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                              <CheckCircle2 size={12} /> ขจัด Pain Point
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mb-2">บทบาท: {bestMatch.type}</p>
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${bestMatch.score || 95}%` }}></div>
                            </div>
                            <span className="text-xs font-black text-blue-600 shrink-0">{bestMatch.score || 95}% Fit</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 flex flex-col items-center">
                      <PackageSearch size={32} className="text-slate-300 mb-2" />
                      <p className="font-medium text-sm">ยังไม่พบซัพพลายเออร์ที่เหมาะสมในระบบ</p>
                      <p className="text-xs mt-1 text-slate-400">AI ระบบ GNN กำลังทำการค้นหาในเครือข่ายระดับประเทศ...</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => onNavigateMatch(demand.id)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 group/btn"
                  >
                    วิเคราะห์พาร์ทเนอร์ใน AI Engine
                    <ChevronRight size={18} className="text-slate-400 group-hover/btn:text-white transition" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerDemands;
