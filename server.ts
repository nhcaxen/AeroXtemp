import express from "express";
import path from "path";
import net from "net";
import dns from "dns";
import http from "http";
import https from "https";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { generateCards, generateFakeAddress } from "./src/utils.js";
import { db } from "./src/db/index.js";
import { users, redeemCodes, redemptions, mailboxes } from "./src/db/schema.js";
import { eq, and, or, like, desc, sql } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

function getDbErrorMessage(err: any): string {
  if (!err) return "Unknown database error";
  let msg = err.message || String(err);
  if (err.cause) {
    const causeMsg = err.cause.message || String(err.cause);
    msg = `${causeMsg} (${msg})`;
  }
  return msg;
}

// Lazy Supabase Initializer with fallback to user's credentials
let supabaseClient: any = null;
function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || "https://hvbgbabwrjapzozxtgrv.supabase.co";
    const key = process.env.SUPABASE_ANON_KEY || "sb_publishable_tdvnWMRngGv8s_HdEEK2KA_jecAuT90";
    if (url && key) {
      console.log("[SUPABASE] Initializing client with:", url);
      supabaseClient = createClient(url, key);
    } else {
      console.warn("[SUPABASE WARNING] Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
    }
  }
  return supabaseClient;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Database connection check and automatic schema creation on startup
  try {
    await db.execute(sql`SELECT 1;`);
    console.log("[DB] Database connection verified successfully.");
  } catch (err: any) {
    console.warn("[DB WARNING] Database connection verification failed:", err.message);
  }

  console.log("[DB] Running automatic database schema check & table creation...");
  
  // 1. Create users table
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id TEXT UNIQUE,
        username TEXT,
        first_name TEXT,
        role TEXT DEFAULT 'free',
        plan TEXT DEFAULT 'free',
        credits INTEGER DEFAULT 20,
        joined_at TEXT,
        last_active TEXT,
        photo_url TEXT,
        total_recoveries INTEGER DEFAULT 0,
        referrer_id TEXT,
        credit_reset_time TEXT,
        plan_expiry TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("[DB] Verified users table exists.");
  } catch (err: any) {
    console.warn("[DB WARNING] Skip users table creation/verification:", err.message);
  }

  // 2. Create redeem_codes table
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS redeem_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE,
        credits INTEGER DEFAULT 0,
        expires_at TEXT,
        max_uses INTEGER DEFAULT 1,
        used_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by TEXT,
        plan TEXT,
        role TEXT,
        duration_days INTEGER
      );
    `);
    console.log("[DB] Verified redeem_codes table exists.");
  } catch (err: any) {
    console.warn("[DB WARNING] Skip redeem_codes table creation/verification:", err.message);
  }

  // 3. Create redemptions table
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS redemptions (
        id SERIAL PRIMARY KEY,
        code TEXT,
        telegram_id TEXT,
        username TEXT,
        redeemed_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("[DB] Verified redemptions table exists.");
  } catch (err: any) {
    console.warn("[DB WARNING] Skip redemptions table creation/verification:", err.message);
  }

  // 4. Create mailboxes table
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mailboxes (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(telegram_id),
        provider TEXT DEFAULT 'Mail.tm',
        email TEXT UNIQUE,
        password TEXT,
        access_token TEXT,
        refresh_token TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_access TIMESTAMP DEFAULT NOW(),
        last_refresh TIMESTAMP DEFAULT NOW(),
        status TEXT DEFAULT 'active'
      );
    `);
    console.log("[DB] Verified mailboxes table exists.");
  } catch (err: any) {
    console.warn("[DB WARNING] Skip mailboxes table creation/verification:", err.message);
  }

  // --- Helper to compute IP Trust & Fraud Risk Score ---
  function calculateIpScore(isp: string, countryCode: string, isProxy: boolean = false): {
    score: number; // 0 (Trusted) to 100 (High Risk)
    type: string;  // Residential, Mobile/Cellular, Datacenter/Hosting, Corporate
    anonymity: "Low" | "Medium" | "High";
    threatLevel: "Safe" | "Low Risk" | "Medium Risk" | "Dangerous";
    flags: string[];
  } {
    const cleanIsp = (isp || "").toLowerCase();
    let score = 5; 
    let type = "Residential";
    let anonymity: "Low" | "Medium" | "High" = "Low";
    const flags: string[] = [];

    // 1. Detect hosting/datacenter/VPN/Proxy keywords
    const hostingKeywords = [
      "amazon", "aws", "google cloud", "google llc", "digitalocean", "hetzner", "ovh", "m247", 
      "linode", "contabo", "cloudflare", "hosting", "server", "datacenter", "data center",
      "colocation", "leaseweb", "vultr", "scaleway", "kamatera", "fastly", "akamai",
      "zenlayer", "nexus", "cogent", "gtt", "tata", "choopa", "host", "vpn", "proxy", "tor", "anonym"
    ];

    const mobileKeywords = [
      "lte", "4g", "5g", "mobile", "cellular", "telecom", "vodafone", "t-mobile", "reliance jio", 
      "airtel", "idea", "orange", "at&t wireless", "verizon wireless", "sprint", "softbank", "singtel"
    ];

    const isHosting = hostingKeywords.some(keyword => cleanIsp.includes(keyword));
    const isMobile = mobileKeywords.some(keyword => cleanIsp.includes(keyword));

    if (isHosting) {
      type = "Datacenter/Hosting";
      score = 82 + Math.floor(Math.random() * 15); // High risk: 82 - 97
      anonymity = "High";
      flags.push("Commercial Cloud/Hosting Network Range Detected");
      flags.push("High Likelihood of Active VPN Tunnel/Proxy Server");
    } else if (isMobile) {
      type = "Mobile/Cellular";
      score = 10 + Math.floor(Math.random() * 10); 
      anonymity = "Low";
      flags.push("Dynamic CGNAT Mobile Carrier IP");
    } else {
      type = "Residential";
      score = 3 + Math.floor(Math.random() * 8); // Clean: 3 - 11
      anonymity = "Low";
      flags.push("Standard Consumer ISP Block");
    }

    if (isProxy) {
      score = Math.min(100, score + 12);
      anonymity = "High";
      if (!flags.includes("Proxy Server Route Match")) {
        flags.push("Probed via manual connection endpoint");
      }
    }

    const highRiskCountries = ["NG", "CN", "RU", "KP", "IR", "SY"];
    if (highRiskCountries.includes(countryCode)) {
      score = Math.min(99, score + 8);
      flags.push("High volume transaction country range");
    }

    let threatLevel: "Safe" | "Low Risk" | "Medium Risk" | "Dangerous" = "Safe";
    if (score < 20) {
      threatLevel = "Safe";
    } else if (score < 45) {
      threatLevel = "Low Risk";
    } else if (score < 75) {
      threatLevel = "Medium Risk";
    } else {
      threatLevel = "Dangerous";
    }

    return {
      score,
      type,
      anonymity,
      threatLevel,
      flags
    };
  }

  function isPrivateIp(ip: string): boolean {
    if (!ip) return true;
    const parts = ip.split(".");
    if (parts.length !== 4) {
      return ip === "::1" || ip === "127.0.0.1" || ip.startsWith("fe80:") || ip.startsWith("fc00:") || ip.startsWith("fd00:");
    }
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);
    if (first === 10) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    if (first === 127) return true;
    return false;
  }

  // --- API Routes ---

  // API to list all local MP3/M4A/AAC files available in public/music
  app.get("/api/music/list", async (req, res) => {
    try {
      const musicDir = path.join(process.cwd(), "public", "music");
      if (!fs.existsSync(musicDir)) {
        return res.json({ tracks: [] });
      }

      const files = await fs.promises.readdir(musicDir);
      const audioExtensions = [".mp3", ".m4a", ".aac"];
      const audioFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return audioExtensions.includes(ext);
      });

      const tracks = audioFiles.map(file => {
        const ext = path.extname(file);
        const baseName = path.basename(file, ext);
        const title = baseName
          .split(/[-_]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return {
          title: title,
          artist: "AeroX Radio",
          url: `/music/${file}`
        };
      });

      return res.json({ tracks });
    } catch (err) {
      console.error("[MUSIC API ERROR] Failed to list tracks:", err);
      return res.status(500).json({ error: "Failed to load music files." });
    }
  });

  // API to fetch and redirect/stream Telegram User Avatar dynamically
  app.get("/api/telegram/avatar/:telegramId", async (req, res) => {
    const { telegramId } = req.params;
    const botToken = process.env.BOT_TOKEN;

    if (!botToken || !telegramId) {
      return res.status(400).send("Missing Bot Token or User ID");
    }

    try {
      // 1. Get user profile photos list
      const photosRes = await fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${telegramId}&limit=1`);
      if (!photosRes.ok) {
        throw new Error("Failed to get profile photos from Telegram API");
      }

      const photosData = await photosRes.json();
      if (!photosData.ok || !photosData.result || photosData.result.total_count === 0) {
        return res.status(404).send("No profile photos found");
      }

      // Extract file_id of the smallest/medium photo size
      const photoSizes = photosData.result.photos[0];
      const photoSizeObj = photoSizes[1] || photoSizes[0]; // Medium or small size
      const fileId = photoSizeObj.file_id;

      // 2. Get file path details
      const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
      if (!fileRes.ok) {
        throw new Error("Failed to get file path from Telegram API");
      }

      const fileData = await fileRes.json();
      if (!fileData || !fileData.ok || !fileData.result || !fileData.result.file_path) {
        throw new Error("Invalid file details returned");
      }

      const filePath = fileData.result.file_path;
      const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

      // 3. Stream photo directly to client (handles referer and CORS)
      const imageRes = await fetch(downloadUrl);
      if (imageRes.ok) {
        const contentType = imageRes.headers.get("content-type") || "image/jpeg";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=86400"); // cache for 1 day
        const arrayBuffer = await imageRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return res.send(buffer);
      } else {
        throw new Error("Failed to retrieve image file");
      }
    } catch (err: any) {
      console.warn("[TELEGRAM AVATAR ERROR]:", err.message);
      return res.status(404).send("Avatar fetch failed");
    }
  });

  // Serve music folder statically with custom content-type overrides for .m4a and .aac files
  app.use("/music", (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    if (ext === ".m4a") {
      res.setHeader("Content-Type", "audio/mp4");
    } else if (ext === ".aac") {
      res.setHeader("Content-Type", "audio/aac");
    } else if (ext === ".mp3") {
      res.setHeader("Content-Type", "audio/mpeg");
    }
    next();
  }, express.static(path.join(process.cwd(), "public", "music")));

  // --- High-Performance Multi-Provider Geolocation & Trust Scanner ---
  async function getIpDetails(clientIp: string) {
    const details = {
      ipAddress: clientIp,
      ipVersion: clientIp.includes(":") ? "IPv6" : "IPv4",
      country: "",
      countryCode: "",
      region: "",
      city: "",
      zip: "",
      lat: 0,
      lon: 0,
      timezone: "",
      isp: "",
      org: "",
      asn: "",
      isProxy: false,
      isVpn: false,
      isTor: false,
      isHosting: false,
      isMobile: false
    };

    let success = false;

    // Fast robust fetch helper with custom AbortController timeout
    async function fetchWithTimeout(url: string, timeout = 3000) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    }

    // Provider A: freeipapi.com
    try {
      const res = await fetchWithTimeout(`https://freeipapi.com/api/json/${clientIp}`, 3000);
      if (res.ok) {
        const json = await res.json();
        if (json && json.ipAddress) {
          details.country = json.countryName || "";
          details.countryCode = json.countryCode || "";
          details.region = json.regionName || "";
          details.city = json.cityName || "";
          details.zip = json.zipCode || "";
          details.lat = typeof json.latitude === "number" ? json.latitude : parseFloat(json.latitude || "0");
          details.lon = typeof json.longitude === "number" ? json.longitude : parseFloat(json.longitude || "0");
          details.timezone = json.timeZone || "";
          details.asn = json.asn ? `AS${json.asn}` : "";
          details.isp = json.org || "";
          details.org = json.org || "";
          details.isProxy = !!json.isProxy;
          details.isVpn = !!json.isVpn;
          details.isTor = !!json.isTor;
          details.isHosting = !!json.isHosting;
          details.isMobile = !!json.isMobile;
          success = true;
        }
      }
    } catch (err: any) {
      console.warn(`[IP CHECK] Provider A (freeipapi) failed: ${err.message}`);
    }

    // Provider B: ip-api.com
    if (!success || !details.country || !details.isp) {
      try {
        const res = await fetchWithTimeout(`http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, 3000);
        if (res.ok) {
          const json = await res.json();
          if (json && json.status === "success") {
            details.country = details.country || json.country || "";
            details.countryCode = details.countryCode || json.countryCode || "";
            details.region = details.region || json.regionName || json.region || "";
            details.city = details.city || json.city || "";
            details.zip = details.zip || json.zip || "";
            details.lat = details.lat || json.lat || 0;
            details.lon = details.lon || json.lon || 0;
            details.timezone = details.timezone || json.timezone || "";
            details.isp = details.isp || json.isp || json.org || "";
            details.org = details.org || json.org || "";
            details.asn = details.asn || json.as || "";
            success = true;
          }
        }
      } catch (err: any) {
        console.warn(`[IP CHECK] Provider B (ip-api) failed: ${err.message}`);
      }
    }

    // Provider C: ipapi.co
    if (!success || !details.country || !details.isp) {
      try {
        const res = await fetchWithTimeout(`https://ipapi.co/${clientIp}/json/`, 3000);
        if (res.ok) {
          const json = await res.json();
          if (json && !json.error) {
            details.country = details.country || json.country_name || "";
            details.countryCode = details.countryCode || json.country_code || "";
            details.region = details.region || json.region || "";
            details.city = details.city || json.city || "";
            details.zip = details.zip || json.postal || "";
            details.lat = details.lat || json.latitude || 0;
            details.lon = details.lon || json.longitude || 0;
            details.timezone = details.timezone || json.timezone || "";
            details.isp = details.isp || json.org || "";
            details.org = details.org || json.org || "";
            details.asn = details.asn || json.asn || "";
            success = true;
          }
        }
      } catch (err: any) {
        console.warn(`[IP CHECK] Provider C (ipapi.co) failed: ${err.message}`);
      }
    }

    // Provider D: ipinfo.io
    if (!success || !details.country || !details.isp) {
      try {
        const res = await fetchWithTimeout(`https://ipinfo.io/${clientIp}/json`, 3000);
        if (res.ok) {
          const json = await res.json();
          if (json && json.ip) {
            details.country = details.country || json.country || "";
            details.countryCode = details.countryCode || json.country || "";
            details.region = details.region || json.region || "";
            details.city = details.city || json.city || "";
            details.zip = details.zip || json.postal || "";
            details.timezone = details.timezone || json.timezone || "";
            details.isp = details.isp || json.org || "";
            details.org = details.org || json.org || "";
            if (json.loc) {
              const [lt, ln] = json.loc.split(",");
              details.lat = details.lat || parseFloat(lt || "0");
              details.lon = details.lon || parseFloat(ln || "0");
            }
            success = true;
          }
        }
      } catch (err: any) {
        console.warn(`[IP CHECK] Provider D (ipinfo) failed: ${err.message}`);
      }
    }

    // Local IP check
    if (isPrivateIp(clientIp)) {
      details.country = "Local Loopback";
      details.countryCode = "LOCALHOST";
      details.region = "Internal";
      details.city = "Local Network";
      details.timezone = "UTC";
      details.isp = "Local Intranet Provider";
      details.org = "IANA Localhost";
      details.asn = "AS000";
      success = true;
    }

    // Heuristic normalization for security flags
    const cleanIsp = (details.isp || details.org || "").toLowerCase();
    const cleanOrg = (details.org || "").toLowerCase();

    const hostingKeywords = [
      "amazon", "aws", "google", "digitalocean", "hetzner", "ovh", "m247", "linode", "vultr", 
      "hosting", "server", "datacenter", "data center", "colocation", "leaseweb", "vultr", 
      "scaleway", "kamatera", "fastly", "akamai", "zenlayer", "nexus", "cogent", "gtt", "tata", 
      "choopa", "host", "vpn", "proxy", "tor", "anonym", "tunnel"
    ];
    const mobileKeywords = [
      "lte", "4g", "5g", "mobile", "cellular", "telecom", "vodafone", "t-mobile", "reliance jio", 
      "airtel", "idea", "orange", "at&t wireless", "verizon wireless", "sprint", "softbank", "singtel"
    ];

    if (!details.isHosting) {
      details.isHosting = hostingKeywords.some(kw => cleanIsp.includes(kw) || cleanOrg.includes(kw));
    }
    if (!details.isProxy) {
      details.isProxy = cleanIsp.includes("proxy") || cleanIsp.includes("anonym") || cleanOrg.includes("proxy");
    }
    if (!details.isVpn) {
      details.isVpn = cleanIsp.includes("vpn") || cleanIsp.includes("tunnel") || cleanOrg.includes("vpn");
    }
    if (!details.isTor) {
      details.isTor = cleanIsp.includes("tor-exit") || cleanIsp.includes("onion");
    }
    if (!details.isMobile) {
      details.isMobile = mobileKeywords.some(kw => cleanIsp.includes(kw) || cleanOrg.includes(kw));
    }

    // If still missing any important metadata, fill with generic safe values instead of empty
    details.country = details.country || "United States";
    details.countryCode = details.countryCode || "US";
    details.region = details.region || "California";
    details.city = details.city || "San Francisco";
    details.timezone = details.timezone || "America/Los_Angeles";
    details.isp = details.isp || "Standard Consumer ISP";
    details.org = details.org || "Standard Access Provider";
    details.asn = details.asn || "AS15169";

    return details;
  }

  // Auto fetch IP details for the user client (proxied geo lookup)
  app.get("/api/ip-info", async (req, res) => {
    try {
      // Get client IP address from request headers or fallback
      let clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      if (Array.isArray(clientIp)) {
        clientIp = clientIp[0];
      }
      if (clientIp.includes(",")) {
        clientIp = clientIp.split(",")[0].trim();
      }
      // Remove IPv6 prefix if present
      if (clientIp.startsWith("::ffff:")) {
        clientIp = clientIp.substring(7);
      }

      // If local range or localhost, resolve the server's public IP first so we geolocate a real public IP
      if (isPrivateIp(clientIp)) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const ipifyRes = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
          clearTimeout(timeoutId);
          if (ipifyRes.ok) {
            const ipifyData = await ipifyRes.json();
            if (ipifyData && ipifyData.ip) {
              clientIp = ipifyData.ip;
            }
          }
        } catch (e) {
          console.warn("[IP INFO] Server IP resolve failed, attempting loopback.");
        }
      }

      // Query our new robust multi-provider geolocator
      const ipData = await getIpDetails(clientIp as string);

      // Reverse DNS Lookup (Hostname)
      let reverseDns = "";
      const targetIpForDns = String(ipData.ipAddress);
      if (targetIpForDns && !isPrivateIp(targetIpForDns)) {
        try {
          const hostnames = await new Promise<string[]>((resolve) => {
            dns.reverse(targetIpForDns, (err, addresses) => {
              if (err || !addresses) resolve([]);
              else resolve(addresses);
            });
          });
          reverseDns = hostnames[0] || "";
        } catch (e) {
          // ignore
        }
      }

      // Calculate Trust & Fraud risk score
      let score = 5;
      const flags: string[] = [];

      if (ipData.isTor) {
        score += 55;
        flags.push("TOR Detection: POSITIVE");
      } else {
        flags.push("TOR Detection: NEGATIVE");
      }

      if (ipData.isProxy) {
        score += 45;
        flags.push("Proxy Detection: POSITIVE");
      } else {
        flags.push("Proxy Detection: NEGATIVE");
      }

      if (ipData.isVpn) {
        score += 35;
        flags.push("VPN Detection: POSITIVE");
      } else {
        flags.push("VPN Detection: NEGATIVE");
      }

      if (ipData.isHosting) {
        score += 30;
        flags.push("Hosting/Datacenter Detection: POSITIVE");
      } else {
        flags.push("Hosting/Datacenter Detection: NEGATIVE");
      }

      if (ipData.isMobile) {
        score += 5;
        flags.push("Mobile Network: YES");
      } else {
        flags.push("Mobile Network: NO");
      }

      if (reverseDns) {
        flags.push(`Reverse DNS / Host: ${reverseDns}`);
        const cleanHost = reverseDns.toLowerCase();
        if (cleanHost.includes("vpn") || cleanHost.includes("proxy") || cleanHost.includes("tor") || cleanHost.includes("hosting") || cleanHost.includes("server")) {
          score += 15;
          flags.push("Suspicious Hostname Flag: POSITIVE");
        }
      } else {
        flags.push("Reverse DNS / Host: Not Found");
      }

      flags.push(`IP Version: ${ipData.ipVersion}`);
      flags.push(`Timezone: ${ipData.timezone}`);
      flags.push(`ASN Info: ${ipData.asn}`);
      flags.push(`Organization: ${ipData.org}`);
      flags.push(`Coordinates: ${ipData.lat.toFixed(4)}, ${ipData.lon.toFixed(4)}`);

      score = Math.min(100, score);

      let threatLevel: "Safe" | "Low Risk" | "Medium Risk" | "Dangerous" = "Safe";
      if (score < 20) {
        threatLevel = "Safe";
      } else if (score < 45) {
        threatLevel = "Low Risk";
      } else if (score < 75) {
        threatLevel = "Medium Risk";
      } else {
        threatLevel = "Dangerous";
      }

      const scoreDetails = {
        score,
        type: ipData.isHosting ? "Datacenter/Hosting" : ipData.isMobile ? "Mobile/Cellular" : "Residential",
        anonymity: (ipData.isProxy || ipData.isVpn || ipData.isTor) ? "High" : "Low",
        threatLevel,
        flags
      };

      return res.json({
        query: ipData.ipAddress,
        status: "success",
        country: ipData.country || "Unknown",
        countryCode: ipData.countryCode || "UN",
        city: ipData.region ? `${ipData.city}, ${ipData.region}` : (ipData.city || "Unknown"),
        isp: ipData.isp || "AEROX Network Provider",
        scoreDetails
      });
    } catch (err) {
      console.error("[IP INFO ERROR] Fatal:", err);
      const errDetails = {
        score: 10,
        type: "Residential",
        anonymity: "Low" as const,
        threatLevel: "Safe" as const,
        flags: ["Local Host Fallback Route Active"]
      };
      res.json({
        query: "127.0.0.1",
        status: "success",
        country: "India",
        countryCode: "IN",
        city: "Mumbai, Maharashtra",
        isp: "Local Access Network",
        scoreDetails: errDetails
      });
    }
  });

  // Proxy Helper functions for connection test and geo lookup
  function resolveHost(host: string): Promise<string> {
    return new Promise((resolve) => {
      dns.lookup(host, (err, address) => {
        if (err || !address) {
          resolve(host);
        } else {
          resolve(address);
        }
      });
    });
  }

  function testProxyTCP(host: string, port: number, timeoutMs = 4000): Promise<{ online: boolean; ping: number }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = new net.Socket();

      socket.setTimeout(timeoutMs);

      socket.on("connect", () => {
        const ping = Date.now() - startTime;
        socket.destroy();
        resolve({ online: true, ping });
      });

      const handleError = () => {
        socket.destroy();
        resolve({ online: false, ping: -1 });
      };

      socket.on("error", handleError);
      socket.on("timeout", handleError);

      socket.connect(port, host);
    });
  }

  // Probe SOCKS5 Protocol support
  function testSocks5(host: string, port: number, timeout = 2500): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);
      let resolved = false;

      socket.on("connect", () => {
        // Version 5, 1 Auth Method, No Auth
        socket.write(Buffer.from([0x05, 0x01, 0x00]));
      });

      socket.on("data", (data) => {
        if (resolved) return;
        if (data.length >= 2 && data[0] === 0x05) {
          resolved = true;
          socket.destroy();
          resolve(true);
        }
      });

      const handleError = () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      };

      socket.on("error", handleError);
      socket.on("timeout", handleError);
      socket.connect(port, host);
    });
  }

  // Probe SOCKS4 Protocol support
  function testSocks4(host: string, port: number, timeout = 2500): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);
      let resolved = false;

      socket.on("connect", () => {
        // Version 4, Command CONNECT, Port 80, Fake IP 0.0.0.1, UserId null
        socket.write(Buffer.from([0x04, 0x01, 0x00, 0x50, 0x00, 0x00, 0x00, 0x01, 0x00]));
      });

      socket.on("data", (data) => {
        if (resolved) return;
        if (data.length >= 2 && data[0] === 0x00 && (data[1] === 0x5a || data[1] === 0x5b)) {
          resolved = true;
          socket.destroy();
          resolve(true);
        }
      });

      const handleError = () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      };

      socket.on("error", handleError);
      socket.on("timeout", handleError);
      socket.connect(port, host);
    });
  }

  // Probe HTTP / HTTPS CONNECT capability
  function testHttpProxy(host: string, port: number, timeout = 2500): Promise<{ http: boolean; https: boolean }> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);
      let resolved = false;
      let supportsHttps = false;
      let supportsHttp = false;

      socket.on("connect", () => {
        socket.write("CONNECT google.com:443 HTTP/1.1\r\nHost: google.com:443\r\n\r\n");
      });

      socket.on("data", (data) => {
        if (resolved) return;
        const response = data.toString();
        if (response.includes("200 Connection") || response.includes("200 OK") || response.includes("HTTP/1.1 200") || response.includes("HTTP/1.0 200")) {
          supportsHttps = true;
          supportsHttp = true;
        } else if (response.includes("HTTP/")) {
          supportsHttp = true;
        }
        resolved = true;
        socket.destroy();
        resolve({ http: supportsHttp, https: supportsHttps });
      });

      const handleError = () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve({ http: false, https: false });
        }
      };

      socket.on("error", handleError);
      socket.on("timeout", handleError);
      socket.connect(port, host);
    });
  }

  // Parse proxy string (host:port, host:port:user:pass, user:pass@host:port)
  function parseProxyStr(proxyStr: string) {
    let clean = proxyStr.trim();
    let host = "";
    let port = 0;
    let user = "";
    let pass = "";

    if (clean.includes("://")) {
      try {
        const url = new URL(clean);
        host = url.hostname;
        port = parseInt(url.port) || 80;
        user = url.username;
        pass = url.password;
      } catch (e) {
        // fallthrough
      }
    }

    if (!host) {
      if (clean.includes("@")) {
        const parts = clean.split("@");
        const credentials = parts[0].split(":");
        user = credentials[0] || "";
        pass = credentials[1] || "";
        const hostPort = parts[1].split(":");
        host = hostPort[0] || "";
        port = parseInt(hostPort[1]) || 80;
      } else {
        const parts = clean.split(":");
        if (parts.length === 4) {
          host = parts[0];
          port = parseInt(parts[1]) || 80;
          user = parts[2];
          pass = parts[3];
        } else {
          host = parts[0];
          port = parseInt(parts[1]) || 80;
        }
      }
    }

    return { host, port, user, pass };
  }

  // Endpoint to check a proxy
  app.post("/api/proxy/check", async (req, res) => {
    const { proxy } = req.body;
    if (!proxy || typeof proxy !== "string") {
      return res.status(400).json({ error: "Proxy string is required" });
    }

    try {
      const parsed = parseProxyStr(proxy);
      if (!parsed.host || !parsed.port) {
        return res.json({ online: false, error: "Invalid proxy format" });
      }

      // 1. Connection check with TCP reachability and precise latency
      const connTest = await testProxyTCP(parsed.host, parsed.port);

      if (!connTest.online) {
        return res.json({
          online: false,
          host: parsed.host,
          port: parsed.port,
          ping: -1,
          info: { country: "OFFLINE", city: "OFFLINE", isp: "AEROX: CONNECTION TIMEOUT/REFUSED" },
          scoreDetails: {
            score: 100,
            type: "Unknown",
            anonymity: "Low",
            threatLevel: "Dangerous",
            flags: ["TCP Handshake: FAILED", "Proxy Connection: DEAD"]
          }
        });
      }

      // 2. Protocol probing in parallel for ultra high speed
      const [isSocks5, isSocks4, httpProbes] = await Promise.all([
        testSocks5(parsed.host, parsed.port),
        testSocks4(parsed.host, parsed.port),
        testHttpProxy(parsed.host, parsed.port)
      ]);

      // 3. Resolve host to IP and fetch geolocation info using our masterclass geolocator
      const resolvedIp = await resolveHost(parsed.host);
      const geoInfo = await getIpDetails(resolvedIp);

      // 4. Construct accurate Flags, Anonymity Level, SSL support, and Success Rate
      const flags: string[] = ["Proxy Handshake: SUCCESSFUL"];
      let detectedProtocol = "HTTP";

      if (isSocks5) {
        detectedProtocol = "SOCKS5";
        flags.push("Protocol: SOCKS5");
      }
      if (isSocks4) {
        detectedProtocol = "SOCKS4";
        flags.push("Protocol: SOCKS4");
      }
      if (httpProbes.http) {
        flags.push("Protocol: HTTP");
      }
      if (httpProbes.https) {
        flags.push("Protocol: HTTPS");
      }

      // If no protocol is detected yet but TCP connected, it's HTTP
      if (!isSocks5 && !isSocks4 && !httpProbes.http && !httpProbes.https) {
        flags.push("Protocol: HTTP (Inferred)");
      }

      // SSL Support Detection
      const hasSsl = httpProbes.https || parsed.port === 443 || parsed.port === 8443;
      flags.push(`SSL Tunnel Support: ${hasSsl ? "YES" : "NO"}`);

      // Anonymity Level calculation
      // SOCKS proxying is elite by default as headers are not passed. HTTP proxies can be Elite/Anonymous/Transparent
      let anonymityLevel: "Elite" | "Anonymous" | "Transparent" = "Elite";
      if (!isSocks5 && !isSocks4) {
        anonymityLevel = hasSsl ? "Elite" : "Anonymous";
      }
      flags.push(`Anonymity Level: ${anonymityLevel}`);

      // Success Rate calculation based on response speed
      const successRate = Math.round(Math.max(50, 100 - (connTest.ping / 60)));
      flags.push(`Estimated Success Rate: ${successRate}%`);

      // Resolved Real IP, Hostname and Location tags
      flags.push(`Server Real IP: ${resolvedIp}`);
      flags.push(`Proxy Port: ${parsed.port}`);
      if (geoInfo.countryCode !== "UN") {
        flags.push(`Geo Region: ${geoInfo.country}`);
      }

      // High-quality risk/threat details
      const score = Math.min(100, Math.max(5, Math.round((connTest.ping / 50) + ((anonymityLevel as string) === "Transparent" ? 40 : 10))));
      const threatLevel = score > 60 ? "Medium Risk" : "Low Risk";

      const scoreDetails = {
        score,
        type: `${detectedProtocol} Proxy`,
        anonymity: anonymityLevel === "Elite" ? "High" as const : "Medium" as const,
        threatLevel,
        flags
      };

      res.json({
        online: true,
        host: parsed.host,
        port: parsed.port,
        ping: connTest.ping,
        info: {
          country: geoInfo.country,
          city: geoInfo.city,
          isp: geoInfo.isp
        },
        scoreDetails
      });
    } catch (err) {
      console.error("[PROXY CHECK ERROR] Fatal:", err);
      res.json({
        online: false,
        error: "Internal AEROX proxy checker error"
      });
    }
  });

  // --- Real Free Temporary Mailbox (1SecMail API Proxies) ---

  // Generate a random email address
  app.get("/api/tempmail/random", async (req, res) => {
    try {
      const response = await fetch("https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data[0]) {
          return res.json({ email: data[0] });
        }
      }
      // fallback
      const fallbackUser = "dev_" + Math.random().toString(36).substring(2, 7);
      res.json({ email: `${fallbackUser}@1secmail.com` });
    } catch (err) {
      const fallbackUser = "dev_" + Math.random().toString(36).substring(2, 7);
      res.json({ email: `${fallbackUser}@1secmail.com` });
    }
  });

  // Fetch messages from a mailbox
  app.get("/api/tempmail/inbox", async (req, res) => {
    const { login, domain } = req.query;
    if (!login || !domain) {
      return res.status(400).json({ error: "Missing login and domain parameters" });
    }

    try {
      const url = `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return res.json({ messages: data });
      }
      res.json({ messages: [] });
    } catch (err) {
      res.json({ messages: [] });
    }
  });

  // Fetch full details of a specific message
  app.get("/api/tempmail/message", async (req, res) => {
    const { login, domain, id } = req.query;
    if (!login || !domain || !id) {
      return res.status(400).json({ error: "Missing login, domain, or message id parameters" });
    }

    try {
      const url = `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${id}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return res.json({ message: data });
      }
      res.status(404).json({ error: "Message not found" });
    } catch (err) {
      res.status(500).json({ error: "Failed to load message details" });
    }
  });

  // --- User Profile & Role System APIs ---
  const getOwnerId = () => {
    return process.env.OWNER_ID || "1817159548";
  };

  const resolveUserRoleAndPlan = (telegramId: string, dbRole: string | null, dbPlan: string | null) => {
    const ownerId = getOwnerId();
    const cleanOwnerId = String(ownerId).trim().replace(/['"]/g, "");
    const cleanTgId = String(telegramId).trim().replace(/['"]/g, "");

    if (
      cleanTgId === cleanOwnerId || 
      cleanTgId === "5834920194" || 
      cleanTgId === "1817159548"
    ) {
      return { role: "owner", plan: "owner" };
    }
    const plan = dbPlan || "free";
    const role = ["core", "prime", "elite", "premium"].includes(plan) ? "premium" : (dbRole || "free");
    return {
      role,
      plan
    };
  };

  app.get("/api/user-profile", async (req, res) => {
    const { telegramId, username, displayName, photoUrl, referrerId } = req.query;
    if (!telegramId || typeof telegramId !== "string") {
      return res.status(400).json({ error: "telegramId is required" });
    }

    try {
      const ownerId = getOwnerId();
      const cleanOwnerId = String(ownerId).trim().replace(/['"]/g, "");
      const cleanTgId = String(telegramId).trim().replace(/['"]/g, "");
      const isOwner = (cleanTgId === cleanOwnerId || cleanTgId === "5834920194" || cleanTgId === "1817159548");

      const today = new Date();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
      const formattedLastActive = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
      const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

      let [userRecord] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

      if (!userRecord) {
        let refIdClean: string | null = null;
        if (referrerId && typeof referrerId === "string") {
          const rawRef = referrerId.trim();
          refIdClean = rawRef.startsWith("ref_") ? rawRef.substring(4) : rawRef;
          if (refIdClean === telegramId) {
            refIdClean = null;
          }
        }

        // Create new record in database
        const [newUser] = await db.insert(users).values({
          telegramId,
          username: (username as string) || "Anonymous_User",
          firstName: (displayName as string) || "AeroX Guest",
          role: isOwner ? "owner" : "free",
          plan: isOwner ? "owner" : "free",
          credits: isOwner ? 999999 : 20, // New users get 20 credits/day for 7-day trial
          joinedAt: formattedDate,
          lastActive: formattedLastActive,
          photoUrl: (photoUrl as string) || null,
          referrerId: refIdClean,
          creditResetTime: todayStr,
          planExpiry: null
        }).returning();
        
        userRecord = newUser;

        // Process referral credit payout to referrer (+1 credit)
        if (refIdClean) {
          try {
            const [referrerRecord] = await db.select().from(users).where(eq(users.telegramId, refIdClean)).limit(1);
            if (referrerRecord) {
              const newRefCredits = (referrerRecord.credits || 0) + 1;
              await db.update(users).set({ credits: newRefCredits }).where(eq(users.telegramId, refIdClean));
              console.log(`[REFERRAL] Successfully credited +1 point to referrer ${refIdClean} from user ${telegramId}`);
            }
          } catch (refErr) {
            console.error("[REFERRAL ERROR] Failed to reward referrer:", refErr);
          }
        }
      } else {
        // Handle premium/paid plan expiry downgrade check
        let currentPlan = userRecord.plan || "free";
        let currentRole = userRecord.role || "free";
        let currentCredits = userRecord.credits ?? 20;
        let planExpiryVal = userRecord.planExpiry;
        let planExpired = false;

        const paidPlans = ["core", "prime", "elite", "premium"];
        if (paidPlans.includes(currentPlan) && planExpiryVal) {
          if (todayStr > planExpiryVal) {
            currentPlan = "free";
            currentRole = "free";
            planExpiryVal = null;
            planExpired = true;
            currentCredits = 20;
          }
        }

        // Handle daily credit reset for "free" plan only
        if (currentPlan === "free" && userRecord.creditResetTime !== todayStr) {
          currentCredits = 20;
          userRecord.creditResetTime = todayStr;
          await db.update(users).set({
            credits: 20,
            creditResetTime: todayStr
          }).where(eq(users.telegramId, telegramId));
        }

        // Update last active, username, photo, and validated membership status
        const resolved = resolveUserRoleAndPlan(telegramId, currentRole, currentPlan);
        const [updatedUser] = await db.update(users).set({
          lastActive: formattedLastActive,
          username: username ? (username as string) : userRecord.username,
          firstName: displayName ? (displayName as string) : userRecord.firstName,
          role: resolved.role,
          plan: resolved.plan,
          credits: currentCredits,
          planExpiry: planExpired ? null : userRecord.planExpiry,
          photoUrl: photoUrl !== undefined ? (photoUrl as string) : userRecord.photoUrl
        }).where(eq(users.telegramId, telegramId)).returning();

        userRecord = updatedUser;
      }

      const finalResolved = resolveUserRoleAndPlan(telegramId, userRecord.role, userRecord.plan);

      // Count mailboxes for profile/analytics
      const [allMailboxesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(mailboxes).where(eq(mailboxes.userId, telegramId));
      const [activeMailboxesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(mailboxes).where(and(eq(mailboxes.userId, telegramId), eq(mailboxes.status, "active")));
      const [deletedMailboxesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(mailboxes).where(and(eq(mailboxes.userId, telegramId), eq(mailboxes.status, "deleted")));

      // Count referrals
      const [referralsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.referrerId, telegramId));

      // Calculate reset timer countdown until UTC midnight
      const tomorrow = new Date();
      tomorrow.setUTCHours(24, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - Date.now();
      const hoursLeft = Math.floor(msUntilMidnight / (1000 * 60 * 60));
      const minutesLeft = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
      const resetTimer = `${hoursLeft}h ${minutesLeft}m`;

      // Calculate remaining trial days (7 days from registration)
      const userCreated = userRecord.createdAt ? new Date(userRecord.createdAt) : today;
      const diffTime = Math.max(0, today.getTime() - userCreated.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const trialDaysRemaining = Math.max(0, 7 - diffDays);

      return res.json({
        telegramId: userRecord.telegramId,
        username: userRecord.username,
        displayName: userRecord.firstName || userRecord.username || "AeroX Guest",
        role: finalResolved.role,
        plan: finalResolved.plan,
        credits: userRecord.credits,
        joined: userRecord.joinedAt,
        lastActive: userRecord.lastActive,
        photoUrl: userRecord.photoUrl,
        totalRecoveries: userRecord.totalRecoveries || 0,
        totalMailboxesCreated: allMailboxesCount?.count || 0,
        activeMailboxes: activeMailboxesCount?.count || 0,
        deletedMailboxes: deletedMailboxesCount?.count || 0,
        referralsCount: referralsCount?.count || 0,
        resetTimer,
        planExpiry: userRecord.planExpiry,
        trialDaysRemaining
      });
    } catch (err: any) {
      console.error("[DATABASE ERROR] get profile:", err);
      return res.status(500).json({ 
        error: "Failed to retrieve user profile from database",
        details: getDbErrorMessage(err)
      });
    }
  });

  app.post("/api/user-profile/update", async (req, res) => {
    const { telegramId, username, displayName, plan, credits } = req.body;
    if (!telegramId || typeof telegramId !== "string") {
      return res.status(400).json({ error: "telegramId is required" });
    }

    try {
      const ownerId = getOwnerId();
      const cleanOwnerId = String(ownerId).trim().replace(/['"]/g, "");
      const cleanTgId = String(telegramId).trim().replace(/['"]/g, "");
      const isOwner = (cleanTgId === cleanOwnerId || cleanTgId === "5834920194" || cleanTgId === "1817159548");

      const today = new Date();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
      const formattedLastActive = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;

      let [userRecord] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

      if (!userRecord) {
        // Insert new
        const [newUser] = await db.insert(users).values({
          telegramId,
          username: username || "Anonymous_User",
          firstName: displayName || "AeroX Guest",
          role: isOwner ? "owner" : "free",
          plan: isOwner ? "owner" : "free",
          credits: typeof credits === "number" ? credits : 20,
          joinedAt: formattedDate,
          lastActive: formattedLastActive
        }).returning();
        
        userRecord = newUser;
      } else {
        // Update existing
        const updateData: any = {
          lastActive: formattedLastActive,
          username: username !== undefined ? username : userRecord.username,
          firstName: displayName !== undefined ? displayName : userRecord.firstName,
        };

        // ONLY allow OWNER to self-update their plan or credits via this user route
        if (isOwner) {
          if (plan !== undefined) {
            updateData.plan = plan;
            updateData.role = plan;
          }
          if (credits !== undefined) {
            updateData.credits = typeof credits === "number" ? credits : parseInt(credits, 10) || 0;
          }
        }

        const [updatedUser] = await db.update(users)
          .set(updateData)
          .where(eq(users.telegramId, telegramId))
          .returning();
        
        userRecord = updatedUser;
      }

      const finalResolved = resolveUserRoleAndPlan(telegramId, userRecord.role, userRecord.plan);

      return res.json({
        telegramId: userRecord.telegramId,
        username: userRecord.username,
        displayName: userRecord.firstName,
        role: finalResolved.role,
        plan: finalResolved.plan,
        credits: userRecord.credits,
        joined: userRecord.joinedAt,
        lastActive: userRecord.lastActive
      });
    } catch (err: any) {
      console.error("[DATABASE ERROR] update profile:", err);
      return res.status(500).json({ error: "Failed to update user profile in database" });
    }
  });

  app.post("/api/user-profile/upgrade", async (req, res) => {
    const { telegramId, plan } = req.body;
    if (!telegramId || !plan) {
      return res.status(400).json({ error: "telegramId and plan are required" });
    }

    const validPlans = ["free", "core", "prime", "elite"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }

    try {
      const [userRecord] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
      if (!userRecord) {
        return res.status(404).json({ error: "User not found" });
      }

      // Compute plan expiry
      let planExpiryVal: string | null = null;
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      if (plan !== "free") {
        let days = 7;
        if (plan === "core") days = 7;
        else if (plan === "prime") days = 14;
        else if (plan === "elite") days = 30;

        const expiryDate = new Date();
        expiryDate.setDate(today.getDate() + days);
        planExpiryVal = expiryDate.toISOString().split("T")[0];
      }

      // Reset credits according to plan (total credit pool)
      const planLimits: Record<string, number> = {
        free: 20,
        core: 300,
        prime: 600,
        elite: 1200,
        owner: 999999
      };
      const initialCredits = planLimits[plan] || 20;

      const [updatedUser] = await db.update(users)
        .set({
          plan,
          role: plan === "free" ? "free" : "premium",
          credits: initialCredits,
          planExpiry: planExpiryVal,
          creditResetTime: todayStr
        })
        .where(eq(users.telegramId, telegramId))
        .returning();

      // Recount mailboxes and referrals for complete return payload
      const [allMailboxesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(mailboxes).where(eq(mailboxes.userId, telegramId));
      const [activeMailboxesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(mailboxes).where(and(eq(mailboxes.userId, telegramId), eq(mailboxes.status, "active")));
      const [deletedMailboxesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(mailboxes).where(and(eq(mailboxes.userId, telegramId), eq(mailboxes.status, "deleted")));
      const [referralsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.referrerId, telegramId));

      // Calculate reset timer countdown until UTC midnight
      const tomorrow = new Date();
      tomorrow.setUTCHours(24, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - Date.now();
      const hoursLeft = Math.floor(msUntilMidnight / (1000 * 60 * 60));
      const minutesLeft = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
      const resetTimer = `${hoursLeft}h ${minutesLeft}m`;

      const userCreated = updatedUser.createdAt ? new Date(updatedUser.createdAt) : today;
      const diffTime = Math.max(0, today.getTime() - userCreated.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const trialDaysRemaining = Math.max(0, 7 - diffDays);

      return res.json({
        telegramId: updatedUser.telegramId,
        username: updatedUser.username,
        displayName: updatedUser.firstName || updatedUser.username || "AeroX Guest",
        role: updatedUser.role,
        plan: updatedUser.plan,
        credits: updatedUser.credits,
        joined: updatedUser.joinedAt,
        lastActive: updatedUser.lastActive,
        photoUrl: updatedUser.photoUrl,
        totalRecoveries: updatedUser.totalRecoveries || 0,
        totalMailboxesCreated: allMailboxesCount?.count || 0,
        activeMailboxes: activeMailboxesCount?.count || 0,
        deletedMailboxes: deletedMailboxesCount?.count || 0,
        referralsCount: referralsCount?.count || 0,
        resetTimer,
        planExpiry: updatedUser.planExpiry,
        trialDaysRemaining
      });
    } catch (err: any) {
      console.error("[DATABASE ERROR] upgrade plan:", err);
      return res.status(500).json({ error: "Failed to upgrade subscription plan" });
    }
  });

  // --- Admin Panel Security & Functionality APIs ---
  const isRequestFromOwner = (req: express.Request) => {
    const ownerId = getOwnerId();
    const adminId = req.headers["x-admin-id"] || req.query.adminId || req.body.adminId;
    
    const cleanOwnerId = String(ownerId).trim().replace(/['"]/g, "");
    const cleanAdminId = String(adminId).trim().replace(/['"]/g, "");
    
    const isOwner = (
      cleanAdminId === cleanOwnerId || 
      cleanAdminId === "5834920194" || 
      cleanAdminId === "1817159548"
    );
    
    console.log(`[AUTH CHECK] adminId: "${cleanAdminId}" | ownerId: "${cleanOwnerId}" | isOwner: ${isOwner}`);
    return isOwner;
  };

  // 1. Dashboard statistics
  app.get("/api/admin/dashboard-stats", async (req, res) => {
    if (!isRequestFromOwner(req)) {
      return res.status(403).json({ error: "Unauthorized. Owner only." });
    }

    try {
      const allUsers = await db.select().from(users);
      
      const totalUsers = allUsers.length;
      const premiumUsers = allUsers.filter(u => u.plan === "premium").length;
      const freeUsers = allUsers.filter(u => u.plan !== "premium" && u.plan !== "owner").length;
      const totalCredits = allUsers.reduce((sum, u) => sum + (u.credits || 0), 0);

      const allRedeemCodes = await db.select().from(redeemCodes);
      const redeemCodesCreated = allRedeemCodes.length;

      // Sort recently active users in code
      const recentUsers = [...allUsers]
        .sort((a, b) => {
          const dateA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
          const dateB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 10);

      res.json({
        totalUsers,
        premiumUsers,
        freeUsers,
        totalCredits,
        redeemCodesCreated,
        recentUsers: recentUsers.map(u => ({
          telegramId: u.telegramId,
          username: u.username,
          displayName: u.firstName || u.username || "Anonymous",
          role: u.role,
          plan: u.plan,
          credits: u.credits,
          joined: u.joinedAt,
          lastActive: u.lastActive
        }))
      });
    } catch (err: any) {
      console.error("[ADMIN ERROR] Dashboard stats:", err);
      res.status(500).json({ error: "Failed to retrieve admin stats" });
    }
  });

  // 2. User Search
  app.get("/api/admin/users/search", async (req, res) => {
    if (!isRequestFromOwner(req)) {
      return res.status(403).json({ error: "Unauthorized. Owner only." });
    }

    const { query } = req.query;
    if (typeof query !== "string") {
      return res.status(400).json({ error: "Search query is required" });
    }

    try {
      const searchPattern = `%${query}%`;
      const matches = await db.select().from(users).where(
        or(
          like(users.telegramId, searchPattern),
          like(users.username, searchPattern),
          like(users.firstName, searchPattern)
        )
      ).limit(50);

      res.json({
        users: matches.map(u => ({
          telegramId: u.telegramId,
          username: u.username,
          displayName: u.firstName || u.username || "Anonymous",
          role: u.role,
          plan: u.plan,
          credits: u.credits,
          joined: u.joinedAt,
          lastActive: u.lastActive
        }))
      });
    } catch (err: any) {
      console.error("[ADMIN ERROR] Search users:", err);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // 3. Give/Remove Premium
  app.post("/api/admin/users/update-premium", async (req, res) => {
    if (!isRequestFromOwner(req)) {
      return res.status(403).json({ error: "Unauthorized. Owner only." });
    }

    const { telegramId, action } = req.body;
    if (!telegramId || (action !== "give" && action !== "remove")) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    try {
      const targetPlan = action === "give" ? "premium" : "free";
      const targetRole = action === "give" ? "premium" : "free";

      const [updatedUser] = await db.update(users)
        .set({ plan: targetPlan, role: targetRole })
        .where(eq(users.telegramId, telegramId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        success: true,
        user: {
          telegramId: updatedUser.telegramId,
          username: updatedUser.username,
          displayName: updatedUser.firstName || updatedUser.username || "Anonymous",
          role: updatedUser.role,
          plan: updatedUser.plan,
          credits: updatedUser.credits,
          joined: updatedUser.joinedAt,
          lastActive: updatedUser.lastActive
        }
      });
    } catch (err: any) {
      console.error("[ADMIN ERROR] Update premium:", err);
      res.status(500).json({ error: "Failed to update user plan" });
    }
  });

  // 4. Update Credits (Add/Remove)
  app.post("/api/admin/users/update-credits", async (req, res) => {
    if (!isRequestFromOwner(req)) {
      return res.status(403).json({ error: "Unauthorized. Owner only." });
    }

    const { telegramId, amount, action, reason } = req.body;
    if (!telegramId || typeof amount !== "number" || (action !== "add" && action !== "remove")) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    try {
      const [userRecord] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
      if (!userRecord) {
        return res.status(404).json({ error: "User not found" });
      }

      let newCredits = userRecord.credits || 0;
      if (action === "add") {
        newCredits += amount;
      } else {
        newCredits = Math.max(0, newCredits - amount);
      }

      const [updatedUser] = await db.update(users)
        .set({ credits: newCredits })
        .where(eq(users.telegramId, telegramId))
        .returning();

      res.json({
        success: true,
        user: {
          telegramId: updatedUser.telegramId,
          username: updatedUser.username,
          displayName: updatedUser.firstName || updatedUser.username || "Anonymous",
          role: updatedUser.role,
          plan: updatedUser.plan,
          credits: updatedUser.credits,
          joined: updatedUser.joinedAt,
          lastActive: updatedUser.lastActive
        }
      });
    } catch (err: any) {
      console.error("[ADMIN ERROR] Update credits:", err);
      res.status(500).json({ error: "Failed to update credits" });
    }
  });

  // 5. Generate Redeem Code
  app.post("/api/admin/redeem/generate", async (req, res) => {
    if (!isRequestFromOwner(req)) {
      return res.status(403).json({ error: "Unauthorized. Owner only." });
    }

    let { credits, expiresAt, maxUses, plan, role, durationDays } = req.body;
    
    const numCredits = typeof credits !== "undefined" && credits !== null ? (typeof credits === "number" ? credits : parseInt(credits, 10)) : 0;
    const numMaxUses = typeof maxUses !== "undefined" && maxUses !== null ? (typeof maxUses === "number" ? maxUses : parseInt(maxUses, 10)) : 1;
    const numDurationDays = typeof durationDays !== "undefined" && durationDays !== null ? (typeof durationDays === "number" ? durationDays : parseInt(durationDays, 10)) : null;

    if (isNaN(numCredits) || isNaN(numMaxUses)) {
      return res.status(400).json({ error: "Credits and maxUses must be valid numbers" });
    }

    try {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const genSeg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const generatedCode = `AEROX-${genSeg()}-${genSeg()}`;

      await db.insert(redeemCodes).values({
        code: generatedCode,
        credits: numCredits,
        expiresAt: expiresAt || null,
        maxUses: numMaxUses,
        usedCount: 0,
        createdBy: "owner",
        plan: plan || null,
        role: role || null,
        durationDays: numDurationDays
      });

      res.json({
        success: true,
        code: {
          code: generatedCode,
          credits: numCredits,
          expiresAt,
          maxUses: numMaxUses,
          usedCount: 0,
          plan: plan || null,
          role: role || null,
          durationDays: numDurationDays
        }
      });
    } catch (err: any) {
      console.error("[ADMIN ERROR] Generate redeem code:", err);
      res.status(500).json({ error: "Failed to generate redeem code" });
    }
  });

  // 6. List Redeem Codes
  app.get("/api/admin/redeem/list", async (req, res) => {
    if (!isRequestFromOwner(req)) {
      return res.status(403).json({ error: "Unauthorized. Owner only." });
    }

    try {
      const codesList = await db.select().from(redeemCodes).orderBy(desc(redeemCodes.createdAt));
      res.json({ codes: codesList });
    } catch (err: any) {
      console.error("[ADMIN ERROR] List redeem codes:", err);
      res.status(500).json({ error: "Failed to list redeem codes" });
    }
  });

  // 6a. Disable Redeem Code
  app.post("/api/admin/redeem/disable", async (req, res) => {
    if (!isRequestFromOwner(req)) {
      return res.status(403).json({ error: "Unauthorized. Owner only." });
    }

    const { codeId } = req.body;
    if (!codeId) {
      return res.status(400).json({ error: "codeId is required" });
    }

    try {
      const [codeRecord] = await db.select().from(redeemCodes).where(eq(redeemCodes.id, codeId)).limit(1);
      if (!codeRecord) {
        return res.status(404).json({ error: "Redeem code not found" });
      }

      await db.update(redeemCodes)
        .set({ maxUses: codeRecord.usedCount })
        .where(eq(redeemCodes.id, codeId));

      res.json({ success: true, message: "Redeem code disabled successfully." });
    } catch (err: any) {
      console.error("[ADMIN ERROR] Disable redeem code:", err);
      res.status(500).json({ error: "Failed to disable redeem code" });
    }
  });

  // 6b. Delete Redeem Code
  app.post("/api/admin/redeem/delete", async (req, res) => {
    if (!isRequestFromOwner(req)) {
      return res.status(403).json({ error: "Unauthorized. Owner only." });
    }

    const { codeId } = req.body;
    if (!codeId) {
      return res.status(400).json({ error: "codeId is required" });
    }

    try {
      await db.delete(redeemCodes).where(eq(redeemCodes.id, codeId));
      res.json({ success: true, message: "Redeem code deleted successfully." });
    } catch (err: any) {
      console.error("[ADMIN ERROR] Delete redeem code:", err);
      res.status(500).json({ error: "Failed to delete redeem code" });
    }
  });

  // 7. Redeem Code (All Users)
  app.post("/api/redeem", async (req, res) => {
    const { code, telegramId, username } = req.body;
    if (!code || !telegramId) {
      return res.status(400).json({ error: "Code and telegramId are required" });
    }

    try {
      const cleanCode = String(code).trim().toUpperCase();

      const [redeemCode] = await db.select().from(redeemCodes).where(eq(redeemCodes.code, cleanCode)).limit(1);
      if (!redeemCode) {
        return res.status(400).json({ error: "Invalid code. Please check and try again." });
      }

      if (redeemCode.expiresAt) {
        const todayStr = new Date().toISOString().split("T")[0];
        if (todayStr > redeemCode.expiresAt) {
          return res.status(400).json({ error: "This code has expired." });
        }
      }

      if (redeemCode.usedCount >= redeemCode.maxUses) {
        return res.status(400).json({ error: "This code has reached maximum uses." });
      }

      const [existingRedemption] = await db.select().from(redemptions)
        .where(
          and(
            eq(redemptions.code, cleanCode),
            eq(redemptions.telegramId, telegramId)
          )
        ).limit(1);

      if (existingRedemption) {
        return res.status(400).json({ error: "You have already redeemed this code." });
      }

      const [userRecord] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
      if (!userRecord) {
        return res.status(400).json({ error: "User profile not found. Access the profile tab first." });
      }

      let updatedFields: any = {};
      let isPlanRedeem = false;
      let redeemedPlanName = "";
      let redeemedCredits = redeemCode.credits || 0;

      if (redeemCode.plan) {
        isPlanRedeem = true;
        redeemedPlanName = redeemCode.plan;

        // Calculate plan expiry date
        let planExpiryVal: string | null = null;
        if (redeemCode.durationDays && redeemCode.durationDays !== -1) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + redeemCode.durationDays);
          planExpiryVal = expiryDate.toISOString().split("T")[0];
        } else {
          planExpiryVal = "Never Expires";
        }

        // Standard credits for plans if not explicitly set
        if (redeemedCredits === 0) {
          const planLimits: Record<string, number> = {
            free: 20,
            core: 300,
            prime: 600,
            elite: 1200,
            owner: 999999
          };
          redeemedCredits = planLimits[redeemCode.plan] || 20;
        }

        updatedFields = {
          plan: redeemCode.plan,
          role: redeemCode.role || (redeemCode.plan === "owner" ? "owner" : "premium"),
          credits: redeemedCredits,
          planExpiry: planExpiryVal,
          creditResetTime: new Date().toISOString().split("T")[0]
        };
      } else {
        // Just standard credits code
        updatedFields = {
          credits: (userRecord.credits || 0) + redeemedCredits
        };
      }

      // Perform update on the user record
      await db.update(users).set(updatedFields).where(eq(users.telegramId, telegramId));

      // Update used count on redeem code
      await db.update(redeemCodes).set({ usedCount: redeemCode.usedCount + 1 }).where(eq(redeemCodes.id, redeemCode.id));

      // Insert redemptions log
      await db.insert(redemptions).values({
        code: cleanCode,
        telegramId,
        username: username || "Anonymous"
      });

      res.json({
        success: true,
        creditsAdded: redeemedCredits,
        newCredits: updatedFields.credits,
        isPlanRedeem,
        plan: redeemCode.plan,
        role: redeemCode.role,
        durationDays: redeemCode.durationDays
      });
    } catch (err: any) {
      console.error("[REDEEM ERROR] Redeem code:", err);
      res.status(500).json({ error: "An error occurred during code redemption" });
    }
  });

  // --- Mailbox Recovery System Backend Helper & Endpoints ---

  async function refreshMailboxToken(box: any) {
    console.log(`[Mail.tm] Refreshing token for email: ${box.email}`);
    const tokenRes = await fetch("https://api.mail.tm/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: box.email, password: box.password })
    });
    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      const newToken = tokenData.token;
      // Update token in DB
      await db.update(mailboxes).set({
        accessToken: newToken,
        lastRefresh: new Date()
      }).where(eq(mailboxes.id, box.id));
      return newToken;
    } else {
      throw new Error("Authentication failed with Mail.tm server.");
    }
  }

  async function getMailboxToken(box: any) {
    let token = box.accessToken;
    if (!token) {
      token = await refreshMailboxToken(box);
      return token;
    }
    try {
      const testRes = await fetch("https://api.mail.tm/messages", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (testRes.status === 401) {
        token = await refreshMailboxToken(box);
      }
    } catch (err) {
      token = await refreshMailboxToken(box);
    }
    return token;
  }

  // 0. Charge point for generating mailbox (costs 1 credit for FREE plan)
  app.post("/api/mailboxes/generate", async (req, res) => {
    const { telegramId: rawTelegramId } = req.body;
    if (!rawTelegramId) {
      return res.status(400).json({ error: "telegramId is required" });
    }
    
    const telegramId = String(rawTelegramId).trim();
    console.log(`[MAILBOX GEN] Attempting to charge user: "${telegramId}"`);

    try {
      const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "User profile not found. Access the profile tab first." });
      }

      let updatedCredits = user.credits || 0;
      const userPlan = user.plan || "free";
      
      if (userPlan !== "owner") {
        if (updatedCredits < 1) {
          return res.status(402).json({ 
            error: "Insufficient credits. Generating a new temporary mailbox costs 1 credit. Please upgrade your plan or redeem a code to get more credits!" 
          });
        }
        updatedCredits = Math.max(0, updatedCredits - 1);
        await db.update(users).set({ credits: updatedCredits }).where(eq(users.telegramId, telegramId));
      }

      return res.json({ success: true, credits: updatedCredits });
    } catch (err: any) {
      console.error("[RECOVERY ERROR] Generate mailbox charge:", err);
      // Detailed logging for debugging
      if (err.code) console.error("Error Code:", err.code);
      if (err.detail) console.error("Error Detail:", err.detail);
      if (err.hint) console.error("Error Hint:", err.hint);
      if (err.message) console.error("Error Message:", err.message);
      
      return res.status(500).json({ 
        error: "Failed to authorize mailbox generation.",
        details: getDbErrorMessage(err)
      });
    }
  });

  // 1. Save mailbox (Create/Register association)
  app.post("/api/mailboxes", async (req, res) => {
    const { telegramId, email, password, accessToken, provider } = req.body;
    if (!telegramId || !email || !password) {
      return res.status(400).json({ error: "telegramId, email, and password are required" });
    }

    try {
      const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "User profile not found. Access the profile tab first." });
      }

      // Check limits
      const activeBoxes = await db.select().from(mailboxes).where(
        and(
          eq(mailboxes.userId, telegramId),
          eq(mailboxes.status, "active")
        )
      );

      const limit = user.plan === "free" ? 5 : Infinity;
      if (activeBoxes.length >= limit) {
        return res.status(403).json({ 
          error: "Limit reached. FREE users can save up to 5 mailboxes. Upgrade to Premium for unlimited storage." 
        });
      }

      let creditsDeducted = false;
      let updatedCredits = user.credits || 0;
      const userPlan = user.plan || "free";

      const [existing] = await db.select().from(mailboxes).where(eq(mailboxes.email, email)).limit(1);
      
      if (userPlan !== "owner") {
        if (!existing || existing.status !== "active") {
          if (updatedCredits < 5) {
            return res.status(402).json({ 
              error: "Insufficient credits. Mailbox recovery costs 5 credits. Upgrade your plan or redeem a code!" 
            });
          }
          updatedCredits = Math.max(0, updatedCredits - 5);
          creditsDeducted = true;
        }
      }

      if (existing) {
        const [updated] = await db.update(mailboxes).set({
          userId: telegramId,
          password,
          accessToken: accessToken || existing.accessToken,
          status: "active",
          lastAccess: new Date(),
          lastRefresh: new Date()
        }).where(eq(mailboxes.id, existing.id)).returning();
        
        if (creditsDeducted) {
          await db.update(users).set({ credits: updatedCredits }).where(eq(users.telegramId, telegramId));
        }

        return res.json({ success: true, mailbox: updated });
      } else {
        const [inserted] = await db.insert(mailboxes).values({
          userId: telegramId,
          email,
          password,
          accessToken: accessToken || null,
          provider: provider || "Mail.tm",
          status: "active",
          createdAt: new Date(),
          lastAccess: new Date(),
          lastRefresh: new Date()
        }).returning();

        if (creditsDeducted) {
          await db.update(users).set({ credits: updatedCredits }).where(eq(users.telegramId, telegramId));
        }

        return res.json({ success: true, mailbox: inserted });
      }
    } catch (err: any) {
      console.error("[RECOVERY ERROR] Save mailbox:", err);
      return res.status(500).json({ error: "Failed to save mailbox configuration." });
    }
  });

  // 2. List user's active mailboxes with search and sort
  app.get("/api/mailboxes", async (req, res) => {
    const { telegramId, search, sort } = req.query;
    if (!telegramId || typeof telegramId !== "string") {
      return res.status(400).json({ error: "telegramId is required" });
    }

    try {
      const conditions = [
        eq(mailboxes.userId, telegramId),
        eq(mailboxes.status, "active")
      ];

      if (search && typeof search === "string") {
        const pattern = `%${search}%`;
        conditions.push(
          or(
            like(mailboxes.email, pattern),
            like(mailboxes.provider, pattern)
          )
        );
      }

      let list;
      if (sort === "oldest") {
        list = await db.select().from(mailboxes).where(and(...conditions)).orderBy(mailboxes.createdAt);
      } else {
        list = await db.select().from(mailboxes).where(and(...conditions)).orderBy(desc(mailboxes.createdAt));
      }
      return res.json({ mailboxes: list });
    } catch (err: any) {
      console.error("[RECOVERY ERROR] List mailboxes:", err);
      return res.status(500).json({ error: "Failed to retrieve saved mailboxes." });
    }
  });

  // 3. Delete mailbox (database deletion)
  app.post("/api/mailboxes/delete", async (req, res) => {
    const { id, telegramId } = req.body;
    if (!id || !telegramId) {
      return res.status(400).json({ error: "Mailbox id and telegramId are required" });
    }

    try {
      const [box] = await db.select().from(mailboxes).where(eq(mailboxes.id, id)).limit(1);
      if (!box) {
        return res.status(404).json({ error: "Mailbox not found" });
      }
      if (box.userId !== telegramId) {
        return res.status(403).json({ error: "Unauthorized access to this mailbox" });
      }

      await db.delete(mailboxes).where(eq(mailboxes.id, id));
      return res.json({ success: true });
    } catch (err: any) {
      console.error("[RECOVERY ERROR] Delete mailbox:", err);
      return res.status(500).json({ error: "Failed to delete mailbox." });
    }
  });

  // 4. Open recovered mailbox and charge credits
  app.post("/api/mailboxes/open", async (req, res) => {
    const { id, telegramId } = req.body;
    if (!id || !telegramId) {
      return res.status(400).json({ error: "Mailbox id and telegramId are required" });
    }

    try {
      const [box] = await db.select().from(mailboxes).where(eq(mailboxes.id, id)).limit(1);
      if (!box) {
        return res.status(404).json({ error: "Mailbox not found" });
      }
      if (box.userId !== telegramId) {
        return res.status(403).json({ error: "Unauthorized access to this mailbox" });
      }

      const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "User profile not found." });
      }

      await db.update(users).set({
        totalRecoveries: (user.totalRecoveries || 0) + 1
      }).where(eq(users.telegramId, telegramId));

      await db.update(mailboxes).set({ lastAccess: new Date() }).where(eq(mailboxes.id, id));

      return res.json({ 
        success: true, 
        credits: user.credits || 0,
        message: "Mailbox session initialized."
      });
    } catch (err: any) {
      console.error("[RECOVERY ERROR] Open mailbox:", err);
      return res.status(500).json({ error: "Failed to initialize mailbox recovery session." });
    }
  });

  // 5. Proxy message list
  app.get("/api/mailboxes/:id/messages", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { telegramId } = req.query;

    if (isNaN(id) || !telegramId || typeof telegramId !== "string") {
      return res.status(400).json({ error: "Valid mailbox id and telegramId are required" });
    }

    try {
      const [box] = await db.select().from(mailboxes).where(eq(mailboxes.id, id)).limit(1);
      if (!box) {
        return res.status(404).json({ error: "Mailbox not found" });
      }
      if (box.userId !== telegramId) {
        return res.status(403).json({ error: "Unauthorized access to this mailbox" });
      }

      let token;
      try {
        token = await getMailboxToken(box);
      } catch (authErr) {
        await db.update(mailboxes).set({ status: "expired" }).where(eq(mailboxes.id, id));
        return res.status(400).json({ error: "Authentication failed. Mailbox may have expired on Mail.tm." });
      }

      const mailTmRes = await fetch("https://api.mail.tm/messages", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (mailTmRes.ok) {
        const data = await mailTmRes.json();
        return res.json({ messages: data["hydra:member"] || [] });
      } else {
        return res.status(mailTmRes.status).json({ error: "Failed to retrieve messages from Mail.tm server." });
      }
    } catch (err: any) {
      console.error("[RECOVERY ERROR] Fetch messages proxy:", err);
      return res.status(500).json({ error: "Internal mail proxy error." });
    }
  });

  // 6. Proxy single message details + mark as read
  app.get("/api/mailboxes/:id/messages/:msgId", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { msgId } = req.params;
    const { telegramId } = req.query;

    if (isNaN(id) || !msgId || !telegramId || typeof telegramId !== "string") {
      return res.status(400).json({ error: "Valid id, msgId, and telegramId are required" });
    }

    try {
      const [box] = await db.select().from(mailboxes).where(eq(mailboxes.id, id)).limit(1);
      if (!box) {
        return res.status(404).json({ error: "Mailbox not found" });
      }
      if (box.userId !== telegramId) {
        return res.status(403).json({ error: "Unauthorized access to this mailbox" });
      }

      const token = await getMailboxToken(box);

      const mailTmRes = await fetch(`https://api.mail.tm/messages/${msgId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (mailTmRes.ok) {
        const msgDetails = await mailTmRes.json();

        if (!msgDetails.seen) {
          fetch(`https://api.mail.tm/messages/${msgId}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/merge-patch+json"
            },
            body: JSON.stringify({ seen: true })
          }).catch(err => console.warn("Failed to mark message as read on server:", err));
        }

        return res.json({ message: msgDetails });
      } else {
        return res.status(mailTmRes.status).json({ error: "Failed to load message details from Mail.tm." });
      }
    } catch (err: any) {
      console.error("[RECOVERY ERROR] Fetch single message proxy:", err);
      return res.status(500).json({ error: "Internal mail proxy error." });
    }
  });

  // Card generation endpoint
  app.post("/api/cardgen", (req, res) => {
    const { binPattern, expiryMonth, expiryYear, cvv, quantity, validateLuhn } = req.body;
    const cards = generateCards(binPattern, expiryMonth, expiryYear, cvv, quantity, validateLuhn);
    res.json({ cards });
  });

  // Address/identity generator endpoint
  app.get("/api/addressgen", (req, res) => {
    const { country } = req.query;
    const countryCode = typeof country === "string" ? country : "US";
    const address = generateFakeAddress(countryCode);
    res.json({ address });
  });

  // Audio streaming proxy to bypass CORS & Referrer hotlink blocks
  app.get("/api/proxy/audio", (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).send("URL parameter is required");
    }

    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === "https:" ? https : http;

      const request = client.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": parsedUrl.origin
        }
      }, (audioRes) => {
        // Handle redirect (e.g. 301, 302, 307, 308)
        if (audioRes.statusCode && audioRes.statusCode >= 300 && audioRes.statusCode < 400 && audioRes.headers.location) {
          const redirectUrl = audioRes.headers.location;
          const redirectParsed = new URL(redirectUrl);
          const redirectClient = redirectParsed.protocol === "https:" ? https : http;
          
          redirectClient.get(redirectUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Referer": redirectParsed.origin
            }
          }, (redirectRes) => {
            res.writeHead(redirectRes.statusCode || 200, redirectRes.headers);
            redirectRes.pipe(res);
          }).on("error", (e) => {
            res.status(500).send("Error streaming redirected audio");
          });
          return;
        }

        res.writeHead(audioRes.statusCode || 200, audioRes.headers);
        audioRes.pipe(res);
      });

      request.on("error", (e) => {
        res.status(500).send("Error streaming audio source");
      });
    } catch (err) {
      res.status(400).send("Invalid audio URL");
    }
  });

  // --- Vite Dev or Production Static Handler ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`[BB Backend] Server running on port ${PORT}`);
    
    // Database connection and auto-initialization check
    try {
      console.log("[DB INIT] Ensuring tables and unique constraints exist...");
      
      // 1. Create users table
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "users" (
            "id" SERIAL PRIMARY KEY,
            "telegram_id" TEXT,
            "username" TEXT,
            "first_name" TEXT,
            "role" TEXT DEFAULT 'free',
            "plan" TEXT DEFAULT 'free',
            "credits" INTEGER DEFAULT 20,
            "joined_at" TEXT,
            "last_active" TEXT,
            "photo_url" TEXT,
            "total_recoveries" INTEGER DEFAULT 0,
            "referrer_id" TEXT,
            "credit_reset_time" TEXT,
            "plan_expiry" TEXT,
            "created_at" TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log("[DB INIT] Verified users table exists.");
      } catch (e: any) {
        console.log("[DB INIT] Skip users table creation/verification:", e.message);
      }

      // Ensure all columns exist for "users" table (useful if table already exists from older schema versions)
      try {
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegram_id" TEXT`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" TEXT`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'free'`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'free'`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credits" INTEGER DEFAULT 20`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "joined_at" TEXT`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_active" TEXT`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "photo_url" TEXT`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "total_recoveries" INTEGER DEFAULT 0`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referrer_id" TEXT`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credit_reset_time" TEXT`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_expiry" TEXT`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`);
        console.log("[DB INIT] Verified all users columns exist.");
      } catch (e: any) {
        console.log("[DB INIT] Skip adding columns on users:", e.message);
      }

      // Ensure users has telegram_id as UNIQUE if it wasn't added
      try {
        await db.execute(sql`
          ALTER TABLE "users" ADD CONSTRAINT "users_telegram_id_unique" UNIQUE ("telegram_id")
        `);
        console.log("[DB INIT] Added unique constraint to users.telegram_id");
      } catch (e: any) {
        // Ignored if constraint already exists
        if (!e.message?.includes("already exists")) {
          console.log("[DB INIT] Skip adding unique constraint on users.telegram_id:", e.message);
        }
      }

      // 2. Create redeem_codes table
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "redeem_codes" (
            "id" SERIAL PRIMARY KEY,
            "code" TEXT,
            "credits" INTEGER DEFAULT 0,
            "expires_at" TEXT,
            "max_uses" INTEGER DEFAULT 1,
            "used_count" INTEGER DEFAULT 0,
            "created_at" TIMESTAMP DEFAULT NOW(),
            "created_by" TEXT,
            "plan" TEXT,
            "role" TEXT,
            "duration_days" INTEGER
          )
        `);
        console.log("[DB INIT] Verified redeem_codes table exists.");
      } catch (e: any) {
        console.log("[DB INIT] Skip redeem_codes table creation/verification:", e.message);
      }

      // Ensure all columns exist for "redeem_codes"
      try {
        await db.execute(sql`ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "code" TEXT`);
        await db.execute(sql`ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "credits" INTEGER DEFAULT 0`);
        await db.execute(sql`ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "expires_at" TEXT`);
        await db.execute(sql`ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "max_uses" INTEGER DEFAULT 1`);
        await db.execute(sql`ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "used_count" INTEGER DEFAULT 0`);
        await db.execute(sql`ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`);
        await db.execute(sql`ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "created_by" TEXT`);
        await db.execute(sql`ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "plan" TEXT`);
        await db.execute(sql`ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "role" TEXT`);
        await db.execute(sql`ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "duration_days" INTEGER`);
        console.log("[DB INIT] Verified all redeem_codes columns exist.");
      } catch (e: any) {
        console.log("[DB INIT] Skip adding columns on redeem_codes:", e.message);
      }

      // Ensure redeem_codes has code as UNIQUE
      try {
        await db.execute(sql`
          ALTER TABLE "redeem_codes" ADD CONSTRAINT "redeem_codes_code_unique" UNIQUE ("code")
        `);
        console.log("[DB INIT] Added unique constraint to redeem_codes.code");
      } catch (e: any) {
        if (!e.message?.includes("already exists")) {
          console.log("[DB INIT] Skip adding unique constraint on redeem_codes.code:", e.message);
        }
      }

      // 3. Create redemptions table
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "redemptions" (
            "id" SERIAL PRIMARY KEY,
            "code" TEXT,
            "telegram_id" TEXT,
            "username" TEXT,
            "redeemed_at" TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log("[DB INIT] Verified redemptions table exists.");
      } catch (e: any) {
        console.log("[DB INIT] Skip redemptions table creation/verification:", e.message);
      }

      // Ensure all columns exist for "redemptions"
      try {
        await db.execute(sql`ALTER TABLE "redemptions" ADD COLUMN IF NOT EXISTS "code" TEXT`);
        await db.execute(sql`ALTER TABLE "redemptions" ADD COLUMN IF NOT EXISTS "telegram_id" TEXT`);
        await db.execute(sql`ALTER TABLE "redemptions" ADD COLUMN IF NOT EXISTS "username" TEXT`);
        await db.execute(sql`ALTER TABLE "redemptions" ADD COLUMN IF NOT EXISTS "redeemed_at" TIMESTAMP DEFAULT NOW()`);
        console.log("[DB INIT] Verified all redemptions columns exist.");
      } catch (e: any) {
        console.log("[DB INIT] Skip adding columns on redemptions:", e.message);
      }

      // 4. Create mailboxes table
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "mailboxes" (
            "id" SERIAL PRIMARY KEY,
            "user_id" TEXT REFERENCES "users"("telegram_id"),
            "provider" TEXT DEFAULT 'Mail.tm',
            "email" TEXT,
            "password" TEXT,
            "access_token" TEXT,
            "refresh_token" TEXT,
            "created_at" TIMESTAMP DEFAULT NOW(),
            "last_access" TIMESTAMP DEFAULT NOW(),
            "last_refresh" TIMESTAMP DEFAULT NOW(),
            "status" TEXT DEFAULT 'active'
          )
        `);
        console.log("[DB INIT] Verified mailboxes table exists.");
      } catch (e: any) {
        console.log("[DB INIT] Skip mailboxes table creation/verification:", e.message);
      }

      // Ensure all columns exist for "mailboxes"
      try {
        await db.execute(sql`ALTER TABLE "mailboxes" ADD COLUMN IF NOT EXISTS "user_id" TEXT`);
        await db.execute(sql`ALTER TABLE "mailboxes" ADD COLUMN IF NOT EXISTS "provider" TEXT DEFAULT 'Mail.tm'`);
        await db.execute(sql`ALTER TABLE "mailboxes" ADD COLUMN IF NOT EXISTS "email" TEXT`);
        await db.execute(sql`ALTER TABLE "mailboxes" ADD COLUMN IF NOT EXISTS "password" TEXT`);
        await db.execute(sql`ALTER TABLE "mailboxes" ADD COLUMN IF NOT EXISTS "access_token" TEXT`);
        await db.execute(sql`ALTER TABLE "mailboxes" ADD COLUMN IF NOT EXISTS "refresh_token" TEXT`);
        await db.execute(sql`ALTER TABLE "mailboxes" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`);
        await db.execute(sql`ALTER TABLE "mailboxes" ADD COLUMN IF NOT EXISTS "last_access" TIMESTAMP DEFAULT NOW()`);
        await db.execute(sql`ALTER TABLE "mailboxes" ADD COLUMN IF NOT EXISTS "last_refresh" TIMESTAMP DEFAULT NOW()`);
        await db.execute(sql`ALTER TABLE "mailboxes" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active'`);
        console.log("[DB INIT] Verified all mailboxes columns exist.");
      } catch (e: any) {
        console.log("[DB INIT] Skip adding columns on mailboxes:", e.message);
      }

      // Ensure mailboxes has email as UNIQUE
      try {
        await db.execute(sql`
          ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_email_unique" UNIQUE ("email")
        `);
        console.log("[DB INIT] Added unique constraint to mailboxes.email");
      } catch (e: any) {
        if (!e.message?.includes("already exists")) {
          console.log("[DB INIT] Skip adding unique constraint on mailboxes.email:", e.message);
        }
      }

      // Ensure mailboxes foreign key exists
      try {
        await db.execute(sql`
          ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("telegram_id")
        `);
        console.log("[DB INIT] Added foreign key constraint on mailboxes.user_id");
      } catch (e: any) {
        if (!e.message?.includes("already exists")) {
          console.log("[DB INIT] Skip adding foreign key on mailboxes.user_id:", e.message);
        }
      }

      console.log("[DB INIT] Database initialization completed successfully.");
    } catch (err: any) {
      console.error("[DB INIT] Database auto-initialization failed:", err.message);
    }
  });
}

startServer();
