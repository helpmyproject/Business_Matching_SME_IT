import React, { useState, useEffect, useRef } from 'react';
import { Store, Network, ShieldCheck, Zap, ChevronRight, Activity } from 'lucide-react';

const BusinessNetwork = ({ partners, demands }) => {
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Keep radar scanning continuously or simulating random deep scans
    const timer = setInterval(() => {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 4000);
    }, 10000); // scan every 10 secs
    
    // Initial scan timeout
    const initialTimer = setTimeout(() => setIsScanning(false), 3000);
    return () => {
      clearInterval(timer);
      clearTimeout(initialTimer);
    };
  }, []);

  const containerRef = useRef(null);
  const [mouseAngle, setMouseAngle] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate angle in degrees
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    
    setMouseAngle(angle);
  };

  const getPosition = (index, total) => {
    const angle = (index / total) * Math.PI * 2 - (Math.PI / 2); // Start from top 12 o'clock
    const distances = [22, 34, 43, 26, 38, 30]; // % radius from center
    const radius = distances[index % distances.length];
    
    return {
      left: `${50 + radius * Math.cos(angle)}%`,
      top: `${50 + radius * Math.sin(angle)}%`,
    };
  };

  // Injecting Custom Advanced Animations safely within the component
  const customStyles = `
    @keyframes radar-spin {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    @keyframes orbit-slow {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    @keyframes orbit-reverse {
      from { transform: translate(-50%, -50%) rotate(360deg); }
      to { transform: translate(-50%, -50%) rotate(0deg); }
    }
    @keyframes data-stream {
      to { stroke-dashoffset: -20; }
    }
    @keyframes float {
      0% { transform: translate(-50%, -50%) translateY(0px); }
      50% { transform: translate(-50%, -50%) translateY(-10px); }
      100% { transform: translate(-50%, -50%) translateY(0px); }
    }
    @keyframes float-selected {
      0% { transform: translate(-50%, -50%) scale(1.25) translateY(0px); }
      50% { transform: translate(-50%, -50%) scale(1.25) translateY(-5px); }
      100% { transform: translate(-50%, -50%) scale(1.25) translateY(0px); }
    }
  `;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="w-full h-full min-h-[750px] bg-slate-950 rounded-3xl relative overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center animate-in fade-in duration-700 group cursor-crosshair"
    >
      <style>{customStyles}</style>
      
      {/* Background Gradients & Glow Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
      
      {/* Dynamic Radar Sweeper (Follows Cursor or Spins) */}
      <div 
        className={`absolute top-1/2 left-1/2 w-[88%] h-[88%] rounded-full opacity-40 pointer-events-none transition-transform ${isHovering ? 'duration-75 ease-out' : ''}`}
        style={{
          background: 'conic-gradient(from 0deg, transparent 70%, rgba(59, 130, 246, 0.1) 80%, rgba(59, 130, 246, 0.8) 100%)',
          animation: isHovering ? 'none' : `radar-spin ${isScanning ? '2s' : '10s'} linear infinite`,
          transform: isHovering ? `translate(-50%, -50%) rotate(${mouseAngle}deg)` : 'translate(-50%, -50%)'
        }}
      ></div>

      {/* Orbits / Sonar Rings Overlay */}
      {/* Inner Ring */}
      <div 
        className="absolute top-1/2 left-1/2 w-[44%] h-[44%] border-2 border-dashed border-blue-500/20 rounded-full"
        style={{ animation: 'orbit-slow 60s linear infinite' }}
      ></div>
      {/* Middle Ring */}
      <div 
        className="absolute top-1/2 left-1/2 w-[68%] h-[68%] border border-dotted border-blue-500/30 rounded-full"
        style={{ animation: 'orbit-reverse 90s linear infinite' }}
      ></div>
      {/* Outer Ring */}
      <div 
        className="absolute top-1/2 left-1/2 w-[88%] h-[88%] border border-dashed border-blue-500/10 rounded-full"
        style={{ animation: 'orbit-slow 120s linear infinite' }}
      ></div>

      {/* SVG Connecting Light Beams (Data Streams) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="idleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" stopOpacity="0" />
            <stop offset="100%" stopColor="#475569" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {partners.map((partner, i) => {
          const pos = getPosition(i, partners.length);
          const isSelected = selectedPartner?.id === partner.id;
          
          if (isSelected) {
            // High-speed Laser Data Stream for Selected Partner
            return (
              <line
                key={`line-${partner.id}`}
                x1="50%" y1="50%"
                x2={pos.left} y2={pos.top}
                stroke="url(#lineGrad)"
                strokeWidth="4"
                strokeDasharray="10 10"
                filter="url(#glow)"
                style={{ animation: 'data-stream 0.5s linear infinite' }}
              />
            );
          } else {
            // Idle faint connecting lines for all partners
            return (
              <line
                key={`line-${partner.id}`}
                x1="50%" y1="50%"
                x2={pos.left} y2={pos.top}
                stroke="url(#idleGrad)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="opacity-50"
              />
            );
          }
        })}
      </svg>

      {/* Center Node: Current IT Store */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
        <div className="relative cursor-pointer hover:scale-110 transition-transform duration-300" onClick={() => setSelectedPartner(null)}>
          {/* Pulsing Sonar Waves FX */}
          {isScanning && (
            <>
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-40"></div>
              <div className="absolute inset-0 bg-cyan-400 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20 animation-delay-500"></div>
            </>
          )}
          
          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-slate-900 z-10 relative transition-colors duration-500 ${
            isScanning 
              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_50px_rgba(34,211,238,0.8)]' 
              : 'bg-gradient-to-br from-blue-700 to-indigo-800 shadow-[0_0_30px_rgba(37,99,235,0.4)]'
          }`}>
            <Store size={40} className="text-white drop-shadow-md" />
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <span className="text-white font-black tracking-widest text-lg bg-slate-900/80 px-4 py-1.5 rounded-full backdrop-blur-md border border-slate-800 shadow-xl inline-block">
            MY STORE
          </span>
          <p className={`text-[10px] font-bold mt-3 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-300 ${isScanning ? 'text-cyan-400' : 'text-blue-400'}`}>
            <Activity size={12} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Deep Scanning...' : 'Network Idle'}
          </p>
        </div>
      </div>

      {/* Orbiting B2B Partners (Floating Nodes) */}
      {partners.map((partner, i) => {
        const pos = getPosition(i, partners.length);
        const isSelected = selectedPartner?.id === partner.id;
        
        // Randomize float timing perfectly based on index
        const floatDuration = 3 + (i % 3);
        
        return (
          <button
            key={partner.id}
            onClick={() => setSelectedPartner(partner)}
            className={`absolute z-30 flex flex-col items-center transition-all duration-300 group hover:opacity-100 ${
              isSelected ? 'opacity-100 z-50' : 'opacity-80'
            }`}
            style={{ 
              left: pos.left, 
              top: pos.top,
              animation: isSelected 
                ? `float-selected 3s ease-in-out infinite` 
                : `float ${floatDuration}s ease-in-out infinite alternate`
            }}
          >
            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md border-2 shadow-2xl transition-all duration-500 ${
              isSelected 
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-white shadow-[0_0_40px_rgba(59,130,246,0.9)] scale-110' 
                : 'bg-slate-800/90 border-slate-600 group-hover:border-blue-400 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:scale-110'
            }`}>
              {/* Spinning border when selected */}
              {isSelected && (
                <div className="absolute inset-[-4px] rounded-full border border-dashed border-white/50 animate-spin"></div>
              )}
              
              <span className={`text-2xl font-black transition-colors ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                {partner.name.charAt(0)}
              </span>
              
              {/* Match Score UI Badge */}
              <div className={`absolute -top-2 -right-2 text-white text-[10px] font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg transition-transform ${
                isSelected 
                  ? 'bg-gradient-to-r from-orange-400 to-red-500 shadow-orange-500/80 scale-110' 
                  : 'bg-gradient-to-r from-slate-600 to-slate-500 shadow-black/50 group-hover:from-blue-500 group-hover:to-cyan-500 group-hover:scale-110 group-hover:shadow-blue-500/50'
              }`}>
                {partner.score}%
              </div>
            </div>
            
            <div className={`mt-4 text-center transition-all px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md border ${
              isSelected 
                ? 'bg-blue-600/90 text-white border-blue-400' 
                : 'bg-slate-900/80 text-slate-400 border-slate-800 group-hover:text-blue-300 group-hover:border-blue-500/50 group-hover:bg-slate-800'
            }`}>
              <p className="text-xs font-bold whitespace-nowrap">{partner.name}</p>
            </div>
          </button>
        );
      })}

      {/* Pop-in Glassmorphism Details Panel */}
      {selectedPartner && (
        <div className="absolute right-0 top-0 bottom-0 w-[380px] bg-slate-900/80 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-right-full duration-500 p-8 overflow-y-auto">
          {/* Decorative glowing orb in the panel */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-[0_0_30px_rgba(59,130,246,0.4)] mb-5 border border-white/20">
                {selectedPartner.name.charAt(0)}
              </div>
              <h2 className="text-3xl font-black text-white leading-tight">{selectedPartner.name}</h2>
              <p className="text-cyan-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">{selectedPartner.type}</p>
            </div>
            <button 
              onClick={() => setSelectedPartner(null)}
              className="bg-slate-800/80 hover:bg-red-500 hover:text-white text-slate-400 p-2.5 rounded-full transition-all shadow-inner border border-slate-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="bg-slate-800/40 p-5 rounded-3xl border border-white/5 hover:bg-slate-800/60 transition-colors backdrop-blur-md">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <ShieldCheck size={18} className="text-green-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Trust Ranking</span>
              </div>
              <div className="flex items-end gap-3">
                <div className="text-5xl font-black text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                  {selectedPartner.reliability}%
                </div>
                <div className="text-green-400 font-bold text-sm mb-2 uppercase tracking-wide bg-green-400/10 px-2 py-1 rounded-md">Excellent</div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-3xl border border-white/5 hover:bg-slate-800/60 transition-colors backdrop-blur-md">
               <div className="flex items-center gap-2 text-slate-400 mb-6">
                <Zap size={18} className="text-orange-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Synergy Features</span>
              </div>
              <div className="space-y-4">
                {Object.entries(selectedPartner.features).map(([key, val], idx) => (
                  <div key={key} className="group">
                    <div className="flex justify-between text-xs text-slate-300 mb-2">
                      <span className="uppercase font-bold tracking-wide group-hover:text-white transition-colors">{key}</span>
                      <span className="font-black text-cyan-400">{val}%</span>
                    </div>
                    <div className="w-full bg-slate-900/80 rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 h-2.5 rounded-full relative" 
                        style={{ width: `${val}%` }}
                      >
                        {/* Shimmer effect inside the progress bar */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-cyan-500 hover:via-blue-500 hover:to-blue-600 text-white rounded-2xl font-black shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 group border border-blue-400/50 overflow-hidden relative">
              {/* Button shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
              
              <span className="relative z-10 tracking-widest text-sm">INITIATE MATCHING</span>
              <ChevronRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Main UI Title Badge */}
      <div className="absolute top-6 left-6 z-40">
        <div className="bg-slate-900/80 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/10 flex items-center gap-4 shadow-2xl hover:bg-slate-900/90 transition-colors">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl shadow-lg shadow-blue-500/30">
            <Network size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-black tracking-widest text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">NETWORK GRAPH</h1>
            <p className="text-cyan-400 text-xs mt-1 font-bold tracking-wider uppercase">Live AI Sonar Protocol</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessNetwork;
