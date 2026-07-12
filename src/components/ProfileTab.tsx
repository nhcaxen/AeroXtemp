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
  Ticket,
  Clock,
  Shield
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
  referralsCount?: number;
  resetTimer?: string;
  planExpiry?: string | null;
  trialDaysRemaining?: number;
}

export default function ProfileTab() {
  const [telegramId, setTelegramId] = useState("5834920194");
  const [username, setUsername] = useState("AeroX_Developer");
  const [displayName, setDisplayName] = useState("AeroX VIP Member");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  const [userProfile, setUserProfile] = useState<ServerUserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Subscription & Upgrade states
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

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

  const handleSelectPlan = async (selectedPlan: string) => {
    setIsUpgrading(true);
    setUpgradeError(null);
    try {
      const res = await fetch("/api/user-profile/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          plan: selectedPlan
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        
        // Sync with root App immediately
        window.dispatchEvent(new CustomEvent("aerox_profile_updated", { detail: data }));
        setIsUpgradeModalOpen(false);
      } else {
        const data = await res.json();
        setUpgradeError(data.error || "Failed to update subscription plan.");
      }
    } catch (err: any) {
      console.error(err);
      setUpgradeError("Network error. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const getMembershipStatus = () => {
    const plan = userProfile?.plan || "free";
    if (plan === "owner") return "Active";
    if (["core", "prime", "elite"].includes(plan)) return "Active";
    
    // For free
    const remaining = userProfile?.trialDaysRemaining ?? 7;
    return remaining > 0 ? "Trial" : "Expired";
  };

  const membershipStatus = getMembershipStatus();

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

  // Hardcoded secure Telegram owner contact (cannot be changed via settings or DB)
  const OWNER_TELEGRAM_USERNAME = "Adityahuvai";

  const getPlanDescription = (planName: string) => {
    if (planName === "core") return { credits: "250 CRD Daily", price: "$2.99", duration: "7 Days" };
    if (planName === "prime") return { credits: "500 CRD Daily", price: "$5.99", duration: "14 Days" };
    if (planName === "elite") return { credits: "750 CRD Daily", price: "$9.99", duration: "30 Days" };
    return { credits: "20 CRD Daily", price: "$0.00", duration: "7 Days" };
  };

  const plans = [
    {
      id: "core",
      name: "Core Plan",
      credits: "250 CRD Daily Reset",
      price: "$2.99",
      duration: "7 Days",
      features: ["250 Credits Daily", "Temporary Mailbox Generation", "VIP Priority Recovery", "Premium Badge Indicator"],
      color: "from-blue-600/20 to-cyan-500/10",
      borderColor: "border-cyan-500/20",
      accentColor: "text-cyan-400"
    },
    {
      id: "prime",
      name: "Prime Plan",
      credits: "500 CRD Daily Reset",
      price: "$5.99",
      duration: "14 Days",
      features: ["500 Credits Daily", "Priority High-Speed Mailbox", "Unlimited Thread Processing", "Premium Badge Indicator"],
      color: "from-purple-600/20 to-pink-500/10",
      borderColor: "border-purple-500/30",
      accentColor: "text-purple-400",
      popular: true
    },
    {
      id: "elite",
      name: "Elite Plan",
      credits: "750 CRD Daily Reset",
      price: "$9.99",
      duration: "30 Days",
      features: ["750 Credits Daily", "Ultimate Concurrent Spawning", "VIP Support & Free Recovery", "Premium Badge Indicator"],
      color: "from-amber-600/20 to-orange-500/10",
      borderColor: "border-amber-500/20",
      accentColor: "text-amber-400"
    }
  ];

  return (
    <div id="profile-tab-root" className="flex flex-col gap-4 px-4 pt-4 pb-8 select-none">
      {/* Header section */}
      <div className="flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-tr from-cyber-purple to-indigo-600 border border-white/[0.08] shadow-[0_4px_12px_rgba(124,58,237,0.3)]">
            <span className="text-white font-extrabold text-base font-display italic tracking-tight">AX</span>
          </div>
          <div>
            <span className="text-xs font-black tracking-widest text-white uppercase block">AeroX MEMBER HUB</span>
            <span className="text-[8px] text-neutral-400 font-bold tracking-widest uppercase">ACCOUNT CONFIGURATION</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wide uppercase flex items-center gap-1 border ${roleDetails.colorClass}`}>
          <span>{roleDetails.badge}</span>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          UNIFIED CYBERPUNK TELEGRAM PROFILE HUB (Master Card)
          ═════════════════════════════════════════════════════════════ */}
      <div id="profile-master-card" className="relative rounded-2xl p-5 border border-white/[0.05] bg-dark-surface overflow-hidden shadow-2xl flex flex-col gap-4 text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col gap-4">
          {/* Upper Info Row */}
          <div className="flex items-center gap-4">
            {/* Profile Avatar Ring */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl bg-void-black border border-white/10 overflow-hidden shadow-lg">
              {userProfile?.photoUrl ? (
                <img 
                  id="profile-avatar-img"
                  src={userProfile.photoUrl} 
                  alt={displayName} 
                  className="w-full h-full object-cover rounded-2xl" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
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
              <h3 className="text-sm font-black text-white truncate uppercase tracking-wide">
                {displayName}
              </h3>
              <span className="text-[10px] text-cosmic-lilac font-semibold block truncate">
                @{username}
              </span>

              <button 
                id="copy-telegram-id-btn"
                onClick={handleCopyId}
                className="mt-1.5 px-2.5 py-1 rounded bg-void-black border border-white/[0.03] text-[9px] text-neutral-400 font-mono hover:text-white transition-all inline-flex items-center gap-1 active:scale-95"
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

          {/* Account and Subscription Details Grid */}
          <div className="pt-4 border-t border-white/[0.05] grid grid-cols-2 gap-x-4 gap-y-3.5">
            <div>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">Role Type</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border inline-flex items-center gap-1 ${roleDetails.colorClass}`}>
                {roleDetails.badge}
              </span>
            </div>
            
            <div>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">Membership Plan</span>
              <span className="text-xs font-black text-white uppercase tracking-wide block">
                {userProfile?.plan === "owner" 
                  ? "👑 Lifetime Owner" 
                  : ["core", "prime", "elite"].includes(userProfile?.plan || "")
                    ? `⭐ ${userProfile!.plan!.toUpperCase()} Access` 
                    : "🟢 Free Trial"}
              </span>
            </div>

            <div>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">Status</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border inline-flex items-center ${
                membershipStatus === "Active" 
                  ? "bg-green-500/10 border-green-500/20 text-green-400" 
                  : membershipStatus === "Trial" 
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {membershipStatus}
              </span>
            </div>

            <div>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">Credits Balance</span>
              <span className="text-xs font-mono font-black text-pink-400 block">
                {userProfile?.plan === "owner" 
                  ? "∞ UNLIMITED" 
                  : userProfile?.plan === "free"
                    ? `${userProfile?.credits ?? 0} / 20 CRD`
                    : userProfile?.plan === "core"
                      ? `${userProfile?.credits ?? 0} / 250 CRD`
                      : userProfile?.plan === "prime"
                        ? `${userProfile?.credits ?? 0} / 500 CRD`
                        : `${userProfile?.credits ?? 0} / 750 CRD`}
              </span>
            </div>
            
            <div>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">Daily Reset Countdown</span>
              <span className="text-xs font-mono font-bold text-white block">
                {userProfile?.plan === "owner" 
                  ? "No Reset Required" 
                  : userProfile?.resetTimer ? `${userProfile.resetTimer} Left` : "Resets soon"}
              </span>
            </div>

            <div>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">Plan Expiry Date</span>
              <span className="text-xs font-mono font-bold text-white block">
                {userProfile?.plan === "owner" 
                  ? "Never Expires" 
                  : userProfile?.planExpiry 
                    ? userProfile.planExpiry 
                    : `${userProfile?.trialDaysRemaining ?? 7} Days Left`}
              </span>
            </div>

            <div>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">Member Since</span>
              <span className="text-xs font-semibold text-white block">
                {userProfile?.joined ?? "11 Jul 2026"}
              </span>
            </div>
          </div>

          {/* Upgrade Access Call to Action Button */}
          {userProfile?.plan !== "owner" && (
            <div className="pt-2">
              <button
                id="trigger-upgrade-modal-btn"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyber-purple to-pink-500 hover:opacity-95 active:scale-[0.98] transition-all text-xs font-black uppercase tracking-wider text-white shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                {userProfile?.plan === "free" ? (
                  <>
                    <span>⭐ Upgrade to AeroX Premium</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Manage Subscription Plans</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Redeem Code Section - only visible for non-owners */}
          {userProfile?.plan !== "owner" && (
            <div className="pt-3 border-t border-white/[0.05] flex flex-col gap-2 animate-fade-in">
              <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-cyber-purple" />
                <span>Redeem System Promo Code</span>
              </span>
              <form onSubmit={handleRedeemCode} className="flex gap-2">
                <input 
                  id="redeem-code-input-field"
                  type="text" 
                  value={redeemCodeInput} 
                  onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                  placeholder="AEROX-XXXX-XXXX"
                  className="flex-1 bg-void-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono tracking-wider placeholder-neutral-600 focus:outline-none focus:border-cyber-purple/60"
                />
                <button 
                  id="submit-redeem-code-btn"
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
          )}

          {/* Referral Program Section */}
          <div className="pt-3 border-t border-white/[0.05] flex flex-col gap-2">
            <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-pink-400" />
              <span>AEROX Referral Link Program</span>
            </span>
            <div className="flex bg-void-black p-2 rounded-lg border border-white/[0.03] items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-neutral-300 truncate select-all pl-1.5">
                {`https://t.me/AeroXIpgen_bot?start=ref_${telegramId}`}
              </span>
              <button
                id="copy-referral-link-btn"
                onClick={() => {
                  navigator.clipboard.writeText(`https://t.me/AeroXIpgen_bot?start=ref_${telegramId}`);
                  setCopiedRefLink(true);
                  setTimeout(() => setCopiedRefLink(false), 2000);
                }}
                className="px-3 py-1 rounded bg-cyber-purple hover:bg-opacity-90 text-white text-[9px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all shrink-0"
              >
                {copiedRefLink ? "Copied" : "Copy Link"}
              </button>
            </div>
            <p className="text-[8px] text-neutral-500 leading-normal">
              Earn +1 point instantly for every friend referred. Point payouts synchronize automatically between bot and web!
            </p>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          INTEGRATED ENGINE SYSTEM TELEMETRY (Dual metrics grid)
          ═════════════════════════════════════════════════════════════ */}
      <div id="telemetry-console-section" className="flex flex-col gap-2 text-left">
        <div className="flex items-center gap-1.5 px-1 justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyber-purple" />
            <h2 className="text-[10px] font-extrabold tracking-widest uppercase text-neutral-400">
              AEROX ENGINE SYSTEM TELEMETRY
            </h2>
          </div>
          <span className="text-[8px] bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">LIVE FEED</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* USER stats - Active Mailboxes */}
          <div className="p-3 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-1.5">
            <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-widest block">Your Mailboxes</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[18px] font-black font-mono text-white leading-none">
                {userProfile?.activeMailboxes ?? 0}
              </span>
              <span className="text-[8px] text-green-400 font-black uppercase">Active</span>
            </div>
          </div>

          {/* USER stats - Total Recoveries */}
          <div className="p-3 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-1.5">
            <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-widest block">Your Recoveries</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[18px] font-black font-mono text-pink-400 leading-none">
                {userProfile?.totalRecoveries ?? 0}
              </span>
              <span className="text-[8px] text-neutral-500 font-semibold uppercase">Logs</span>
            </div>
          </div>

          {/* Global Cards Generated */}
          <div className="p-3 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-1.5">
            <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-widest block">Global Cards Gen</span>
            <span className="text-[18px] font-black font-mono text-white leading-none">
              {analytics.cardsGenerated}
            </span>
          </div>

          {/* Global Mail Refreshes */}
          <div className="p-3 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-1.5">
            <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-widest block">Global Mail Refreshes</span>
            <span className="text-[18px] font-black font-mono text-white leading-none">
              {analytics.emailsChecked}
            </span>
          </div>

          {/* Global Fake Profiles */}
          <div className="p-3 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-1.5 col-span-1">
            <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-widest block">Global Profile Gens</span>
            <span className="text-[18px] font-black font-mono text-white leading-none">
              {analytics.identitiesGenerated}
            </span>
          </div>

          {/* Global Proxies Checked */}
          <div className="p-3 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-1.5 col-span-1">
            <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-widest block">Global Proxies verified</span>
            <span className="text-[18px] font-black font-mono text-white leading-none">
              {analytics.proxiesChecked}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Elegant Footer Guidelines (Eliminated the large bulky banner) */}
      <div className="py-2 px-1 select-none text-center">
        <p className="text-[8.5px] text-neutral-500 tracking-wide leading-relaxed">
          ⚡ AeroX Toolset resides securely offline-first. Telemetry & member session logs are held under memory. Zero fee cloud infrastructure.
        </p>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          ULTRA-PREMIUM MEMBERSHIP PLANS BUY MODAL (Owner @Adityahuvai)
          ═════════════════════════════════════════════════════════════ */}
      {isUpgradeModalOpen && (
        <div id="subscription-plans-modal" className="fixed inset-0 bg-void-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-[0_0_50px_rgba(124,58,237,0.2)] my-auto max-h-[90vh] overflow-y-auto scrollbar-none relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-2 select-none">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyber-purple" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider font-display">
                  AEROX MEMBERSHIP PLANS
                </h3>
              </div>
              <button 
                id="close-upgrade-modal-btn"
                onClick={() => {
                  setIsUpgradeModalOpen(false);
                  setUpgradeError(null);
                }}
                className="text-neutral-500 hover:text-white text-sm font-black p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[10px] text-neutral-400 leading-normal -mt-1 text-left">
              Select an access plan below to upgrade your credit limit instantly. Redirection is securely handled directly to our owner.
            </p>

            {/* Plan Options Grid */}
            <div className="flex flex-col gap-3">
              {plans.map((p) => {
                const isCurrent = userProfile?.plan === p.id;
                
                // Secure immutable purchase redirection link directly to Telegram of Aditya (@Adityahuvai)
                const textMessage = `Hi Aditya, I would like to upgrade my AeroX account to the ${p.name} (${p.price} / ${p.duration})!\n\nMy Telegram ID is: ${telegramId}`;
                const telegramRedirectionUrl = `https://t.me/${OWNER_TELEGRAM_USERNAME}?text=${encodeURIComponent(textMessage)}`;

                return (
                  <div 
                    key={p.id}
                    id={`plan-card-${p.id}`}
                    className={`p-4 rounded-xl border relative transition-all flex flex-col gap-2.5 text-left bg-gradient-to-tr ${p.color} ${
                      isCurrent 
                        ? "border-cyber-purple ring-1 ring-cyber-purple/50" 
                        : "border-white/[0.06] hover:border-white/15"
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2 right-4 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-pink-500 to-cyber-purple rounded-full border border-pink-500/30">
                        🔥 Popular
                      </span>
                    )}

                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-xs font-black block uppercase tracking-wide ${p.accentColor}`}>
                          {p.name}
                        </span>
                        <span className="text-[9px] text-neutral-300 block font-bold mt-0.5">
                          ⏳ Duration: {p.duration}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-white block leading-none">{p.price}</span>
                        <span className="text-[7px] text-neutral-400 uppercase font-black tracking-wider block mt-0.5">One-time payment</span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="flex flex-col gap-1 border-t border-white/[0.05] pt-2">
                      <div className="text-[9px] font-mono font-black text-pink-400 uppercase tracking-wider mb-1">
                        🚀 Limit: {p.credits}
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {p.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            <span className="text-[8px] text-neutral-300 font-medium truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Actions */}
                    <div className="mt-1 flex items-center justify-between gap-2.5">
                      {isCurrent ? (
                        <span className="w-full text-center py-2 rounded-lg bg-cyber-purple/20 text-cyber-purple font-black uppercase text-[9px] border border-cyber-purple/30">
                          Active Membership
                        </span>
                      ) : (
                        <a
                          id={`buy-plan-${p.id}-btn`}
                          href={telegramRedirectionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-center py-2 rounded-lg bg-cyber-purple hover:bg-opacity-95 text-white font-black uppercase text-[9px] cursor-pointer transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1"
                        >
                          <span>Purchase Plan (${p.price})</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Free Plan Info Card */}
              {userProfile?.plan !== "free" && (
                <div className="p-3.5 rounded-xl border border-white/[0.04] bg-void-black flex flex-col gap-1.5 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-neutral-400 block uppercase tracking-wide">Free Plan</span>
                      <span className="text-[8px] text-neutral-500 block font-bold">Standard Account Tier</span>
                    </div>
                    <span className="text-[10.5px] font-extrabold text-neutral-400">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-neutral-400 border-t border-white/[0.05] pt-1.5">
                    <span>Reset Limit: <strong>20 CRD Daily</strong></span>
                    <button
                      id="downgrade-to-free-btn"
                      disabled={isUpgrading}
                      onClick={() => handleSelectPlan("free")}
                      className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold uppercase text-[8px] border border-red-500/20 cursor-pointer active:scale-95 transition-all disabled:opacity-40"
                    >
                      Downgrade Account
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Telegram Copy Info Block */}
            <div className="bg-void-black/50 border border-white/[0.04] p-2.5 rounded-lg text-center select-none flex flex-col gap-1 mt-1">
              <span className="text-[8px] text-neutral-500 uppercase tracking-wider font-extrabold">Redirection Notice</span>
              <p className="text-[7.5px] text-neutral-400 leading-normal">
                Purchasing redirects you to securely contact owner <strong className="text-white">@{OWNER_TELEGRAM_USERNAME}</strong> on Telegram. Your unique ID will be automatically sent.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
