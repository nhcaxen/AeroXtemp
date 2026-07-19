import React, { useState, useEffect } from "react";
import { incrementAnalytic } from "../utils/analytics";
import { getAbsoluteUrl } from "../utils";
import { 
  Mail, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  ChevronLeft, 
  Eye, 
  AlertCircle,
  Clock,
  Inbox,
  Search,
  WifiOff
} from "lucide-react";

interface MailTmDomain {
  id: string;
  domain: string;
  isActive: boolean;
}

interface MailTmMessage {
  id: string;
  from: {
    address: string;
    name: string;
  };
  subject: string;
  intro: string;
  seen: boolean;
  createdAt: string;
}

interface MailTmFullMessage {
  id: string;
  from: {
    address: string;
    name: string;
  };
  subject: string;
  text: string;
  html: string[] | string;
  createdAt: string;
}

interface DatabaseMailbox {
  id: number;
  userId: string;
  provider: string;
  email: string;
  createdAt: string;
  lastAccess: string | null;
  status: string;
  expiresAt?: string;
  accountId?: string | null;
  domain?: string | null;
  inboxMetadata?: string | null;
}

const calculateTimeRemaining = (createdAt: string | Date, expiresAt?: string | Date) => {
  const createdTime = new Date(createdAt).getTime();
  const expiryTime = expiresAt ? new Date(expiresAt).getTime() : createdTime + 5 * 24 * 60 * 60 * 1000;
  const now = new Date().getTime();
  const diff = expiryTime - now;
  if (diff <= 0) return "Expired";
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default function TempMailTab() {
  // Navigation mode: active mailbox vs saved recoveries
  const [mode, setMode] = useState<"active" | "recovery">("active");

  // 1. ACTIVE MAILBOX STATES (Original feature)
  const [emailAddress, setEmailAddress] = useState("");
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [messages, setMessages] = useState<MailTmMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MailTmFullMessage | null>(null);
  
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. RECOVERY SYSTEM STATES
  const [mailboxes, setMailboxes] = useState<DatabaseMailbox[]>([]);
  const [loadingMailboxes, setLoadingMailboxes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [copiedBoxId, setCopiedBoxId] = useState<number | null>(null);
  const [deletingMailboxId, setDeletingMailboxId] = useState<number | null>(null);
  const [activatedBox, setActivatedBox] = useState<DatabaseMailbox | null>(null);
  const [showActivationSuccess, setShowActivationSuccess] = useState(false);
  const [activatingBoxId, setActivatingBoxId] = useState<number | null>(null);

  // 3. RECOVERED MAILBOX INBOX VIEWER STATES
  const [openedRecoveredMailbox, setOpenedRecoveredMailbox] = useState<DatabaseMailbox | null>(null);
  const [recoveredMessages, setRecoveredMessages] = useState<MailTmMessage[]>([]);
  const [loadingRecoveredMessages, setLoadingRecoveredMessages] = useState(false);
  const [selectedRecoveredMessage, setSelectedRecoveredMessage] = useState<MailTmFullMessage | null>(null);
  const [loadingRecoveredContent, setLoadingRecoveredContent] = useState(false);
  const [refreshingRecoveredInbox, setRefreshingRecoveredInbox] = useState(false);
  const [isRecoveredInboxOffline, setIsRecoveredInboxOffline] = useState(false);

  // 4. MANUAL SAVING & PLAN SYSTEM STATES
  const [isSaved, setIsSaved] = useState(false);
  const [savingMailbox, setSavingMailbox] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Helper to fetch/determine telegramId dynamically
  const getTelegramId = () => {
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser) return String(tgUser.id);
    return localStorage.getItem("aerox_tg_id") || "5834920194";
  };

  // Sync user profile telemetry (credits and stats)
  const fetchUserProfileSync = async () => {
    const tgId = getTelegramId();
    try {
      const savedUser = localStorage.getItem("aerox_tg_user") || "AeroX_Developer";
      const savedDisplay = localStorage.getItem("aerox_tg_display") || "AeroX VIP Member";
      const apiUrl = getAbsoluteUrl(`/api/user-profile?telegramId=${encodeURIComponent(tgId)}&username=${encodeURIComponent(savedUser)}&displayName=${encodeURIComponent(savedDisplay)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        window.dispatchEvent(new CustomEvent("aerox_profile_updated", { detail: data }));
      }
    } catch (e) {
      console.warn("Failed to sync profile credits", e);
    }
  };

  // Helper for API fetch with exponential backoff and retries
  const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3, delay = 1000): Promise<Response> => {
    try {
      const res = await fetch(getAbsoluteUrl(url), options);
      if (!res.ok && retries > 0) {
        if (res.status === 429 || res.status >= 500) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 1.5);
        }
      }
      return res;
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      throw err;
    }
  };

  // Manual save mailbox trigger
  const handleSaveCurrentMailbox = async () => {
    if (!emailAddress) return;
    setSavingMailbox(true);
    setError(null);
    const passwordVal = localStorage.getItem("aerox_mail_password") || "";
    const tgId = getTelegramId();

    try {
      const apiUrl = getAbsoluteUrl("/api/mailboxes");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: tgId,
          email: emailAddress,
          password: passwordVal,
          accessToken: token,
          accountId: accountId,
          provider: "1SecMail"
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save mailbox configuration.");
      }

      setIsSaved(true);
      localStorage.setItem("aerox_mail_saved", "true");
      
      // Update global analytics and sync profile immediately
      incrementAnalytic("totalMailboxesCreated" as any);
      fetchUserProfileSync();

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save mailbox to database.");
    } finally {
      setSavingMailbox(false);
    }
  };

  // Generate a random email address and mailbox on 1SecMail
  const generateNewEmail = async () => {
    setLoadingAddress(true);
    setError(null);
    const tgId = getTelegramId();
    try {
      const apiUrl = getAbsoluteUrl("/api/mailboxes/generate");
      const chargeRes = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: tgId })
      });
      if (!chargeRes.ok) {
        const data = await chargeRes.json();
        const detailsStr = data.details ? ` (${data.details})` : "";
        throw new Error((data.error || "Failed to authorize mailbox generation.") + detailsStr);
      }
      fetchUserProfileSync();

      let generatedEmail = "";
      try {
        const response = await fetch("https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data[0]) {
            generatedEmail = data[0];
          } else {
            throw new Error("Invalid response format from direct 1SecMail API");
          }
        } else {
          throw new Error(`Direct API returned status ${response.status}`);
        }
      } catch (directErr) {
        console.warn("Direct 1SecMail API failed, using backend proxy fallback:", directErr);
        const apiUrl = getAbsoluteUrl("/api/tempmail/random");
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to generate temporary email address (${response.status})`);
        }
        const data = await response.json();
        generatedEmail = data.email;
      }

      if (!generatedEmail) {
        throw new Error("No active email address was received.");
      }

      const generatedPassword = "1secmail-password";
      const jwtToken = "1secmail-token";
      const newAccountId = "1secmail-account";

      setEmailAddress(generatedEmail);
      setToken(jwtToken);
      setAccountId(newAccountId);
      setMessages([]);
      setSelectedMessage(null);

      localStorage.setItem("aerox_mail_address", generatedEmail);
      localStorage.setItem("aerox_mail_password", generatedPassword);
      localStorage.setItem("aerox_mail_token", jwtToken);
      localStorage.setItem("aerox_mail_accountId", newAccountId);

      setIsSaved(false);
      localStorage.setItem("aerox_mail_saved", "false");
      
    } catch (err: any) {
      console.error("Mailbox generation failed:", err);
      setError(err?.message || "Failed to create temporary mailbox. Please retry.");
    } finally {
      setLoadingAddress(false);
    }
  };

  // Check inbox / refresh messages
  const handleRefreshInbox = async (showPulse = true) => {
    if (!token || !emailAddress) return;
    if (showPulse) setRefreshing(true);
    setError(null);
    incrementAnalytic("emailsChecked");

    try {
      const [login, domain] = emailAddress.split("@");
      let rawMessages = [];
      try {
        const res = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}`);
        if (res.ok) {
          rawMessages = await res.json();
        } else {
          throw new Error(`Direct API returned status ${res.status}`);
        }
      } catch (directErr) {
        console.warn("Direct 1SecMail inbox fetch failed, using backend proxy fallback:", directErr);
        const apiUrl = getAbsoluteUrl(`/api/tempmail/inbox?login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}`);
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          rawMessages = data.messages || [];
        } else {
          throw new Error(`Failed to load messages (${res.status})`);
        }
      }

      // Map 1SecMail messages to Mail.tm compatible format
      const mapped = rawMessages.map((m: any) => ({
        id: String(m.id),
        from: {
          address: m.from,
          name: m.from.split("<")[0].trim() || m.from
        },
        subject: m.subject,
        createdAt: m.date,
        seen: false
      }));

      setMessages(mapped);
    } catch (err: any) {
      console.error("Failed to fetch messages:", err);
      if (showPulse) {
        setError(err?.message || "Failed to retrieve messages. Connection issue.");
      }
    } finally {
      if (showPulse) setRefreshing(false);
    }
  };

  // Fetch individual message details
  const handleViewMessage = async (msgId: string) => {
    if (!token || !emailAddress) return;
    setLoadingContent(true);
    setError(null);
    
    try {
      const [login, domain] = emailAddress.split("@");
      let msgData;
      try {
        const res = await fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(msgId)}`);
        if (res.ok) {
          msgData = await res.json();
        } else {
          throw new Error(`Direct API returned status ${res.status}`);
        }
      } catch (directErr) {
        console.warn("Direct 1SecMail message fetch failed, using backend proxy fallback:", directErr);
        const apiUrl = getAbsoluteUrl(`/api/tempmail/message?login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(msgId)}`);
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          msgData = data.message;
        } else {
          throw new Error(`Failed to load email content (${res.status})`);
        }
      }

      // Map to Mail.tm full message format
      const mappedMsg = {
        id: String(msgData.id),
        from: {
          address: msgData.from,
          name: msgData.from
        },
        subject: msgData.subject,
        createdAt: msgData.date,
        text: msgData.textBody || msgData.body || "",
        html: [msgData.htmlBody || msgData.body || ""],
        seen: true
      };

      setSelectedMessage(mappedMsg);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, seen: true } : m));
    } catch (err: any) {
      console.error("Failed to load message details:", err);
      setError(err?.message || "Could not retrieve message content.");
    } finally {
      setLoadingContent(false);
    }
  };

  // Delete active mailbox completely
  const handleDeleteMailbox = async () => {
    setLoadingAddress(true);
    setError(null);
    try {
      if (accountId && token) {
        await fetch(`https://api.mail.tm/accounts/${accountId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.warn("Mailbox deletion call failed:", err);
    }

    localStorage.removeItem("aerox_mail_address");
    localStorage.removeItem("aerox_mail_password");
    localStorage.removeItem("aerox_mail_token");
    localStorage.removeItem("aerox_mail_accountId");
    setEmailAddress("");
    setToken("");
    setAccountId("");
    setMessages([]);
    setSelectedMessage(null);

    await generateNewEmail();
  };

  // ----------------------------------------------------
  // RECOVERY SYSTEM METHODS
  // ----------------------------------------------------

  const fetchSavedMailboxes = async () => {
    setLoadingMailboxes(true);
    setRecoveryError(null);
    const tgId = getTelegramId();
    try {
      const apiUrl = getAbsoluteUrl(`/api/mailboxes?telegramId=${encodeURIComponent(tgId)}&search=${encodeURIComponent(searchQuery)}&sort=${sortBy}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setMailboxes(data.mailboxes || []);
      } else {
        throw new Error("Failed to load saved mailboxes.");
      }
    } catch (err: any) {
      setRecoveryError(err.message || "Failed to load saved mailboxes.");
    } finally {
      setLoadingMailboxes(false);
    }
  };

  const handleDeleteMailboxFromDb = async (mailboxId: number) => {
    const tgId = getTelegramId();
    try {
      const apiUrl = getAbsoluteUrl("/api/mailboxes/delete");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mailboxId, telegramId: tgId })
      });
      if (res.ok) {
        incrementAnalytic("deletedMailboxes" as any);
        fetchSavedMailboxes();
        fetchUserProfileSync();
      } else {
        const data = await res.json();
        setRecoveryError(data.error || "Failed to delete mailbox.");
      }
    } catch (err) {
      console.error(err);
      setRecoveryError("Failed to delete mailbox due to a network issue.");
    }
  };

  const handleRecoverMailbox = async (mailbox: DatabaseMailbox) => {
    setActivatingBoxId(mailbox.id);
    setRecoveryError(null);
    const tgId = getTelegramId();
    try {
      const apiUrl = getAbsoluteUrl("/api/mailboxes/activate");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mailbox.id, telegramId: tgId })
      });
      const data = await res.json();
      if (res.ok) {
        setActivatedBox(mailbox);
        setShowActivationSuccess(true);
      } else {
        setRecoveryError(data.error || "This mailbox is no longer available from the provider.");
      }
    } catch (err: any) {
      setRecoveryError("This mailbox is no longer available from the provider.");
    } finally {
      setActivatingBoxId(null);
    }
  };

  const handleOpenRecoveredInbox = async (mailbox: DatabaseMailbox) => {
    setShowActivationSuccess(false);
    setLoadingMailboxes(true);
    setRecoveryError(null);
    setIsRecoveredInboxOffline(false);
    const tgId = getTelegramId();
    try {
      const apiUrl = getAbsoluteUrl("/api/mailboxes/open");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mailbox.id, telegramId: tgId })
      });
      if (res.ok) {
        incrementAnalytic("totalRecoveries" as any);
        fetchUserProfileSync();
        setOpenedRecoveredMailbox(mailbox);
        setSelectedRecoveredMessage(null);
        await fetchRecoveredMessages(mailbox.id);
      } else {
        const data = await res.json();
        setRecoveryError(data.error || "Failed to initialize recovery session.");
      }
    } catch (err: any) {
      setRecoveryError(err.message || "Failed to open mailbox.");
    } finally {
      setLoadingMailboxes(false);
    }
  };

  const fetchRecoveredMessages = async (mailboxId: number, showPulse = true) => {
    if (showPulse) setLoadingRecoveredMessages(true);
    setRecoveryError(null);
    const tgId = getTelegramId();
    try {
      // Find current mailbox provider
      const box = mailboxes.find(m => m.id === mailboxId);
      if (box && box.provider === "1SecMail") {
        const [login, domain] = (box.email || "").split("@");
        let rawMessages = [];
        try {
          const directRes = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}`);
          if (directRes.ok) {
            rawMessages = await directRes.json();
          } else {
            throw new Error(`Direct API status ${directRes.status}`);
          }
        } catch (directErr) {
          console.warn("Direct 1SecMail fetch for recovered box failed, falling back to proxy:", directErr);
          const apiUrl = getAbsoluteUrl(`/api/mailboxes/${mailboxId}/messages?telegramId=${encodeURIComponent(tgId)}`);
          const res = await fetch(apiUrl);
          if (res.ok) {
            const data = await res.json();
            rawMessages = data.messages || [];
          } else {
            const data = await res.json();
            throw new Error(data.error || "Failed to retrieve messages.");
          }
        }

        const mapped = (rawMessages || []).map((m: any) => ({
          id: String(m.id),
          from: {
            address: m.from,
            name: m.from.split("<")[0].trim() || m.from
          },
          subject: m.subject,
          createdAt: m.date,
          seen: false
        }));

        setRecoveredMessages(mapped);
        setIsRecoveredInboxOffline(false);
        return;
      }

      // Default implementation for Mail.tm
      const apiUrl = getAbsoluteUrl(`/api/mailboxes/${mailboxId}/messages?telegramId=${encodeURIComponent(tgId)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setRecoveredMessages(data.messages || []);
        setIsRecoveredInboxOffline(!!data.isCached);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to retrieve messages.");
      }
    } catch (err: any) {
      setRecoveryError(err.message || "Could not retrieve messages.");
    } finally {
      if (showPulse) setLoadingRecoveredMessages(false);
    }
  };

  const handleViewRecoveredMessage = async (msgId: string) => {
    if (!openedRecoveredMailbox) return;
    setLoadingRecoveredContent(true);
    setRecoveryError(null);
    const tgId = getTelegramId();
    try {
      if (openedRecoveredMailbox.provider === "1SecMail") {
        const [login, domain] = (openedRecoveredMailbox.email || "").split("@");
        let msgDetails;
        try {
          const directRes = await fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(msgId)}`);
          if (directRes.ok) {
            const data = await directRes.json();
            msgDetails = {
              id: String(data.id),
              from: {
                address: data.from,
                name: data.from
              },
              subject: data.subject,
              createdAt: data.date,
              text: data.textBody || data.body || "",
              html: [data.htmlBody || data.body || ""],
              seen: true
            };
          } else {
            throw new Error(`Direct API status ${directRes.status}`);
          }
        } catch (directErr) {
          console.warn("Direct 1SecMail detail fetch for recovered box failed, falling back to proxy:", directErr);
          const apiUrl = getAbsoluteUrl(`/api/mailboxes/${openedRecoveredMailbox.id}/messages/${msgId}?telegramId=${encodeURIComponent(tgId)}`);
          const res = await fetch(apiUrl);
          if (res.ok) {
            const data = await res.json();
            msgDetails = data.message;
          } else {
            const data = await res.json();
            throw new Error(data.error || "Failed to load message details.");
          }
        }

        setSelectedRecoveredMessage(msgDetails);
        // Silently update list for read state
        fetchRecoveredMessages(openedRecoveredMailbox.id, false);
        return;
      }

      // Default implementation for Mail.tm
      const apiUrl = getAbsoluteUrl(`/api/mailboxes/${openedRecoveredMailbox.id}/messages/${msgId}?telegramId=${encodeURIComponent(tgId)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setSelectedRecoveredMessage(data.message);
        // Silently update list for read state
        fetchRecoveredMessages(openedRecoveredMailbox.id, false);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to load message details.");
      }
    } catch (err: any) {
      setRecoveryError(err.message || "Could not retrieve message content.");
    } finally {
      setLoadingRecoveredContent(false);
    }
  };

  const handleCopyEmailAddress = (email: string, id: number) => {
    navigator.clipboard.writeText(email);
    setCopiedBoxId(id);
    setTimeout(() => setCopiedBoxId(null), 2000);
  };

  // ----------------------------------------------------
  // INITIALIZATION AND POLLING EFFECTS
  // ----------------------------------------------------

  // Active inbox load
  useEffect(() => {
    fetchUserProfileSync();

    const handleProfileUpdated = (e: any) => {
      if (e.detail) {
        setUserProfile(e.detail);
      }
    };
    window.addEventListener("aerox_profile_updated", handleProfileUpdated);

    const savedAddress = localStorage.getItem("aerox_mail_address");
    const savedToken = localStorage.getItem("aerox_mail_token");
    const savedAccountId = localStorage.getItem("aerox_mail_accountId");
    const savedIsSaved = localStorage.getItem("aerox_mail_saved") === "true";

    if (savedAddress && savedToken && savedAccountId) {
      setEmailAddress(savedAddress);
      setToken(savedToken);
      setAccountId(savedAccountId);
      setIsSaved(savedIsSaved);
    } else {
      generateNewEmail();
    }

    return () => {
      window.removeEventListener("aerox_profile_updated", handleProfileUpdated);
    };
  }, []);

  // Active inbox auto refresh polling
  useEffect(() => {
    if (!token || mode !== "active") return;
    handleRefreshInbox(false);

    const interval = setInterval(() => {
      handleRefreshInbox(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [token, mode]);

  // Saved mailboxes list fetch
  useEffect(() => {
    if (mode === "recovery") {
      fetchSavedMailboxes();
    }
  }, [mode, searchQuery, sortBy]);

  // Recovered inbox auto refresh polling
  useEffect(() => {
    if (!openedRecoveredMailbox || mode !== "recovery") return;

    const interval = setInterval(() => {
      fetchRecoveredMessages(openedRecoveredMailbox.id, false);
    }, 5000);

    return () => clearInterval(interval);
  }, [openedRecoveredMailbox, mode]);

  const copyToClipboard = () => {
    if (!emailAddress) return;
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyMessageBody = () => {
    const msg = selectedMessage || selectedRecoveredMessage;
    if (!msg) return;
    const plainText = msg.text || "";
    navigator.clipboard.writeText(plainText);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const renderHtmlContent = (htmlVal: string[] | string) => {
    return Array.isArray(htmlVal) ? htmlVal.join("") : htmlVal;
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8 select-none">
      {/* Tab Header Banner */}
      <div className="bg-gradient-to-r from-cyber-purple/10 via-cosmic-lilac/10 to-transparent p-4 rounded-2xl border border-white/[0.04] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cosmic-lilac/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-cosmic-lilac" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider font-display">
            Real Disposable Mailbox
          </h2>
        </div>
        <p className="text-[10px] text-ash-gray font-medium leading-relaxed">
          Powered by AEROX Secure Mail Engine. Automatically updates every 5 seconds to show incoming OTPs, verification links, and messages instantly.
        </p>
      </div>

      {/* Mode Navigation Toggle */}
      <div className="flex bg-void-black/80 p-1 rounded-xl border border-white/[0.04] shrink-0">
        <button
          onClick={() => {
            setMode("active");
            setOpenedRecoveredMailbox(null);
            setRecoveryError(null);
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
            mode === "active"
              ? "bg-gradient-to-r from-cyber-purple to-cosmic-lilac text-white shadow-md font-extrabold"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Active Mailbox
        </button>
        <button
          onClick={() => {
            setMode("recovery");
            setOpenedRecoveredMailbox(null);
            setRecoveryError(null);
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
            mode === "recovery"
              ? "bg-gradient-to-r from-cyber-purple to-cosmic-lilac text-white shadow-md font-extrabold"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Recover Mail
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* ACTIVE MODE VIEW */}
      {/* -------------------------------------------------------------------- */}
      {mode === "active" && (
        <>
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-[10px] text-red-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Connection Warning</span>
                <span>{error}</span>
              </div>
              <button 
                onClick={() => token ? handleRefreshInbox(true) : generateNewEmail()}
                className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 font-bold uppercase tracking-wider cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Address Card Panel */}
          <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest">
                Your Temp Email Address
              </span>
              <div className="flex items-center gap-1 text-[9px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/15">
                <Clock className="w-2.5 h-2.5 animate-pulse" />
                <span>5S AUTO-REFRESH</span>
              </div>
            </div>

            {/* Display Mail Box Address */}
            <div className="bg-void-black p-3.5 rounded-xl border border-white/[0.03] flex items-center justify-between gap-2">
              {loadingAddress ? (
                <div className="h-6 flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-cyber-purple/20 border-t-cyber-purple rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-neutral-500 italic">Provisioning AEROX Secure Mailbox...</span>
                </div>
              ) : (
                <span className="text-xs font-bold font-mono text-white select-all break-all pr-2">
                  {emailAddress || "Generating secure mailbox..."}
                </span>
              )}

              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={copyToClipboard}
                  disabled={!emailAddress || loadingAddress}
                  className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] active:scale-90 text-neutral-300 hover:text-white transition-all border border-white/[0.03] cursor-pointer"
                  title="Copy email to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Top Control Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleRefreshInbox(true)}
                disabled={refreshing || loadingAddress || !emailAddress}
                className="py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 text-xs font-bold text-white border border-white/[0.05] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyber-purple" : ""}`} />
                <span>{refreshing ? "Refreshing..." : "Refresh Inbox"}</span>
              </button>

              <button
                onClick={handleDeleteMailbox}
                disabled={loadingAddress}
                className="py-2.5 rounded-xl bg-gradient-to-r from-cyber-purple to-cosmic-lilac hover:brightness-110 active:scale-95 text-xs font-black uppercase text-white shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                title="Delete current mailbox and register a brand new one"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>New Address</span>
              </button>
            </div>

            {/* Save Mailbox Action */}
            {!loadingAddress && emailAddress && (
              <div className="mt-1">
                {isSaved ? (
                  <div className="py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold text-center flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
                    <span>Mailbox Saved to Recovery List</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSaveCurrentMailbox}
                    disabled={savingMailbox}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 active:scale-95 text-xs font-black uppercase text-white shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <span>💾 Save to Recovery {userProfile?.plan === "owner" ? "(Free)" : "(Costs 5 Credits)"}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Inbox Feed / Message viewer section */}
          <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04]">
            {selectedMessage ? (
              /* SINGLE MESSAGE VIEWER STATE */
              <div className="flex flex-col gap-4 animate-fade-in text-left">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Inbox</span>
                  </button>

                  <button
                    onClick={copyMessageBody}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-bold text-neutral-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    {copiedBody ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        <span>Copied Content</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Content</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-void-black p-3.5 rounded-xl border border-white/[0.03] flex flex-col gap-1.5 select-all">
                  <div>
                    <span className="text-[8px] text-neutral-500 uppercase tracking-wider font-extrabold block">FROM:</span>
                    <span className="text-xs font-bold text-white font-mono block break-all">
                      {selectedMessage.from.name ? `${selectedMessage.from.name} <${selectedMessage.from.address}>` : selectedMessage.from.address}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-neutral-500 uppercase tracking-wider font-extrabold block">SUBJECT:</span>
                    <span className="text-xs font-semibold text-cyber-purple block">{selectedMessage.subject || "(No Subject)"}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-white/[0.02]">
                    <span className="text-[8px] text-neutral-500 uppercase tracking-wider font-extrabold">RECEIVED AT:</span>
                    <span className="text-[9px] text-neutral-400 font-mono font-medium">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-void-black p-4 rounded-xl border border-white/[0.03] min-h-[160px] overflow-x-auto text-xs text-neutral-300 leading-relaxed font-sans select-text">
                  {selectedMessage.html ? (
                    <div 
                      className="html-email-container overflow-hidden max-w-full text-white break-words"
                      dangerouslySetInnerHTML={{ __html: renderHtmlContent(selectedMessage.html) }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap font-mono break-all text-[11px]">
                      {selectedMessage.text || "No text content in this email."}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* INBOX LIST FEED */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1 px-1">
                  <div className="flex items-center gap-1.5">
                    <Inbox className="w-4 h-4 text-cyber-purple" />
                    <h3 className="text-xs font-extrabold text-frost-white uppercase tracking-wider font-display">
                      Inbox List ({messages.length})
                    </h3>
                  </div>

                  {messages.some(m => !m.seen) && (
                    <span className="text-[9px] text-cyber-purple font-bold bg-cyber-purple/10 px-2 py-0.5 rounded-full animate-pulse border border-cyber-purple/20">
                      {messages.filter(m => !m.seen).length} UNREAD
                    </span>
                  )}
                </div>

                {loadingContent ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2.5">
                    <div className="w-7 h-7 border-2 border-cyber-purple/20 border-t-cyber-purple rounded-full animate-spin" />
                    <span className="text-[10px] text-neutral-400 font-extrabold animate-pulse uppercase">Fetching message body...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="bg-void-black/80 py-12 px-6 rounded-xl border border-white/[0.02] text-center select-none">
                    <div className="w-10 h-10 rounded-full bg-cyber-purple/5 flex items-center justify-center text-cyber-purple/40 mx-auto mb-3 border border-cyber-purple/10">
                      <Mail className="w-5 h-5 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-neutral-400 block uppercase tracking-wider">
                      Your inbox is clean
                    </span>
                    <span className="text-[10px] text-neutral-500 block leading-relaxed mt-1 max-w-[240px] mx-auto">
                      Send an email to the address above. Messages are automatically checked every 5 seconds.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-96 overflow-y-auto scrollbar-none pr-0.5">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => handleViewMessage(msg.id)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer text-left select-none relative overflow-hidden group ${
                          msg.seen 
                            ? "bg-void-black border-white/[0.02] opacity-80" 
                            : "bg-cyber-purple/[0.02] border-cyber-purple/20 hover:border-cyber-purple/40"
                        }`}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyber-purple/50 rounded-r opacity-0 group-hover:opacity-100 transition-all" />
                        
                        <div className="flex flex-col gap-1 max-w-[80%]">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-neutral-400 font-bold block truncate">
                              FROM: {msg.from.name || msg.from.address}
                            </span>
                            {!msg.seen && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyber-purple animate-pulse shadow-[0_0_8px_rgba(79,125,255,0.8)]" />
                            )}
                          </div>
                          <span className={`text-xs font-bold transition-all truncate ${msg.seen ? "text-white" : "text-cyber-purple"}`}>
                            {msg.subject || "(No Subject)"}
                          </span>
                          <span className="text-[8px] text-neutral-500 font-bold uppercase block mt-0.5">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="shrink-0 p-1.5 rounded-lg bg-cyber-purple/10 text-cyber-purple hover:text-white transition-colors">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* RECOVERY MODE VIEW */}
      {/* -------------------------------------------------------------------- */}
      {mode === "recovery" && (
        <>
          {recoveryError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-[10px] text-red-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">System Message</span>
                <span>{recoveryError}</span>
              </div>
              <button 
                onClick={() => openedRecoveredMailbox ? fetchRecoveredMessages(openedRecoveredMailbox.id, true) : fetchSavedMailboxes()}
                className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 font-bold uppercase tracking-wider cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Opened recovered mailbox detail state */}
          {openedRecoveredMailbox ? (
            <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04]">
              {selectedRecoveredMessage ? (
                /* RECOVERED MESSAGE VIEWER STATE */
                <div className="flex flex-col gap-4 animate-fade-in text-left">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                    <button
                      onClick={() => setSelectedRecoveredMessage(null)}
                      className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back to Inbox</span>
                    </button>

                    <button
                      onClick={copyMessageBody}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-bold text-neutral-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                      {copiedBody ? (
                        <>
                          <Check className="w-3 h-3 text-green-400" />
                          <span>Copied Content</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Content</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-void-black p-3.5 rounded-xl border border-white/[0.03] flex flex-col gap-1.5 select-all">
                    <div>
                      <span className="text-[8px] text-neutral-500 uppercase tracking-wider font-extrabold block">FROM:</span>
                      <span className="text-xs font-bold text-white font-mono block break-all">
                        {selectedRecoveredMessage.from.name ? `${selectedRecoveredMessage.from.name} <${selectedRecoveredMessage.from.address}>` : selectedRecoveredMessage.from.address}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] text-neutral-500 uppercase tracking-wider font-extrabold block">SUBJECT:</span>
                      <span className="text-xs font-semibold text-pink-300 block">{selectedRecoveredMessage.subject || "(No Subject)"}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-white/[0.02]">
                      <span className="text-[8px] text-neutral-500 uppercase tracking-wider font-extrabold">RECEIVED AT:</span>
                      <span className="text-[9px] text-neutral-400 font-mono font-medium">
                        {new Date(selectedRecoveredMessage.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-void-black p-4 rounded-xl border border-white/[0.03] min-h-[160px] overflow-x-auto text-xs text-neutral-300 leading-relaxed font-sans select-text">
                    {selectedRecoveredMessage.html ? (
                      <div 
                        className="html-email-container overflow-hidden max-w-full text-white break-words"
                        dangerouslySetInnerHTML={{ __html: renderHtmlContent(selectedRecoveredMessage.html) }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap font-mono break-all text-[11px]">
                        {selectedRecoveredMessage.text || "No text content in this email."}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* RECOVERED MESSAGES LIST */
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                    <button
                      onClick={() => setOpenedRecoveredMailbox(null)}
                      className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back to Recovery List</span>
                    </button>

                    <button
                      onClick={() => fetchRecoveredMessages(openedRecoveredMailbox.id, true)}
                      disabled={refreshingRecoveredInbox}
                      className="p-1 rounded bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingRecoveredMessages ? "animate-spin text-cyber-purple" : ""}`} />
                    </button>
                  </div>

                  <div className="bg-void-black p-3 rounded-xl border border-white/[0.03] text-left">
                    <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-extrabold block">OPENED MAILBOX:</span>
                    <span className="text-xs font-bold text-white font-mono break-all block mt-0.5">{openedRecoveredMailbox.email}</span>
                  </div>

                  {isRecoveredInboxOffline && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left flex flex-col gap-1.5 animate-pulse">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <WifiOff className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">AeroX Offline Recovery Vault</span>
                      </div>
                      <p className="text-[9.5px] text-neutral-300 leading-normal">
                        Live connection is no longer active on Mail.tm (deactivated by temporary provider), but all your received emails and verification OTP codes are safely archived and readable below.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-1 px-1 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Inbox className="w-4 h-4 text-cyber-purple" />
                      <h3 className="text-xs font-extrabold text-frost-white uppercase tracking-wider font-display">
                        Inbox List ({recoveredMessages.length})
                      </h3>
                    </div>

                    {recoveredMessages.some(m => !m.seen) && (
                      <span className="text-[9px] text-cyber-purple font-bold bg-cyber-purple/10 px-2 py-0.5 rounded-full animate-pulse border border-cyber-purple/20">
                        {recoveredMessages.filter(m => !m.seen).length} UNREAD
                      </span>
                    )}
                  </div>

                  {loadingRecoveredMessages ? (
                    /* SKELETON LOADER FOR MESSAGES */
                    <div className="py-12 flex flex-col items-center justify-center gap-2.5">
                      <div className="w-7 h-7 border-2 border-cyber-purple/20 border-t-cyber-purple rounded-full animate-spin" />
                      <span className="text-[10px] text-neutral-400 font-extrabold animate-pulse uppercase">Fetching messages...</span>
                    </div>
                  ) : recoveredMessages.length === 0 ? (
                    <div className="bg-void-black/80 py-12 px-6 rounded-xl border border-white/[0.02] text-center select-none">
                      <div className="w-10 h-10 rounded-full bg-cyber-purple/5 flex items-center justify-center text-cyber-purple/40 mx-auto mb-3 border border-cyber-purple/10">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-neutral-400 block uppercase tracking-wider">
                        Inbox is empty
                      </span>
                      <span className="text-[10px] text-neutral-500 block leading-relaxed mt-1 max-w-[240px] mx-auto">
                        No messages received in this mailbox yet. Auto-refreshes every 5 seconds.
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto scrollbar-none pr-0.5">
                      {recoveredMessages.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => handleViewRecoveredMessage(msg.id)}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer text-left select-none relative overflow-hidden group ${
                            msg.seen 
                              ? "bg-void-black border-white/[0.02] opacity-80" 
                              : "bg-cyber-purple/[0.02] border-cyber-purple/20 hover:border-cyber-purple/40"
                          }`}
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-cyber-purple/50 rounded-r opacity-0 group-hover:opacity-100 transition-all" />
                          
                          <div className="flex flex-col gap-1 max-w-[80%]">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-neutral-400 font-bold block truncate">
                                FROM: {msg.from.name || msg.from.address}
                              </span>
                              {!msg.seen && (
                                <span className="w-1.5 h-1.5 rounded-full bg-cyber-purple animate-pulse shadow-[0_0_8px_rgba(79,125,255,0.8)]" />
                              )}
                            </div>
                            <span className={`text-xs font-bold transition-all truncate ${msg.seen ? "text-white" : "text-cyber-purple"}`}>
                              {msg.subject || "(No Subject)"}
                            </span>
                            <span className="text-[8px] text-neutral-500 font-bold uppercase block mt-0.5">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="shrink-0 p-1.5 rounded-lg bg-cyber-purple/10 text-cyber-purple hover:text-white transition-colors">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* RECOVERY LIST VIEW */
            <div className="flex flex-col gap-4">
              {/* Search and Sort controls */}
              <div className="flex gap-2.5 bg-dark-surface p-3 rounded-2xl border border-white/[0.04]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-void-black border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyber-purple transition-all"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                  className="bg-void-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer focus:outline-none focus:border-cyber-purple transition-all"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>

              {/* Saved Mailboxes Feed */}
              {loadingMailboxes ? (
                /* SKELETON LOADER */
                <div className="py-12 flex flex-col items-center justify-center gap-2.5">
                  <div className="w-7 h-7 border-2 border-cyber-purple/20 border-t-cyber-purple rounded-full animate-spin" />
                  <span className="text-[10px] text-neutral-400 font-extrabold animate-pulse uppercase">Querying active list...</span>
                </div>
              ) : mailboxes.length === 0 ? (
                /* EMPTY STATE */
                <div className="bg-dark-surface py-12 px-6 rounded-2xl border border-white/[0.04] text-center select-none flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cyber-purple/5 flex items-center justify-center text-cyber-purple/40 border border-cyber-purple/10">
                    <Mail className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-400 block uppercase tracking-wider">
                      No saved mailboxes.
                    </span>
                    <span className="text-[10px] text-neutral-500 block leading-relaxed mt-1 max-w-[240px] mx-auto">
                      All mailboxes created under your AEROX account will automatically appear here for secure recovery.
                    </span>
                  </div>
                  <button
                    onClick={() => setMode("active")}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyber-purple to-cosmic-lilac text-white text-xs font-bold uppercase cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  >
                    Create Temp Mail
                  </button>
                </div>
              ) : (
                /* MAILBOX CARDS LISTING */
                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto scrollbar-none pr-0.5">
                  {mailboxes.map((box) => (
                    <div 
                      key={box.id} 
                      className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] shadow-md flex flex-col gap-3 text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="text-xs font-mono font-bold text-white block break-all select-all">{box.email}</span>
                          <span className="text-[9px] text-neutral-400 font-bold block mt-0.5 uppercase tracking-wide">
                            Provider: {box.provider === "Mail.tm" || box.provider === "1SecMail" ? "AEROX Secure Mail Engine" : box.provider}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                          box.status === "active" 
                            ? "bg-green-500/10 text-green-400 border-green-500/15" 
                            : "bg-red-500/10 text-red-400 border-red-500/15"
                        }`}>
                          {box.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9px] text-neutral-400 border-t border-white/[0.03] pt-2">
                        <div>
                          <span className="block font-bold">Created Date</span>
                          <span className="text-white font-mono">{new Date(box.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="block font-bold">Expiry Date</span>
                          <span className="text-white font-mono">
                            {box.expiresAt ? new Date(box.expiresAt).toLocaleDateString() : new Date(new Date(box.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="block font-bold">Time Remaining</span>
                          <span className="text-white font-mono">
                            {box.status === "expired" ? "Expired" : calculateTimeRemaining(box.createdAt, box.expiresAt)}
                          </span>
                        </div>
                        <div>
                          <span className="block font-bold">Last Opened</span>
                          <span className="text-white font-mono">
                            {box.lastAccess ? new Date(box.lastAccess).toLocaleString() : "Never"}
                          </span>
                        </div>
                      </div>

                      {/* Card Button Panel */}
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {deletingMailboxId === box.id ? (
                          <>
                            <div className="col-span-3 text-[10px] font-black text-red-400 text-center mb-0.5 bg-red-500/5 py-1 rounded border border-red-500/10">
                              ARE YOU SURE? REMOVES FROM RECOVERY!
                            </div>
                            <button
                              onClick={() => {
                                handleDeleteMailboxFromDb(box.id);
                                setDeletingMailboxId(null);
                              }}
                              className="col-span-2 py-2 rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-[10px] font-black uppercase text-white transition-all cursor-pointer text-center"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setDeletingMailboxId(null)}
                              className="col-span-1 py-2 rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 text-[10px] font-bold text-white border border-white/[0.05] transition-all cursor-pointer text-center"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRecoverMailbox(box)}
                              disabled={box.status === "expired" || activatingBoxId !== null}
                              className="py-2 rounded-lg bg-cyber-purple hover:bg-opacity-90 active:scale-95 text-[10px] font-extrabold uppercase text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                              {activatingBoxId === box.id ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Recovering...</span>
                                </>
                              ) : (
                                <span>Recover</span>
                              )}
                            </button>
                            <button
                              onClick={() => handleCopyEmailAddress(box.email, box.id)}
                              className="py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 text-[10px] font-bold text-white border border-white/[0.05] transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              {copiedBoxId === box.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setDeletingMailboxId(box.id)}
                              className="py-2 rounded-lg bg-red-500/10 hover:bg-red-500/25 active:scale-95 text-[10px] font-bold text-red-400 transition-all cursor-pointer"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Footer support prompt */}
      <div className="flex items-center gap-1.5 bg-void-black/40 p-3 rounded-xl border border-white/[0.02] mt-1 text-[9px] text-neutral-500 justify-center">
        <AlertCircle className="w-3.5 h-3.5 text-neutral-600" />
        <span>AEROX temporary inbox holds contents for secure, premium disposable testing.</span>
      </div>

      {/* ---------------------------------------------------- */}
      {/* ACTIVATION SUCCESS POPUP MODAL */}
      {/* ---------------------------------------------------- */}
      {showActivationSuccess && activatedBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-dark-surface border border-cyber-purple/20 p-6 rounded-3xl shadow-2xl text-center flex flex-col items-center gap-4 relative animate-scale-up">
            {/* Close button */}
            <button
              onClick={() => setShowActivationSuccess(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5 cursor-pointer text-xs font-bold"
            >
              ✕
            </button>

            {/* Success icon banner */}
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center text-green-400">
              <Check className="w-8 h-8" />
            </div>

            {/* Typography pairings */}
            <div className="flex flex-col gap-1.5">
              <h3 className="font-sans font-extrabold text-white text-base tracking-tight uppercase">
                Mailbox Activated
              </h3>
              <p className="font-mono text-xs text-neutral-300 break-all bg-void-black/50 py-1.5 px-3 rounded-xl border border-white/[0.02]">
                {activatedBox.email}
              </p>
              <p className="text-[10px] text-neutral-400 max-w-[240px] leading-relaxed mx-auto mt-1">
                The secure mailbox has been reactivated on the mail servers. You can now access your incoming messages and continue receiving new emails.
              </p>
            </div>

            {/* Core Action Button */}
            <button
              onClick={() => handleOpenRecoveredInbox(activatedBox)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyber-purple to-cosmic-lilac text-white text-xs font-black uppercase tracking-wider cursor-pointer hover:brightness-110 active:scale-95 transition-all mt-2"
            >
              Open Inbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
