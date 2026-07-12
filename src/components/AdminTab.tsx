import React, { useState, useEffect } from "react";
import { 
  Users, 
  Shield, 
  Award, 
  Coins, 
  Ticket, 
  Search, 
  UserPlus, 
  UserMinus, 
  Plus, 
  Minus, 
  Calendar, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ChevronRight,
  UserCheck
} from "lucide-react";

interface AdminTabProps {
  adminTelegramId: string;
}

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalCredits: number;
  redeemCodesCreated: number;
  recentUsers: Array<{
    telegramId: string;
    username: string;
    displayName: string;
    role: string;
    plan: string;
    credits: number;
    joined: string;
    lastActive: string;
  }>;
}

interface RedeemCode {
  id: number;
  code: string;
  credits: number;
  expiresAt: string | null;
  maxUses: number;
  usedCount: number;
  createdBy: string;
}

export default function AdminTab({ adminTelegramId }: AdminTabProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Credit adjustment form state
  const [creditAmount, setCreditAmount] = useState<number>(500);
  const [creditReason, setCreditReason] = useState("");
  const [isUpdatingCredits, setIsUpdatingCredits] = useState(false);

  // Premium toggle state
  const [isUpdatingPremium, setIsUpdatingPremium] = useState(false);

  // Redeem code form state
  const [redeemCredits, setRedeemCredits] = useState<number>(1000);
  const [redeemMaxUses, setRedeemMaxUses] = useState<number>(10);
  const [redeemExpiry, setRedeemExpiry] = useState("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<RedeemCode[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);

  // Status banners
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/admin/dashboard-stats", {
        headers: { "x-admin-id": adminTelegramId }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || "Failed to load dashboard stats");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error loading dashboard stats");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchRedeemCodes = async () => {
    setIsLoadingCodes(true);
    try {
      const res = await fetch("/api/admin/redeem/list", {
        headers: { "x-admin-id": adminTelegramId }
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedCodes(data.codes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCodes(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRedeemCodes();
  }, [adminTelegramId]);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/users/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { "x-admin-id": adminTelegramId }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
        if (data.users && data.users.length > 0) {
          // Auto select first user
          setSelectedUser(data.users[0]);
        } else {
          setSelectedUser(null);
          triggerError("No users found matching query.");
        }
      }
    } catch (err) {
      console.error(err);
      triggerError("Failed to search users.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleTogglePremium = async (action: "give" | "remove") => {
    if (!selectedUser) return;
    setIsUpdatingPremium(true);
    try {
      const res = await fetch("/api/admin/users/update-premium", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminTelegramId
        },
        body: JSON.stringify({
          telegramId: selectedUser.telegramId,
          action
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data.user);
        triggerSuccess(`Premium status successfully ${action === "give" ? "granted" : "revoked"}!`);
        fetchStats(); // Refresh dashboard stats
        // Update user inside results list too
        setSearchResults(prev => prev.map(u => u.telegramId === selectedUser.telegramId ? data.user : u));
      } else {
        const errData = await res.json();
        triggerError(errData.error || "Failed to update premium plan");
      }
    } catch (err) {
      console.error(err);
      triggerError("Network error updating premium status");
    } finally {
      setIsUpdatingPremium(false);
    }
  };

  const handleUpdateCredits = async (action: "add" | "remove") => {
    if (!selectedUser) return;
    if (creditAmount <= 0) {
      triggerError("Please enter a valid credit amount.");
      return;
    }

    setIsUpdatingCredits(true);
    try {
      const res = await fetch("/api/admin/users/update-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminTelegramId
        },
        body: JSON.stringify({
          telegramId: selectedUser.telegramId,
          amount: creditAmount,
          action,
          reason: creditReason
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data.user);
        triggerSuccess(`Credits updated successfully! (${action === "add" ? "+" : "-"}${creditAmount})`);
        setCreditReason("");
        fetchStats(); // Refresh stats
        setSearchResults(prev => prev.map(u => u.telegramId === selectedUser.telegramId ? data.user : u));
      } else {
        const errData = await res.json();
        triggerError(errData.error || "Failed to modify user credits");
      }
    } catch (err) {
      console.error(err);
      triggerError("Network error updating user credits");
    } finally {
      setIsUpdatingCredits(false);
    }
  };

  const handleGenerateRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (redeemCredits <= 0) {
      triggerError("Redeem credits must be greater than zero.");
      return;
    }
    if (redeemMaxUses <= 0) {
      triggerError("Maximum uses must be at least 1.");
      return;
    }

    setIsGeneratingCode(true);
    try {
      const res = await fetch("/api/admin/redeem/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminTelegramId
        },
        body: JSON.stringify({
          credits: redeemCredits,
          expiresAt: redeemExpiry || null,
          maxUses: redeemMaxUses
        })
      });

      if (res.ok) {
        const data = await res.json();
        triggerSuccess(`Redeem code generated: ${data.code.code}`);
        fetchRedeemCodes();
        fetchStats();
      } else {
        const errData = await res.json();
        triggerError(errData.error || "Failed to generate code");
      }
    } catch (err) {
      console.error(err);
      triggerError("Network error generating redeem code");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    if (role === "owner") {
      return "bg-red-500/15 border-red-500/30 text-red-400 font-extrabold";
    } else if (role === "premium") {
      return "bg-amber-500/15 border-amber-500/30 text-amber-400 font-extrabold";
    } else {
      return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-extrabold";
    }
  };

  const getRoleBadgeLabel = (role: string) => {
    if (role === "owner") return "👑 DEMON";
    if (role === "premium") return "⭐ PREMIUM";
    return "🟢 FREE";
  };

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-12 select-none">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 border border-white/[0.08] shadow-[0_4px_12px_rgba(239,68,68,0.3)]">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xs font-black tracking-widest text-white uppercase block">AeroX OWNER PORTAL</span>
            <span className="text-[8px] text-red-400 font-black tracking-widest uppercase">ADMIN ENGINE SYSTEM</span>
          </div>
        </div>
        <button 
          onClick={() => { fetchStats(); fetchRedeemCodes(); }}
          className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all text-neutral-400 hover:text-white cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingStats ? "animate-spin text-red-400" : ""}`} />
        </button>
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 font-black uppercase">Total Members</span>
            <Users className="w-4 h-4 text-neutral-500" />
          </div>
          <span className="text-2xl font-mono font-black text-white leading-none">
            {stats ? stats.totalUsers : "..."}
          </span>
          <div className="text-[9px] text-neutral-500 flex gap-2 font-bold uppercase mt-1">
            <span className="text-amber-400">{stats ? stats.premiumUsers : 0} Prem</span>
            <span>•</span>
            <span className="text-emerald-400">{stats ? stats.freeUsers : 0} Free</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 font-black uppercase">Credits Distributed</span>
            <Coins className="w-4 h-4 text-neutral-500" />
          </div>
          <span className="text-2xl font-mono font-black text-pink-400 leading-none">
            {stats ? stats.totalCredits : "..."}
          </span>
          <span className="text-[9px] text-neutral-500 font-bold uppercase mt-1">
            Global system reserves
          </span>
        </div>

        <div className="p-4 rounded-xl bg-dark-surface border border-white/[0.03] flex flex-col gap-2 col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 font-black uppercase">Redeem Codes Issued</span>
            <Ticket className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-black text-indigo-400 leading-none">
              {stats ? stats.redeemCodesCreated : "..."}
            </span>
            <span className="text-[9px] text-neutral-500 font-bold uppercase">
              Promo codes active in DB
            </span>
          </div>
        </div>
      </div>

      {/* User Management Panel */}
      <div className="p-5 rounded-2xl border border-white/[0.05] bg-dark-surface">
        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-red-500" />
          <span>User Search & Modification</span>
        </h3>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, username, or name..."
              className="w-full bg-void-black border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/60"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-black text-xs text-white uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Selected User details */}
        {selectedUser ? (
          <div className="p-4 rounded-xl bg-void-black border border-white/[0.03] flex flex-col gap-4 animate-fadeIn">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-white/[0.04] pb-3">
              <div>
                <h4 className="text-sm font-black text-white">{selectedUser.displayName}</h4>
                <span className="text-[10px] text-neutral-400 font-mono block">@{selectedUser.username}</span>
                <span className="text-[9px] text-neutral-500 font-mono">ID: {selectedUser.telegramId}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase border ${getRoleBadgeClass(selectedUser.plan)}`}>
                {getRoleBadgeLabel(selectedUser.plan)}
              </span>
            </div>

            {/* Profile fields */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-xs">
              <div>
                <span className="text-[8px] text-neutral-500 font-bold uppercase block mb-0.5">Credits Balance</span>
                <span className="font-mono font-black text-pink-400">{selectedUser.credits}</span>
              </div>
              <div>
                <span className="text-[8px] text-neutral-500 font-bold uppercase block mb-0.5">Joined Bot</span>
                <span className="font-bold text-neutral-300">{selectedUser.joined || "N/A"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[8px] text-neutral-500 font-bold uppercase block mb-0.5">Last Active Datetime</span>
                <span className="font-mono text-[10px] font-bold text-neutral-300">{selectedUser.lastActive || "N/A"}</span>
              </div>
            </div>

            {/* Actions: Give/Remove Premium */}
            <div className="pt-3 border-t border-white/[0.04] flex flex-col gap-3">
              <div>
                <span className="text-[9px] text-neutral-400 font-black uppercase block mb-2">Premium Status Command</span>
                <div className="flex gap-2">
                  {selectedUser.plan !== "premium" ? (
                    <button
                      onClick={() => handleTogglePremium("give")}
                      disabled={isUpdatingPremium}
                      className="flex-1 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/20 hover:border-transparent font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Give Premium</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTogglePremium("remove")}
                      disabled={isUpdatingPremium}
                      className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-transparent font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Remove Premium</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Actions: Add/Remove Credits */}
              <div>
                <span className="text-[9px] text-neutral-400 font-black uppercase block mb-2">Adjust System Credits</span>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(parseInt(e.target.value, 10) || 0)}
                      placeholder="Credits amount..."
                      className="w-24 bg-dark-surface border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                    />
                    <input 
                      type="text"
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      placeholder="Enter update reason (optional)..."
                      className="flex-1 bg-dark-surface border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateCredits("add")}
                      disabled={isUpdatingCredits}
                      className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Credits</span>
                    </button>
                    <button
                      onClick={() => handleUpdateCredits("remove")}
                      disabled={isUpdatingCredits}
                      className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Remove Credits</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-neutral-500 text-center py-4 italic border border-dashed border-white/[0.04] rounded-xl">
            Search for an active member using the box above to manage their profile commands.
          </p>
        )}
      </div>

      {/* Redeem Codes System Panel */}
      <div className="p-5 rounded-2xl border border-white/[0.05] bg-dark-surface flex flex-col gap-4">
        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-red-500" />
          <span>Redeem Code Generator</span>
        </h3>

        <form onSubmit={handleGenerateRedeemCode} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-neutral-400 font-bold uppercase">Grant Credits</label>
              <input 
                type="number"
                value={redeemCredits}
                onChange={(e) => setRedeemCredits(parseInt(e.target.value, 10) || 0)}
                placeholder="Credits e.g. 1000"
                className="bg-void-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-neutral-400 font-bold uppercase">Max Redemptions</label>
              <input 
                type="number"
                value={redeemMaxUses}
                onChange={(e) => setRedeemMaxUses(parseInt(e.target.value, 10) || 0)}
                placeholder="Uses e.g. 5"
                className="bg-void-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-neutral-400 font-bold uppercase">Expiry Date (YYYY-MM-DD)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              <input 
                type="date"
                value={redeemExpiry}
                onChange={(e) => setRedeemExpiry(e.target.value)}
                className="w-full bg-void-black border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <span className="text-[8px] text-neutral-500">Leave blank for a permanent promo code.</span>
          </div>

          <button
            type="submit"
            disabled={isGeneratingCode}
            className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 font-black text-xs text-white uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            {isGeneratingCode ? "Generating..." : "Generate Code"}
          </button>
        </form>

        {/* Existing Promo Codes List */}
        <div className="pt-3 border-t border-white/[0.04]">
          <h4 className="text-[10px] text-neutral-400 font-black uppercase tracking-wider mb-2.5">
            Issued Promo Codes
          </h4>

          {isLoadingCodes ? (
            <p className="text-[10px] text-neutral-500 italic">Loading promo codes...</p>
          ) : generatedCodes.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {generatedCodes.map((code) => (
                <div key={code.id} className="p-2.5 rounded-lg bg-void-black border border-white/[0.02] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-black text-indigo-400 block tracking-wider">{code.code}</span>
                    <span className="text-[8px] text-neutral-500 font-semibold uppercase block mt-0.5">
                      {code.credits} CRD • Uses: {code.usedCount}/{code.maxUses}
                      {code.expiresAt && ` • Exp: ${code.expiresAt}`}
                    </span>
                  </div>
                  {code.usedCount >= code.maxUses ? (
                    <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-neutral-800 text-neutral-500 uppercase">Used Up</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[7px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">Active</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-neutral-500 italic py-2">No promo codes found in database.</p>
          )}
        </div>
      </div>

      {/* Recent Logins */}
      <div className="p-5 rounded-2xl border border-white/[0.05] bg-dark-surface">
        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-red-500" />
          <span>Recently Active Members</span>
        </h3>

        {stats && stats.recentUsers && stats.recentUsers.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {stats.recentUsers.map((user, idx) => (
              <button 
                key={user.telegramId || idx}
                onClick={() => {
                  setSelectedUser(user);
                  setSearchQuery(user.telegramId);
                }}
                className="p-2.5 rounded-xl bg-void-black/50 hover:bg-void-black border border-white/[0.02] flex items-center justify-between text-left transition-all active:scale-95 cursor-pointer"
              >
                <div>
                  <span className="text-xs font-black text-white block">{user.displayName}</span>
                  <span className="text-[9px] text-neutral-400 font-mono block">@{user.username || "Anonymous"}</span>
                  <span className="text-[8px] text-neutral-500 font-mono block">ID: {user.telegramId} • Joined: {user.joined}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-pink-400 block leading-none">{user.credits} CRD</span>
                  <span className="text-[7px] text-neutral-500 uppercase font-bold mt-1 block">
                    Active {user.lastActive ? user.lastActive.split(" ")[0] + " " + user.lastActive.split(" ")[1] : "N/A"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-neutral-500 italic py-2 text-center">No recent active users found.</p>
        )}
      </div>
    </div>
  );
}
