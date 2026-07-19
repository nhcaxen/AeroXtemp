import React, { useState, useEffect } from "react";
import { UserCheck, Copy, Check, RefreshCw, MapPin, Globe, Shield, Briefcase, CreditCard, ChevronRight } from "lucide-react";
import { incrementAnalytic } from "../utils/analytics";
import { FakeAddress } from "../types";
import { generateFakeAddress, COUNTRY_DATA, getAbsoluteUrl } from "../utils";

export default function AddressGenTab() {
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [identity, setIdentity] = useState<FakeAddress | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (countryOverride?: string | unknown) => {
    setGenerating(true);
    const country = (typeof countryOverride === "string" ? countryOverride : undefined) || selectedCountry;
    try {
      const res = await fetch(getAbsoluteUrl(`/api/addressgen?country=${country}`));
      if (res.ok) {
        const data = await res.json();
        setIdentity(data.address);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Local fallback
      const addr = generateFakeAddress(country);
      setIdentity(addr);
    } finally {
      setGenerating(false);
      incrementAnalytic("identitiesGenerated");
    }
  };

  // Generate an initial address on load
  useEffect(() => {
    if (!identity) {
      handleGenerate("US");
    }
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleCopyAll = () => {
    if (!identity) return;
    const bulkText = `
--- FAKE IDENTITY PROFILE ---
Name: ${identity.firstName} ${identity.lastName}
Gender: ${identity.gender}
DOB: ${identity.dob}
Country: ${identity.country}

ADDRESS:
Street: ${identity.street}
City: ${identity.city}
State: ${identity.state}
Zip: ${identity.zip}

CONTACT & ID:
Phone: ${identity.phone}
SSN/Aadhaar/National ID: ${identity.ssn}

CREDENTIALS:
Username: ${identity.username}
Password: ${identity.password}

EMPLOYMENT:
Company: ${identity.company}
Title: ${identity.jobTitle}
    `.trim();

    navigator.clipboard.writeText(bulkText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Get flag representation for country code
  const getFlag = (code: string) => {
    const flags: Record<string, string> = {
      US: "🇺🇸",
      UK: "🇬🇧",
      DE: "🇩🇪",
      RU: "🇷🇺",
      CA: "🇨🇦",
      IN: "🇮🇳",
      FR: "🇫🇷",
      AU: "🇦🇺",
      JP: "🇯🇵",
      BR: "🇧🇷",
      CN: "🇨🇳",
      AE: "🇦🇪",
      ES: "🇪🇸"
    };
    return flags[code] || "🌐";
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8 select-none">
      {/* Title block */}
      <div className="text-center mb-1">
        <h2 className="text-base font-extrabold tracking-wide text-white uppercase font-display flex items-center justify-center gap-1.5">
          🗺️ Identity Gen Pro <span className="text-[10px] bg-cyber-purple/20 text-cosmic-lilac px-1.5 py-0.5 rounded">AUTO</span>
        </h2>
        <p className="text-[11px] text-neutral-400">
          Procedural multinational address & profile builder for registrations and testing.
        </p>
      </div>

      {/* Generator setup panel */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Target Country Identity
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {Object.keys(COUNTRY_DATA).map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    setSelectedCountry(code);
                    handleGenerate(code);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                    selectedCountry === code
                      ? "bg-cyber-purple border-cyber-purple text-white shadow-lg"
                      : "bg-void-black border-white/[0.05] text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>{getFlag(code)}</span>
                  <span>{COUNTRY_DATA[code].name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerate()}
            disabled={generating}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyber-purple to-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg hover:from-purple-600 hover:to-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            <span>{generating ? "Randomizing..." : "Generate Identity"}</span>
          </button>

          {identity && (
            <button
              onClick={handleCopyAll}
              className="px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/5 text-neutral-300 hover:text-white text-xs font-bold active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              title="Copy Complete Profile Text"
            >
              {copiedAll ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {identity && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {/* Identity Header Card */}
          <div className="p-4 rounded-2xl bg-dark-card border border-white/[0.05] flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-cyber-purple/10 rounded-full blur-xl" />
            
            {/* Avatar seeds initials */}
            <img
              src={identity.avatar}
              alt="Avatar"
              className="w-14 h-14 rounded-2xl bg-cyber-purple border border-white/10 shadow-md"
              referrerPolicy="no-referrer"
            />

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">
                  {identity.firstName} {identity.lastName}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-white/10 text-neutral-300 font-bold uppercase">
                  {identity.gender}
                </span>
              </div>
              <span className="text-[10px] text-cosmic-lilac font-mono font-medium block">
                DOB: {identity.dob} ({new Date().getFullYear() - parseInt(identity.dob.split("-")[0])} Y/O)
              </span>
            </div>
          </div>

          {/* Group 1: Address Details */}
          <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-1 border-b border-white/[0.04] pb-1">
              <MapPin className="w-3.5 h-3.5 text-cyber-purple" />
              <span>Location Coordinates</span>
            </div>

            {/* Street */}
            <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Street</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-cyber-purple/40">{identity.street}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.street, "street")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "street" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* City */}
            <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">City</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-cyber-purple/40">{identity.city}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.city, "city")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "city" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* State / Region */}
            <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">State / Region</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-cyber-purple/40">{identity.state}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.state, "state")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "state" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Postcode */}
            <div className="flex justify-between items-center py-1">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Postcode / Zip</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-cyber-purple/40">{identity.zip}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.zip, "zip")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "zip" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Group 2: Phone and ID Info */}
          <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-1 border-b border-white/[0.04] pb-1">
              <Shield className="w-3.5 h-3.5 text-hot-pink" />
              <span>Contact & Regional IDs</span>
            </div>

            {/* Phone */}
            <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Phone Number</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-cyber-purple/40">{identity.phone}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.phone, "phone")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "phone" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* SSN / ID */}
            <div className="flex justify-between items-center py-1">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">
                  {selectedCountry === "IN" ? "Aadhaar Card" : selectedCountry === "RU" ? "SNILS Code" : "SSN Code"}
                </span>
                <span className="text-xs font-mono font-bold text-white selection:bg-cyber-purple/40">{identity.ssn}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.ssn, "ssn")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "ssn" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Group 3: Online Credentials */}
          <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-1 border-b border-white/[0.04] pb-1">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Online Profile Credentials</span>
            </div>

            {/* Username */}
            <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Generated Username</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-cyber-purple/40">{identity.username}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.username, "username")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "username" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Password */}
            <div className="flex justify-between items-center py-1">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Random secure Password</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-cyber-purple/40">{identity.password}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.password, "password")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "password" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Group 4: Employment Details */}
          <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-1 border-b border-white/[0.04] pb-1">
              <Briefcase className="w-3.5 h-3.5 text-teal-400" />
              <span>Occupation & Company</span>
            </div>

            {/* Company */}
            <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Employer Company</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-cyber-purple/40">{identity.company}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.company, "company")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "company" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Job title */}
            <div className="flex justify-between items-center py-1">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Occupation Role</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-cyber-purple/40">{identity.jobTitle}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.jobTitle, "jobTitle")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "jobTitle" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Futuristic Quote and Guidelines Box */}
      <div className="relative p-4 rounded-xl border border-white/[0.04] bg-void-black/40 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] mt-3">
        <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-cyber-purple to-pink-500" />
        <div className="flex gap-3">
          <span className="text-xl text-cyber-purple select-none shrink-0 font-serif leading-none mt-0.5">“</span>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest block">
              Procedural Testing Integrity
            </span>
            <p className="text-[9.5px] text-neutral-400 leading-relaxed italic">
              All identity matrices, credentials, and geographic locations are compiled procedurally using randomized cryptographic algorithms. None of the profiles correspond to real-world individuals or registered databases, keeping your sandbox activities entirely secure and compliant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
