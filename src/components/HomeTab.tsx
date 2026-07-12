import React, { useState, useEffect } from "react";
import { TabId } from "../types";
import { incrementAnalytic } from "../utils/analytics";
import { 
  Globe, 
  History, 
  Trash2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ArrowRight, 
  ShieldAlert,
  ShieldCheck,
  Server,
  AlertTriangle
} from "lucide-react";

interface HomeTabProps {
  onTabChange: (tab: TabId) => void;
}

interface ScoreDetails {
  score: number;
  type: string;
  anonymity: "Low" | "Medium" | "High";
  threatLevel: "Safe" | "Low Risk" | "Medium Risk" | "Dangerous";
  flags: string[];
}

interface IpDetails {
  query: string;
  country: string;
  countryCode: string;
  city: string;
  isp: string;
  status: string;
  scoreDetails?: ScoreDetails;
}

interface ProxyHistoryItem {
  id: string;
  proxy: string;
  online: boolean;
  ping: number;
  country: string;
  city: string;
  isp: string;
  timestamp: string;
  scoreDetails?: ScoreDetails;
}

export default function HomeTab({ onTabChange }: HomeTabProps) {
  const [activePromo, setActivePromo] = useState(0);
  
  // IP info states
  const [userIpInfo, setUserIpInfo] = useState<IpDetails | null>(null);
  const [loadingIp, setLoadingIp] = useState(false);

  // Proxy Checker states
  const [proxyInput, setProxyInput] = useState("");
  const [checkingProxy, setCheckingProxy] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    success: boolean;
    online: boolean;
    ping: number;
    host: string;
    port: number;
    country: string;
    city: string;
    isp: string;
    error?: string;
    scoreDetails?: ScoreDetails;
  } | null>(null);

  // History state
  const [history, setHistory] = useState<ProxyHistoryItem[]>([]);

  // Promo slides for top carousel with premium high-fidelity interactive elements and brand gradients
  const promoSlides = [
    {
      title: "AeroX Pro Card Generator",
      subtitle: "Luhn-validated CC Gen",
      desc: "Generate bulk test credit card numbers for software development.",
      actionText: "Open Generator",
      actionTab: "cardgen" as TabId,
      color: "from-[#1d4ed8]/85 via-[#1e1b4b]/95 to-[#07070b]/98",
      accent: "#38bdf8",
      icon: (
        <div className="relative w-24 h-16 bg-[#07070b]/95 rounded-xl border border-[#38bdf8]/35 p-2.5 shadow-2xl flex flex-col justify-between overflow-hidden select-none animate-float">
          {/* Subtle moving neon glow line */}
          <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent animate-pulse" />
          
          {/* Gold Microchip */}
          <div className="flex justify-between items-start">
            <div className="w-5 h-4 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-sm border border-amber-600/30 flex flex-col gap-[1px] p-[2.5px] shadow-sm">
              <div className="w-full h-[1.5px] bg-amber-800/30" />
              <div className="w-full h-[1.5px] bg-amber-800/30" />
              <div className="w-full h-[1.5px] bg-amber-800/30" />
            </div>
            {/* Wireless Signal Icon */}
            <div className="flex gap-[1.5px] items-end opacity-85">
              <div className="w-[1.5px] h-1.5 bg-white/90 rounded-full animate-pulse" />
              <div className="w-[1.5px] h-2.5 bg-white/90 rounded-full" />
              <div className="w-[1.5px] h-3.5 bg-white/90 rounded-full" />
            </div>
          </div>

          {/* Card details */}
          <div className="flex flex-col gap-0.5 mt-2">
            <span className="text-[7.5px] font-mono tracking-wider text-[#38bdf8] font-bold">AeroX Pro</span>
            <span className="text-[6.5px] font-mono text-slate-300">•••• •••• •••• 8295</span>
          </div>
        </div>
      )
    },
    {
      title: "Real Temporary Mail Client",
      subtitle: "100% Free OTP Receiver",
      desc: "Receive real validation emails and OTPs using high-speed AEROX Mail Engine.",
      actionText: "Open Mailbox",
      actionTab: "tempmail" as TabId,
      color: "from-[#db2777]/80 via-[#4c1d95]/95 to-[#07070b]/98",
      accent: "#f472b6",
      icon: (
        <div className="relative w-24 h-16 bg-[#07070b]/95 rounded-xl border border-pink-500/25 p-2.5 shadow-2xl flex flex-col gap-1.5 overflow-hidden select-none animate-float">
          {/* Ambient neon pink/violet aura */}
          <div className="absolute top-0 right-0 w-8 h-8 bg-pink-500/20 rounded-full blur-md animate-pulse" />
          
          {/* Inbox line items representing mail */}
          <div className="flex items-center gap-1.5 border-b border-white/5 pb-1">
            <span className="text-xs">✉️</span>
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="w-12 h-[3px] bg-[#38bdf8] rounded-full animate-pulse" />
              <div className="w-8 h-[2px] bg-slate-500 rounded-full" />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[6.5px] font-mono text-pink-400 font-bold uppercase tracking-wider">AEROX OTP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
            </div>
            <span className="text-[8px] font-bold text-white font-mono bg-white/5 px-1 py-0.5 rounded text-center">
              Code: <span className="text-[#38bdf8]">482-915</span>
            </span>
          </div>
        </div>
      )
    },
    {
      title: "Procedural Identity Generator",
      subtitle: "Fake Addresses & Profiles",
      desc: "Generate realistic registration information and addresses for various countries.",
      actionText: "Open Identity",
      actionTab: "addressgen" as TabId,
      color: "from-[#4f46e5]/80 via-[#1e1b4b]/95 to-[#07070b]/98",
      accent: "#818cf8",
      icon: (
        <div className="relative w-24 h-16 bg-[#07070b]/95 rounded-xl border border-indigo-500/25 p-2.5 shadow-2xl flex items-center gap-2.5 overflow-hidden select-none animate-float">
          {/* Ambient violet aura */}
          <div className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-500/20 rounded-full blur-md" />

          {/* Left side: Avatar picture card */}
          <div className="w-8 h-8 rounded-full border border-white/10 bg-gradient-to-tr from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-indigo-400 fill-current opacity-85" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>

          {/* Right side: details lines */}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="w-12 h-[3px] bg-white rounded-full opacity-80" />
            <div className="w-8 h-[2px] bg-slate-500 rounded-full" />
            <div className="w-10 h-[2px] bg-slate-500 rounded-full" />
            <span className="text-[6px] font-mono text-[#38bdf8] font-bold uppercase tracking-wide mt-1 leading-none block truncate">VERIFIED</span>
          </div>
        </div>
      )
    }
  ];

  // Auto rotate top slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromo((prev) => (prev + 1) % promoSlides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Fetch client IP on mount
  const fetchClientIp = async () => {
    setLoadingIp(true);
    try {
      const res = await fetch("/api/ip-info");
      if (res.ok) {
        const data = await res.json();
        setUserIpInfo(data);
      }
    } catch (err) {
      console.warn("Could not auto-fetch IP info", err);
    } finally {
      setLoadingIp(false);
    }
  };

  useEffect(() => {
    fetchClientIp();

    // Load history from LocalStorage
    try {
      const saved = localStorage.getItem("bb_proxy_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not read localStorage", e);
    }
  }, []);

  // Save history to LocalStorage helper
  const saveHistoryToLocal = (newHistory: ProxyHistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("bb_proxy_history", JSON.stringify(newHistory));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  };

  // Perform proxy connection test
  const handleCheckProxy = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = proxyInput.trim();
    if (!cleanInput) return;

    setCheckingProxy(true);
    setCheckResult(null);

    try {
      const res = await fetch("/api/proxy/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proxy: cleanInput })
      });

      if (res.ok) {
        const data = await res.json();
        incrementAnalytic("proxiesChecked");

        const resultObj = {
          success: true,
          online: data.online,
          ping: data.ping,
          host: data.host || cleanInput.split(":")[0] || "",
          port: data.port || 80,
          country: data.online && data.info ? data.info.country : "Offline",
          city: data.online && data.info ? data.info.city : "Offline",
          isp: data.online && data.info ? data.info.isp : data.info?.isp || "Failed connection",
          error: data.error,
          scoreDetails: data.scoreDetails
        };

        setCheckResult(resultObj);

        // Add to history (max 10 entries)
        const newItem: ProxyHistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          proxy: cleanInput,
          online: resultObj.online,
          ping: resultObj.ping,
          country: resultObj.country,
          city: resultObj.city,
          isp: resultObj.isp,
          scoreDetails: data.scoreDetails,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        };

        const updatedHistory = [newItem, ...history].slice(0, 10);
        saveHistoryToLocal(updatedHistory);
      } else {
        throw new Error();
      }
    } catch (err) {
      const errorResult = {
        success: false,
        online: false,
        ping: -1,
        host: cleanInput.split(":")[0] || "Unknown",
        port: parseInt(cleanInput.split(":")[1]) || 80,
        country: "Offline",
        city: "Offline",
        isp: "Connection failed",
        error: "Server connection failed",
        scoreDetails: {
          score: 100,
          type: "Offline/Dead Server",
          anonymity: "High" as const,
          threatLevel: "Dangerous" as const,
          flags: ["Connection failed / Network offline"]
        }
      };
      setCheckResult(errorResult);
    } finally {
      setCheckingProxy(false);
    }
  };

  // Clear checking history logs
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear proxy check history?")) {
      saveHistoryToLocal([]);
    }
  };

  // Renders a high-fidelity concentric SVG progress score dial
  const renderScoreGauge = (score: number, level: string, type: string, flags: string[]) => {
    let strokeColor = "stroke-green-500";
    let textColor = "text-green-400";
    let bgColor = "bg-green-500/10";
    let borderColor = "border-green-500/20";
    
    if (score >= 75) {
      strokeColor = "stroke-red-500";
      textColor = "text-red-400";
      bgColor = "bg-red-500/10";
      borderColor = "border-red-500/20";
    } else if (score >= 30) {
      strokeColor = "stroke-amber-500";
      textColor = "text-amber-400";
      bgColor = "bg-amber-500/10";
      borderColor = "border-amber-500/20";
    }

    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className={`p-3 rounded-xl border ${bgColor} ${borderColor} flex items-center gap-4`}>
        {/* SVG Circle Gauge */}
        <div className="relative w-12 h-12 shrink-0 select-none">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r={radius}
              className="stroke-white/[0.05]"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="24"
              cy="24"
              r={radius}
              className={`${strokeColor} transition-all duration-1000`}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black text-white leading-none">{score}%</span>
            <span className="text-[5.5px] text-neutral-400 font-extrabold uppercase mt-0.5">Risk</span>
          </div>
        </div>

        <div className="text-left flex-1">
          <span className="text-[8px] text-neutral-400 uppercase tracking-widest font-black block">IP Fraud/Risk Score</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[11px] font-black uppercase tracking-wide ${textColor}`}>{level}</span>
            <span className="text-[9px] text-neutral-500 font-bold">•</span>
            <span className="text-[10px] text-white font-bold">{type}</span>
          </div>
          {flags && flags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {flags.map((flag, idx) => (
                <span 
                  key={idx} 
                  className="px-1.5 py-0.5 rounded bg-void-black text-[7px] font-bold text-neutral-400 border border-white/[0.03] flex items-center gap-1 uppercase tracking-wide"
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                  <span>{flag}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8 select-none">
      {/* AeroX Brand Logo Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5 select-none animate-fade-in">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-105 active:scale-95">
            {/* Ambient cyber neon glow background */}
            <div className="absolute inset-0 bg-[#38BDF8]/10 rounded-xl blur-[14px] opacity-80 pointer-events-none animate-logo-pulse-glow" />
            
            {/* High-end glass bezel base */}
            <div className="absolute inset-0 rounded-xl bg-slate-950/80 border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]" />

            {/* Professional animated custom SVG logo */}
            <svg viewBox="0 0 100 100" className="w-10 h-10 z-10 drop-shadow-[0_0_10px_rgba(56,189,248,0.45)]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#4338CA" />
                </linearGradient>
                <linearGradient id="logoEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>

              {/* Slow-rotating high-tech outer index ring */}
              <circle 
                cx="50" 
                cy="50" 
                r="42" 
                stroke="url(#logoRingGrad)" 
                strokeWidth="1.8" 
                strokeLinecap="round"
                strokeDasharray="60 25 15 25" 
                className="animate-logo-spin-slow origin-center"
              />

              {/* Ultra-premium, sharp geometric "AeroX" Monogram core */}
              <g className="animate-logo-pulse-glow origin-center">
                {/* Left Aerodynamic wing of the 'A/X' */}
                <path 
                  d="M32 68 L48 32 L56 32 L40 68 Z" 
                  fill="url(#logoEmblemGrad)" 
                  className="transition-transform duration-300"
                />
                {/* Right Intersecting wing forming the 'X' with absolute geometric precision */}
                <path 
                  d="M68 68 L52 32 L44 32 L60 68 Z" 
                  fill="url(#logoEmblemGrad)" 
                  opacity="0.85"
                />
                {/* Micro-scale horizontal high-contrast connector creating a razor-sharp 'A' apex split */}
                <path 
                  d="M40 54 L60 54 L57 58 L43 58 Z" 
                  fill="#38BDF8" 
                  className="animate-pulse"
                />
              </g>
            </svg>
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-wide text-white block font-display leading-none">
              Aero<span className="text-[#38BDF8] drop-shadow-[0_0_8px_rgba(56,189,248,0.7)] font-black">X</span>
            </span>
            <span className="text-[8px] text-[#94a3b8] font-bold tracking-widest uppercase block mt-1.5 opacity-90">
              MINI PLATFORM
            </span>
          </div>
        </div>

        {/* Clean right side with developer suit removed */}
        <div className="flex items-center gap-1.5 text-[9px] text-[#38BDF8] font-bold bg-[#3b82f6]/10 px-2.5 py-1 rounded-full border border-[#3b82f6]/25 shadow-[0_0_10px_rgba(56,189,248,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse shadow-[0_0_6px_#38BDF8]" />
          <span>LIVE CORE</span>
        </div>
      </div>

      {/* Slide / Promo Carousel */}
      <div 
        className="relative rounded-2xl overflow-hidden shadow-2xl border bg-[#0b0b13]/80 backdrop-blur-md select-none transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] group animate-fade-in"
        style={{ 
          borderColor: `${promoSlides[activePromo].accent}40`,
          boxShadow: `0 0 35px ${promoSlides[activePromo].accent}15`
        }}
      >
        <div className="h-44 flex transition-all duration-500 relative">
          {promoSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 p-5 flex justify-between items-center bg-gradient-to-r ${slide.color} transition-all duration-500 transform ${
                idx === activePromo ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 pointer-events-none translate-x-4"
              }`}
            >
              <div className="flex-1 pr-4">
                <span 
                  className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest mb-2 inline-block border bg-white/5"
                  style={{ 
                    color: slide.accent,
                    borderColor: `${slide.accent}30`,
                    textShadow: `0 0 6px ${slide.accent}40`
                  }}
                >
                  Featured Service
                </span>
                <h3 className="text-lg font-black text-white leading-tight font-display mb-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                  {slide.title}
                </h3>
                <p 
                  className="text-xs font-bold mb-1.5"
                  style={{ 
                    color: slide.accent,
                    textShadow: `0 0 8px ${slide.accent}50`
                  }}
                >
                  {slide.subtitle}
                </p>
                <p className="text-[10px] text-slate-300 font-medium line-clamp-2 leading-relaxed mb-4">
                  {slide.desc}
                </p>
                <button
                  onClick={() => onTabChange(slide.actionTab)}
                  className="px-4 py-2 rounded-xl bg-white text-slate-950 text-[11px] font-black tracking-wide shadow-[0_4px_12px_rgba(255,255,255,0.25)] hover:bg-slate-50 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-1.5 cursor-pointer"
                  style={{
                    boxShadow: `0 4px 14px rgba(255, 255, 255, 0.15), 0 0 20px ${slide.accent}30`
                  }}
                >
                  <span>{slide.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* Icon Container */}
              <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
                <div 
                  className="absolute inset-0 rounded-full blur-2xl opacity-35 animate-pulse" 
                  style={{ backgroundColor: slide.accent }}
                />
                <div className="relative z-10">
                  {slide.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-3.5 right-6 flex gap-1.5 z-20">
          {promoSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActivePromo(idx)}
              className="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                width: idx === activePromo ? "1.5rem" : "0.5rem",
                backgroundColor: idx === activePromo ? promoSlides[idx].accent : "rgba(255, 255, 255, 0.2)",
                boxShadow: idx === activePromo ? `0 0 10px ${promoSlides[idx].accent}` : "none"
              }}
            />
          ))}
        </div>
      </div>

      {/* Auto IP Fetch Display Panel */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-cyber-purple" />
            <h3 className="text-xs font-extrabold text-frost-white uppercase tracking-wider font-display">
              My Current IP Connection
            </h3>
          </div>
          <button 
            onClick={fetchClientIp}
            disabled={loadingIp}
            className="p-1 rounded bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-all cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingIp ? "animate-spin text-cyber-purple" : ""}`} />
          </button>
        </div>

        {loadingIp ? (
          <div className="py-4 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-cyber-purple/20 border-t-cyber-purple animate-spin" />
            <span className="text-[10px] text-neutral-400 font-bold animate-pulse uppercase">Querying Geolocation...</span>
          </div>
        ) : userIpInfo ? (
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 bg-void-black p-3 rounded-xl border border-white/[0.03] flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold">IP Address</span>
                  <span className="text-xs sm:text-sm font-bold text-white block font-mono mt-0.5 select-all break-all whitespace-normal leading-relaxed">{userIpInfo.query}</span>
                </div>
                <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] text-green-400 font-extrabold uppercase">CONNECTED</span>
                </div>
              </div>

              <div className="bg-void-black p-2.5 rounded-xl border border-white/[0.03]">
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold block">Country</span>
                <span className="text-[11px] font-bold text-white mt-1 block">
                  {userIpInfo.countryCode ? `${userIpInfo.countryCode} - ` : ""}{userIpInfo.country || "Unknown"}
                </span>
              </div>

              <div className="bg-void-black p-2.5 rounded-xl border border-white/[0.03]">
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold block">City / Region</span>
                <span className="text-[11px] font-bold text-white mt-1 block truncate">
                  {userIpInfo.city || "Unknown"}
                </span>
              </div>

              <div className="col-span-2 bg-void-black p-2.5 rounded-xl border border-white/[0.03]">
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold block">ISP Provider</span>
                <span className="text-[11px] font-mono font-bold text-cosmic-lilac mt-1 block truncate">
                  {userIpInfo.isp || "Unknown ISP"}
                </span>
              </div>
            </div>

            {/* Display calculated IP Score details */}
            {userIpInfo.scoreDetails && renderScoreGauge(
              userIpInfo.scoreDetails.score,
              userIpInfo.scoreDetails.threatLevel,
              userIpInfo.scoreDetails.type,
              userIpInfo.scoreDetails.flags
            )}
          </div>
        ) : (
          <div className="bg-void-black p-4 rounded-xl border border-white/[0.03] text-center">
            <span className="text-[10px] text-neutral-400 font-bold block mb-1">IP detection is suspended.</span>
            <button 
              onClick={fetchClientIp}
              className="px-3 py-1 rounded bg-cyber-purple text-white text-[10px] font-extrabold uppercase hover:bg-purple-600 transition-all"
            >
              Fetch Connection Details
            </button>
          </div>
        )}
      </div>

      {/* Manual Proxy Checker Module */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Server className="w-4 h-4 text-pink-500" />
          <h3 className="text-xs font-extrabold text-frost-white uppercase tracking-wider font-display">
            Manual Proxy Connection Checker
          </h3>
        </div>

        <form onSubmit={handleCheckProxy} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
              Enter IP:Port, raw, URL formats
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 192.168.1.1:8080 or host:port:user:pass"
                value={proxyInput}
                onChange={(e) => setProxyInput(e.target.value)}
                disabled={checkingProxy}
                className="w-full bg-void-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-cyber-purple/60 transition-all select-all pr-10"
              />
              {proxyInput && (
                <button
                  type="button"
                  onClick={() => setProxyInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-[8px] text-neutral-500 leading-normal">
              Supports socks5://, http://, socks4:// or direct raw host:port formats with user auth.
            </p>
          </div>

          <button
            type="submit"
            disabled={checkingProxy || !proxyInput.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyber-purple to-pink-600 hover:from-purple-600 hover:to-pink-500 text-xs font-black uppercase text-white shadow-lg active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {checkingProxy ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>CONNECTING & PROBING...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>CHECK PROXY STATUS</span>
              </>
            )}
          </button>
        </form>

        {/* Live Proxy Output Result Banner */}
        {checkResult && (
          <div className={`mt-3.5 p-3 rounded-xl border animate-fade-in flex flex-col gap-3 ${
            checkResult.online 
              ? "bg-green-500/10 border-green-500/20 text-green-300" 
              : "bg-red-500/10 border-red-500/20 text-red-300"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {checkResult.online ? <ShieldCheck className="w-4 h-4 text-green-400" /> : <ShieldAlert className="w-4 h-4 text-red-400" />}
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {checkResult.online ? "Proxy is Live & Reachable!" : "Proxy Connection Failed / Offline"}
                </span>
              </div>
              {checkResult.online && (
                <span className="text-[10px] font-mono bg-green-500/20 px-2 py-0.5 rounded text-green-400 font-extrabold">
                  {checkResult.ping} ms
                </span>
              )}
            </div>

            {checkResult.online && (
              <div className="grid grid-cols-2 gap-2 text-left bg-void-black/50 p-2.5 rounded-lg border border-white/[0.02] text-[10px]">
                <div>
                  <span className="text-[8px] text-neutral-400 font-bold block uppercase">Country</span>
                  <span className="font-semibold text-white block mt-0.5">{checkResult.country}</span>
                </div>
                <div>
                  <span className="text-[8px] text-neutral-400 font-bold block uppercase">City</span>
                  <span className="font-semibold text-white block mt-0.5 truncate">{checkResult.city}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[8px] text-neutral-400 font-bold block uppercase">Proxy ISP / Host Network</span>
                  <span className="font-mono text-cosmic-lilac block mt-0.5 truncate">{checkResult.isp}</span>
                </div>
              </div>
            )}

            {/* Display Proxy calculated IP Score details */}
            {checkResult.scoreDetails && renderScoreGauge(
              checkResult.scoreDetails.score,
              checkResult.scoreDetails.threatLevel,
              checkResult.scoreDetails.type,
              checkResult.scoreDetails.flags
            )}
          </div>
        )}
      </div>

      {/* History check logs */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04]">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-cyber-purple" />
            <h3 className="text-xs font-extrabold text-frost-white uppercase tracking-wider font-display">
              Recent Checks Log (Max 10)
            </h3>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-[9px] text-red-400 hover:text-red-300 flex items-center gap-1 font-bold cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>CLEAR ALL</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="bg-void-black/60 p-5 rounded-xl border border-white/[0.02] text-center select-none">
            <span className="text-[10px] text-neutral-500 font-bold block uppercase">No proxies checked yet</span>
            <span className="text-[8px] text-neutral-600 block mt-0.5">Results of checked proxies will appear here.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto scrollbar-none pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setProxyInput(item.proxy);
                }}
                className="p-2.5 rounded-xl bg-void-black border border-white/[0.02] hover:border-white/[0.08] transition-all flex flex-col gap-2 cursor-pointer group text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5 max-w-[70%]">
                    <span className="text-[10px] font-mono text-neutral-300 truncate select-all group-hover:text-cyber-purple transition-all">
                      {item.proxy}
                    </span>
                    <span className="text-[8px] text-neutral-500 font-bold uppercase truncate">
                      {item.online ? `${item.city}, ${item.country}` : "Offline"} • {item.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.online ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-green-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          ONLINE
                        </span>
                        <span className="text-[8px] font-mono text-neutral-400">{item.ping}ms</span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold text-red-400 flex items-center gap-0.5">
                        <XCircle className="w-2.5 h-2.5" />
                        OFFLINE
                      </span>
                    )}
                  </div>
                </div>

                {/* Micro-score ribbon inside history row */}
                {item.online && item.scoreDetails && (
                  <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] px-2 py-1 rounded-lg text-[9px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Risk Score:</span>
                      <span className={`font-black ${
                        item.scoreDetails.score >= 75 ? "text-red-400" : item.scoreDetails.score >= 30 ? "text-amber-400" : "text-green-400"
                      }`}>{item.scoreDetails.score}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Type:</span>
                      <span className="text-white font-semibold truncate max-w-[100px]">{item.scoreDetails.type}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
