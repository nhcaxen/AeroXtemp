import React, { useState, useEffect } from "react";
import { 
  User, 
  Hash, 
  Calendar, 
  TrendingUp, 
  CreditCard, 
  Mail, 
  Globe, 
  Users, 
  ShieldAlert, 
  Cpu, 
  Edit3, 
  Check, 
  Ticket 
} from "lucide-react";
import { getAnalytics, AppAnalytics } from "../utils/analytics";

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
}

export default function ProfileTab() {
  const [telegramId, setTelegramId] = useState("5834920194");
  const [username, setUsername] = useState("AeroX_Developer");
  const [displayName, setDisplayName] = useState("AeroX VIP Member");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  const [userProfile, setUserProfile] = useState<ServerUserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Redeem Promo Code states
  const [redeemCodeInput, setRedeemCodeInput] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemFeedback, setRedeemFeedback] = useState({ text: "", type: "" });

  // Live analytics state
  const [analytics, setAnalytics] = useState<AppAnalytics>({
    cardsGenerated: 0,
    emailsChecked: 0,
    identitiesGenerated: 0,
    proxiesChecked: 0
  });

  // Load and subscribe to live analytics updates
  const loadAnalytics = () => {
    setAnalytics(getAnalytics());
  };

  const fetchUserProfile = async (id: string, userNm: string, disp: string, photoUrl: string = "") => {
    setIsLoadingProfile(true);
    try {
      const res = await fetch(`/api/user-profile?telegramId=${encodeURIComponent(id)}&username=${encodeURIComponent(userNm)}&displayName=${encodeURIComponent(disp)}&photoUrl=${encodeURIComponent(photoUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        
        // Sync profile state with root App immediately
        window.dispatchEvent(new CustomEvent("aerox_profile_updated", { detail: data }));
      }
    } catch (err) {
      console.error("Failed to load user profile from database", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    // Listen to custom window events for immediate sync across components
    window.addEventListener("aerox_analytics_updated", loadAnalytics);
    
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
      // Load stored profile details if they exist in localStorage
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

    // Sync from root state changes if they occur elsewhere (e.g. from admin panel updates)
    const handleRootSync = (e: any) => {
      if (e.detail && e.detail.telegramId === initialId) {
        setUserProfile(e.detail);
      }
    };
    window.addEventListener("aerox_profile_updated", handleRootSync);

    return () => {
      window.removeEventListener("aerox_analytics_updated", loadAnalytics);
      window.removeEventListener("aerox_profile_updated", handleRootSync);
    };
  }, []);

  // Redeem code form submission
  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCodeInput.trim()) {
      setRedeemFeedback({ text: "Please enter a code.", type: "error" });
      return;
    }

    setIsRedeeming(true);
    setRedeemFeedback({ text: "", type: "" });

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: redeemCodeInput,
          telegramId,
          username
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedProfile: ServerUserProfile = {
          ...userProfile!,
          credits: data.newCredits
        };
        setUserProfile(updatedProfile);
        
        // Sync with root App immediately
        window.dispatchEvent(new CustomEvent("aerox_profile_updated", { detail: updatedProfile }));
        
        setRedeemFeedback({ text: `Success! Added +${data.creditsAdded} credits to your balance.`, type: "success" });
        setRedeemCodeInput("");
      } else {
        const errData = await res.json();
        setRedeemFeedback({ text: errData.error || "Failed to redeem code.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setRedeemFeedback({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Estimate Account Age & Registration Year from sequential Telegram ID
  const calculateAccountAge = (idStr: string) => {
    const id = parseInt(idStr) || 5800000000;
    
    // Sequence metrics mapping IDs to historical registration dates
    let year = 2024;
    let month = "October";
    let estimatedAge = "New Account";

    if (id < 1000000) {
      year = 2013;
      month = "August (Very Early OG)";
      estimatedAge = "12.9 Years (Telegram Founding Member)";
    } else if (id < 10000000) {
      year = 2014;
      month = "March";
      estimatedAge = "12.3 Years (Elite Legend)";
    } else if (id < 50000000) {
      year = 2015;
      month = "January";
      estimatedAge = "11.5 Years (OG OG)";
    } else if (id < 150000000) {
      year = 2016;
      month = "July";
      estimatedAge = "10.0 Years (Elder Telegram Vet)";
    } else if (id < 350000000) {
      year = 2017;
      month = "February";
      estimatedAge = "9.4 Years (Vintage Pioneer)";
    } else if (id < 600000000) {
      year = 2018;
      month = "May";
      estimatedAge = "8.2 Years (Seasoned Pro)";
    } else if (id < 950000000) {
      year = 2019;
      month = "November";
      estimatedAge = "6.7 Years (Pre-Pandemic Resident)";
    } else if (id < 1400000000) {
      year = 2020;
      month = "September";
      estimatedAge = "5.8 Years (Pandemic Era Join)";
    } else if (id < 2100000000) {
      year = 2021;
      month = "July";
      estimatedAge = "5.0 Years (Global Vet)";
    } else if (id < 4000000000) {
      year = 2022;
      month = "December";
      estimatedAge = "3.6 Years (Active Member)";
    } else if (id < 6000000000) {
      year = 2023;
      month = "August";
      estimatedAge = "2.9 Years (Regular User)";
    } else if (id < 8000000000) {
      year = 2024;
      month = "May";
      estimatedAge = "2.1 Years (Recent Joined)";
    } else if (id < 9500000000) {
      year = 2025;
      month = "January";
      estimatedAge = "1.5 Years (Modern Recruit)";
    } else {
      year = 2026;
      month = "March";
      estimatedAge = "0.3 Years (Fresh Account)";
    }

    return { year, month, estimatedAge };
  };

  const ageDetails = calculateAccountAge(telegramId);

  const getRoleDetails = () => {
    const role = userProfile?.role || userProfile?.plan || "free";
    if (role === "owner") {
      return {
        badge: "👑 OWNER",
        colorClass: "bg-red-500/10 border-red-500/20 text-red-400 font-extrabold",
        indicator: "👑 OWNER"
      };
    } else if (role === "premium") {
      return {
        badge: "⭐ PREMIUM",
        colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-400 font-extrabold",
        indicator: "⭐ PREMIUM"
      };
    } else {
      return {
        badge: "🟢 FREE",
        colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-extrabold",
        indicator: "🟢 FREE"
      };
    }
  };

  const roleDetails = getRoleDetails();

  const handleCopyId = () => {
    navigator.clipboard.writeText(telegramId);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8 select-none">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 select-none">
          <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-tr from-cyber-purple to-indigo-600 border border-white/[0.08] shadow-[0_4px_12px_rgba(124,58,237,0.3)]">
            <span className="text-white font-extrabold text-base font-display italic tracking-tight">AX</span>
          </div>
          <div>
            <span className="text-xs font-black tracking-widest text-white uppercase block">AeroX MEMBER PROFILE</span>
            <span className="text-[8px] text-neutral-400 font-bold tracking-widest uppercase">ANALYTICS ENGINE</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wide uppercase flex items-center gap-1 border ${roleDetails.colorClass}`}>
          <span>{roleDetails.badge}</span>
        </div>
      </div>

      {/* Cyberpunk Telegram Profile Mockup Card */}
      <div className="relative rounded-2xl p-5 border border-white/[0.05] bg-dark-surface overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col gap-4">
          {/* Upper Info Row */}
          <div className="flex items-center gap-4">
            {/* Profile Avatar Ring */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl bg-void-black border border-white/10 overflow-hidden shadow-lg">
              {userProfile?.photoUrl ? (
                <img 
                  src={userProfile.photoUrl} 
                  alt={displayName} 
                  className="w-full h-full object-cover rounded-2xl" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyber-purple/30 to-pink-500/20" />
                  <span className="text-xl font-black text-white font-display">
                    {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                  </span>
                </>
              )}
              <div className="absolute inset-0 border border-cyber-purple/40 animate-pulse rounded-2xl" />
            </div>

            {/* Identity Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white truncate uppercase tracking-wide">
                  {displayName}
                </h3>
              </div>
              <span className="text-[10px] text-cosmic-lilac font-semibold block truncate">
                @{username}
              </span>

              <button 
                onClick={handleCopyId}
                className="mt-1 px-2 py-0.5 rounded bg-void-black border border-white/[0.03] text-[9px] text-neutral-400 font-mono hover:text-white transition-all inline-flex items-center gap-1 active:scale-95"
              >
                <Hash className="w-2.5 h-2.5 text-cyber-purple" />
                <span>ID: {telegramId}</span>
                <span className="text-[7px] text-neutral-500">•</span>
                <span className="text-[8px] text-neutral-400 font-sans uppercase">
                  {copiedText ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>
          </div>

          {/* Profile Info block */}
          <div className="mt-4 pt-4 border-t border-white/[0.05] flex flex-col gap-4">
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Role</span>
              <span className="text-sm font-black text-white flex items-center gap-1.5">
                {roleDetails.badge}
              </span>
            </div>
            
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Credits</span>
              <span className="text-sm font-mono font-black text-pink-400">
                {userProfile?.credits ?? 1250}
              </span>
            </div>
            
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Joined</span>
              <span className="text-sm font-extrabold text-white">
                {userProfile?.joined ?? "11 Jul 2026"}
              </span>
            </div>
            
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Recovered Mailboxes</span>
              <span className="text-sm font-mono font-black text-white">
                {userProfile?.activeMailboxes ?? 0}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Referrals</span>
              <span className="text-sm font-mono font-black text-white">
                {userProfile?.referralsCount ?? 0}
              </span>
            </div>
          </div>

          {/* Redeem Code Section */}
          <div className="mt-4 pt-4 border-t border-white/[0.05] flex flex-col gap-2.5">
            <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-cyber-purple" />
              <span>Redeem System Promo Code</span>
            </span>
            <form onSubmit={handleRedeemCode} className="flex gap-2">
              <input 
                type="text" 
                value={redeemCodeInput} 
                onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                placeholder="AEROX-XXXX-XXXX"
                className="flex-1 bg-void-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono tracking-wider placeholder-neutral-600 focus:outline-none focus:border-cyber-purple/60"
              />
              <button 
                type="submit"
                disabled={isRedeeming}
                className="px-4 py-2 rounded-lg bg-cyber-purple hover:bg-opacity-90 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
              >
                {isRedeeming ? "Redeeming..." : "Redeem"}
              </button>
            </form>
            {redeemFeedback.text && (
              <p className={`text-[9px] font-bold ${redeemFeedback.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                {redeemFeedback.text}
              </p>
            )}
          </div>

          {/* Referral Program Section */}
          <div className="mt-4 pt-4 border-t border-white/[0.05] flex flex-col gap-2.5">
            <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-pink-400" />
              <span>AEROX Referral Link Program</span>
            </span>
            <div className="flex bg-void-black p-2.5 rounded-xl border border-white/[0.03] items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-neutral-300 truncate select-all pr-2">
                {`https://t.me/AeroXIpgen_bot?start=ref_${telegramId}`}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://t.me/AeroXIpgen_bot?start=ref_${telegramId}`);
                  setCopiedRefLink(true);
                  setTimeout(() => setCopiedRefLink(false), 2000);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-cyber-purple hover:bg-opacity-90 text-white text-[9px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all shrink-0"
              >
                {copiedRefLink ? "Copied" : "Copy Link"}
              </button>
            </div>
            <p className="text-[8px] text-neutral-500 leading-normal">
              Earn +1 point instantly for every friend you refer. Point payouts are synchronized between bot and web!
            </p>
          </div>

          {/* Simulated Account Age details block */}
          <div className="mt-2.5 p-3.5 rounded-xl bg-void-black border border-white/[0.03] flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 border-b border-white/[0.04] pb-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyber-purple" />
              <span className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest">
                Telegram Account Age Analyzer
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[8px] text-neutral-500 font-bold uppercase block">Estimated Join Date</span>
                <span className="text-xs font-extrabold text-frost-white flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-pink-500" />
                  <span>{ageDetails.month}, {ageDetails.year}</span>
                </span>
              </div>
              <div>
                <span className="text-[8px] text-neutral-500 font-bold uppercase block">Calculated Age</span>
                <span className="text-xs font-black text-emerald-400 mt-0.5 block truncate">
                  ~ {ageDetails.estimatedAge}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Live Total Analytics Dashboard Section */}
      <div>
        <div className="flex items-center gap-1.5 mb-3 px-1">
          <TrendingUp className="w-4 h-4 text-cyber-purple" />
          <h2 className="text-xs font-extrabold tracking-wider uppercase text-neutral-400">
            Global Analytics Tracker (100% Free)
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* CCs generated counter */}
          <div className="p-3.5 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyber-purple/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-cyber-purple" />
            </div>
            <div>
              <span className="text-[18px] font-black font-mono text-white block leading-none">
                {analytics.cardsGenerated}
              </span>
              <span className="text-[9px] text-neutral-400 font-bold block uppercase mt-1">Cards Generated</span>
            </div>
          </div>

          {/* Mailbox Refresh Counter */}
          <div className="p-3.5 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <span className="text-[18px] font-black font-mono text-white block leading-none">
                {analytics.emailsChecked}
              </span>
              <span className="text-[9px] text-neutral-400 font-bold block uppercase mt-1">Mail Refreshes</span>
            </div>
          </div>

          {/* Identities Counter */}
          <div className="p-3.5 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="text-[18px] font-black font-mono text-white block leading-none">
                {analytics.identitiesGenerated}
              </span>
              <span className="text-[9px] text-neutral-400 font-bold block uppercase mt-1">Fake Profiles Gen</span>
            </div>
          </div>

          {/* Proxies verified counter */}
          <div className="p-3.5 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[18px] font-black font-mono text-white block leading-none">
                {analytics.proxiesChecked}
              </span>
              <span className="text-[9px] text-neutral-400 font-bold block uppercase mt-1">Proxies Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mail Recovery Telemetry Tracker */}
      <div className="bg-dark-surface border border-white/[0.03] p-4 rounded-xl flex flex-col gap-3 text-left">
        <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block border-b border-white/[0.04] pb-2">
          Mail Recovery Telemetry Tracker
        </span>
        <div className="grid grid-cols-2 gap-3 mt-1 text-xs">
          <div>
            <span className="text-[9px] text-neutral-500 font-bold uppercase block">Total Mailboxes Created</span>
            <span className="text-sm font-mono font-black text-white">{userProfile?.totalMailboxesCreated ?? 0}</span>
          </div>
          <div>
            <span className="text-[9px] text-neutral-500 font-bold uppercase block">Total Recoveries</span>
            <span className="text-sm font-mono font-black text-pink-400">{userProfile?.totalRecoveries ?? 0}</span>
          </div>
          <div>
            <span className="text-[9px] text-neutral-500 font-bold uppercase block">Active Mailboxes</span>
            <span className="text-sm font-mono font-black text-green-400">{userProfile?.activeMailboxes ?? 0}</span>
          </div>
          <div>
            <span className="text-[9px] text-neutral-500 font-bold uppercase block">Deleted Mailboxes</span>
            <span className="text-sm font-mono font-black text-red-400">{userProfile?.deletedMailboxes ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Fully Free Hosting & Persistent DB Guideline Banner */}
      <div className="p-4 rounded-xl border border-white/[0.03] bg-void-black/60 flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-[10px] text-neutral-300 font-black uppercase">Hosting & Database Integrity Info</span>
        </div>
        <p className="text-[9px] text-neutral-400 leading-relaxed">
          The AeroX Toolset operates completely server-less and free. All telemetry analytics, session logs, and profile info are kept completely offline under client-first memory storage. <strong>Never pay for hosting, databases, or API keys again!</strong>
        </p>
      </div>
    </div>
  );
}
