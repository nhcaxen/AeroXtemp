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
            {/* Premium counter-rotating tech emblem logo with animated Soft Crimson/Light Red Gradient Winking Face */}
            <div className="relative w-9 h-9 flex items-center justify-center group">
              {/* Sleek crimson-accented outer radar sweeping circle */}
              <div className="absolute inset-0 rounded-full border border-rose-500/10 group-hover:border-rose-500/20 transition-colors duration-300" />
              <div className="absolute inset-0 rounded-full border-t-2 border-rose-500 opacity-50 animate-[spin_4s_linear_infinite]" />
              
              {/* Inside custom Soft Crimson / Light Red Gradient Winking Logo */}
              <svg 
                className="w-[26px] h-[26px] relative z-10 transition-all duration-300 group-hover:scale-110 logo-glowing-effect" 
                viewBox="0 0 100 100" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="crimsonLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff758f" />
                    <stop offset="100%" stopColor="#c9184a" />
                  </linearGradient>
                </defs>
                
                <style>{`
                  @keyframes logoFloat {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-2px) scale(1.02); }
                  }
                  @keyframes eyeBlink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                  }
                  @keyframes winkNudge {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(0.5px, -0.3px) scale(1.03); }
                  }
                  .anim-logo-container {
                    animation: logoFloat 4s ease-in-out infinite;
                  }
                  .anim-eye-blink {
                    transform-origin: 35px 42px;
                    animation: eyeBlink 4s ease-in-out infinite;
                  }
                  .anim-wink-nudge {
                    transform-origin: 65px 41px;
                    animation: winkNudge 3s ease-in-out infinite;
                  }
                  .logo-glowing-effect {
                    filter: drop-shadow(0 2px 6px rgba(201, 24, 74, 0.4));
                    transition: filter 0.3s ease;
                  }
                  .group:hover .logo-glowing-effect {
                    filter: drop-shadow(0 4px 12px rgba(201, 24, 74, 0.65));
                  }
                `}</style>

                {/* Ambient floating container group */}
                <g className="anim-logo-container">
                  {/* Squircle Background */}
                  <rect 
                    x="4" 
                    y="4" 
                    width="92" 
                    height="92" 
                    rx="26" 
                    fill="url(#crimsonLogoGrad)" 
                  />

                  {/* Left Eye (Blinking) */}
                  <circle 
                    className="anim-eye-blink" 
                    cx="35" 
                    cy="42" 
                    r="7.5" 
                    fill="#121212" 
                  />

                  {/* Right Eye (Winking) */}
                  <rect 
                    className="anim-wink-nudge"
                    x="54" 
                    y="38" 
                    width="22" 
                    height="7.5" 
                    rx="2" 
                    transform="rotate(-6 65 41)" 
                    fill="#121212" 
                  />

                  {/* Smiling Loop Mouth */}
                  <path 
                    d="M 35,55 C 35,72 60,75 66,60 C 69,53 77,53 77,60 C 77,67 69,67 66,60" 
                    stroke="#121212" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none" 
                  />
                </g>
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
