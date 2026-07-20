import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  Battery
} from "lucide-react";
import { getAbsoluteUrl } from "../utils";

interface TelegramFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TelegramFrame({ children, activeTab, onTabChange }: TelegramFrameProps) {
  const [time, setTime] = useState("");
  const [pingMs, setPingMs] = useState<number | null>(null);



  useEffect(() => {
    // Current time clock
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateClock();
    const timer = setInterval(updateClock, 60000);

    // Dynamic real-time latency ping checker
    const measurePing = async () => {
      const start = performance.now();
      try {
        const response = await fetch(getAbsoluteUrl("/api/health"), {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });
        if (response.ok) {
          const end = performance.now();
          setPingMs(Math.round(end - start));
        } else {
          setPingMs(null);
        }
      } catch (e) {
        setPingMs(null);
      }
    };
    measurePing();
    const pingTimer = setInterval(measurePing, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(pingTimer);
    };
  }, []);



  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-0 md:p-6 lg:p-10 purple-mesh relative overflow-hidden font-sans">
      {/* Background glowing blurred decorative orbs */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-white/[0.01] blur-[110px] pointer-events-none" />

      {/* Main Telegram Application Frame Container */}
      <div className="w-full max-w-[480px] h-screen md:h-[840px] md:rounded-[40px] md:border md:border-neutral-800/80 bg-void-black shadow-2xl flex flex-col relative overflow-hidden z-10">
        
        {/* Device Status Bar (Simulating Mobile Phone Screen) */}
        <div className="hidden md:flex justify-between items-center px-6 pt-3 pb-1 text-xs text-neutral-400 font-medium tracking-tight select-none z-30">
          <span>{time || "9:41"}</span>
          {/* Speaker pill notch */}
          <div className="w-24 h-4 bg-black rounded-full absolute left-1/2 transform -translate-x-1/2 top-2" />
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-neutral-300" />
            <span className="text-[10px]">5G</span>
            <Battery className="w-4 h-4 text-neutral-300" />
          </div>
        </div>

        {/* Custom Header Bar with a Premium Animated Logo matching the Apple-inspired modern aesthetic */}
        <div 
          className="z-30 select-none bg-void-black/90 backdrop-blur-md w-full shrink-0 border-b border-white/[0.03] px-5 pb-3 flex items-center justify-between"
          style={{ 
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)"
          }} 
        >
          <div className="flex items-center gap-2.5">
            {/* Premium counter-rotating tech emblem logo with animated holographic baby dragon */}
            <div className="relative w-9 h-9 flex items-center justify-center group">
              {/* Sleek high-tech outer radar sweeping circle */}
              <div className="absolute inset-0 rounded-full border border-white/5 group-hover:border-white/10 transition-colors duration-300" />
              <div className="absolute inset-0 rounded-full border-t-2 border-white opacity-40 animate-[spin_4s_linear_infinite]" />
              
              {/* Inside custom high-contrast animated cute cyber robot logo */}
              <svg 
                className="w-7 h-7 relative z-10 transition-all duration-300 group-hover:scale-110" 
                viewBox="0 0 64 64" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <style>{`
                  @keyframes robotFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-1.5px); }
                  }
                  @keyframes robotBlink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                  }
                  @keyframes antennaGlow {
                    0%, 100% { filter: drop-shadow(0 0 1px #ffffff); opacity: 0.7; }
                    50% { filter: drop-shadow(0 0 4px #ffffff); opacity: 1; }
                  }
                  @keyframes earWiggle {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(5deg); }
                  }
                  .anim-robot-head {
                    animation: robotFloat 3s ease-in-out infinite;
                  }
                  .anim-robot-blink {
                    transform-origin: center;
                    animation: robotBlink 4s ease-in-out infinite;
                  }
                  .anim-antenna {
                    animation: antennaGlow 1.5s ease-in-out infinite;
                  }
                  .anim-ear-left {
                    transform-origin: 18px 28px;
                    animation: earWiggle 2s ease-in-out infinite;
                  }
                  .anim-ear-right {
                    transform-origin: 46px 28px;
                    animation: earWiggle 2s ease-in-out infinite reverse;
                  }
                `}</style>

