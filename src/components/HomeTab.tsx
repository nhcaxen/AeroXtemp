import React, { useState } from "react";
import { TabId } from "../types";
import { 
  Heart, 
  Palette, 
  Store, 
  Building2, 
  Presentation, 
  GraduationCap 
} from "lucide-react";

interface HomeTabProps {
  onTabChange: (tab: TabId) => void;
}

export default function HomeTab({ onTabChange }: HomeTabProps) {
  const [selectedUse, setSelectedUse] = useState("personal");

  const handleNextAction = () => {
    if (selectedUse === "profit" || selectedUse === "personal") {
      onTabChange("cardgen");
    } else if (selectedUse === "small_biz" || selectedUse === "large_corp") {
      onTabChange("addressgen");
    } else {
      onTabChange("tempmail");
    }
  };

  const categories = [
    { 
      id: "profit", 
      label: "Profit or charity", 
      icon: <Heart className="w-8 h-8 transition-transform group-hover:scale-110 duration-300" stroke="url(#blueCyanGrad)" strokeWidth={1.8} /> 
    },
    { 
      id: "personal", 
      label: "Personal", 
      icon: <Palette className="w-8 h-8 transition-transform group-hover:scale-110 duration-300" stroke="url(#blueCyanGrad)" strokeWidth={1.8} /> 
    },
    { 
      id: "small_biz", 
      label: "Small business", 
      icon: <Store className="w-8 h-8 transition-transform group-hover:scale-110 duration-300" stroke="url(#blueCyanGrad)" strokeWidth={1.8} /> 
    },
    { 
      id: "large_corp", 
      label: "Large company", 
      icon: <Building2 className="w-8 h-8 transition-transform group-hover:scale-110 duration-300" stroke="url(#blueCyanGrad)" strokeWidth={1.8} /> 
    },
    { 
      id: "teacher", 
      label: "Teacher", 
      icon: <Presentation className="w-8 h-8 transition-transform group-hover:scale-110 duration-300" stroke="url(#blueCyanGrad)" strokeWidth={1.8} /> 
    },
    { 
      id: "student", 
      label: "Student", 
      icon: <GraduationCap className="w-8 h-8 transition-transform group-hover:scale-110 duration-300" stroke="url(#blueCyanGrad)" strokeWidth={1.8} /> 
    }
  ];

  return (
    <div className="flex flex-col items-center justify-between min-h-[85vh] px-6 pt-10 pb-8 select-none relative overflow-hidden">
      {/* SVG Definitions for global neon gradients used in the icons */}
      <svg className="absolute w-0 h-0" width="0" height="0">
        <defs>
          <linearGradient id="blueCyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00e4ff" />
            <stop offset="100%" stopColor="#007aff" />
          </linearGradient>
        </defs>
      </svg>

      {/* Background ambient neon glows to match the beautiful Canva AI screenshot */}
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-[#00b4ff]/04 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-tr from-[#00e4ff]/03 to-transparent blur-[120px] pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col items-center text-center z-10 w-full max-w-md animate-fade-in">
        {/* Custom Cursive cursive style Brand Logo - matching Canva's text layout */}
        <h1 className="text-3xl font-serif italic font-medium text-[#00e4ff] tracking-wide mb-3">
          AeroX
        </h1>

        <h2 className="text-[21px] font-bold text-white tracking-tight leading-tight max-w-xs font-sans">
          What will you be using AeroX for?
        </h2>

        <p className="text-[11px] text-slate-400 mt-2 font-medium">
          Let us know so we can build you a better homepage.
        </p>
      </div>

      {/* 2x3 Grid of premium soft tactile cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-8 mb-8 z-10">
        {categories.map((item) => {
          const isSelected = selectedUse === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedUse(item.id)}
              className={`group relative p-5 rounded-[22px] cursor-pointer text-center flex flex-col items-center justify-center min-h-[120px] transition-all duration-300 border ${
                isSelected
                  ? "bg-gradient-to-b from-[#007aff] to-[#00d4ff] border-transparent text-white shadow-[0_4px_16px_rgba(0,122,255,0.2)] scale-[1.02]"
                  : "bg-[#0b0f1d]/80 border-white/[0.04] text-slate-300 hover:border-[#00e4ff]/15 hover:bg-[#0f152d] shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
              }`}
            >
              {/* Glow backdrop behind selected item */}
              {isSelected && (
                <div className="absolute inset-0 rounded-[22px] bg-gradient-to-b from-[#007aff]/10 to-[#00d4ff]/10 blur-sm -z-10" />
              )}

              {/* Radio Selector in the top right corner */}
              <div className="absolute top-3 right-3">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border transition-all ${
                  isSelected
                    ? "border-white bg-white"
                    : "border-slate-700 bg-transparent"
                }`}>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[#007aff]" />
                  )}
                </div>
              </div>

              {/* Icon Container with centered layout */}
              <div className="mb-3.5 flex items-center justify-center">
                {isSelected ? (
                  // White icon on selected state
                  React.cloneElement(item.icon, { stroke: "#ffffff" })
                ) : (
                  // Gradient icon on unselected state
                  item.icon
                )}
              </div>

              {/* Label below the icon */}
              <span className={`text-[11px] font-semibold tracking-wide ${
                isSelected ? "text-white font-bold" : "text-slate-300 font-medium"
              }`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Button matching the Canva AI UI perfectly */}
      <div className="w-full max-w-sm z-10 mt-auto px-1">
        <button
          onClick={handleNextAction}
          className="w-full py-3.5 rounded-2xl bg-[#007aff] hover:bg-[#008cff] active:scale-[0.98] transition-all text-[12px] font-bold text-white shadow-[0_2px_8px_rgba(0,122,255,0.15)] cursor-pointer flex items-center justify-center tracking-wider"
        >
          Next
        </button>
      </div>
    </div>
  );
}
