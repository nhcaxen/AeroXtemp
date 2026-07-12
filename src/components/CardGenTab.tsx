import React, { useState, useEffect } from "react";
import { Copy, RefreshCw, Layers, CheckCircle2, AlertCircle, FileText, ChevronDown, Check } from "lucide-react";
import { incrementAnalytic } from "../utils/analytics";
import { GeneratedCard, BinInfo } from "../types";
import { generateCards, lookupBin, PRESET_BINS } from "../utils";

export default function CardGenTab() {
  const [binInput, setBinInput] = useState("414720xxxxxxxxxx");
  const [expiryMonth, setExpiryMonth] = useState("rnd");
  const [expiryYear, setExpiryYear] = useState("rnd");
  const [cvv, setCvv] = useState("");
  const [quantity, setQuantity] = useState(15);
  const [validateLuhn, setValidateLuhn] = useState(true);
  const [exportFormat, setExportFormat] = useState<"pipe" | "json" | "csv" | "sql">("pipe");
  
  const [generatedList, setGeneratedList] = useState<GeneratedCard[]>([]);
  const [binInfo, setBinInfo] = useState<BinInfo | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Auto look up BIN information on input change
  useEffect(() => {
    const cleanBin = binInput.replace(/[^0-9]/g, "");
    if (cleanBin.length >= 6) {
      const info = lookupBin(cleanBin);
      setBinInfo(info as BinInfo | null);
    } else {
      setBinInfo(null);
    }
  }, [binInput]);

  // Set preset BIN helper
  const loadPreset = (bin: string) => {
    setBinInput(`${bin}xxxxxxxxxx`);
    setShowPresets(false);
  };

  const handleGenerate = async () => {
    try {
      const res = await fetch("/api/cardgen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          binPattern: binInput,
          expiryMonth,
          expiryYear,
          cvv,
          quantity,
          validateLuhn
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedList(data.cards);
        setCopiedAll(false);
      } else {
        throw new Error();
      }
    } catch (err) {
      const cards = generateCards(
        binInput,
        expiryMonth,
        expiryYear,
        cvv,
        quantity,
        validateLuhn
      );
      setGeneratedList(cards);
      setCopiedAll(false);
    } finally {
      incrementAnalytic("cardsGenerated", quantity);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getFormattedOutputText = () => {
    if (exportFormat === "json") {
      return JSON.stringify(generatedList.map(c => ({
        number: c.number,
        expiryMonth: c.expiryMonth,
        expiryYear: c.expiryYear,
        cvv: c.cvv,
        network: c.network
      })), null, 2);
    }

    if (exportFormat === "csv") {
      const headers = "Card Number,Expiry Month,Expiry Year,CVV,Brand\n";
      const rows = generatedList.map(c => `${c.number},${c.expiryMonth},${c.expiryYear},${c.cvv},${c.network}`).join("\n");
      return headers + rows;
    }

    if (exportFormat === "sql") {
      return generatedList.map(c => 
        `INSERT INTO credit_cards (card_number, exp_month, exp_year, cvv, brand) VALUES ('${c.number}', '${c.expiryMonth}', '${c.expiryYear}', '${c.cvv}', '${c.network}');`
      ).join("\n");
    }

    // Default pipe separator CARD|MM|YYYY|CVV
    return generatedList.map(c => c.formatted).join("\n");
  };

  const handleCopyAll = () => {
    const output = getFormattedOutputText();
    if (!output) return;
    copyToClipboard(output);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingle = (text: string, idx: number) => {
    copyToClipboard(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Get card background styling based on brand
  const getCardStyle = () => {
    if (!binInfo) return "from-slate-900 to-indigo-950 border-white/[0.04]";
    if (binInfo.brand === "Visa") return "from-indigo-600 to-blue-900 border-indigo-500/30";
    if (binInfo.brand === "Mastercard") return "from-red-900 to-amber-900 border-amber-500/20";
    if (binInfo.brand === "Amex") return "from-emerald-900 to-teal-950 border-emerald-500/30";
    if (binInfo.brand === "Discover") return "from-orange-700 to-orange-950 border-orange-500/30";
    return "from-purple-900 to-neutral-900 border-purple-500/30";
  };

  // Visual card number renderer (adds nice spaced blocks)
  const formatVisualCardNumber = (pattern: string) => {
    let clean = pattern.replace(/[^0-9xX]/g, "");
    if (clean.length < 16) {
      clean = clean.padEnd(16, "•");
    }
    const blocks = [];
    for (let i = 0; i < clean.length; i += 4) {
      blocks.push(clean.substring(i, i + 4));
    }
    return blocks.join(" ");
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8 select-none">
      {/* Title block */}
      <div className="text-center mb-1">
        <h2 className="text-base font-extrabold tracking-wide text-white uppercase font-display flex items-center justify-center gap-1.5">
          💳 Namso Gen Pro <span className="text-[10px] bg-cyber-purple/20 text-cosmic-lilac px-1.5 py-0.5 rounded">v3.5</span>
        </h2>
        <p className="text-[11px] text-neutral-400">
          Professional card number generator with active Luhn algorithm completion.
        </p>
      </div>

      {/* Dynamic 3D Bank Card Preview */}
      <div className={`p-5 rounded-2xl bg-gradient-to-br ${getCardStyle()} border shadow-2xl relative overflow-hidden transition-all duration-500 animate-float`}>
        {/* Abstract cyber vector details */}
        <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="absolute right-12 top-6 w-24 h-12 bg-white/[0.02] transform rotate-12 rounded-full pointer-events-none" />

        {/* Card Top Level Info */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/50 tracking-widest uppercase font-bold">
              {binInfo ? binInfo.bank : "DEBIT CARD"}
            </span>
            <span className="text-[8px] font-mono font-medium text-white/40 tracking-wider">
              {binInfo ? `${binInfo.type} / ${binInfo.level}` : "PROTOTYPE TESTING"}
            </span>
          </div>

          {/* Card Network Watermark badge */}
          <div className="px-2.5 py-1 rounded bg-white/10 border border-white/10 font-bold text-xs tracking-wider text-white">
            {binInfo ? binInfo.brand : "Visa"}
          </div>
        </div>

        {/* Gold Card Chip SVG representation */}
        <div className="w-10 h-7 rounded bg-amber-400/90 border border-amber-300/60 relative overflow-hidden flex flex-col justify-center gap-1 px-1 mb-5">
          <div className="h-[1px] bg-amber-900/40 w-full" />
          <div className="h-[1px] bg-amber-900/40 w-full" />
          <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-amber-900/40" />
          <div className="absolute right-4 top-0 bottom-0 w-[1px] bg-amber-900/40" />
        </div>

        {/* Card Number Block */}
        <div className="text-lg md:text-xl font-mono text-white tracking-widest font-bold mb-5 leading-none">
          {formatVisualCardNumber(binInput)}
        </div>

        {/* Footer info inside Card */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[8px] text-white/40 uppercase tracking-widest block">Card Holder</span>
            <span className="text-xs font-mono font-bold text-white tracking-wide">JERSEY STUDIO</span>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col text-right">
              <span className="text-[8px] text-white/40 uppercase tracking-widest block">Expiry</span>
              <span className="text-xs font-mono font-bold text-white">
                {expiryMonth === "rnd" ? "MM" : expiryMonth}/{expiryYear === "rnd" ? "YYYY" : expiryYear}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[8px] text-white/40 uppercase tracking-widest block">CVV</span>
              <span className="text-xs font-mono font-bold text-white">
                {cvv ? cvv : "•••"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset BIN expander */}
      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="w-full px-3 py-2.5 rounded-xl bg-dark-surface border border-white/[0.04] text-xs font-bold text-cosmic-lilac flex items-center justify-between hover:bg-white/[0.02] cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            📖 Quick Preset BINs
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showPresets ? "rotate-180" : ""}`} />
        </button>

        {showPresets && (
          <div className="absolute left-0 right-0 top-11 bg-dark-card border border-white/[0.08] rounded-xl max-h-48 overflow-y-auto p-2 z-30 shadow-2xl flex flex-col gap-1.5">
            {PRESET_BINS.map((preset) => (
              <button
                key={preset.bin}
                onClick={() => loadPreset(preset.bin)}
                className="w-full p-2 rounded-lg bg-void-black/80 hover:bg-cyber-purple/20 transition-all text-left text-xs flex justify-between items-center border border-white/[0.02] cursor-pointer"
              >
                <div>
                  <span className="font-mono font-bold text-white pr-2">{preset.bin}</span>
                  <span className="text-[10px] text-neutral-400">{preset.bank} ({preset.country})</span>
                </div>
                <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded text-neutral-300 font-mono">
                  {preset.brand}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controls Form Grid */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] flex flex-col gap-3.5">
        
        {/* BIN INPUT */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex justify-between">
            <span>Enter BIN Formula (up to 16 characters)</span>
            {binInfo && (
              <span className="text-cosmic-lilac text-[9px] font-mono uppercase font-bold">
                Lookup: {binInfo.bank} ({binInfo.country})
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              value={binInput}
              onChange={(e) => setBinInput(e.target.value)}
              className="w-full bg-void-black border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-cyber-purple transition-all"
              placeholder="e.g. 542418xxxxxxxxxx"
            />
            <button
              onClick={() => setBinInput("xxxxxxxxxxxxxxxx")}
              className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>

        {/* EXPIRY MONTH & YEAR ROW */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Expiry Month</label>
            <select
              value={expiryMonth}
              onChange={(e) => setExpiryMonth(e.target.value)}
              className="w-full bg-void-black border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyber-purple transition-all cursor-pointer"
            >
              <option value="rnd">Random Month</option>
              {Array.from({ length: 12 }).map((_, i) => {
                const monthStr = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
                return <option key={monthStr} value={monthStr}>{monthStr}</option>;
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Expiry Year</label>
            <select
              value={expiryYear}
              onChange={(e) => setExpiryYear(e.target.value)}
              className="w-full bg-void-black border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyber-purple transition-all cursor-pointer"
            >
              <option value="rnd">Random Year</option>
              {Array.from({ length: 8 }).map((_, i) => {
                const year = new Date().getFullYear() + i;
                return <option key={year} value={year.toString()}>{year}</option>;
              })}
            </select>
          </div>
        </div>

        {/* CVV & QUANTITY ROW */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Custom CVV (CVV2)</label>
            <input
              type="text"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
              placeholder="Random"
              className="w-full bg-void-black border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-cyber-purple transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Quantity ({quantity})</label>
            <input
              type="range"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full accent-cyber-purple h-2 mt-4 bg-void-black rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* EXTRA TOGGLES */}
        <div className="flex items-center justify-between py-1 bg-void-black/40 px-2 rounded-xl border border-white/[0.02]">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="luhn-check"
              checked={validateLuhn}
              onChange={(e) => setValidateLuhn(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-cyber-purple focus:ring-cyber-purple accent-cyber-purple cursor-pointer"
            />
            <label htmlFor="luhn-check" className="text-xs text-neutral-300 font-semibold cursor-pointer">
              Enforce Luhn (Valid CC Checksum)
            </label>
          </div>
          <AlertCircle className="w-4 h-4 text-neutral-500 hover:text-white transition-all cursor-help" title="Fills last digit deterministically to make card valid in standard validation libraries" />
        </div>

        {/* Output Format Picker */}
        <div className="flex items-center justify-between gap-1 bg-void-black p-1 rounded-xl border border-white/[0.04]">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-2">Export Format:</span>
          <div className="flex gap-1">
            {(["pipe", "json", "csv", "sql"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setExportFormat(fmt)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  exportFormat === fmt
                    ? "bg-cyber-purple text-white shadow-md font-extrabold"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Glow Action Button */}
        <button
          onClick={handleGenerate}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyber-purple to-indigo-600 text-white text-xs font-extrabold uppercase tracking-widest shadow-lg hover:from-purple-600 hover:to-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          <span>Generate Bulk Testing Matrix</span>
        </button>

      </div>

      {/* Generated output Area */}
      {generatedList.length > 0 && (
        <div className="p-4 rounded-2xl bg-dark-surface border border-white/[0.04] flex flex-col gap-3 animate-fade-in">
          
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Matrix Results ({generatedList.length})
            </span>
            
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1 text-[10px] font-bold text-cosmic-lilac bg-cyber-purple/10 border border-cyber-purple/20 px-2.5 py-1 rounded-lg hover:bg-cyber-purple/20 transition-all cursor-pointer"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied All!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All</span>
                </>
              )}
            </button>
          </div>

          {/* Terminal / Code Editor card listing */}
          <div className="bg-void-black border border-white/[0.06] rounded-xl p-3 max-h-56 overflow-y-auto font-mono text-[11px] leading-relaxed select-text text-neutral-300">
            {exportFormat === "pipe" ? (
              <div className="flex flex-col gap-1.5">
                {generatedList.map((card, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center hover:bg-white/[0.02] p-1 rounded transition-all group"
                  >
                    <span>{card.formatted}</span>
                    <button
                      onClick={() => handleCopySingle(card.formatted, idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white transition-all cursor-pointer"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-cosmic-lilac whitespace-pre-wrap leading-tight font-mono text-[10px] select-text">
                {getFormattedOutputText()}
              </pre>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
