import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, Cpu, Sparkles, Shield, Globe, Tv, Music, Instagram, 
  TrendingUp, ShoppingBag, History, Key, Check, Copy, 
  ExternalLink, RefreshCw, AlertCircle, Coins, Search, Filter,
  CheckCircle2, ArrowRight, ArrowUpRight, Lock, X, Info
} from "lucide-react";
import { Icon } from "@iconify/react";
import { getAbsoluteUrl } from "../utils";

interface Product {
  id: string;
  title: string;
  desc: string;
  price: number;
  category: "AI" | "VPN" | "OTT" | "Instagram";
  stock: string;
  badge: string;
  iconName: string;
}

interface Purchase {
  id: number;
  telegramId: string;
  username: string;
  productTitle: string;
  productCategory: string;
  productPrice: number;
  credentials: string;
  purchasedAt: string;
}

const PRODUCTS: Product[] = [
  {
    id: "gpt_plus",
    title: "ChatGPT Plus Premium Slot",
    desc: "Private shared profile with GPT-4o, Custom GPTs, and full memory features. High speed, no throttle.",
    price: 15,
    category: "AI",
    stock: "High Stock",
    badge: "Most Popular",
    iconName: "Brain"
  },
  {
    id: "claude_pro",
    title: "Claude 3.5 Pro Private Profile",
    desc: "High-tier premium rate limits, superb code generation, private workspaces, and projects support.",
    price: 18,
    category: "AI",
    stock: "Limited Stock",
    badge: "Dev Favourite",
    iconName: "Cpu"
  },
  {
    id: "gemini_adv",
    title: "Gemini Advanced Ultra Slot",
    desc: "2M Token context size, Google Workspace integrations, ultra-fast reasoning with deep search access.",
    price: 12,
    category: "AI",
    stock: "In Stock",
    badge: "Fast Reasoning",
    iconName: "Sparkles"
  },
  {
    id: "midjourney",
    title: "Midjourney Premium Shared Slot",
    desc: "Access the absolute best AI image generation system. Private channels and relax/fast mode hours.",
    price: 16,
    category: "AI",
    stock: "In Stock",
    badge: "Creative Power",
    iconName: "Sparkles"
  },
  {
    id: "perplexity_pro",
    title: "Perplexity Pro Copilot Key",
    desc: "AI search companion with Copilot, Opus/GPT-4 models, file uploads, and academic research depth.",
    price: 14,
    category: "AI",
    stock: "15 Keys Left",
    badge: "Research Guru",
    iconName: "Search"
  },
  {
    id: "canva_pro",
    title: "Canva Pro Team Lifetime Slot",
    desc: "Instant unlock of premium assets, templates, brand kits, AI magic studio tools, and high-res exports.",
    price: 9,
    category: "AI",
    stock: "High Stock",
    badge: "Lifetime Team",
    iconName: "Cpu"
  },
  {
    id: "nordvpn",
    title: "NordVPN Premium (1 Year)",
    desc: "Dedicated high bandwidth secure tunnel, double VPN hop, Threat Protection, 90+ countries.",
    price: 10,
    category: "VPN",
    stock: "In Stock",
    badge: "Mil-Grade Security",
    iconName: "Shield"
  },
  {
    id: "expressvpn",
    title: "ExpressVPN Private Key",
    desc: "Lightway protocol support, unthrottled global streaming unlock, safe and private config files.",
    price: 14,
    category: "VPN",
    stock: "Few Left",
    badge: "Max Speeds",
    iconName: "Globe"
  },
  {
    id: "surfshark",
    title: "Surfshark VPN Unlimited Devices",
    desc: "Bypass censors, secure multi-hop links, premium clean web protection. Infinite concurrent devices.",
    price: 11,
    category: "VPN",
    stock: "High Stock",
    badge: "Unlimited Conn",
    iconName: "Shield"
  },
  {
    id: "protonvpn",
    title: "ProtonVPN Plus Private Route",
    desc: "Swiss-based maximum privacy architecture, NetShield adblocker, Tor over VPN, uncompromised speed.",
    price: 12,
    category: "VPN",
    stock: "Limited Keys",
    badge: "Swiss Privacy",
    iconName: "Shield"
  },
  {
    id: "cyberghost",
    title: "CyberGhost Premium Safe Key",
    desc: "Stream and game unthrottled with 10Gbps high-performance dedicated nodes, automatic Wi-Fi defense.",
    price: 9,
    category: "VPN",
    stock: "High Stock",
    badge: "Streaming King",
    iconName: "Shield"
  },
  {
    id: "netflix_4k",
    title: "Netflix Ultra HD 4K (1 Screen)",
    desc: "Dedicated personal screen with custom PIN, 4K HDR playback support, Dolby Atmos sound.",
    price: 15,
    category: "OTT",
    stock: "In Stock",
    badge: "4K UHD Stream",
    iconName: "Tv"
  },
  {
    id: "spotify_fam",
    title: "Spotify Premium Family Link",
    desc: "No-ad background high fidelity streams, offline downloads, separate personal library playlists.",
    price: 8,
    category: "OTT",
    stock: "High Stock",
    badge: "Lossless Audio",
    iconName: "Music"
  },
  {
    id: "youtube_premium",
    title: "YouTube Premium (No Ads)",
    desc: "Complete ad-free global YouTube & Music streaming with background playback and high-bitrate offline play.",
    price: 7,
    category: "OTT",
    stock: "Instant Delivery",
    badge: "No Ad Interruption",
    iconName: "Tv"
  },
  {
    id: "amazon_prime",
    title: "Amazon Prime Video 4K UHD",
    desc: "Stream highly rated Amazon Originals, live sports, premium movies in 4K with Dolby digital surround.",
    price: 8,
    category: "OTT",
    stock: "High Stock",
    badge: "Amazon Originals",
    iconName: "Tv"
  },
  {
    id: "disney_plus",
    title: "Disney+ Premium 4K UHD",
    desc: "Watch Pixar, Marvel, Star Wars, National Geographic in stunning 4K HDR with up to 4 parallel streams.",
    price: 10,
    category: "OTT",
    stock: "Few Left",
    badge: "Marvel & StarWars",
    iconName: "Tv"
  },
  {
    id: "apple_tv",
    title: "Apple TV+ High-Res Profile",
    desc: "Breathtaking premium Apple Original drama series, movies, and family shows in premium high-bitrate HDR.",
    price: 8,
    category: "OTT",
    stock: "In Stock",
    badge: "Apple Originals",
    iconName: "Tv"
  },
  {
    id: "ig_aged_pva",
    title: "Aged Instagram PVA Account",
    desc: "High quality phone verified account created in 2022/2023. Real post feed, completely warmed.",
    price: 25,
    category: "Instagram",
    stock: "2 Left Today",
    badge: "Aged History",
    iconName: "Instagram"
  },
  {
    id: "ig_followers_10k",
    title: "Instagram 10K High Quality Fans",
    desc: "Instant organic follower expansion. High retention, authentic profiles with active daily posts.",
    price: 35,
    category: "Instagram",
    stock: "Instant Delivery",
    badge: "Viral Growth",
    iconName: "TrendingUp"
  },
  {
    id: "telegram_premium",
    title: "Telegram Premium (1 Year Gift)",
    desc: "Double limits, exclusive active emojis, voice-to-text transcript, premium badges, and 4GB cloud storage.",
    price: 22,
    category: "Instagram",
    stock: "In Stock",
    badge: "Fast Delivery",
    iconName: "TrendingUp"
  },
  {
    id: "twitter_pva",
    title: "Twitter/X Phone Verified Account",
    desc: "Highly-secure phone-verified X account, completely established. Ideal for branding, API testing or bots.",
    price: 20,
    category: "Instagram",
    stock: "Limited Batch",
    badge: "Secure PVA",
    iconName: "TrendingUp"
  },
  {
    id: "tiktok_pva",
    title: "TikTok High Authority PVA",
    desc: "Established TikTok account with bypass verification, instant creator fund eligible, warmed algorithms.",
    price: 18,
    category: "Instagram",
    stock: "8 Left Today",
    badge: "Authority Profile",
    iconName: "TrendingUp"
  }
];

