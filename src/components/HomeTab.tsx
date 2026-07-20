import React, { useState, useEffect, useRef } from "react";
import { TabId } from "../types";
import { 
  Sparkles, 
  Mail,
  User,
  Zap,
  ArrowRight
} from "lucide-react";
import { getAbsoluteUrl } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface ServerUserProfile {
  telegramId: string;
  username: string;
  displayName: string;
  plan: "free" | "premium" | "owner";
  credits: number;
  joined: string;
  role?: string;
  photoUrl?: string | null;
  totalRecoveries?: number;
  totalMailboxesCreated?: number;
  activeMailboxes?: number;
  deletedMailboxes?: number;
  referralsCount?: number;
  resetTimer?: string;
  planExpiry?: string | null;
  trialDaysRemaining?: number;
}

interface HomeTabProps {
  onTabChange: (tab: TabId) => void;
}

export default function HomeTab({ onTabChange }: HomeTabProps) {
  const [telegramId, setTelegramId] = useState("5834920194");
  const [username, setUsername] = useState("AeroX_Developer");
  const [displayName, setDisplayName] = useState("AeroX VIP Member");
  const [userProfile, setUserProfile] = useState<ServerUserProfile | null>(null);

  // Slide state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUserProfile = async (id: string, userNm: string, disp: string, photoUrl: string = "") => {
    try {
      const apiUrl = getAbsoluteUrl(`/api/user-profile?telegramId=${encodeURIComponent(id)}&username=${encodeURIComponent(userNm)}&displayName=${encodeURIComponent(disp)}&photoUrl=${encodeURIComponent(photoUrl)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        // Sync profile state with root App immediately
        window.dispatchEvent(new CustomEvent("aerox_profile_updated", { detail: data }));
      }
    } catch (err) {
      console.error("Failed to load user profile from database", err);
    }
  };

  // Setup auto sliding rotation every 5 seconds
  const resetAutoSlideTimer = () => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
    }
    autoSlideTimerRef.current = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % 3);
    }, 5000);
  };

  useEffect(() => {
    resetAutoSlideTimer();
    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Load Telegram WebApp user context if inside Telegram
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    let initialId = "5834920194";
    let initialUser = "AeroX_Developer";
    let initialDisplay = "AeroX VIP Member";
    let initialPhotoUrl = "";

    if (tgUser) {
      initialId = String(tgUser.id);
      initialUser = tgUser.username || `user_${initialId.substring(0, 5)}`;
      initialDisplay = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || "Telegram Member";
      initialPhotoUrl = tgUser.photo_url || "";
      
      setTelegramId(initialId);
      setUsername(initialUser);
      setDisplayName(initialDisplay);
    } else {
      const savedId = localStorage.getItem("aerox_tg_id");
      const savedUser = localStorage.getItem("aerox_tg_user");
      const savedDisplay = localStorage.getItem("aerox_tg_display");
      
      if (savedId) {
        initialId = savedId;
        setTelegramId(savedId);
      }
      if (savedUser) {
        initialUser = savedUser;
        setUsername(savedUser);
      }
      if (savedDisplay) {
        initialDisplay = savedDisplay;
        setDisplayName(savedDisplay);
      }
    }

    fetchUserProfile(initialId, initialUser, initialDisplay, initialPhotoUrl);

    const handleProfileUpdated = (e: any) => {
      if (e.detail && e.detail.telegramId === initialId) {
        setUserProfile(e.detail);
      }
    };
    window.addEventListener("aerox_profile_updated", handleProfileUpdated);

    return () => {
      window.removeEventListener("aerox_profile_updated", handleProfileUpdated);
    };
  }, []);

  // Premium slider cards - downscaled and direct
  const mainCards = [
    {
      id: "cardgen" as TabId, // Shop Tab ID (aliased back to original routing)
      tag: "PREMIUM MARKET",
      title: "AeroX Market",
      subtitle: "Instant Premium Shared Accounts",
      description: "Get immediate access to premium shared subscriptions & tools.",
      btnText: "Open Market",
      color: "from-rose-500/25 via-rose-950/20 to-[#0a0304]",
      borderColor: "border-rose-500/20 hover:border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.08)]",
      textColor: "text-rose-300",
      tagColor: "text-rose-400",
      graphicType: "shop"
    },
    {
      id: "tempmail" as TabId, // Temp Mail Tab ID
      tag: "DISPOSABLE INBOX",
      title: "Temp Mail",
      subtitle: "Instant Free Live Mailbox",
      description: "Receive private validation and OTP confirmation emails live.",
      btnText: "Open Mailbox",
      color: "from-amber-500/20 via-amber-950/10 to-[#0a0805]",
      borderColor: "border-amber-500/20 hover:border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.08)]",
      textColor: "text-amber-300",
      tagColor: "text-amber-400",
      graphicType: "mail"
    },
    {
      id: "addressgen" as TabId, // Fake Address Tab ID
      tag: "IDENTITY CREATOR",
      title: "Fake Address Generator",
      subtitle: "Premium Billing Identity Profiles",
      description: "Deploy highly realistic billing addresses and fake SSN info.",
      btnText: "Generate Now",
      color: "from-purple-500/20 via-purple-950/20 to-[#06040a]",
      borderColor: "border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.08)]",
      textColor: "text-purple-300",
      tagColor: "text-purple-400",
      graphicType: "identity"
    }
  ];

  const handleIndicatorClick = (index: number) => {
    setCurrentSlideIndex(index);
    resetAutoSlideTimer();
  };

  const activeSlide = mainCards[currentSlideIndex];

  return (
    <div className="flex flex-col select-none relative overflow-x-hidden min-h-[85vh] px-5 pt-4 pb-24 scrollbar-none text-white font-sans">
      
      {/* SECTION 1: HEADER & GREETING */}
      <div className="flex items-center justify-between mb-4 mt-1 select-none">
        <div className="flex items-center gap-2">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-gradient-to-tr from-[#1c1c1e] to-[#121212] flex items-center justify-center shrink-0 shadow-md">
            {userProfile?.photoUrl ? (
              <img 
                src={userProfile.photoUrl} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4.5 h-4.5 text-zinc-300" />
            )}
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-black" />
          </div>
          <div>
            <h2 className="text-[13px] font-extrabold text-white tracking-tight leading-none mb-0.5 truncate max-w-[170px]">
              Hi, {userProfile?.displayName || displayName}
            </h2>
            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
              <Zap className="w-2 h-2 text-zinc-400 animate-pulse" />
              {userProfile?.role === "owner" ? "Owner Access" : userProfile?.plan === "premium" ? "VIP Premium" : "Free Member"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onTabChange("profile")}
            className="px-2 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-[9px] font-bold text-slate-300 uppercase tracking-wider transition-all cursor-pointer active:scale-95"
          >
            VIP Code
          </button>
        </div>
      </div>

      {/* SECTION 2: DOWN-SCALED, ULTRA-COMPACT PREMIUM SLIDING CAROUSEL */}
      <div className="w-full relative select-none mt-1">
        <div 
          className={`w-full min-h-[148px] rounded-[24px] bg-gradient-to-br ${activeSlide.color} border ${activeSlide.borderColor} p-4.5 relative overflow-hidden transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col justify-between`}
        >
          {/* Sheen reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />

          {/* Slide Content */}
          <div className="flex-1 flex flex-row items-center justify-between w-full h-full gap-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlideIndex}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex-1 flex flex-row items-center justify-between w-full h-full gap-3"
              >
                {/* Left side info column */}
                <div className="flex-1 flex flex-col justify-between h-full min-w-0 py-0.5">
                  <div>
                    {/* Tiny Tag */}
                    <span className={`text-[7px] font-black tracking-widest uppercase mb-1.5 block ${activeSlide.tagColor || "text-slate-400"}`}>
                      {activeSlide.tag}
                    </span>
                    
                    {/* Clean compact Title */}
                    <h4 className="text-[14.5px] font-black text-white tracking-tight leading-tight mb-0.5 truncate">
                      {activeSlide.title}
                    </h4>

                    {/* Subtitle with theme match accent color */}
                    <p className={`text-[10px] font-extrabold ${activeSlide.textColor} tracking-tight mb-1.5 truncate`}>
                      {activeSlide.subtitle}
                    </p>

                    {/* Short refined description */}
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed max-w-[95%] line-clamp-2">
                      {activeSlide.description}
                    </p>
                  </div>

                  {/* Clean Down-scaled Button CTA */}
                  <div className="mt-3">
                    <button
                      onClick={() => onTabChange(activeSlide.id)}
                      className="bg-white hover:bg-slate-100 active:scale-95 text-[#030612] px-3.5 py-1.5 rounded-full text-[9.5px] font-black transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                    >
                      {activeSlide.btnText}
                      <ArrowRight className="w-3 h-3" strokeWidth={3} />
                    </button>
                  </div>
                </div>

                {/* Right side compact visual graphic widget */}
                <div className="flex shrink-0 items-center justify-center w-[98px] h-full relative">
                  {activeSlide.graphicType === "shop" && (
                    <motion.div 
                      initial={{ rotate: 1, scale: 0.94 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 140, damping: 14 }}
                      className="w-[95px] h-[58px] bg-[#1c1c1e] border border-white/10 rounded-lg p-2 flex flex-col justify-between shadow-md relative select-none overflow-hidden"
                    >
                      <div className="absolute -right-4 -bottom-4 w-10 h-10 bg-white/5 rounded-full blur-lg pointer-events-none" />
                      <div className="flex justify-between items-start">
                        {/* Metallic credit chip */}
                        <div className="w-4 h-3 bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-600 rounded-[2px] relative shadow-sm">
                          <div className="absolute inset-x-0.5 top-0.5 bottom-0.5 border-y border-zinc-950/20" />
                          <div className="absolute inset-y-0.5 left-0.5 right-0.5 border-x border-zinc-950/20" />
                        </div>
                        {/* Compact Wi-fi indicator */}
                        <div className="flex gap-[1px] items-end h-2">
                          <div className="w-[1px] h-1 bg-white rounded-full" />
                          <div className="w-[1px] h-1.5 bg-white rounded-full" />
                          <div className="w-[1px] h-2 bg-white rounded-full" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[6px] font-bold text-slate-500 tracking-wider block">AeroX Pro</span>
                        <div className="text-[7.5px] font-mono text-white font-bold mt-0.5 tracking-wider">
                          •••• •••• 5092
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeSlide.graphicType === "mail" && (
                    <motion.div 
                      initial={{ rotate: -1, scale: 0.94 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 140, damping: 14 }}
                      className="w-[95px] h-[58px] bg-[#1c1c1e] border border-white/10 rounded-lg p-2 flex flex-col justify-between shadow-md relative select-none overflow-hidden"
                    >
                      <div className="absolute -right-4 -bottom-4 w-10 h-10 bg-white/5 rounded-full blur-lg pointer-events-none" />
                      <div className="flex justify-between items-center">
                        <div className="w-5.5 h-5.5 rounded bg-white/5 flex items-center justify-center text-white border border-white/10">
                          <Mail className="w-3 h-3" />
                        </div>
                        <div className="flex items-center gap-0.5 bg-white/10 border border-white/20 px-1 py-0.5 rounded-full">
                          <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="text-[4.5px] font-black uppercase text-zinc-300 tracking-wider">LIVE</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[6px] font-bold text-slate-500 tracking-wider block">Inbox Feed</span>
                        <div className="text-[7.5px] text-zinc-300 font-semibold truncate">
                          support@aerox.vip
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeSlide.graphicType === "identity" && (
                    <motion.div 
                      initial={{ rotate: 1, scale: 0.94 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 140, damping: 14 }}
                      className="w-[95px] h-[58px] bg-[#1c1c1e] border border-white/10 rounded-lg p-2 flex flex-col justify-between shadow-md relative select-none overflow-hidden"
                    >
                      <div className="absolute -right-4 -bottom-4 w-10 h-10 bg-white/5 rounded-full blur-lg pointer-events-none" />
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 shrink-0">
                          <User className="w-3 h-3" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="h-1 bg-white/20 rounded w-8 animate-pulse" />
                          <div className="h-0.5 bg-white/10 rounded w-5 mt-0.5" />
                        </div>
                      </div>
                      <div className="border-t border-white/10 pt-1">
                        <div className="flex justify-between items-center text-[5.5px] font-mono text-slate-400">
                          <span>SSN SECURE</span>
                          <span className="text-white font-bold">100%</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicator Dot Navigation matches precisely in small scale */}
          <div className="absolute right-4.5 bottom-4 flex items-center gap-1.5">
            {mainCards.map((_, idx) => {
              const isActive = currentSlideIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleIndicatorClick(idx)}
                  className={`transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? "w-6 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]" 
                      : "w-1.5 h-1.5 bg-slate-600 hover:bg-slate-500 rounded-full"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
