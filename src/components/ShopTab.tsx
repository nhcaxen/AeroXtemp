import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, Cpu, Sparkles, Shield, Globe, Tv, Music, Instagram, 
  TrendingUp, ShoppingBag, History, Key, Check, Copy, 
  ExternalLink, RefreshCw, AlertCircle, Coins, Search, Filter,
  CheckCircle2, ArrowRight, ArrowUpRight, Lock, X, Info,
  Bot, Terminal, Store, Send, Plus, Trash2, Edit, Award, Star, 
  Clock, AlertTriangle, MessageSquare, CheckSquare, Bell
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

export default function ShopTab({ userRole: initialUserRole }: { userRole?: string } = {}) {
  const [activeTab, setActiveTab] = useState<"explore" | "vault" | "marketplace">("marketplace");
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
  const [selectedCategory, setSelectedCategory] = useState<"AI" | "VPN" | "OTT" | "Instagram">("AI");
  const [searchQuery, setSearchQuery] = useState("");

  // Default selected products in each category for the interactive detail viewer
  const [selectedAI, setSelectedAI] = useState<Product>(PRODUCTS[0]);
  const [selectedVPN, setSelectedVPN] = useState<Product>(PRODUCTS[6]);
  const [selectedOTT, setSelectedOTT] = useState<Product>(PRODUCTS[11]);
  const [selectedIG, setSelectedIG] = useState<Product>(PRODUCTS[17]);

  // Track currently active visual panel for purchasing details
  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);

  const telegramId = localStorage.getItem("aerox_tg_id") || "5834920194";

  // ==========================================
  //          AEROX MARKETPLACE STATES
  // ==========================================
  const [userRole, setUserRole] = useState<string>(initialUserRole || "free");
  const [username, setUsername] = useState<string>("Anonymous_User");
  const [marketSubTab, setMarketSubTab] = useState<"buyer" | "seller" | "admin">("buyer");

  // Application
  const [sellerApp, setSellerApp] = useState<any>(null);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appStoreName, setAppStoreName] = useState("");
  const [appTelegramUsername, setAppTelegramUsername] = useState("");
  const [appStoreLogo, setAppStoreLogo] = useState("");
  const [appStoreDescription, setAppStoreDescription] = useState("");
  const [appCryptoWallet, setAppCryptoWallet] = useState("");
  const [appProductsToSell, setAppProductsToSell] = useState("");

  // Buyer View
  const [marketProducts, setMarketProducts] = useState<any[]>([]);
  const [marketSearchQuery, setMarketSearchQuery] = useState("");
  const [selectedMarketProduct, setSelectedMarketProduct] = useState<any | null>(null);
  const [checkoutOffering, setCheckoutOffering] = useState<any | null>(null);
  const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderActionLoading, setOrderActionLoading] = useState(false);

  // Rating forms
  const [rateRating, setRateRating] = useState<number>(5);
  const [rateReview, setRateReview] = useState<string>("");

  // Seller View
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [sellerStats, setSellerStats] = useState<any>(null);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState<any | null>(null);

  // Catalog + Listings state
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<any | null>(null);
  const [showRequestProductModal, setShowRequestProductModal] = useState(false);
  const [reqProductName, setReqProductName] = useState("");
  const [reqProductCategory, setReqProductCategory] = useState("AI");
  const [reqProductDescription, setReqProductDescription] = useState("");
  const [reqProductBrand, setReqProductBrand] = useState("");
  const [reqProductWebsite, setReqProductWebsite] = useState("");

  // Listing inputs
  const [listPrice, setListPrice] = useState("");
  const [listStock, setListStock] = useState("10");
  const [listDeliveryTime, setListDeliveryTime] = useState("Instant");
  const [listNotes, setListNotes] = useState("");

  // Admin Catalog Management state
  const [adminCatalogProducts, setAdminCatalogProducts] = useState<any[]>([]);
  const [showAdminCatalogModal, setShowAdminCatalogModal] = useState(false);
  const [adminCatalogName, setAdminCatalogName] = useState("");
  const [adminCatalogCategory, setAdminCatalogCategory] = useState("AI");
  const [adminCatalogDescription, setAdminCatalogDescription] = useState("");
  const [adminCatalogBrand, setAdminCatalogBrand] = useState("");
  const [adminCatalogLogo, setAdminCatalogLogo] = useState("");
  const [adminCatalogStatus, setAdminCatalogStatus] = useState("active");
  const [editingAdminCatalogProduct, setEditingAdminCatalogProduct] = useState<any | null>(null);

  // Add/Edit Product inputs
  const [prodCategory, setProdCategory] = useState("AI");
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodLogo, setProdLogo] = useState("");
  const [prodStockStatus, setProdStockStatus] = useState("in_stock");
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Seller Settings Form
  const [showSellerSettings, setShowSellerSettings] = useState(false);
  const [settStoreName, setSettStoreName] = useState("");
  const [settStoreLogo, setSettStoreLogo] = useState("");
  const [settStoreDesc, setSettStoreDesc] = useState("");
  const [settWallet, setSettWallet] = useState("");
  const [settTgUser, setSettTgUser] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Admin Hub
  const [adminApps, setAdminApps] = useState<any[]>([]);
  const [adminSellers, setAdminSellers] = useState<any[]>([]);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  // Notifications
  const [marketNotifications, setMarketNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const isAdminRole = (role: string) => {
    const storedTgId = localStorage.getItem("aerox_tg_id");
    if (!storedTgId) return role === "owner";
    return role === "owner" || storedTgId === "5834920194" || storedTgId === "1817159548";
  };

  // Fetch user credit balance & role details
  const fetchUserCredits = async () => {
    try {
      const apiUrl = getAbsoluteUrl(`/api/user-profile?telegramId=${encodeURIComponent(telegramId)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits ?? 0);
        setUserRole(data.role ?? "free");
        setUsername(data.username ?? "Anonymous_User");
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

  // ==========================================
  //          MARKETPLACE API METHODS
  // ==========================================

  const fetchMarketplaceProducts = async () => {
    try {
      const apiUrl = getAbsoluteUrl("/api/marketplace/products/grouped");
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setMarketProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch marketplace products", err);
    }
  };

  const fetchApplicationStatus = async () => {
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/application-status?telegramId=${encodeURIComponent(telegramId)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setSellerApp(data.application);
      }
    } catch (err) {
      console.error("Failed to fetch application status", err);
    }
  };

  const fetchBuyerOrders = async () => {
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/orders/buyer?telegramId=${encodeURIComponent(telegramId)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setBuyerOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to fetch buyer orders", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/notifications?telegramId=${encodeURIComponent(telegramId)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setMarketNotifications(data.notifications || []);
        const unread = data.notifications.filter((n: any) => n.isRead === 0).length;
        setUnreadNotificationsCount(unread);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const apiUrl = getAbsoluteUrl("/api/marketplace/notifications/read");
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId })
      });
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error("Failed to read notifications", err);
    }
  };

  const fetchCatalogProducts = async () => {
    try {
      const apiUrl = getAbsoluteUrl("/api/marketplace/catalog/products");
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setCatalogProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch catalog products", err);
    }
  };

  const fetchAdminCatalogProducts = async () => {
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/admin/catalog/products?telegramId=${encodeURIComponent(telegramId)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setAdminCatalogProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin catalog products", err);
    }
  };

  const fetchSellerData = async () => {
    try {
      // Profile
      const profUrl = getAbsoluteUrl(`/api/marketplace/seller/profile?telegramId=${encodeURIComponent(telegramId)}`);
      const profRes = await fetch(profUrl);
      if (profRes.ok) {
        const profData = await profRes.json();
        setSellerProfile(profData.seller);
        if (profData.seller) {
          setSettStoreName(profData.seller.storeName);
          setSettStoreLogo(profData.seller.storeLogo || "");
          setSettStoreDesc(profData.seller.storeDescription);
          setSettWallet(profData.seller.cryptoWallet);
          setSettTgUser(profData.seller.telegramUsername);
        }
      }

      // Stats
      const statsUrl = getAbsoluteUrl(`/api/marketplace/seller/stats?telegramId=${encodeURIComponent(telegramId)}`);
      const statsRes = await fetch(statsUrl);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSellerStats(statsData.stats);
      }

      // Listings
      const listingsUrl = getAbsoluteUrl(`/api/marketplace/seller/listings?telegramId=${encodeURIComponent(telegramId)}`);
      const listingsRes = await fetch(listingsUrl);
      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setSellerProducts(listingsData.listings || []);
      }

      // Orders
      const ordsUrl = getAbsoluteUrl(`/api/marketplace/seller/orders?telegramId=${encodeURIComponent(telegramId)}`);
      const ordsRes = await fetch(ordsUrl);
      if (ordsRes.ok) {
        const ordsData = await ordsRes.json();
        setSellerOrders(ordsData.orders || []);
      }

      // Also load approved catalog products
      fetchCatalogProducts();
    } catch (err) {
      console.error("Failed to fetch seller data", err);
    }
  };

  const fetchAdminData = async () => {
    if (!isAdminRole(userRole)) return;
    try {
      // Applications
      const appsUrl = getAbsoluteUrl(`/api/marketplace/admin/applications?telegramId=${encodeURIComponent(telegramId)}`);
      const appsRes = await fetch(appsUrl);
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setAdminApps(appsData.applications || []);
      }

      // Sellers
      const selUrl = getAbsoluteUrl(`/api/marketplace/admin/sellers?telegramId=${encodeURIComponent(telegramId)}`);
      const selRes = await fetch(selUrl);
      if (selRes.ok) {
        const selData = await selRes.json();
        setAdminSellers(selData.sellers || []);
      }

      // Orders
      const ordUrl = getAbsoluteUrl(`/api/marketplace/admin/orders?telegramId=${encodeURIComponent(telegramId)}`);
      const ordRes = await fetch(ordUrl);
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setAdminOrders(ordData.orders || []);
      }

      // Stats
      const statsUrl = getAbsoluteUrl(`/api/marketplace/admin/stats?telegramId=${encodeURIComponent(telegramId)}`);
      const statsRes = await fetch(statsUrl);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAdminStats(statsData.stats);
      }

      // Fetch all catalog products for Admin
      fetchAdminCatalogProducts();
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
  };

  // Seller Apply handler
  const handleApplyAsSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appStoreName || !appTelegramUsername || !appStoreDescription || !appProductsToSell) {
      setErrorMsg("Please fill in all application fields");
      return;
    }
    setSubmittingApp(true);
    setErrorMsg(null);
    try {
      const apiUrl = getAbsoluteUrl("/api/marketplace/apply");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          username,
          storeName: appStoreName,
          telegramUsername: appTelegramUsername,
          storeLogo: appStoreLogo,
          storeDescription: appStoreDescription,
          cryptoWallet: "N/A",
          productsToSell: appProductsToSell
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }
      setAppStoreName("");
      setAppTelegramUsername("");
      setAppStoreLogo("");
      setAppStoreDescription("");
      setAppCryptoWallet("");
      setAppProductsToSell("");
      fetchApplicationStatus();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingApp(false);
    }
  };

  // Request Catalog Product handler
  const handleRequestProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqProductName || !reqProductCategory || !reqProductDescription) {
      setErrorMsg("Product name, category, and description are required");
      return;
    }
    setSubmittingProduct(true);
    setErrorMsg(null);
    try {
      const apiUrl = getAbsoluteUrl("/api/marketplace/seller/catalog/request");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          name: reqProductName,
          category: reqProductCategory,
          description: reqProductDescription,
          brand: reqProductBrand,
          website: reqProductWebsite
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }
      setReqProductName("");
      setReqProductCategory("AI");
      setReqProductDescription("");
      setReqProductBrand("");
      setReqProductWebsite("");
      setShowRequestProductModal(false);
      alert("Catalog product request submitted to admins for verification!");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Listing Add handler
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogProduct || !listPrice) {
      setErrorMsg("Catalog product and price are required");
      return;
    }
    setSubmittingProduct(true);
    setErrorMsg(null);
    try {
      const apiUrl = getAbsoluteUrl("/api/marketplace/seller/listings/add");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          productId: selectedCatalogProduct.id,
          price: listPrice,
          stock: listStock,
          deliveryTime: listDeliveryTime,
          notes: listNotes
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to list product");
      }
      setListPrice("");
      setListStock("10");
      setListDeliveryTime("Instant");
      setListNotes("");
      setSelectedCatalogProduct(null);
      setShowAddProductModal(false);
      fetchSellerData();
      fetchMarketplaceProducts();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Listing Edit handler
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditProductModal) return;
    setSubmittingProduct(true);
    setErrorMsg(null);
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/seller/listings/edit/${showEditProductModal.id}`);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          price: listPrice,
          stock: listStock,
          deliveryTime: listDeliveryTime,
          notes: listNotes,
          status: prodStockStatus === "in_stock" ? "active" : "inactive"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update listing");
      }
      setShowEditProductModal(null);
      fetchSellerData();
      fetchMarketplaceProducts();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Listing Delete handler
  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product listing?")) return;
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/seller/listings/${id}`);
      const res = await fetch(apiUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete listing");
      }
      fetchSellerData();
      fetchMarketplaceProducts();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Update seller store profile settings
  const handleUpdateSellerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setErrorMsg(null);
    try {
      const apiUrl = getAbsoluteUrl("/api/marketplace/seller/profile/update");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          storeName: settStoreName,
          storeLogo: settStoreLogo,
          storeDescription: settStoreDesc,
          cryptoWallet: settWallet,
          telegramUsername: settTgUser
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update store settings");
      }
      setShowSellerSettings(false);
      fetchSellerData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Admin action handler (approvals, toggles)
  const handleAdminApproveReject = async (appId: number, status: string) => {
    setAdminActionLoading(true);
    setErrorMsg(null);
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/admin/applications/${appId}/status`);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, status })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }
      fetchAdminData();
      fetchUserCredits();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleAdminVerifySeller = async (sellerId: number, currentVerified: boolean) => {
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/admin/sellers/${sellerId}/status`);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, isVerified: !currentVerified })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminSuspendActivateSeller = async (sellerId: number, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "active" ? "suspended" : "active";
      const apiUrl = getAbsoluteUrl(`/api/marketplace/admin/sellers/${sellerId}/status`);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, status: nextStatus })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminDeleteSeller = async (sellerId: number) => {
    if (!confirm("Are you sure you want to completely delete this seller? This will demote user and delete all their products!")) return;
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/admin/sellers/${sellerId}`);
      const res = await fetch(apiUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Buyer Order flow
  const handleBuyMarketplaceProduct = async (offering: any) => {
    setOrderActionLoading(true);
    setErrorMsg(null);
    try {
      const apiUrl = getAbsoluteUrl("/api/marketplace/orders/create");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerTelegramId: telegramId,
          buyerUsername: username,
          productId: offering.productId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Order creation failed");
      }
      setCheckoutOffering(null);
      setSelectedMarketProduct(null);
      fetchBuyerOrders();
      
      // View the created order details right away
      fetchOrderDetails(data.orderId);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setOrderActionLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/orders/${orderId}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
      }
    } catch (err) {
      console.error("Failed to load order details", err);
    }
  };

  // Order state update (accept, complete, dispute)
  const handleUpdateOrderStatus = async (orderId: string, status: string, dealLink?: string) => {
    setOrderActionLoading(true);
    setErrorMsg(null);
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/orders/${orderId}/update-status`);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          status,
          dealGroupLink: dealLink
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order");
      }
      fetchOrderDetails(orderId);
      fetchBuyerOrders();
      fetchSellerData();
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setOrderActionLoading(false);
    }
  };

  // Seller accept/reject deal response
  const handleSellerRespondOrder = async (orderId: string, action: "accept" | "reject") => {
    setOrderActionLoading(true);
    setErrorMsg(null);
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/orders/${orderId}/respond`);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, action })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to respond to order");
      }
      fetchSellerData();
      fetchOrderDetails(orderId);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setOrderActionLoading(false);
    }
  };

  // Rate deal
  const handleRateDeal = async (e: React.FormEvent, orderId: string) => {
    e.preventDefault();
    setOrderActionLoading(true);
    setErrorMsg(null);
    try {
      const apiUrl = getAbsoluteUrl(`/api/marketplace/orders/${orderId}/rate`);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          rating: rateRating,
          review: rateReview
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit rating");
      }
      setRateReview("");
      fetchOrderDetails(orderId);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setOrderActionLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCredits();
    fetchPurchases();
    
    // Core marketplace boots
    fetchMarketplaceProducts();
    fetchCatalogProducts();
    fetchApplicationStatus();
    fetchBuyerOrders();
    fetchNotifications();
  }, [telegramId]);

  useEffect(() => {
    if (activeTab === "marketplace") {
      fetchUserCredits();
      fetchMarketplaceProducts();
      fetchCatalogProducts();
      fetchApplicationStatus();
      fetchBuyerOrders();
      fetchNotifications();
      if (userRole === "seller" || isAdminRole(userRole)) {
        fetchSellerData();
      }
      if (isAdminRole(userRole)) {
        fetchAdminData();
      }
    }
  }, [activeTab, userRole]);

  useEffect(() => {
    if (initialUserRole) {
      setUserRole(initialUserRole);
    }
  }, [initialUserRole]);

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

  const renderMarketplace = () => {
    // Helper to get status colors
    const getStatusBadge = (status: string) => {
      switch (status) {
        case "pending":
          return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-wider">Pending</span>;
        case "waiting_payment":
          return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 uppercase tracking-wider">Waiting Pay</span>;
        case "delivering":
          return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 uppercase tracking-wider">Delivering</span>;
        case "completed":
          return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">Completed</span>;
        case "disputed":
          return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 uppercase tracking-wider">Disputed</span>;
        case "rejected":
          return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 border border-red-500/30 text-red-400 uppercase tracking-wider">Rejected</span>;
        case "suspended":
          return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-950/30 border border-red-500/30 text-red-300 uppercase tracking-wider">Suspended</span>;
        default:
          return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-500/10 border border-slate-500/30 text-slate-400 uppercase tracking-wider">{status}</span>;
      }
    };

    return (
      <div className="flex flex-col gap-4 pb-24 font-sans select-none text-left">
        
        {/* Marketplace Sub Tab Selector (Pill switcher style like Mail Tab) */}
        <div className="flex items-center justify-between gap-3 mb-2 mt-1">
          {/* Render the Mail-style Pill Container only if they have multiple subtabs, else show clean title */}
          {(userRole === "seller" || isAdminRole(userRole)) ? (
            <div className="flex bg-[#030612]/80 p-1 rounded-xl border border-white/[0.04] shrink-0 gap-1">
              <button
                onClick={() => { setMarketSubTab("buyer"); setErrorMsg(null); }}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                  marketSubTab === "buyer"
                    ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md font-extrabold border border-rose-500/20 shadow-rose-500/10"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                🛍️ Market
              </button>

              {userRole === "seller" && (
                <button
                  onClick={() => { setMarketSubTab("seller"); setErrorMsg(null); }}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                    marketSubTab === "seller"
                      ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md font-extrabold border border-rose-500/20 shadow-rose-500/10"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  🏪 Seller
                </button>
              )}

              {isAdminRole(userRole) && (
                <button
                  onClick={() => { setMarketSubTab("admin"); setErrorMsg(null); }}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                    marketSubTab === "admin"
                      ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md font-extrabold border border-rose-500/20 shadow-rose-500/10"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  👑 Admin
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <span className="text-base">🛍️</span>
              <span className="text-xs font-black tracking-widest text-white uppercase font-sans">AeroX Market</span>
            </div>
          )}

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                markNotificationsAsRead();
                setShowSellerSettings(false);
                setSelectedOrder(null);
                // Simple toggle for notification list visibility
                setErrorMsg(errorMsg === "notifications_shown" ? null : "notifications_shown");
              }}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer relative"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border border-dark-card text-[7px] font-black flex items-center justify-center text-black">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ==========================================
            NOTIFICATIONS DRAWER / BLOCK
            ========================================== */}
        {errorMsg === "notifications_shown" && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-slate-950/90 border border-white/10 rounded-2xl flex flex-col gap-3"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
              <span className="text-[10px] font-black tracking-widest text-white uppercase font-mono">
                MARKETPLACE ALERTS
              </span>
              <button 
                onClick={() => setErrorMsg(null)}
                className="text-[9px] text-neutral-500 hover:text-neutral-300 font-mono uppercase"
              >
                Close
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-[25vh] overflow-y-auto pr-1">
              {marketNotifications.length > 0 ? (
                marketNotifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-white/5 border border-white/[0.03] text-[10px] text-neutral-300 leading-relaxed flex items-start gap-2">
                    <span className="text-xs shrink-0 mt-0.5">🔔</span>
                    <div className="flex-1">
                      <p>{n.message}</p>
                      <span className="text-[8px] text-neutral-500 block font-mono mt-1">
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-[10px] text-neutral-500 font-bold uppercase tracking-wider font-mono">
                  No notifications yet
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ==========================================
            BUYER PERSPECTIVE 
            ========================================== */}
        {marketSubTab === "buyer" && (
          <div className="flex flex-col gap-4">
            
            {/* Inner Toggle: Shop vs Active Deals */}
            <div className="grid grid-cols-2 gap-1 bg-zinc-900/70 p-1 rounded-xl border border-white/[0.03]">
              <button
                onClick={() => { setSelectedMarketProduct(null); setCheckoutOffering(null); setSelectedOrder(null); }}
                className={`py-2 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer text-center ${
                  !selectedOrder
                    ? "bg-[#0a0304] border border-rose-500/30 text-rose-300 font-extrabold shadow-[0_0_15px_rgba(244,63,94,0.08)]"
                    : "border border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                🛍️ Browse Products
              </button>
              <button
                onClick={() => {
                  fetchBuyerOrders();
                  if (buyerOrders.length > 0) {
                    setSelectedOrder(buyerOrders[0]);
                  } else {
                    setSelectedOrder(null);
                    setErrorMsg("You have no active or historical orders placed.");
                  }
                }}
                className={`py-2 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedOrder
                    ? "bg-[#0a0304] border border-rose-500/30 text-rose-300 font-extrabold shadow-[0_0_15px_rgba(244,63,94,0.08)]"
                    : "border border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                📦 My Deals ({buyerOrders.length})
              </button>
            </div>

            {/* CASE 1: Active Order Details Screen */}
            {selectedOrder ? (
              <div className="flex flex-col gap-4 bg-slate-950/40 p-4 border border-white/[0.04] rounded-2xl">
                
                {/* Order Header */}
                <div className="flex justify-between items-start pb-2 border-b border-white/[0.04]">
                  <div>
                    <span className="text-[8px] text-neutral-500 font-black tracking-widest uppercase font-mono block">
                      SECURED ESCROW DEAL
                    </span>
                    <span className="text-xs font-black text-white mt-0.5 block">
                      ID: {selectedOrder.id.substring(0, 8).toUpperCase()}...
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    {getStatusBadge(selectedOrder.status)}
                    <span className="text-[9px] font-black text-white mt-1 font-mono">
                      ₹{selectedOrder.productPrice}
                    </span>
                  </div>
                </div>

                {/* Product Box */}
                <div className="p-3 bg-white/5 border border-white/[0.03] rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-mono block">Product</span>
                    <span className="text-xs font-bold text-white mt-0.5 block">{selectedOrder.productName}</span>
                    <span className="text-[9px] text-slate-400 block font-mono mt-0.5">Category: {selectedOrder.productCategory}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-mono block">Seller</span>
                    <span className="text-xs font-bold text-zinc-300 block mt-0.5">@{selectedOrder.sellerUsername || "Anonymous"}</span>
                  </div>
                </div>

                {/* Status Timeline Info */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-white/[0.03] text-[10px] text-neutral-400 leading-relaxed flex flex-col gap-2">
                  <span className="text-[8px] text-neutral-500 uppercase font-black tracking-wider">Escrow Guidelines</span>
                  
                  {selectedOrder.status === "pending" && (
                    <p className="text-amber-300">⏳ Awaiting Seller Acceptance. The seller must accept this deal before the group link is created.</p>
                  )}
                  {selectedOrder.status === "waiting_payment" && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-yellow-300 font-bold">💰 Payment Required to Admin Escrow.</p>
                      <p>1. Join the Telegram Deal Group using the link below.</p>
                      <p>2. Transfer <span className="text-yellow-400 font-black">₹{selectedOrder.productPrice}</span> to the Admin via UPI / Wallet / USDT as instructed in the group chat.</p>
                      <p>3. Do NOT pay the seller directly. Admin will verify and set the order to Delivering.</p>
                    </div>
                  )}
                  {selectedOrder.status === "delivering" && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-blue-300 font-bold">📤 Payment Verified. Seller is Delivering.</p>
                      <p>The seller has been notified to deliver the account details/license key inside the Deal Group chat.</p>
                      <p>Upon receiving the details, verify them and click "Confirm Delivery" below to release payment to the seller.</p>
                    </div>
                  )}
                  {selectedOrder.status === "completed" && (
                    <p className="text-emerald-400">🎉 Deal Completed Successfully! Funds have been safely transferred to the seller (minus 5% platform commission).</p>
                  )}
                  {selectedOrder.status === "disputed" && (
                    <p className="text-rose-400">⚠️ Mediation Active. AeroX Admin is reviewing transaction histories and credentials inside the Deal Group. A resolution will be announced shortly.</p>
                  )}

                  {selectedOrder.dealGroupLink && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/[0.05] flex flex-col gap-2">
                      <span className="text-[8px] text-neutral-500 uppercase font-black tracking-wider">Deal Group Link</span>
                      <a 
                        href={selectedOrder.dealGroupLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-center font-black tracking-widest text-[9px] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(79,70,229,0.2)]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Join Telegram Deal Group
                      </a>
                    </div>
                  )}
                </div>

                {/* Buyer Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  {selectedOrder.status === "delivering" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, "completed")}
                        disabled={orderActionLoading}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-[9px] font-black tracking-widest uppercase cursor-pointer text-center"
                      >
                        ✅ Confirm Delivery & Pay Seller
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, "disputed")}
                        disabled={orderActionLoading}
                        className="px-4 py-2.5 rounded-xl bg-rose-950/50 border border-rose-500/20 text-rose-300 text-[9px] font-black tracking-widest uppercase cursor-pointer text-center"
                      >
                        ⚠️ Dispute Deal
                      </button>
                    </div>
                  )}

                  {/* Rating Section if Completed */}
                  {selectedOrder.status === "completed" && (
                    <div className="mt-2 pt-3 border-t border-white/[0.04]">
                      {selectedOrder.buyerRating ? (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                          <span className="text-[8px] text-emerald-400 font-bold block uppercase tracking-wider font-mono">YOUR REVIEW SUBMITTED</span>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: selectedOrder.buyerRating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          {selectedOrder.buyerReview && (
                            <p className="text-[10px] text-neutral-300 mt-1.5 italic font-mono">"{selectedOrder.buyerReview}"</p>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={(e) => handleRateDeal(e, selectedOrder.id)} className="flex flex-col gap-2.5">
                          <span className="text-[9px] text-white font-black tracking-widest uppercase font-mono">
                            ⭐ Rate this Peer Deal
                          </span>
                          <div className="flex gap-1.5 items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRateRating(star)}
                                className="p-1 cursor-pointer"
                              >
                                <Star className={`w-5 h-5 ${rateRating >= star ? "fill-amber-400 text-amber-400" : "text-neutral-600"}`} />
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={rateReview}
                            onChange={(e) => setRateReview(e.target.value)}
                            placeholder="Add store feedback (e.g. fast response, friendly seller)..."
                            className="w-full px-3 py-2 bg-slate-950/50 border border-white/[0.04] rounded-xl text-[10px] text-white focus:outline-none focus:border-white/30 font-mono"
                          />
                          <button
                            type="submit"
                            disabled={orderActionLoading}
                            className="py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[9px] font-black uppercase font-mono cursor-pointer"
                          >
                            Submit Rating
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="py-2.5 rounded-xl border border-white/[0.05] bg-white/5 text-neutral-400 text-[9px] font-black tracking-widest uppercase cursor-pointer text-center"
                  >
                    Dismiss Details
                  </button>
                </div>
              </div>
            ) : (
              /* CASE 2: Browsing Products & Categories */
              <div className="flex flex-col gap-4">
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={marketSearchQuery}
                    onChange={(e) => setMarketSearchQuery(e.target.value)}
                    placeholder="Search peer marketplace products..."
                    className="w-full pl-10 pr-12 py-2.5 bg-zinc-900/50 border border-white/[0.06] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all font-sans"
                  />
                  {marketSearchQuery && (
                    <button
                      onClick={() => setMarketSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-[9px] font-black uppercase font-mono tracking-wider"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Premium Redesigned Seller Application Promo Banner */}
                {userRole !== "seller" && (
                  <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#1c1c1e] via-[#121212] to-[#0a0a0a] border border-white/[0.05] shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
                    {/* Glowing Accent Blur */}
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />

                    {/* Left vertical sleek colored accent line */}
                    <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-white/20 rounded-r-md" />

                    <div className="flex flex-col gap-4 pl-2 relative z-10">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700/10 to-zinc-800/10 border border-white/10 flex items-center justify-center text-lg shrink-0 shadow-inner">
                          🏪
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] text-white font-black tracking-widest uppercase font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              VERIFIED SELLER
                            </span>
                          </div>
                          <h4 className="font-sans font-black text-xs text-white tracking-wide mt-1 uppercase">
                            Become an AeroX Verified Seller
                          </h4>
                        </div>
                      </div>

                      <p className="text-[10px] text-neutral-400 font-medium leading-relaxed max-w-[340px]">
                        List your premium accounts & digital assets, automate deliverability with instant keys, and withdraw your earned credits securely.
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                        <div className="flex gap-4 text-neutral-500 font-mono text-[8px] uppercase tracking-wider font-bold">
                          <span>📈 0% FEE</span>
                          <span>🔒 ESCROW SECURED</span>
                        </div>
                        <button
                          onClick={() => { setMarketSubTab("seller"); setErrorMsg(null); }}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-500/20 text-white font-black text-[9px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-500/10 shrink-0 font-mono"
                        >
                          {sellerApp ? "View Status" : "Apply Now"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedMarketProduct ? (
                  /* Offerings panel for specific product */
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-[#1c1c1e] border border-white/[0.06] rounded-2xl">
                      <span className="text-[8px] text-zinc-400 font-black tracking-widest uppercase font-mono block">Product Category: {selectedMarketProduct.productCategory}</span>
                      <h4 className="text-sm font-black text-white mt-1 uppercase">{selectedMarketProduct.productName}</h4>
                      <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">{selectedMarketProduct.productDescription || "Premium high-quality accounts listed by vetted sellers with escrow support."}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-neutral-500 font-black uppercase tracking-wider font-mono">SELLER OFFERINGS (CHEAPEST FIRST)</span>
                      <button 
                        onClick={() => setSelectedMarketProduct(null)}
                        className="text-[9px] text-zinc-400 hover:text-white transition-colors font-mono uppercase font-black"
                      >
                        ← Back to browse
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {selectedMarketProduct.sellers && selectedMarketProduct.sellers.length > 0 ? (
                        selectedMarketProduct.sellers.map((offering: any) => (
                          <div 
                            key={offering.productId}
                            className="relative p-5 rounded-2xl bg-gradient-to-br from-[#1c1c1e] via-[#121212] to-[#0a0a0a] border border-white/[0.06] hover:border-white/15 shadow-lg flex flex-col gap-4 overflow-hidden"
                          >
                            {/* Accent Glow on Hover */}
                            <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />

                            {/* Seller Meta info */}
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex gap-3 items-center min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-700/10 to-zinc-800/10 border border-white/10 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-inner uppercase">
                                  {offering.storeName ? offering.storeName.substring(0, 1) : "S"}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-white truncate">{offering.storeName}</span>
                                    {offering.isVerified === 1 && (
                                      <span className="w-3.5 h-3.5 bg-gradient-to-r from-zinc-400 to-zinc-600 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-md shrink-0" title="Verified AeroX Seller">✓</span>
                                    )}
                                  </div>
                                  <span className="text-[8px] text-neutral-400 font-bold block uppercase tracking-wider font-mono mt-0.5">
                                    ⭐ {offering.rating ? offering.rating.toFixed(1) : "5.0"} ({offering.completedDeals || 0} deals) • Delivery: ~15m
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[13px] font-black text-white font-mono block">₹{offering.price}</span>
                                <span className="text-[8px] text-emerald-400 font-black tracking-widest block uppercase font-mono mt-1">In Stock</span>
                              </div>
                            </div>

                            {/* Offering specific description */}
                            <p className="text-[10px] text-neutral-300 font-mono leading-relaxed bg-[#020408]/60 p-3 rounded-xl border border-white/[0.03]">
                              {offering.description || "Shared premium access. Guaranteed active support with escrow mediation."}
                            </p>

                            {/* Buy offering button */}
                            <button
                              onClick={() => setCheckoutOffering(offering)}
                              className="py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-500/20 text-white text-[9px] font-black tracking-widest uppercase transition-all text-center cursor-pointer shadow-lg shadow-rose-500/10 active:scale-[0.98]"
                            >
                              🛒 Request Escrow Deal
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <span className="text-xs text-neutral-500 font-bold block uppercase tracking-wider font-mono">No sellers are offering this product today.</span>
                        </div>
                      )}
                    </div>

                    {/* Checkout Confirmation Overlay / Panel */}
                    {checkoutOffering && (
                      <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-full max-w-sm bg-dark-card border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left"
                        >
                          <div className="flex justify-between items-start pb-2 border-b border-white/[0.04]">
                            <div>
                              <span className="text-[8px] text-neutral-400 font-black tracking-widest uppercase font-mono block">Secured Escrow Checkout</span>
                              <span className="text-xs font-black text-white mt-1 block uppercase">{selectedMarketProduct.productName}</span>
                            </div>
                            <button onClick={() => setCheckoutOffering(null)} className="p-1 rounded-full bg-slate-900 text-neutral-400 hover:text-white">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.03] text-[10px] text-neutral-400 leading-relaxed font-mono">
                            <p className="text-yellow-300 font-bold mb-1">🛡️ AeroX Admin Escrow active.</p>
                            Upon creation, a private Deal Group chat is generated automatically on Telegram. You will pay the Admin, who secures the funds. Seller delivers the details inside the group. After you verify and complete, Admin releases funds to the seller. Safe, rapid, and fully secure.
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-xl border border-white/[0.03] font-mono text-[10px]">
                            <div>
                              <span className="text-neutral-500 block uppercase">SELLER</span>
                              <span className="text-white font-extrabold block mt-0.5">{checkoutOffering.storeName}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-neutral-500 block uppercase">TOTAL AMOUNT</span>
                              <span className="text-white font-extrabold block mt-0.5">₹{checkoutOffering.price} INR</span>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => setCheckoutOffering(null)}
                              className="flex-1 py-2.5 rounded-xl border border-rose-500/10 hover:border-rose-500/30 bg-[#0a0304] hover:bg-rose-950/20 text-neutral-300 hover:text-rose-300 text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleBuyMarketplaceProduct(checkoutOffering)}
                              disabled={orderActionLoading}
                              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-500/20 text-white text-[10px] font-black tracking-widest uppercase transition-all text-center cursor-pointer disabled:opacity-50 shadow-lg shadow-rose-500/10"
                            >
                              {orderActionLoading ? "CREATING DEAL..." : "AUTHORIZE DEAL"}
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Listings Catalog Grid */
                  <div className="flex flex-col gap-3">
                    <span className="text-[9px] text-neutral-500 font-black uppercase tracking-wider font-mono block">Peer-to-Peer Catalog</span>
                    {marketProducts.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5">
                        {marketProducts
                          .filter((p) => p.productName.toLowerCase().includes(marketSearchQuery.toLowerCase()))
                          .map((p) => {
                            const staticProduct = PRODUCTS.find(sp => sp.title.toLowerCase() === p.productName.toLowerCase() || p.productName.toLowerCase().includes(sp.title.toLowerCase()));
                            const iconId = staticProduct?.id || "Sparkles";
                            
                            return (
                              <button
                                key={p.productName}
                                onClick={() => setSelectedMarketProduct(p)}
                                className="relative p-4 rounded-2xl bg-gradient-to-r from-slate-950/40 to-slate-950/20 hover:from-slate-950/80 hover:to-slate-950/60 border border-white/[0.04] hover:border-white/15 transition-all text-left flex justify-between items-center group cursor-pointer overflow-hidden shadow-md"
                              >
                                {/* Left Edge subtle accent */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-white/40 transition-all" />
                                
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                                  <div className="shrink-0 scale-90 group-hover:scale-95 transition-transform">
                                    {getIcon(iconId, false, "w-10 h-10")}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[8px] text-white font-extrabold uppercase tracking-widest font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                      {p.productCategory}
                                    </span>
                                    <h4 className="text-[11px] font-black text-white mt-1.5 uppercase block truncate group-hover:text-zinc-300 transition-colors">
                                      {p.productName}
                                    </h4>
                                    <span className="text-[9px] text-neutral-400 block font-mono mt-0.5">
                                      {p.sellers?.length || 1} available offerings • Vetted sellers
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 flex flex-col items-end">
                                  <span className="text-[7px] text-neutral-500 uppercase tracking-widest font-mono block">From</span>
                                  <span className="text-xs font-black text-white font-mono block mt-1">
                                    ₹{p.lowestPrice}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-16 border border-dashed border-white/[0.04] rounded-2xl bg-slate-950/20">
                        <ShoppingBag className="w-8 h-8 text-neutral-600 mx-auto mb-3 animate-pulse" />
                        <span className="text-neutral-400 font-black tracking-widest text-xs block uppercase">NO PRODUCTS LISTED TODAY</span>
                        <span className="text-[10px] text-neutral-500 block mt-1.5 px-4 font-mono">Check back later or apply as a seller to list your custom subscriptions!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            SELLER PERSPECTIVE 
            ========================================== */}
        {marketSubTab === "seller" && (
          <div className="flex flex-col gap-4">
            
            {/* If Not a Seller, render Apply Page/Status */}
            {userRole !== "seller" ? (
              <div className="flex flex-col gap-4">
                {/* Check Application Status */}
                {sellerApp ? (
                  <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/[0.05] flex flex-col gap-4">
                    <div className="text-center flex flex-col items-center gap-2">
                      <div className="p-3 bg-white/5 rounded-full border border-white/10 text-neutral-400">
                        <Clock className="w-8 h-8 animate-spin" />
                      </div>
                      <span className="text-xs font-black tracking-widest uppercase font-mono text-white mt-1">Application Received</span>
                      <span className="text-sm font-black text-neutral-200 block">{sellerApp.storeName}</span>
                    </div>

                    <div className="p-4 bg-slate-950/80 rounded-xl border border-white/[0.03] text-[10px] text-neutral-400 leading-relaxed font-mono flex flex-col gap-2">
                      <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                        <span className="text-neutral-500 uppercase">STATUS</span>
                        {getStatusBadge(sellerApp.status)}
                      </div>
                      <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                        <span className="text-neutral-500 uppercase">TG USER</span>
                        <span className="text-white font-bold">{sellerApp.telegramUsername}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500 uppercase">USDT WALLET</span>
                        <span className="text-white font-bold truncate max-w-[120px]">{sellerApp.cryptoWallet}</span>
                      </div>
                    </div>

                    {sellerApp.status === "pending" && (
                      <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-[10px] text-amber-300 font-mono">
                        ⏳ Your seller application is currently undergoing admin security review. Join the support group or contact @AeroX_Mediation on Telegram for fast approval.
                      </div>
                    )}

                    {sellerApp.status === "rejected" && (
                      <div className="flex flex-col gap-2">
                        <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-[10px] text-red-300 font-mono">
                          ❌ Application Rejected. Admin Note: "{sellerApp.adminNotes || "Details did not meet our standard requirements."}"
                        </div>
                        <button
                          onClick={() => {
                            setSellerApp(null); // Clears application to let them resubmit
                          }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-500/20 text-white text-xs font-black tracking-widest uppercase transition-all text-center cursor-pointer shadow-lg shadow-rose-500/10"
                        >
                          ✏️ Modify & Re-Apply
                        </button>
                      </div>
                    )}

                    {sellerApp.status === "suspended" && (
                      <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-[10px] text-red-300 font-mono">
                        🚫 Your seller room privileges have been suspended indefinitely by the admin. Please contact support.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setMarketSubTab("buyer")}
                      className="w-full mt-2 py-2 border border-white/[0.05] bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-[10px] font-black uppercase font-mono rounded-xl transition-all cursor-pointer text-center"
                    >
                      ← Back to Market
                    </button>
                  </div>
                ) : (
                  /* Render Seller Application Form */
                  <form onSubmit={handleApplyAsSeller} className="p-5 rounded-2xl bg-slate-950/40 border border-white/[0.05] flex flex-col gap-4">
                    <div>
                      <span className="text-[8px] text-zinc-400 font-black tracking-widest uppercase font-mono block">VETTING PROCESS</span>
                      <h3 className="text-sm font-black text-white uppercase mt-0.5">Apply as AeroX Seller</h3>
                      <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed font-mono">We do not allow instant sellers to prevent scams. Submit your store profile below. Admin reviews applications manually within 12 hours.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Store Name *</label>
                        <input
                          type="text"
                          value={appStoreName}
                          onChange={(e) => setAppStoreName(e.target.value)}
                          placeholder="e.g. AeroX premium shop"
                          className="px-3.5 py-2 bg-slate-950/60 border border-white/[0.04] rounded-xl text-xs text-white focus:outline-none focus:border-white/30 transition-all font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Telegram Username *</label>
                        <input
                          type="text"
                          value={appTelegramUsername}
                          onChange={(e) => setAppTelegramUsername(e.target.value)}
                          placeholder="e.g. @yourname_seller"
                          className="px-3.5 py-2 bg-slate-950/60 border border-white/[0.04] rounded-xl text-xs text-white focus:outline-none focus:border-white/30 transition-all font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Store Logo URL (Optional)</label>
                        <input
                          type="text"
                          value={appStoreLogo}
                          onChange={(e) => setAppStoreLogo(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="px-3.5 py-2 bg-slate-950/60 border border-white/[0.04] rounded-xl text-xs text-white focus:outline-none focus:border-white/30 transition-all font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Store Description *</label>
                        <textarea
                          rows={2}
                          value={appStoreDescription}
                          onChange={(e) => setAppStoreDescription(e.target.value)}
                          placeholder="What makes your store unique?"
                          className="px-3.5 py-2 bg-slate-950/60 border border-white/[0.04] rounded-xl text-xs text-white focus:outline-none focus:border-white/30 transition-all font-mono resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">What products do you sell? *</label>
                        <input
                          type="text"
                          value={appProductsToSell}
                          onChange={(e) => setAppProductsToSell(e.target.value)}
                          placeholder="e.g. Netflix, ChatGPT, vpn, canva"
                          className="px-3.5 py-2 bg-slate-950/60 border border-white/[0.04] rounded-xl text-xs text-white focus:outline-none focus:border-white/30 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingApp}
                      className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-500/20 text-white text-xs font-black tracking-widest uppercase transition-all text-center cursor-pointer shadow-lg shadow-rose-500/10 disabled:opacity-50"
                    >
                      {submittingApp ? "SUBMITTING PROPOSAL..." : "SUBMIT APPLICATION"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMarketSubTab("buyer")}
                      className="w-full py-2.5 rounded-xl bg-[#0a0304] border border-rose-500/10 hover:border-rose-500/30 text-neutral-400 hover:text-rose-300 text-xs font-black tracking-widest uppercase transition-all text-center cursor-pointer"
                    >
                      ← Cancel & Back to Market
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* Approved Seller dashboard layout */
              <div className="flex flex-col gap-4">
                
                {/* Store mini banner */}
                <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-white/[0.05] rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-black text-white text-sm">
                      {sellerProfile?.storeName ? sellerProfile.storeName.substring(0, 1).toUpperCase() : "🏪"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-white uppercase">{sellerProfile?.storeName || "My Premium Store"}</span>
                        {sellerProfile?.isVerified === 1 && (
                          <span className="w-3.5 h-3.5 bg-sky-500 text-white rounded-full text-[7px] font-black flex items-center justify-center" title="Verified Seller">✓</span>
                        )}
                      </div>
                      <span className="text-[8px] text-neutral-400 font-bold block uppercase tracking-wider font-mono mt-0.5">
                        Telegram: {sellerProfile?.telegramUsername ? `@${sellerProfile.telegramUsername.replace("@", "")}` : "Not Set"}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowSellerSettings(!showSellerSettings);
                      setSelectedOrder(null);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Seller stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-[#02040c]/40 border border-white/[0.03] rounded-xl flex flex-col font-mono text-[9px]">
                    <span className="text-neutral-500 uppercase font-black">Gross Volume</span>
                    <span className="text-[12px] font-black text-white mt-1">₹{sellerStats?.grossEarnings ?? 0} INR</span>
                  </div>
                  <div className="p-3 bg-[#02040c]/40 border border-white/[0.03] rounded-xl flex flex-col font-mono text-[9px]">
                    <span className="text-neutral-500 uppercase font-black">Net Volume (95%)</span>
                    <span className="text-[12px] font-black text-white mt-1">₹{sellerStats?.netEarnings ?? 0} INR</span>
                  </div>
                </div>

                {showSellerSettings ? (
                  /* Store Settings edit form */
                  <form onSubmit={handleUpdateSellerProfile} className="p-4 bg-slate-950/40 border border-white/[0.04] rounded-2xl flex flex-col gap-4">
                    <div className="flex justify-between items-center pb-1.5 border-b border-white/[0.04]">
                      <span className="text-[9px] text-white font-black uppercase tracking-widest font-mono">Store Profile Settings</span>
                      <button type="button" onClick={() => setShowSellerSettings(false)} className="text-[9px] text-neutral-400 font-mono">Cancel</button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Store Name</label>
                        <input
                          type="text"
                          value={settStoreName}
                          onChange={(e) => setSettStoreName(e.target.value)}
                          className="px-3 py-1.5 bg-slate-950/60 border border-white/[0.04] rounded-lg text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Store Description</label>
                        <textarea
                          rows={2}
                          value={settStoreDesc}
                          onChange={(e) => setSettStoreDesc(e.target.value)}
                          className="px-3 py-1.5 bg-slate-950/60 border border-white/[0.04] rounded-lg text-xs text-white focus:outline-none focus:border-white/30 font-mono resize-none"
                        />
                      </div>

                    </div>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-500/20 text-white text-[10px] font-black tracking-widest uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-500/10"
                    >
                      {savingSettings ? "SAVING..." : "SAVE STORE SETTINGS"}
                    </button>
                  </form>
                ) : selectedOrder ? (
                  /* Seller Order Details Escalated Panel */
                  <div className="p-4 bg-slate-950/40 border border-white/[0.04] rounded-2xl flex flex-col gap-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                      <div>
                        <span className="text-[8px] text-neutral-500 uppercase tracking-widest block font-mono">INCOMING ORDER</span>
                        <span className="text-xs font-black text-white mt-0.5 block">ID: {selectedOrder.id.substring(0, 8).toUpperCase()}...</span>
                      </div>
                      {getStatusBadge(selectedOrder.status)}
                    </div>

                    <div className="p-3 bg-white/5 border border-white/[0.03] rounded-xl font-mono text-[10px] flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">BUYER:</span>
                        <span className="text-white font-bold">@{selectedOrder.buyerUsername || "anonymous"} ({selectedOrder.buyerTelegramId})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">PRODUCT:</span>
                        <span className="text-white font-bold">{selectedOrder.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">PAYOUT EARNINGS (95%):</span>
                        <span className="text-emerald-400 font-extrabold">₹{(selectedOrder.productPrice * 0.95).toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Timeline Action Box for Seller */}
                    <div className="p-3.5 bg-slate-950/80 rounded-xl border border-white/[0.03] text-[10px] text-neutral-400 leading-relaxed font-mono">
                      {selectedOrder.status === "pending" && (
                        <div className="flex flex-col gap-2">
                          <p className="text-amber-300">⏳ Buyer requested deal. Review details and accept or decline below.</p>
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleSellerRespondOrder(selectedOrder.id, "accept")}
                              disabled={orderActionLoading}
                              className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border border-emerald-500/20 text-white font-black text-[9px] uppercase tracking-wider rounded-lg cursor-pointer text-center shadow-md shadow-emerald-500/10"
                            >
                              ✅ Accept Deal
                            </button>
                            <button
                              onClick={() => handleSellerRespondOrder(selectedOrder.id, "reject")}
                              disabled={orderActionLoading}
                              className="px-3 py-2 bg-red-950/30 border border-red-500/30 text-red-300 font-black text-[9px] uppercase tracking-wider rounded-lg cursor-pointer text-center"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedOrder.status === "waiting_payment" && (
                        <p className="text-yellow-300">⏳ Waiting for Buyer Payment. The buyer is paying the Admin Escrow wallet inside the Deal Group. Do NOT deliver any login details yet.</p>
                      )}

                      {selectedOrder.status === "delivering" && (
                        <div className="flex flex-col gap-2">
                          <p className="text-blue-300 font-bold">📤 Payment Escrowed! Deliver Now.</p>
                          <p>Admin has locked the buyer's funds. Deliver account login details, cookie, or license code inside the Deal Group chat.</p>
                          <p>After delivery, click the button below to notify the buyer and await confirmation.</p>
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, "delivering")} // Triggers delivery notify in backend
                            disabled={orderActionLoading}
                            className="mt-1 w-full py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-500/20 text-white font-black text-[9px] uppercase tracking-widest rounded-lg cursor-pointer text-center shadow-lg shadow-rose-500/10"
                          >
                            📤 Notify Credentials Delivered
                          </button>
                        </div>
                      )}

                      {selectedOrder.status === "completed" && (
                        <p className="text-emerald-400">🎉 Completed! Payout has been initialized and transferred to your crypto address. Thank you for using AeroX Escrow.</p>
                      )}

                      {selectedOrder.dealGroupLink && (
                        <div className="mt-2.5 pt-2.5 border-t border-white/[0.05] flex flex-col gap-1.5">
                          <span className="text-[8px] text-neutral-500 uppercase tracking-wider font-black">Deal Communication Link</span>
                          <a 
                            href={selectedOrder.dealGroupLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-500/20 text-white text-center font-black tracking-widest text-[9px] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-500/10"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Open Telegram Deal chat
                          </a>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="py-2.5 rounded-xl border border-rose-500/10 hover:border-rose-500/30 bg-[#0a0304] text-neutral-400 hover:text-rose-300 text-[9px] font-black tracking-widest uppercase cursor-pointer text-center transition-all"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                ) : (
                  /* Standard List selection: own products & active buyer requests */
                  <div className="flex flex-col gap-4">
                    
                    {/* Switcher inner */}
                    <div className="grid grid-cols-2 gap-1 bg-[#02040c]/50 p-1 rounded-xl border border-white/[0.02]">
                      <button
                        onClick={() => { setShowAddProductModal(false); setShowEditProductModal(null); }}
                        className={`py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                          !showAddProductModal && !showEditProductModal
                            ? "bg-[#0a0304] border border-rose-500/30 text-rose-300 font-extrabold shadow-[0_0_15px_rgba(244,63,94,0.08)]"
                            : "border border-transparent text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        🏪 Listed Items ({sellerProducts.length})
                      </button>
                      <button
                        onClick={() => {
                          fetchSellerData();
                          if (sellerOrders.length > 0) {
                            setSelectedOrder(sellerOrders[0]);
                          } else {
                            setErrorMsg("No incoming deals have been assigned to your store yet.");
                          }
                        }}
                        className={`py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                          selectedOrder
                            ? "bg-[#0a0304] border border-rose-500/30 text-rose-300 font-extrabold shadow-[0_0_15px_rgba(244,63,94,0.08)]"
                            : "border border-transparent text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        📥 Incoming Deals ({sellerOrders.length})
                      </button>
                    </div>

                    {/* Listings manager sub-view */}
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-neutral-500 font-black uppercase tracking-wider font-mono">Store Offerings Catalog</span>
                        <button
                          onClick={() => {
                            setListPrice("");
                            setListStock("10");
                            setListDeliveryTime("Instant");
                            setListNotes("");
                            setSelectedCatalogProduct(null);
                            setShowAddProductModal(true);
                          }}
                          className="py-1 px-2.5 rounded-lg bg-[#0a0304] border border-rose-500/20 hover:border-rose-500/40 text-rose-300 hover:text-rose-200 text-[9px] font-black uppercase font-mono flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          Add Listing
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {sellerProducts.length > 0 ? (
                          sellerProducts.map((p) => (
                            <div key={p.id} className="p-3.5 rounded-xl bg-slate-950/50 border border-white/[0.04] flex justify-between items-center gap-4">
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] text-zinc-400 font-bold block uppercase tracking-widest font-mono">{p.category}</span>
                                <span className="text-xs font-bold text-white block mt-0.5 truncate">{p.name}</span>
                                <span className="text-[9px] text-neutral-400 block font-mono mt-0.5">
                                  Price: ₹{p.price} • Stock: {p.stock} • Delivery: {p.deliveryTime || "Instant"} • {p.stockStatus === "in_stock" ? "✅ Active" : "❌ Suspended"}
                                </span>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setListPrice(p.price.toString());
                                    setListStock(p.stock ? p.stock.toString() : "10");
                                    setListDeliveryTime(p.deliveryTime || "Instant");
                                    setListNotes(p.notes || "");
                                    setProdStockStatus(p.status === "active" ? "in_stock" : "out_of_stock");
                                    setShowEditProductModal(p);
                                  }}
                                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                                  title="Edit listing"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 rounded bg-red-950/20 hover:bg-red-950/40 text-red-400 cursor-pointer"
                                  title="Delete listing"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 border border-dashed border-white/[0.04] rounded-2xl bg-slate-950/20">
                            <Store className="w-8 h-8 text-neutral-600 mx-auto mb-2 animate-pulse" />
                            <span className="text-neutral-400 font-black tracking-widest text-xs block uppercase">YOUR SHELF IS EMPTY</span>
                            <span className="text-[10px] text-neutral-500 block mt-1.5 font-mono">Create your first product listing using the "Add Listing" button.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ADD PRODUCT MODAL -> LIST NEW OFFERING WITH AUTOCOMPLETE */}
                    {showAddProductModal && (
                      <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-full max-w-sm bg-dark-card border border-white/[0.08] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left"
                        >
                          <div className="flex justify-between items-start pb-2 border-b border-white/[0.03]">
                            <div>
                              <span className="text-[8px] text-neutral-400 font-black tracking-widest uppercase font-mono block">Product Directory</span>
                              <span className="text-xs font-black text-white mt-1 block">LIST NEW OFFERING</span>
                            </div>
                            <button onClick={() => setShowAddProductModal(false)} className="p-1 rounded-full bg-slate-900 text-neutral-400 hover:text-white">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {!selectedCatalogProduct ? (
                            <div className="flex flex-col gap-3">
                              <span className="text-[10px] text-zinc-400 font-bold block uppercase font-mono">1. Select Catalog Product</span>
                              <div className="flex flex-col gap-2">
                                <input
                                  type="text"
                                  placeholder="🔍 Search catalog (e.g. Netflix, ChatGPT)..."
                                  value={modalSearchQuery}
                                  onChange={(e) => setModalSearchQuery(e.target.value)}
                                  className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono"
                                />

                                <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
                                  {catalogProducts
                                    .filter((p) => p.name.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                                    .map((p) => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setSelectedCatalogProduct(p)}
                                        className="w-full p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.04] hover:border-rose-500/30 text-left cursor-pointer transition-all flex items-center gap-2"
                                      >
                                        <div className="w-6 h-6 shrink-0 rounded bg-slate-900 flex items-center justify-center text-xs text-neutral-400">
                                          {p.logo ? (
                                            <div dangerouslySetInnerHTML={{ __html: p.logo }} className="w-4 h-4 flex items-center justify-center" />
                                          ) : (
                                            "📦"
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-white truncate block">{p.name}</span>
                                            <span className="text-[7px] text-zinc-400 px-1.5 py-0.5 rounded bg-white/5 font-mono uppercase shrink-0">{p.category}</span>
                                          </div>
                                          <span className="text-[9px] text-neutral-400 truncate block mt-0.5">{p.description}</span>
                                        </div>
                                      </button>
                                    ))}
                                  {catalogProducts.filter((p) => p.name.toLowerCase().includes(modalSearchQuery.toLowerCase())).length === 0 && (
                                    <div className="text-center py-6 text-neutral-500 text-[10px] uppercase font-mono">
                                      No matching catalog items found
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-white/[0.03] flex flex-col gap-2">
                                <span className="text-[9px] text-neutral-500 text-center font-mono">Can't find your product in our official directory?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddProductModal(false);
                                    setShowRequestProductModal(true);
                                  }}
                                  className="w-full py-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 text-rose-300 hover:text-rose-200 text-[10px] font-black uppercase transition-all cursor-pointer text-center font-mono"
                                >
                                  Request to Add New Product
                                </button>
                              </div>
                            </div>
                          ) : (
                            <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
                              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.04] flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[8px] text-zinc-400 font-mono uppercase block">{selectedCatalogProduct.category}</span>
                                  <span className="text-xs font-black text-white block mt-0.5">{selectedCatalogProduct.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCatalogProduct(null)}
                                  className="px-2 py-1 rounded bg-white/5 text-[9px] hover:bg-white/10 text-neutral-400 hover:text-white font-mono cursor-pointer uppercase shrink-0"
                                >
                                  Change
                                </button>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Price (INR ₹) *</label>
                                <input
                                  type="number"
                                  value={listPrice}
                                  onChange={(e) => setListPrice(e.target.value)}
                                  placeholder="e.g. 299"
                                  className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Stock Quantity</label>
                                  <input
                                    type="number"
                                    value={listStock}
                                    onChange={(e) => setListStock(e.target.value)}
                                    placeholder="e.g. 10"
                                    className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Delivery Time</label>
                                  <select
                                    value={listDeliveryTime}
                                    onChange={(e) => setListDeliveryTime(e.target.value)}
                                    className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono h-[34px]"
                                  >
                                    <option value="Instant">Instant Delivery</option>
                                    <option value="1-2 Hours">1-2 Hours</option>
                                    <option value="12 Hours">12 Hours</option>
                                    <option value="24 Hours">24 Hours</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Listing Delivery Notes / Specs</label>
                                <textarea
                                  rows={2}
                                  value={listNotes}
                                  onChange={(e) => setListNotes(e.target.value)}
                                  placeholder="Details about warranty duration, screen slot profile, instructions..."
                                  className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono resize-none"
                                />
                              </div>

                              <div className="flex gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setShowAddProductModal(false)}
                                  className="flex-1 py-2 rounded-xl border border-rose-500/10 hover:border-rose-500/30 bg-[#0a0304] hover:bg-rose-950/20 text-neutral-300 hover:text-rose-300 text-[10px] font-black uppercase transition-all cursor-pointer"
                                >
                                  Dismiss
                                </button>
                                <button
                                  type="submit"
                                  disabled={submittingProduct}
                                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-500/20 text-white text-[10px] font-black uppercase transition-all cursor-pointer shadow-lg shadow-rose-500/10"
                                >
                                  {submittingProduct ? "LISTING..." : "LIST DEPLOY"}
                                </button>
                              </div>
                            </form>
                          )}
                        </motion.div>
                      </div>
                    )}

                    {/* EDIT LISTING MODAL */}
                    {showEditProductModal && (
                      <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-full max-w-sm bg-dark-card border border-white/[0.08] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left"
                        >
                          <div className="flex justify-between items-start pb-2 border-b border-white/[0.03]">
                            <div>
                              <span className="text-[8px] text-neutral-400 font-black tracking-widest uppercase font-mono block">Product Directory</span>
                              <span className="text-xs font-black text-white mt-1 block">EDIT LISTING</span>
                            </div>
                            <button onClick={() => setShowEditProductModal(null)} className="p-1 rounded-full bg-slate-900 text-neutral-400 hover:text-white">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <form onSubmit={handleEditProduct} className="flex flex-col gap-3">
                            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.04] flex items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] text-zinc-400 font-mono uppercase block">{showEditProductModal.category}</span>
                                <span className="text-xs font-black text-white block mt-0.5">{showEditProductModal.name}</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Price (INR ₹) *</label>
                              <input
                                type="number"
                                value={listPrice}
                                onChange={(e) => setListPrice(e.target.value)}
                                className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Stock Quantity</label>
                                <input
                                  type="number"
                                  value={listStock}
                                  onChange={(e) => setListStock(e.target.value)}
                                  className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Delivery Time</label>
                                <select
                                  value={listDeliveryTime}
                                  onChange={(e) => setListDeliveryTime(e.target.value)}
                                  className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono h-[34px]"
                                >
                                  <option value="Instant">Instant Delivery</option>
                                  <option value="1-2 Hours">1-2 Hours</option>
                                  <option value="12 Hours">12 Hours</option>
                                  <option value="24 Hours">24 Hours</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Listing Delivery Notes / Specs</label>
                              <textarea
                                rows={2}
                                value={listNotes}
                                onChange={(e) => setListNotes(e.target.value)}
                                className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono resize-none"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Stock Status</label>
                              <select
                                value={prodStockStatus}
                                onChange={(e) => setProdStockStatus(e.target.value)}
                                className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none h-[34px]"
                              >
                                <option value="in_stock">In Stock / Active</option>
                                <option value="out_of_stock">Out of Stock / Suspended</option>
                              </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setShowEditProductModal(null)}
                                className="flex-1 py-2 rounded-xl border border-rose-500/10 hover:border-rose-500/30 bg-[#0a0304] hover:bg-rose-950/20 text-neutral-300 hover:text-rose-300 text-[10px] font-black uppercase transition-all cursor-pointer"
                              >
                                Dismiss
                              </button>
                              <button
                                type="submit"
                                disabled={submittingProduct}
                                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-500/20 text-white text-[10px] font-black uppercase transition-all cursor-pointer shadow-lg shadow-rose-500/10"
                              >
                                {submittingProduct ? "SAVING..." : "SAVE UPDATE"}
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      </div>
                    )}

                    {/* REQUEST CATALOG PRODUCT MODAL */}
                    {showRequestProductModal && (
                      <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-full max-w-sm bg-dark-card border border-white/[0.08] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left"
                        >
                          <div className="flex justify-between items-start pb-2 border-b border-white/[0.03]">
                            <div>
                              <span className="text-[8px] text-neutral-400 font-black tracking-widest uppercase font-mono block">Product Request</span>
                              <span className="text-xs font-black text-white mt-1 block font-sans">SUGGEST DIRECTORY ITEM</span>
                            </div>
                            <button onClick={() => setShowRequestProductModal(false)} className="p-1 rounded-full bg-slate-900 text-neutral-400 hover:text-white">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <form onSubmit={handleRequestProduct} className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Category *</label>
                              <select
                                value={reqProductCategory}
                                onChange={(e) => setReqProductCategory(e.target.value)}
                                className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none"
                              >
                                <option value="AI">AI & Dev Tools</option>
                                <option value="VPN">Secured VPNs</option>
                                <option value="OTT">OTT / Streams</option>
                                <option value="Instagram">Instagram & Aged PVAs</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Product Name *</label>
                              <input
                                type="text"
                                value={reqProductName}
                                onChange={(e) => setReqProductName(e.target.value)}
                                placeholder="e.g. ChatGPT Pro Max Slot"
                                className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Brief Description / Features *</label>
                              <textarea
                                rows={2}
                                value={reqProductDescription}
                                onChange={(e) => setReqProductDescription(e.target.value)}
                                placeholder="Details about this service so admins can verify and prepare the logo/metadata."
                                className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Brand Developer</label>
                                <input
                                  type="text"
                                  value={reqProductBrand}
                                  onChange={(e) => setReqProductBrand(e.target.value)}
                                  placeholder="e.g. OpenAI"
                                  className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Official Website</label>
                                <input
                                  type="text"
                                  value={reqProductWebsite}
                                  onChange={(e) => setReqProductWebsite(e.target.value)}
                                  placeholder="openai.com"
                                  className="px-3 py-2 bg-slate-950 border border-white/[0.06] rounded-xl text-xs text-white focus:outline-none font-mono"
                                />
                              </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowRequestProductModal(false);
                                  setShowAddProductModal(true);
                                }}
                                className="flex-1 py-2 rounded-xl border border-rose-500/10 hover:border-rose-500/30 bg-[#0a0304] hover:bg-rose-950/20 text-neutral-300 hover:text-rose-300 text-[10px] font-black uppercase transition-all cursor-pointer font-mono"
                              >
                                Back
                              </button>
                              <button
                                type="submit"
                                disabled={submittingProduct}
                                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-500/20 text-white text-[10px] font-black uppercase transition-all cursor-pointer shadow-lg shadow-rose-500/10"
                              >
                                {submittingProduct ? "SENDING..." : "SUBMIT REQUEST"}
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            ADMIN PERSPECTIVE 
            ========================================== */}
        {marketSubTab === "admin" && isAdminRole(userRole) && (
          <div className="flex flex-col gap-4">
            
            {/* Admin sub-sub tab panel selection */}
            <div className="grid grid-cols-4 gap-0.5 bg-slate-950 p-1 rounded-xl border border-white/[0.03]">
              <button 
                onClick={() => { setProdCategory("apps"); setSelectedOrder(null); }} 
                className={`py-1 rounded text-[8px] font-black uppercase font-mono ${prodCategory === "apps" ? "bg-white/10 border border-white/20 text-white" : "text-neutral-500"}`}
              >
                Apps ({adminApps.length})
              </button>
              <button 
                onClick={() => { setProdCategory("sellers"); setSelectedOrder(null); }} 
                className={`py-1 rounded text-[8px] font-black uppercase font-mono ${prodCategory === "sellers" ? "bg-white/10 border border-white/20 text-white" : "text-neutral-500"}`}
              >
                Sellers ({adminSellers.length})
              </button>
              <button 
                onClick={() => { 
                  fetchAdminData();
                  if (adminOrders.length > 0) {
                    setSelectedOrder(adminOrders[0]);
                  } else {
                    setErrorMsg("No orders exist inside database yet.");
                  }
                  setProdCategory("orders"); 
                }} 
                className={`py-1 rounded text-[8px] font-black uppercase font-mono ${prodCategory === "orders" ? "bg-white/10 border border-white/20 text-white" : "text-neutral-500"}`}
              >
                Deals ({adminOrders.length})
              </button>
              <button 
                onClick={() => { setProdCategory("stats"); setSelectedOrder(null); }} 
                className={`py-1 rounded text-[8px] font-black uppercase font-mono ${prodCategory === "stats" ? "bg-white/10 border border-white/20 text-white" : "text-neutral-500"}`}
              >
                Stats
              </button>
            </div>

            {/* Case A: Seller Applications */}
            {prodCategory === "apps" && (
              <div className="flex flex-col gap-3">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Pending Seller requests</span>
                {adminApps.length > 0 ? (
                  adminApps.map((app) => (
                    <div key={app.id} className="p-4 bg-slate-950/50 border border-white/[0.04] rounded-xl flex flex-col gap-3 text-[10px]">
                      <div className="flex justify-between items-start pb-1.5 border-b border-white/[0.04]">
                        <span className="text-xs font-black text-white block uppercase">{app.storeName}</span>
                        <span className="text-[8px] text-neutral-400 font-bold uppercase block font-mono">User: @{app.telegramUsername} ({app.telegramId})</span>
                      </div>
                      <div className="flex flex-col gap-1 leading-relaxed text-neutral-300">
                        <p><span className="text-neutral-500 font-bold">Desc:</span> {app.storeDescription}</p>
                        <p><span className="text-neutral-500 font-bold">Products:</span> {app.productsToSell}</p>
                        <p className="font-mono text-[9px] text-white"><span className="text-neutral-500">Wallet:</span> {app.cryptoWallet}</p>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleAdminApproveReject(app.id, "approved")}
                          disabled={adminActionLoading}
                          className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[9px] tracking-wider cursor-pointer"
                        >
                          Approve Seller
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Enter rejection reason note:") || "Rejected by admin.";
                            handleAdminApproveReject(app.id, `rejected:${reason}`);
                          }}
                          disabled={adminActionLoading}
                          className="px-3 py-1.5 rounded bg-red-950/30 border border-red-500/30 text-red-300 font-bold uppercase text-[9px] cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-neutral-500 font-bold text-[10px] uppercase tracking-wider font-mono">
                    No pending seller applications
                  </div>
                )}
              </div>
            )}

            {/* Case B: Active Sellers Directory */}
            {prodCategory === "sellers" && (
              <div className="flex flex-col gap-3">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Sellers directory manager</span>
                {adminSellers.length > 0 ? (
                  adminSellers.map((s) => (
                    <div key={s.id} className="p-4 bg-slate-950/50 border border-white/[0.04] rounded-xl flex flex-col gap-3 text-[10px]">
                      <div className="flex justify-between items-center pb-1.5 border-b border-white/[0.04]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white block uppercase">{s.storeName}</span>
                          {s.isVerified === 1 && (
                            <span className="w-3.5 h-3.5 bg-sky-500 text-white rounded-full text-[7px] font-black flex items-center justify-center">✓</span>
                          )}
                        </div>
                        {getStatusBadge(s.status)}
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-neutral-300">
                        <span>Tg ID: {s.telegramId} (@{s.telegramUsername})</span>
                        <span className="text-amber-400">Rating: {s.rating ? s.rating.toFixed(1) : "5.0"} ({s.completedDeals || 0} deals)</span>
                      </div>
                      <div className="flex gap-2 pt-1.5">
                        <button
                          onClick={() => handleAdminVerifySeller(s.id, s.isVerified === 1)}
                          className="flex-1 py-1.5 rounded bg-blue-950/40 border border-blue-500/20 text-blue-300 text-[9px] font-bold uppercase font-mono cursor-pointer"
                        >
                          {s.isVerified === 1 ? "Remove Badge" : "Verify Store"}
                        </button>
                        <button
                          onClick={() => handleAdminSuspendActivateSeller(s.id, s.status)}
                          className="px-3 py-1.5 rounded bg-amber-950/30 border border-amber-500/20 text-amber-300 text-[9px] font-bold uppercase font-mono cursor-pointer"
                        >
                          {s.status === "active" ? "Suspend" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleAdminDeleteSeller(s.id)}
                          className="p-1.5 rounded bg-red-950/30 text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-neutral-500 font-bold text-[10px] uppercase tracking-wider font-mono">
                    No active sellers found
                  </div>
                )}
              </div>
            )}

            {/* Case C: Global Escrow Mediation Order Panel */}
            {prodCategory === "orders" && selectedOrder && (
              <div className="p-4 bg-slate-950/40 border border-white/[0.04] rounded-2xl flex flex-col gap-4 text-[10px] text-neutral-300">
                <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                  <div>
                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider font-mono">ESCROW ESCORT MEDIATION</span>
                    <span className="text-xs font-black text-white mt-0.5 block">ID: {selectedOrder.id}</span>
                  </div>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                <div className="p-3 bg-[#02040c] border border-white/[0.03] rounded-xl flex flex-col gap-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">BUYER:</span>
                    <span className="text-white">@{selectedOrder.buyerUsername} ({selectedOrder.buyerTelegramId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">SELLER:</span>
                    <span className="text-white">@{selectedOrder.sellerUsername} ({selectedOrder.sellerTelegramId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">SELLER WALLET:</span>
                    <span className="text-amber-400 text-[9px] select-all font-bold">{selectedOrder.sellerWallet}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">PRODUCT:</span>
                    <span className="text-white font-bold">{selectedOrder.productName} ({selectedOrder.productCategory})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">AMOUNT ESCROWED:</span>
                    <span className="text-green-400 font-extrabold">₹{selectedOrder.productPrice} INR (Commission: ₹{(selectedOrder.productPrice * 0.05).toFixed(1)})</span>
                  </div>
                </div>

                {/* Support Link editor */}
                <div className="flex flex-col gap-1 bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-[8px] text-neutral-400 font-bold uppercase font-mono">Set Telegram Deal Group Link *</span>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      id="admin-deal-link"
                      defaultValue={selectedOrder.dealGroupLink || ""}
                      placeholder="https://t.me/c/123456/78"
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-white/[0.05] rounded-lg text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById("admin-deal-link") as HTMLInputElement;
                        if (el) {
                          handleUpdateOrderStatus(selectedOrder.id, selectedOrder.status, el.value);
                          alert("Telegram Deal Group link updated inside DB & alerts dispatched!");
                        }
                      }}
                      className="px-3 py-1.5 rounded bg-white hover:bg-zinc-200 text-black font-black uppercase text-[8px] tracking-wider cursor-pointer font-mono"
                    >
                      Save Group
                    </button>
                  </div>
                </div>

                {/* Mediation Actions */}
                <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
                  <span className="text-[8px] text-neutral-500 font-bold uppercase font-mono tracking-widest block">ADMIN FORCE STATUS OVERRIDES</span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[9px]">
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, "delivering")}
                      disabled={adminActionLoading}
                      className="py-2 rounded bg-blue-900/30 border border-blue-500/30 text-blue-300 font-bold uppercase cursor-pointer"
                    >
                      💰 Confirm Payment (Wait → Deliver)
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, "completed")}
                      disabled={adminActionLoading}
                      className="py-2 rounded bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 font-bold uppercase cursor-pointer"
                    >
                      🎉 Force Pay Seller (Complete)
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, "disputed")}
                      disabled={adminActionLoading}
                      className="py-2 rounded bg-rose-900/30 border border-rose-500/30 text-rose-300 font-bold uppercase cursor-pointer"
                    >
                      ⚠️ Place Dispute (Mediate)
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, "cancelled")}
                      disabled={adminActionLoading}
                      className="py-2 rounded bg-slate-900 border border-slate-700/50 text-neutral-400 font-bold uppercase cursor-pointer"
                    >
                      ❌ Cancel Deal (Refund)
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        fetchOrderDetails(e.target.value);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-white/[0.05] rounded-xl text-xs text-white"
                  >
                    <option value="">-- Jump to another Escrow Deal --</option>
                    {adminOrders.map((o) => (
                      <option key={o.id} value={o.id}>{o.productName} (ID: {o.id.substring(0,6)})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Case D: Platform Analytics Stats */}
            {prodCategory === "stats" && (
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 bg-[#02040c]/40 border border-white/[0.03] rounded-xl flex flex-col font-mono text-[9px]">
                  <span className="text-neutral-500 uppercase">Gross Platform Sales</span>
                  <span className="text-[14px] font-black text-white mt-1">₹{adminStats?.totalSalesVolume ?? 0} INR</span>
                </div>
                <div className="p-4 bg-[#02040c]/40 border border-white/[0.03] rounded-xl flex flex-col font-mono text-[9px]">
                  <span className="text-neutral-500 uppercase">Platform Commissions (5%)</span>
                  <span className="text-[14px] font-black text-white mt-1">₹{adminStats?.totalCommissionFees ?? 0} INR</span>
                </div>
                <div className="p-4 bg-[#02040c]/40 border border-white/[0.03] rounded-xl flex flex-col font-mono text-[9px]">
                  <span className="text-neutral-500 uppercase">Approved Sellers</span>
                  <span className="text-[14px] font-black text-white mt-1">{adminStats?.activeSellersCount ?? 0} Sellers</span>
                </div>
                <div className="p-4 bg-[#02040c]/40 border border-white/[0.03] rounded-xl flex flex-col font-mono text-[9px]">
                  <span className="text-neutral-500 uppercase">Listed Products</span>
                  <span className="text-[14px] font-black text-white mt-1">{adminStats?.totalProductsCount ?? 0} Items</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  const vpnProducts = PRODUCTS.filter(p => p.category === "VPN");
  const ottProducts = PRODUCTS.filter(p => p.category === "OTT");
  const igProducts = PRODUCTS.filter(p => p.category === "Instagram");

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchCat = p.category === selectedCategory;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col gap-4 p-4 min-h-[85vh] select-none text-left">
      {/* Premium Header */}
      <div id="shop-header" className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
        <div>
          <span className="font-sans font-black tracking-widest text-base bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500 block uppercase">
            AeroX Peer-to-Peer Market
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono mt-0.5">
            SECURED ESCROW & DEALS ROOM
          </span>
        </div>
        {/* Dynamic Credits Display */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          <Coins className="w-3.5 h-3.5 text-zinc-300 animate-pulse" />
          <span className="text-[10px] font-black tracking-wider text-white font-mono">
            {credits} CR
          </span>
        </div>
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

      {true ? (
        renderMarketplace()
      ) : activeTab === "explore" ? (
        <div className="flex flex-col gap-4 pb-24">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search premium services..."
              className="w-full pl-10 pr-12 py-2.5 bg-zinc-900/50 border border-white/[0.06] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all font-sans"
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
              { id: "AI" as const, label: "AI & Dev", icon: Bot },
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
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-[#1c1c1e]/50 border-white/[0.05] text-zinc-400 hover:text-white"
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
                      ? "border-white/25 bg-zinc-900/60"
                      : "border-white/[0.05] hover:border-white/15 hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] rounded-full blur-2xl pointer-events-none group-hover:bg-white/[0.03] transition-colors" />

                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="p-1 bg-[#02040c]/80 rounded-xl border border-white/[0.03]">
                        {getIcon(p.id, isSelected, "w-10 h-10")}
                      </div>
                      
                      {p.badge && (
                        <span className="text-[7px] font-black tracking-wider text-white bg-white/5 px-2 py-0.5 rounded-full uppercase border border-white/10 max-w-[90px] truncate">
                          {p.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-white block group-hover:text-zinc-200 transition-colors leading-snug">
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
                      <span className="text-[10px] font-black text-white font-mono flex items-center gap-0.5 mt-0.5">
                        <Coins className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                        {p.price} CR
                      </span>
                    </div>

                    <div className={`p-1.5 rounded-lg border transition-all duration-300 ${
                      isSelected 
                        ? "bg-white border-transparent text-black" 
                        : "bg-white/5 border-white/[0.05] text-neutral-400 group-hover:text-white hover:bg-white/10"
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
                  className="w-full max-w-[480px] bg-[#1c1c1e] border-t border-white/[0.08] rounded-t-[2rem] p-6 shadow-2xl flex flex-col gap-5 text-left relative z-50 pb-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Drag Indicator Bar */}
                  <div className="w-12 h-1 bg-white/10 rounded-full mx-auto -mt-2 mb-2" />

                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-black rounded-2xl border border-white/[0.05]">
                        {getIcon(activeDetailProduct.id, true, "w-11 h-11")}
                      </div>
                      <div>
                        <span className="text-[8px] font-black tracking-widest text-zinc-400 uppercase font-mono block">
                          Secure Vault Licensing
                        </span>
                        <span className="text-xs font-black text-white block mt-0.5 leading-snug">
                          {activeDetailProduct.title}
                        </span>
                      </div>
                    </div>

                    <span className="text-[8px] font-bold tracking-widest text-white bg-white/5 px-2.5 py-1 rounded-full uppercase border border-white/10 font-mono">
                      {activeDetailProduct.stock}
                    </span>
                  </div>

                  {/* Description & Specs block */}
                  <div className="flex flex-col gap-3">
                    <div className="p-4 bg-black/60 rounded-2xl border border-white/[0.03] text-xs text-slate-400 leading-relaxed font-sans">
                      {activeDetailProduct.desc}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-black/40 border border-white/[0.03] rounded-xl flex flex-col">
                        <span className="text-[7.5px] text-neutral-500 font-bold uppercase tracking-wider font-mono">Dispatch Speed</span>
                        <span className="text-[10px] text-white font-extrabold mt-0.5 uppercase tracking-wide">Instant Delivery</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-white/10 rounded-xl flex flex-col">
                        <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Account Type</span>
                        <span className="text-[10px] text-zinc-200 font-extrabold mt-0.5 uppercase tracking-wide">Fully Secured</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer pricing & authorization checkout */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.04] mt-2">
                    <div className="flex flex-col">
                      <span className="text-[7.5px] text-neutral-500 uppercase tracking-widest font-black font-mono">Authoritative Price</span>
                      <span className="text-sm font-black text-white font-mono flex items-center gap-1 mt-0.5">
                        <Coins className="w-4 h-4 text-zinc-300" />
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
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-[0_4px_12px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.25)]"
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
      ) : activeTab === "vault" ? (
        /* My Vault Tab */
        <div className="flex flex-col gap-4 pb-20">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-white" />
            <span className="text-xs text-neutral-300 font-black tracking-widest uppercase font-mono">
              Secured Purchases Archive
            </span>
          </div>

          {loadingPurchases ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-5 h-5 text-neutral-400 animate-spin" />
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                Unlocking Vault Archives...
              </span>
            </div>
          ) : purchases.length > 0 ? (
            <div className="flex flex-col gap-3">
              {purchases.map((pur) => (
                <div 
                  key={pur.id}
                  className="p-4 rounded-xl bg-slate-950/50 border border-white/[0.04] hover:border-white/10 transition-all duration-200 flex flex-col gap-3"
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
                      <span className="text-xs font-black text-white font-mono mt-0.5">
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
                        className="px-2.5 py-1.5 rounded bg-white/[0.03] border border-white/[0.05] text-white hover:bg-white/[0.08] transition-all text-[8px] font-black tracking-wider uppercase cursor-pointer"
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
      ) : (
        /* Marketplace Tab */
        renderMarketplace()
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
                  <span className="text-[9px] text-zinc-400 font-black tracking-widest uppercase font-mono block">
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
                  <span className="text-xs font-black text-white">
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
                    <span className="text-[9px] text-zinc-400 font-black tracking-widest uppercase font-mono block">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/[0.06] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all font-mono"
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
                              <span className="text-xs font-bold text-neutral-100 block truncate group-hover:text-white transition-colors">
                                {p.title}
                              </span>
                              <span className="text-[9px] text-neutral-400 block truncate font-mono mt-0.5">
                                {p.stock} • {p.badge}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-mono">Price</span>
                            <span className="text-[11px] font-black text-white font-mono">
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