                {/* Antenna */}
                <g className="anim-robot-head">
                  <path 
                    d="M 32,18 L 32,10" 
                    stroke="rgba(255, 255, 255, 0.6)" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                  />
                  <circle 
                    className="anim-antenna" 
                    cx="32" 
                    cy="8" 
                    r="3.5" 
                    fill="#ffffff" 
                  />
                </g>

                {/* Left Ear */}
                <rect 
                  className="anim-ear-left" 
                  x="12" 
                  y="22" 
                  width="4" 
                  height="12" 
                  rx="2" 
                  fill="#0c0e18" 
                  stroke="rgba(255, 255, 255, 0.45)" 
                  strokeWidth="1" 
                />

                {/* Right Ear */}
                <rect 
                  className="anim-ear-right" 
                  x="48" 
                  y="22" 
                  width="4" 
                  height="12" 
                  rx="2" 
                  fill="#0c0e18" 
                  stroke="rgba(255, 255, 255, 0.45)" 
                  strokeWidth="1" 
                />

                {/* Robot Main Head Body */}
                <g className="anim-robot-head">
                  {/* Outer metallic head chassis */}
                  <rect 
                    x="16" 
                    y="16" 
                    width="32" 
                    height="28" 
                    rx="9" 
                    fill="#0c0e18" 
                    stroke="rgba(255, 255, 255, 0.5)" 
                    strokeWidth="1.2" 
                  />

                  {/* Glass Screen Face */}
                  <rect 
                    x="20" 
                    y="20" 
                    width="24" 
                    height="20" 
                    rx="6" 
                    fill="rgba(255, 255, 255, 0.05)" 
                    stroke="rgba(255, 255, 255, 0.2)" 
                    strokeWidth="0.8" 
                  />

                  {/* Left Eye */}
                  <g className="anim-robot-blink" style={{ transformOrigin: "26px 28px" }}>
                    <circle 
                      cx="26" 
                      cy="28" 
                      r="3.5" 
                      fill="url(#robotEyeGrad)" 
                    />
                    <circle 
                      cx="25" 
                      cy="26.5" 
                      r="1" 
                      fill="#ffffff" 
                    />
                  </g>

                  {/* Right Eye */}
                  <g className="anim-robot-blink" style={{ transformOrigin: "38px 28px" }}>
                    <circle 
                      cx="38" 
                      cy="28" 
                      r="3.5" 
                      fill="url(#robotEyeGrad)" 
                    />
                    <circle 
                      cx="37" 
                      cy="26.5" 
                      r="1" 
                      fill="#ffffff" 
                    />
                  </g>

                  {/* Cute Smiling Mouth */}
                  <path 
                    d="M 30,34 Q 32,36.5 34,34" 
                    stroke="#ffffff" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    fill="none" 
                  />

                  {/* Rosy blush cheeks */}
                  <circle cx="23" cy="33" r="1.5" fill="rgba(244, 63, 94, 0.4)" />
                  <circle cx="41" cy="33" r="1.5" fill="rgba(244, 63, 94, 0.4)" />
                </g>

                <defs>
                  <linearGradient id="robotEyeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#a1a1aa" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Title text */}
            <div className="flex flex-col">
              <span className="text-[13px] font-extrabold tracking-tight text-white flex items-center gap-0.5 font-display">
                Aero<span className="text-zinc-400 font-black">X</span>
              </span>
              <span className="text-[7.5px] font-black uppercase tracking-[0.15em] text-zinc-400/80">
                PRO ACTIVE
              </span>
            </div>
          </div>

          {/* Right side real-time Server Connection Monitor (Authentic Ping in Milliseconds) */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              pingMs === null 
                ? "bg-rose-500 shadow-[0_0_6px_#f43f5e]" 
                : pingMs < 40 
                  ? "bg-white shadow-[0_0_6px_#ffffff]" 
                  : "bg-amber-400 shadow-[0_0_6px_#fbbf24]"
            }`} />
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              SYS: <span className={pingMs === null ? "text-rose-400" : "text-emerald-400 font-mono font-medium"}>
                {pingMs === null ? "OFFLINE" : `${pingMs}ms`}
              </span>
            </span>
          </div>
        </div>

        {/* Inner Mini App Webview Panel */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative pb-20 scrollbar-none">
          {children}
        </div>
      </div>
    </div>
  );
}