export default function ShopTab() {
  const [activeTab, setActiveTab] = useState<"explore" | "vault">("explore");
  const [credits, setCredits] = useState<number>(0);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [buyingProductId, setBuyingProductId] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<Purchase | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<Product | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewingCredentials, setViewingCredentials] = useState<Purchase | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedModal, setCopiedModal] = useState(false);

  // Category Shelf Modal states
  const [activeCategoryModal, setActiveCategoryModal] = useState<"AI" | "VPN" | "OTT" | "Instagram" | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  // New filtered store states
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "AI" | "VPN" | "OTT" | "Instagram">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Default selected products in each category for the interactive detail viewer
  const [selectedAI, setSelectedAI] = useState<Product>(PRODUCTS[0]);
  const [selectedVPN, setSelectedVPN] = useState<Product>(PRODUCTS[6]);
  const [selectedOTT, setSelectedOTT] = useState<Product>(PRODUCTS[11]);
  const [selectedIG, setSelectedIG] = useState<Product>(PRODUCTS[17]);

  // Track currently active visual panel for purchasing details
  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);

  const telegramId = localStorage.getItem("aerox_tg_id") || "5834920194";

  // Fetch user credit balance
  const fetchUserCredits = async () => {
    try {
      const apiUrl = getAbsoluteUrl(`/api/user-profile?telegramId=${encodeURIComponent(telegramId)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  };

  // Fetch purchase history
  const fetchPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const apiUrl = getAbsoluteUrl(`/api/shop/purchases?telegramId=${encodeURIComponent(telegramId)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
      }
    } catch (err) {
      console.error("Failed to fetch purchases", err);
    } finally {
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    fetchUserCredits();
    fetchPurchases();
  }, [telegramId]);

  const handleBuyProduct = async (product: Product) => {
    setErrorMsg(null);
    setBuyingProductId(product.id);
    setShowConfirmModal(null);

    try {
      const apiUrl = getAbsoluteUrl("/api/shop/buy");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          productTitle: product.title,
          productCategory: product.category,
          price: product.price
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Purchase failed");
      }

      setCredits(data.updatedCredits);
      setPurchaseSuccess(data.purchase);
      setPurchases((prev) => [data.purchase, ...prev]);

      // Fire a custom profile update event to keep header in sync immediately
      window.dispatchEvent(new CustomEvent("aerox_profile_updated", {
        detail: { credits: data.updatedCredits }
      }));

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setBuyingProductId(null);
    }
  };

  const copyToClipboard = (text: string, id: number | null = null) => {
    navigator.clipboard.writeText(text);
    if (id !== null) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedModal(true);
      setTimeout(() => setCopiedModal(false), 2000);
    }
  };

  const PRODUCT_ICONS: Record<string, string> = {
    gpt_plus: "simple-icons:openai",
    claude_pro: "simple-icons:anthropic",
    gemini_adv: "simple-icons:googlegemini",
    midjourney: "simple-icons:stabilityai",
    perplexity_pro: "simple-icons:perplexity",
    canva_pro: "simple-icons:canva",
    nordvpn: "simple-icons:nordvpn",
    expressvpn: "simple-icons:expressvpn",
    surfshark: "simple-icons:surfshark",
    protonvpn: "simple-icons:protonvpn",
    cyberghost: "simple-icons:cyberghost",
    netflix_4k: "simple-icons:netflix",
    spotify_fam: "simple-icons:spotify",
    youtube_premium: "simple-icons:youtube",
    amazon_prime: "simple-icons:primevideo",
    disney_plus: "simple-icons:disneyplus",
    apple_tv: "simple-icons:appletv",
    ig_aged_pva: "simple-icons:instagram",
    ig_followers_10k: "simple-icons:instagram",
    telegram_premium: "simple-icons:telegram",
    twitter_pva: "simple-icons:x",
    tiktok_pva: "simple-icons:tiktok",
    
    // Fallback names corresponding to product iconNames
    Brain: "simple-icons:openai",
    Cpu: "simple-icons:anthropic",
    Sparkles: "simple-icons:googlegemini",
    Shield: "simple-icons:nordvpn",
    Globe: "simple-icons:expressvpn",
    Tv: "simple-icons:netflix",
    Music: "simple-icons:spotify",
    Instagram: "simple-icons:instagram",
    TrendingUp: "simple-icons:telegram"
  };

  const BRAND_COLORS: Record<string, { bg: string; text: string }> = {
    gpt_plus: { bg: "#10a37f", text: "#ffffff" },
    claude_pro: { bg: "#d97753", text: "#ffffff" },
    gemini_adv: { bg: "#1a1a24", text: "#38bdf8" },
    midjourney: { bg: "#040a18", text: "#e2b857" },
    perplexity_pro: { bg: "#13343b", text: "#22c55e" },
    canva_pro: { bg: "#7d2ae8", text: "#ffffff" },
    nordvpn: { bg: "#0b2265", text: "#ffffff" },
    expressvpn: { bg: "#e1242c", text: "#ffffff" },
    surfshark: { bg: "#0057ff", text: "#ffffff" },
    protonvpn: { bg: "#1a1235", text: "#6d4aff" },
    cyberghost: { bg: "#ffcc00", text: "#1e1e1e" },
    netflix_4k: { bg: "#000000", text: "#e50914" },
    spotify_fam: { bg: "#121212", text: "#1db954" },
    youtube_premium: { bg: "#212121", text: "#ff0000" },
    amazon_prime: { bg: "#151a21", text: "#00a8e1" },
    disney_plus: { bg: "#090979", text: "#ffffff" },
    apple_tv: { bg: "#1c1c1e", text: "#ffffff" },
    ig_aged_pva: { bg: "#e1306c", text: "#ffffff" },
    ig_followers_10k: { bg: "#fd5949", text: "#ffffff" },
    telegram_premium: { bg: "#229ed9", text: "#ffffff" },
    twitter_pva: { bg: "#000000", text: "#ffffff" },
    tiktok_pva: { bg: "#010101", text: "#25f4ee" },

    // Fallbacks
    Brain: { bg: "#10a37f", text: "#ffffff" },
    Cpu: { bg: "#d97753", text: "#ffffff" },
    Sparkles: { bg: "#1a1a24", text: "#38bdf8" },
    Shield: { bg: "#0b2265", text: "#ffffff" },
    Globe: { bg: "#e1242c", text: "#ffffff" },
    Tv: { bg: "#000000", text: "#e50914" },
    Music: { bg: "#121212", text: "#1db954" },
    Instagram: { bg: "#e1306c", text: "#ffffff" },
    TrendingUp: { bg: "#229ed9", text: "#ffffff" }
  };

  const getIcon = (nameOrId: string, active: boolean = false, sizeClass?: string) => {
    const iconSlug = PRODUCT_ICONS[nameOrId] || "simple-icons:simpleicons";
    const colors = BRAND_COLORS[nameOrId] || { bg: "#1e293b", text: "#94a3b8" };
    
    // Premium iOS style rounded squircle icon layout with equal, proportionate padding
    const containerClass = `${sizeClass || "w-11 h-11"} rounded-[22%] flex items-center justify-center overflow-hidden transition-all duration-300 shadow-md shrink-0 p-1.5 ${
      active ? "scale-105" : "hover:scale-105 opacity-90 hover:opacity-100"
    }`;

    return (
      <div 
        className={containerClass} 
        style={{ 
          backgroundColor: colors.bg,
          color: colors.text
        }}
      >
        <Icon 
          icon={iconSlug} 
          className="w-full h-full object-contain" 
        />
      </div>
    );
  };

  const aiProducts = PRODUCTS.filter(p => p.category === "AI");
  const vpnProducts = PRODUCTS.filter(p => p.category === "VPN");
  const ottProducts = PRODUCTS.filter(p => p.category === "OTT");
  const igProducts = PRODUCTS.filter(p => p.category === "Instagram");

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col gap-4 p-4 min-h-[85vh] select-none text-left">
      {/* Premium Header */}
      <div id="shop-header" className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
        <div>
          <span className="font-sans font-black tracking-widest text-base bg-clip-text text-transparent bg-gradient-to-r from-[#00b4ff] via-[#00d0ff] to-[#00e4ff] block uppercase">
            AeroX Shop Vault
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono mt-0.5">
            PREMIUM LICENSES & DIRECT DISPATCH
          </span>
        </div>
        {/* Dynamic Credits Display */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          <Coins className="w-3.5 h-3.5 text-[#00e4ff] animate-pulse" />
          <span className="text-[10px] font-black tracking-wider text-[#00e4ff] font-mono">
            {credits} CR
          </span>
        </div>
      </div>

      {/* Sub tabs: Explore Lobby vs Purchases Vault */}
      <div className="grid grid-cols-2 gap-1.5 bg-[#070a18]/70 p-1 rounded-xl border border-white/[0.03]">
        <button
          onClick={() => { setActiveTab("explore"); setErrorMsg(null); }}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === "explore"
              ? "bg-[#00b4ff]/10 border border-[#00b4ff]/20 text-[#00e4ff]"
              : "text-neutral-500 hover:text-neutral-300 border border-transparent"
          }`}
        >
          <ShoppingBag className="w-3 h-3" />
          Catalog Explore
        </button>
        <button
          onClick={() => { setActiveTab("vault"); fetchPurchases(); setErrorMsg(null); }}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === "vault"
              ? "bg-[#00b4ff]/10 border border-[#00b4ff]/20 text-[#00e4ff]"
              : "text-neutral-500 hover:text-neutral-300 border border-transparent"
          }`}
        >
          <History className="w-3 h-3" />
          My Vault ({purchases.length})
        </button>
      </div>

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-[10px] text-red-300 flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {activeTab === "explore" ? (
        <div className="flex flex-col gap-4 pb-24">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search premium services..."
              className="w-full pl-10 pr-12 py-2.5 bg-[#070a18]/50 border border-white/[0.04] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00e4ff]/35 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-[9px] font-black uppercase font-mono tracking-wider"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Scroller */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none select-none">
            {[
              { id: "ALL" as const, label: "All Items", icon: ShoppingBag },
              { id: "AI" as const, label: "AI & Dev", icon: Brain },
              { id: "OTT" as const, label: "OTT Media", icon: Tv },
              { id: "VPN" as const, label: "Secure VPN", icon: Shield },
              { id: "Instagram" as const, label: "Social PVA", icon: Instagram },
            ].map((cat) => {
              const IconComp = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap transition-all duration-300 border cursor-pointer ${
                    isSelected
                      ? "bg-[#00b4ff]/10 border-[#00b4ff]/20 text-[#00e4ff]"
                      : "bg-[#070a18]/45 border-white/[0.03] text-slate-400 hover:text-white"
                  }`}
                >
                  <IconComp className="w-3 h-3" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            {filteredProducts.map((p) => {
              const isSelected = activeDetailProduct?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActiveDetailProduct(p)}
                  className={`p-3.5 rounded-2xl bg-dark-card/40 border transition-all duration-300 flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                    isSelected
                      ? "border-[#00e4ff]/30 bg-[#0c1229]/60"
                      : "border-white/[0.03] hover:border-white/[0.08] hover:bg-[#080c18]/50"
                  }`}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#00b4ff]/2 rounded-full blur-2xl pointer-events-none group-hover:bg-[#00b4ff]/4 transition-colors" />

                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="p-1 bg-[#02040c]/80 rounded-xl border border-white/[0.03]">
                        {getIcon(p.id, isSelected, "w-10 h-10")}
                      </div>
                      
                      {p.badge && (
                        <span className="text-[7px] font-black tracking-wider text-[#00e4ff] bg-[#00e4ff]/5 px-2 py-0.5 rounded-full uppercase border border-[#00e4ff]/10 max-w-[90px] truncate">
                          {p.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-white block group-hover:text-[#00e4ff] transition-colors leading-snug">
                        {p.title}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal line-clamp-2">
                        {p.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.03]">
                    <div className="flex flex-col">
                      <span className="text-[7px] text-neutral-500 font-extrabold tracking-widest uppercase font-mono">VALUATION</span>
                      <span className="text-[10px] font-black text-[#00b4ff] font-mono flex items-center gap-0.5 mt-0.5">
                        <Coins className="w-2.5 h-2.5 text-[#00b4ff] shrink-0" />
                        {p.price} CR
                      </span>
                    </div>

                    <div className={`p-1.5 rounded-lg border transition-all duration-300 ${
                      isSelected 
                        ? "bg-[#00b4ff] border-transparent text-black" 
                        : "bg-white/5 border-white/[0.03] text-neutral-400 group-hover:text-white"
                    }`}>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-10 bg-white/[0.01] rounded-2xl border border-white/[0.02]">
                <Search className="w-7 h-7 text-neutral-600 mx-auto mb-2" />
                <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider font-mono">
                  No matches found
                </span>
              </div>
            )}
          </div>

          {/* Sliding Details Drawer Sheet */}
          <AnimatePresence>
            {activeDetailProduct && (
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-end justify-center p-0"
                onClick={() => setActiveDetailProduct(null)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 350 }}
                  className="w-full max-w-[480px] bg-[#070a18] border-t border-white/[0.08] rounded-t-[2rem] p-6 shadow-2xl flex flex-col gap-5 text-left relative z-50 pb-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Drag Indicator Bar */}
                  <div className="w-12 h-1 bg-white/10 rounded-full mx-auto -mt-2 mb-2" />

                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-[#02040c] rounded-2xl border border-white/[0.05]">
                        {getIcon(activeDetailProduct.id, true, "w-11 h-11")}
                      </div>
                      <div>
                        <span className="text-[8px] font-black tracking-widest text-[#00b4ff] uppercase font-mono block">
                          Secure Vault Licensing
                        </span>
                        <span className="text-xs font-black text-white block mt-0.5 leading-snug">
                          {activeDetailProduct.title}
                        </span>
                      </div>
                    </div>

                    <span className="text-[8px] font-bold tracking-widest text-[#00e4ff] bg-[#00e4ff]/8 px-2.5 py-1 rounded-full uppercase border border-[#00e4ff]/10 font-mono">
                      {activeDetailProduct.stock}
                    </span>
                  </div>

                  {/* Description & Specs block */}
                  <div className="flex flex-col gap-3">
                    <div className="p-4 bg-[#02040c]/60 rounded-2xl border border-white/[0.03] text-xs text-slate-400 leading-relaxed font-sans">
                      {activeDetailProduct.desc}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-[#02040c]/40 border border-white/[0.03] rounded-xl flex flex-col">
                        <span className="text-[7.5px] text-neutral-500 font-bold uppercase tracking-wider font-mono">Dispatch Speed</span>
                        <span className="text-[10px] text-white font-extrabold mt-0.5 uppercase tracking-wide">Instant Delivery</span>
                      </div>
                      <div className="p-3 bg-[#02040c]/40 border border-[#00b4ff]/10 rounded-xl flex flex-col">
                        <span className="text-[7.5px] text-[#00e4ff]/60 font-bold uppercase tracking-wider font-mono">Account Type</span>
                        <span className="text-[10px] text-[#00e4ff] font-extrabold mt-0.5 uppercase tracking-wide">Fully Secured</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer pricing & authorization checkout */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.04] mt-2">
                    <div className="flex flex-col">
                      <span className="text-[7.5px] text-neutral-500 uppercase tracking-widest font-black font-mono">Authoritative Price</span>
                      <span className="text-sm font-black text-[#00b4ff] font-mono flex items-center gap-1 mt-0.5">
                        <Coins className="w-4 h-4 text-[#00b4ff]" />
                        {activeDetailProduct.price} CR
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveDetailProduct(null)}
                        className="px-4 py-2.5 rounded-xl border border-white/[0.05] bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => {
                          setShowConfirmModal(activeDetailProduct);
                          setActiveDetailProduct(null);
                        }}
                        disabled={buyingProductId !== null}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#007aff] to-[#00e4ff] text-black text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-[0_4px_12px_rgba(0,228,255,0.15)] hover:shadow-[0_4px_20px_rgba(0,228,255,0.25)]"
                      >
                        Deploy Slot
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      ) : (
        /* My Vault Tab */
        <div className="flex flex-col gap-4 pb-20">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-neutral-300 font-black tracking-widest uppercase font-mono">
              Secured Purchases Archive
            </span>
          </div>

          {loadingPurchases ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-5 h-5 text-purple-500 animate-spin" />
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                Unlocking Vault Archives...
              </span>
            </div>
          ) : purchases.length > 0 ? (
            <div className="flex flex-col gap-3">
              {purchases.map((pur) => (
                <div 
                  key={pur.id}
                  className="p-4 rounded-xl bg-slate-950/50 border border-white/[0.04] hover:border-purple-500/20 transition-all duration-200 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const matchedProduct = PRODUCTS.find(p => p.title === pur.productTitle);
                        return matchedProduct ? getIcon(matchedProduct.id, true, "w-9 h-9") : null;
                      })()}
                      <div>
                        <span className="text-[9px] font-bold text-neutral-400 bg-slate-900 px-2 py-0.5 rounded border border-white/[0.03] uppercase">
                          {pur.productCategory}
                        </span>
                        <span className="text-xs font-bold text-neutral-100 block mt-1.5">
                          {pur.productTitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-mono">Cost Paid</span>
                      <span className="text-xs font-black text-purple-300 font-mono mt-0.5">
                        {pur.productPrice} CR
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.03]">
                    <span className="text-[9px] text-neutral-500 font-mono font-bold uppercase">
                      Unlocked: {new Date(pur.purchasedAt).toLocaleDateString()}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(pur.credentials, pur.id)}
                        className="p-1.5 rounded bg-slate-900 border border-white/[0.04] text-neutral-400 hover:text-white transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1"
                        title="Copy credentials block"
                      >
                        {copiedId === pur.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400 text-[8px] uppercase">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[8px] uppercase">Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setViewingCredentials(pur)}
                        className="px-2.5 py-1.5 rounded bg-purple-900/30 border border-purple-500/20 text-purple-300 hover:bg-purple-900/50 transition-all text-[8px] font-black tracking-wider uppercase cursor-pointer"
                      >
                        Open Keys
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-white/[0.04] rounded-2xl bg-slate-950/20">
              <ShoppingBag className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
              <span className="text-neutral-400 font-black tracking-widest text-xs block uppercase">
                YOUR VAULT IS VACANT
              </span>
              <span className="text-[10px] text-neutral-500 block mt-1.5 px-4">
                Redeem codes inside the Profile tab to charge your credits and unlock subscriptions!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Purchase Drawer Dialog */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-dark-card border border-white/[0.08] rounded-t-3xl p-6 shadow-2xl flex flex-col gap-4 text-left"
            >
              <div className="flex justify-between items-start pb-2 border-b border-white/[0.03]">
                <div>
                  <span className="text-[9px] text-purple-400 font-black tracking-widest uppercase font-mono block">
                    Secured Purchase Authorization
                  </span>
                  <span className="text-sm font-black text-neutral-100 block mt-0.5">
                    {showConfirmModal.title}
                  </span>
                </div>
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="p-1 rounded-full bg-slate-900 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.03] text-[11px] text-neutral-400 leading-relaxed">
                {showConfirmModal.desc}
              </div>

              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-white/[0.03] font-mono">
                <div className="flex flex-col">
                  <span className="text-[8px] text-neutral-500 uppercase tracking-widest">PRODUCT PRICE</span>
                  <span className="text-xs font-black text-purple-300">
                    {showConfirmModal.price} Credits
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-neutral-500 uppercase tracking-widest">YOUR BALANCE</span>
                  <span className="text-xs font-black text-neutral-300">
                    {credits} Credits
                  </span>
                </div>
              </div>

              {credits < showConfirmModal.price && (
                <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-[10px] text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    Insufficient credits! You need {showConfirmModal.price - credits} more credits. Go to Profile &gt; Redeem Codes.
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.05] bg-slate-900 hover:bg-slate-800 text-neutral-300 text-xs font-black tracking-widest uppercase transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBuyProduct(showConfirmModal)}
                  disabled={credits < showConfirmModal.price}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black tracking-widest uppercase transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                >
                  Authorize Buy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Purchase Success Keys Modal */}
      <AnimatePresence>
        {purchaseSuccess && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-dark-card border border-purple-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col gap-4 text-left"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="text-sm font-black tracking-widest text-emerald-400 uppercase font-mono mt-1">
                  VAULT KEY GENERATED
                </span>
                <span className="text-xs text-neutral-300 font-bold">
                  {purchaseSuccess.productTitle}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-mono">
                  Premium Credentials & Key Block
                </span>
                <div className="p-3 bg-slate-950 rounded-xl border border-white/[0.05] text-[10px] text-indigo-200 font-mono leading-relaxed whitespace-pre-wrap select-text break-all">
                  {purchaseSuccess.credentials}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => copyToClipboard(purchaseSuccess.credentials)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 border border-white/[0.05] hover:bg-slate-800 text-neutral-300 text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedModal ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copiedModal ? "COPIED!" : "COPY KEYS"}
                </button>
                <button
                  onClick={() => { setPurchaseSuccess(null); setActiveTab("vault"); }}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black tracking-widest uppercase transition-all text-center cursor-pointer"
                >
                  Close Key
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Viewing Credentials Modal (for past purchases) */}
      <AnimatePresence>
        {viewingCredentials && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-dark-card border border-white/[0.08] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left"
            >
              <div className="flex justify-between items-start pb-2 border-b border-white/[0.03]">
                <div>
                  <span className="text-[9px] text-neutral-400 font-black tracking-widest uppercase font-mono block">
                    Unlocked Credentials
                  </span>
                  <span className="text-xs font-black text-neutral-200 block mt-0.5">
                    {viewingCredentials.productTitle}
                  </span>
                </div>
                <button
                  onClick={() => setViewingCredentials(null)}
                  className="p-1 rounded-full bg-slate-900 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-mono">
                  Credentials & Key Block
                </span>
                <div className="p-3 bg-slate-950 rounded-xl border border-white/[0.05] text-[10px] text-indigo-200 font-mono leading-relaxed whitespace-pre-wrap select-text break-all">
                  {viewingCredentials.credentials}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => copyToClipboard(viewingCredentials.credentials)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 border border-white/[0.05] hover:bg-slate-800 text-neutral-300 text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedModal ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copiedModal ? "COPIED!" : "COPY KEYS"}
                </button>
                <button
                  onClick={() => setViewingCredentials(null)}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black tracking-widest uppercase transition-all text-center cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Shelf Modal */}
      <AnimatePresence>
        {activeCategoryModal && (() => {
          const cat = activeCategoryModal;
          const filtered = PRODUCTS.filter(p => p.category === cat && 
            (p.title.toLowerCase().includes(modalSearchQuery.toLowerCase()) || 
             p.desc.toLowerCase().includes(modalSearchQuery.toLowerCase()))
          );
          
          return (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-end justify-center z-50 p-4">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 320 }}
                className="w-full max-w-md bg-dark-card border border-white/[0.08] rounded-t-3xl p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[85vh]"
              >
                {/* Header */}
                <div className="flex justify-between items-center pb-2 border-b border-white/[0.03]">
                  <div>
                    <span className="text-[9px] text-purple-400 font-black tracking-widest uppercase font-mono block">
                      Explore All Options
                    </span>
                    <span className="text-sm font-black text-white block mt-0.5">
                      {cat === "AI" ? "AI Subscriptions" : cat === "VPN" ? "VPN Protocols" : cat === "OTT" ? "OTT Subscriptions" : "Instagram & PVA"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveCategoryModal(null);
                      setModalSearchQuery("");
                    }}
                    className="p-1.5 rounded-full bg-slate-900 text-neutral-400 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    placeholder={`Search ${cat}...`}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/[0.06] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50 transition-all font-mono"
                  />
                  {modalSearchQuery && (
                    <button
                      onClick={() => setModalSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-[10px] font-bold uppercase font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Grid list of category products */}
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[45vh] pr-1 scrollbar-thin">
                  {filtered.length > 0 ? (
                    filtered.map((p) => {
                      // Check if selected currently
                      const isSelected = 
                        cat === "AI" ? selectedAI.id === p.id :
                        cat === "VPN" ? selectedVPN.id === p.id :
                        cat === "OTT" ? selectedOTT.id === p.id :
                        selectedIG.id === p.id;

                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            if (cat === "AI") setSelectedAI(p);
                            else if (cat === "VPN") setSelectedVPN(p);
                            else if (cat === "OTT") setSelectedOTT(p);
                            else setSelectedIG(p);
                            
                            setActiveDetailProduct(p);
                            setActiveCategoryModal(null);
                            setModalSearchQuery("");
                          }}
                          className={`p-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-all duration-300 group cursor-pointer ${
                            isSelected 
                              ? "bg-white/10 border border-white/15 shadow-sm" 
                              : "bg-slate-950/40 hover:bg-slate-900/40 border border-white/[0.02] hover:border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {getIcon(p.id, isSelected, "w-11 h-11")}
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-neutral-100 block truncate group-hover:text-purple-300 transition-colors">
                                {p.title}
                              </span>
                              <span className="text-[9px] text-neutral-400 block truncate font-mono mt-0.5">
                                {p.stock} • {p.badge}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-mono">Price</span>
                            <span className="text-[11px] font-black text-purple-300 font-mono">
                              {p.price} CR
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-10">
                      <span className="text-xs text-neutral-500 font-bold block uppercase tracking-wider font-mono">
                        No matches found
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
