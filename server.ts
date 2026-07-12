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

  // Auto-migration to ensure schema integrity
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_recoveries INTEGER DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_id TEXT;`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mailboxes (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
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
    console.log("[DB] Auto-migration: tables and columns verified.");
  } catch (err) {
    console.warn("[DB WARNING] Auto-migration skipped/failed:", err);
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

  // API to list all local MP3 files available in public/music
  app.get("/api/music/list", async (req, res) => {
    try {
      const musicDir = path.join(process.cwd(), "public", "music");
      if (!fs.existsSync(musicDir)) {
        return res.json({ tracks: [] });
      }

      const files = await fs.promises.readdir(musicDir);
      const mp3Files = files.filter(file => file.toLowerCase().endsWith(".mp3"));

      const tracks = mp3Files.map(file => {
        const baseName = file.substring(0, file.length - 4);
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

  // Serve music folder statically so files placed at runtime can be streamed directly
  app.use("/music", express.static(path.join(process.cwd(), "public", "music")));

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

      let data: any = null;

      // If local range or localhost, fetch geocode for the server's public IP instead
      if (isPrivateIp(clientIp)) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const serverGeo = await fetch("https://ip-api.com/json/", { signal: controller.signal });
          clearTimeout(timeoutId);
          if (serverGeo.ok) {
            data = await serverGeo.json();
          }
        } catch (e) {
          console.warn("[IP INFO] Server geolocation failed or timed out:", e);
        }
      }

      if (!data && !isPrivateIp(clientIp)) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const geoRes = await fetch(`https://ip-api.com/json/${clientIp}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (geoRes.ok) {
            data = await geoRes.json();
          }
        } catch (e) {
          console.warn(`[IP INFO] Geolocation failed or timed out for ${clientIp}:`, e);
        }
      }

      if (data && data.status === "success") {
        const scoreDetails = calculateIpScore(data.isp || "", data.countryCode || "", false);
        return res.json({ ...data, scoreDetails });
      }

      // Fallback response with clean scoring
      const fallbackDetails = calculateIpScore("Localhost Loopback", "IN", false);
      res.json({ 
        query: clientIp, 
        status: "success", 
        country: "India", 
        countryCode: "IN", 
        city: "Mumbai", 
        isp: "Local Access Network", 
        scoreDetails: fallbackDetails 
      });
    } catch (err) {
      const errDetails = calculateIpScore("Unknown Host", "UN", false);
      res.json({ query: "127.0.0.1", status: "fail", message: "Internal error", scoreDetails: errDetails });
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

      // 1. Check TCP reachability
      const connTest = await testProxyTCP(parsed.host, parsed.port);

      if (!connTest.online) {
        const scoreDetails = calculateIpScore("Unknown Route", "UN", true);
        return res.json({
          online: false,
          host: parsed.host,
          port: parsed.port,
          ping: -1,
          info: { country: "Offline", city: "Offline", isp: "Connection Timeout / Refused" },
          scoreDetails: { ...scoreDetails, score: 100, threatLevel: "Dangerous" }
        });
      }

      // 2. Resolve Host to IP and do Geolocation check for details
      const resolvedIp = await resolveHost(parsed.host);
      let geoInfo = { country: "Unknown", countryCode: "UN", city: "Unknown", isp: "Unknown" };

      try {
        if (!isPrivateIp(resolvedIp)) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const geoRes = await fetch(`https://ip-api.com/json/${resolvedIp}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData && geoData.status === "success") {
              geoInfo = {
                country: geoData.country || "Unknown",
                countryCode: geoData.countryCode || "UN",
                city: geoData.city || "Unknown",
                isp: geoData.isp || "Unknown"
              };
            }
          }
        }
      } catch (e) {
        // Fallback or ignore
      }

      const scoreDetails = calculateIpScore(geoInfo.isp, geoInfo.countryCode, true);

      res.json({
        online: true,
        host: parsed.host,
        port: parsed.port,
        ping: connTest.ping,
        info: geoInfo,
        scoreDetails
      });
    } catch (err) {
      res.json({ online: false, error: "Checker failed" });
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
    return {
      role: dbRole || "free",
      plan: dbPlan || "free"
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
          credits: 1250,
          joinedAt: formattedDate,
          lastActive: formattedLastActive,
          photoUrl: (photoUrl as string) || null,
          referrerId: refIdClean
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
        // Update last active on every fetch, and make sure role is correct
        const resolved = resolveUserRoleAndPlan(telegramId, userRecord.role, userRecord.plan);
        const [updatedUser] = await db.update(users).set({
          lastActive: formattedLastActive,
          username: username ? (username as string) : userRecord.username,
          firstName: displayName ? (displayName as string) : userRecord.firstName,
          role: resolved.role,
          plan: resolved.plan,
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
        referralsCount: referralsCount?.count || 0
      });
    } catch (err: any) {
      console.error("[DATABASE ERROR] get profile:", err);
      return res.status(500).json({ error: "Failed to retrieve user profile from database" });
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
          credits: typeof credits === "number" ? credits : 1250,
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

    let { credits, expiresAt, maxUses } = req.body;
    
    const numCredits = typeof credits === "number" ? credits : parseInt(credits, 10);
    const numMaxUses = typeof maxUses === "number" ? maxUses : parseInt(maxUses, 10);

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
        createdBy: "owner"
      });

      res.json({
        success: true,
        code: {
          code: generatedCode,
          credits: numCredits,
          expiresAt,
          maxUses: numMaxUses,
          usedCount: 0
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

      const newCredits = (userRecord.credits || 0) + (redeemCode.credits || 0);
      await db.update(users).set({ credits: newCredits }).where(eq(users.telegramId, telegramId));

      await db.update(redeemCodes).set({ usedCount: redeemCode.usedCount + 1 }).where(eq(redeemCodes.id, redeemCode.id));

      await db.insert(redemptions).values({
        code: cleanCode,
        telegramId,
        username: username || "Anonymous"
      });

      res.json({
        success: true,
        creditsAdded: redeemCode.credits,
        newCredits
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

  // 0. Charge point for generating mailbox (costs 2 credits for FREE plan)
  app.post("/api/mailboxes/generate", async (req, res) => {
    const { telegramId } = req.body;
    if (!telegramId) {
      return res.status(400).json({ error: "telegramId is required" });
    }
    try {
      const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "User profile not found. Access the profile tab first." });
      }

      let updatedCredits = user.credits || 0;
      if (user.plan === "free") {
        if (updatedCredits < 2) {
          return res.status(402).json({ 
            error: "Insufficient credits. Generating a new temporary mailbox costs 2 points. Upgrade to Premium or refer friends to get points." 
          });
        }
        updatedCredits -= 2;
        await db.update(users).set({ credits: updatedCredits }).where(eq(users.telegramId, telegramId));
      }

      return res.json({ success: true, credits: updatedCredits });
    } catch (err: any) {
      console.error("[RECOVERY ERROR] Generate mailbox charge:", err);
      return res.status(500).json({ error: "Failed to authorize mailbox generation." });
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

      const [existing] = await db.select().from(mailboxes).where(eq(mailboxes.email, email)).limit(1);
      
      if (user.plan === "free") {
        if (!existing || existing.status !== "active") {
          if (updatedCredits < 5) {
            return res.status(402).json({ 
              error: "Insufficient credits. Saving a mailbox costs 5 points. Upgrade to Premium or refer friends to get points." 
            });
          }
          updatedCredits -= 5;
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

  // 3. Delete mailbox (soft delete)
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

      await db.update(mailboxes).set({ status: "deleted" }).where(eq(mailboxes.id, id));
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BB Backend] Server running on port ${PORT}`);
  });
}

startServer();
