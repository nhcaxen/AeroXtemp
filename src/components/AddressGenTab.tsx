import React, { useState, useEffect, useRef } from "react";
import { UserCheck, Copy, Check, RefreshCw, MapPin, Globe, Shield, Briefcase, CreditCard, ChevronRight, Search, X } from "lucide-react";
import { incrementAnalytic } from "../utils/analytics";
import { FakeAddress } from "../types";
import { generateFakeAddress, COUNTRY_DATA, getAbsoluteUrl } from "../utils";
import { ALL_COUNTRIES, COUNTRY_FLAGS } from "../countries";

export default function AddressGenTab() {
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [identity, setIdentity] = useState<FakeAddress | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get flag representation for country code
  const getFlag = (code: string) => {
    const uppercaseCode = code.toUpperCase();
    const lookup = uppercaseCode === "UK" ? "GB" : uppercaseCode;
    return COUNTRY_FLAGS[lookup] || "🌐";
  };

  // Filter countries based on search query
  const filteredCountries = Object.keys(ALL_COUNTRIES).filter((code) => {
    const country = ALL_COUNTRIES[code];
    return (
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeCountryName = ALL_COUNTRIES[selectedCountry]?.name || COUNTRY_DATA[selectedCountry]?.name || selectedCountry;
  const popularPresets = ["US", "GB", "IN", "PK", "CA", "DE", "AE", "SA"];

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8 select-none">
      {/* Generator setup panel */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Target Country Identity
            </label>

            {/* Country Search Bar & Autocomplete Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div className="relative flex items-center mb-1">
                <Search className="absolute left-3 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search country (e.g. us, uk, india, pakistan, afghanistan)..."
                  className="pl-9 pr-8 py-2 w-full bg-void-black border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 p-1 text-neutral-500 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && searchQuery.trim() !== "" && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-void-black/95 border border-white/[0.1] rounded-xl shadow-2xl p-1 flex flex-col gap-0.5 backdrop-blur-md">
                  {filteredCountries.slice(0, 15).map((code) => (
                    <button
                      key={code}
                      onClick={() => {
                        const actualCode = code === "GB" ? "UK" : code;
                        setSelectedCountry(actualCode);
                        handleGenerate(actualCode);
                        setSearchQuery("");
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all text-left w-full cursor-pointer"
                    >
                      <span>{getFlag(code)}</span>
                      <span className="flex-1">{ALL_COUNTRIES[code].name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase">{code}</span>
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="text-[11px] text-neutral-500 py-3 text-center">No matching countries found</div>
                  )}
                </div>
              )}
            </div>

            {/* Popular country presets shown when search is empty */}
            {searchQuery.trim() === "" && (
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Popular Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  {popularPresets.map((code) => {
                    const actualCode = code === "GB" ? "UK" : code;
                    const isSelected = selectedCountry === actualCode;
                    return (
                      <button
                        key={code}
                        onClick={() => {
                          setSelectedCountry(actualCode);
                          handleGenerate(actualCode);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-white border-white text-black shadow-md shadow-white/5"
                            : "bg-void-black border-white/[0.05] text-neutral-400 hover:text-white hover:border-white/10"
                        }`}
                      >
                        <span>{getFlag(code)}</span>
                        <span>{code === "GB" ? "UK" : code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Active Country Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/[0.04] rounded-xl mt-1.5">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Active Target:</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span>{getFlag(selectedCountry)}</span>
                <span>{activeCountryName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerate()}
            disabled={generating}
            className="flex-1 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-white/5 rounded-full blur-xl" />
            
            {/* Avatar seeds initials */}
            <img
              src={identity.avatar}
              alt="Avatar"
              className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/10 shadow-md"
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
              <span className="text-[10px] text-zinc-400 font-mono font-medium block">
                DOB: {identity.dob} ({new Date().getFullYear() - parseInt(identity.dob.split("-")[0])} Y/O)
              </span>
            </div>
          </div>

          {/* Grouped Core Identity & Address Matrix */}
          <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-1 border-b border-white/[0.04] pb-1">
              <MapPin className="w-3.5 h-3.5 text-white" />
              <span>Identity & Address Matrix</span>
            </div>

            {/* Street */}
            <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Street</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-white/10">{identity.street}</span>
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
                <span className="text-xs font-mono font-bold text-white selection:bg-white/10">{identity.city}</span>
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
                <span className="text-xs font-mono font-bold text-white selection:bg-white/10">{identity.state}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.state, "state")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "state" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Postcode / Zip */}
            <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Postcode / Zip</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-white/10">{identity.zip}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.zip, "zip")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "zip" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Number */}
            <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Number</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-white/10">{identity.phone}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.phone, "phone")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "phone" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* SSN Code */}
            <div className="flex justify-between items-center py-1">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">SSN Code</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-white/10">{identity.ssn}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.ssn, "ssn")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "ssn" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Group 2: Online Credentials */}
          <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-1 border-b border-white/[0.04] pb-1">
              <Globe className="w-3.5 h-3.5 text-white" />
              <span>Online Profile Credentials</span>
            </div>

            {/* Username */}
            <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Generated Username</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-white/10">{identity.username}</span>
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
                <span className="text-xs font-mono font-bold text-white selection:bg-white/10">{identity.password}</span>
              </div>
              <button
                onClick={() => copyToClipboard(identity.password, "password")}
                className="p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "password" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Group 3: Employment Details */}
          <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-1 border-b border-white/[0.04] pb-1">
              <Briefcase className="w-3.5 h-3.5 text-white" />
              <span>Occupation & Company</span>
            </div>

            {/* Company */}
            <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Employer Company</span>
                <span className="text-xs font-mono font-bold text-white selection:bg-white/10">{identity.company}</span>
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
                <span className="text-xs font-mono font-bold text-white selection:bg-white/10">{identity.jobTitle}</span>
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
    </div>
  );
}
