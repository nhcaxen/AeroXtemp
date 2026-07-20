import React from "react";
import { Home, ShoppingBag, Mail, UserCheck, User, Shield } from "lucide-react";
import { TabId } from "../types";
import { motion } from "motion/react";
import RobotCompanion from "./RobotCompanion";

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isOwner?: boolean;
}

export default function Navbar({ activeTab, onTabChange, isOwner }: NavbarProps) {
  const navItems = [
    { id: "home" as TabId, label: "Lobby", icon: Home },
    { id: "cardgen" as TabId, label: "Shop", icon: ShoppingBag },
    { id: "tempmail" as TabId, label: "Temp Mail", icon: Mail },
    { id: "addressgen" as TabId, label: "Identity", icon: UserCheck },
    { id: "profile" as TabId, label: "Profile", icon: User },
  ];

  // Dynamically include Admin tab if owner
  const items = [...navItems];
  if (isOwner && !items.some(i => i.id === "admin")) {
    items.push({ id: "admin" as TabId, label: "Admin", icon: Shield });
  }

  const activeIndex = items.findIndex((item) => item.id === activeTab);
  const mascotLeft = items.length > 0 ? ((activeIndex + 0.5) / items.length) * 100 : 50;

  return (
    <div className="absolute bottom-4 left-4 right-4 h-[74px] rounded-[24px] bg-[#121212]/90 border border-white/[0.08] backdrop-blur-[24px] flex items-center justify-around px-2 z-40 select-none shadow-[0_12px_40px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.12)]">
      {/* Liquid edge premium silver reflection line */}
      <div className="absolute top-0 inset-x-6 h-[1.2px] bg-gradient-to-r from-transparent via-white/30 to-transparent shadow-[0_1px_8px_rgba(255,255,255,0.2)] pointer-events-none" />
      
      {/* Glossy top reflection layer resembling an iOS curved glass sheet */}
      <div className="absolute inset-x-0 top-0 bottom-1/2 rounded-t-[24px] bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

      {/* Redesigned Premium Floating Mascot centered precisely above the active tab button with high-end physics spring */}
      <motion.div
        animate={{ left: `${mascotLeft}%` }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 24,
          mass: 0.8
        }}
        className="absolute -top-[45px] -translate-x-1/2 z-50 pointer-events-none"
      >
        <RobotCompanion activeTab={activeTab} items={items} />
      </motion.div>

      {/* SVG Definitions for the premium monochrome silver gradient fill/stroke */}
      <svg className="absolute w-0 h-0" width="0" height="0">
        <defs>
          <linearGradient id="activeTabGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#a1a1aa" />
          </linearGradient>
        </defs>
      </svg>

      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            id={`nav-btn-${item.id}`}
            onClick={() => onTabChange(item.id)}
            className="flex flex-col items-center justify-center flex-1 h-full py-2 relative transition-all duration-300 cursor-pointer group"
          >
            {/* Premium iOS Liquid Glass capsule background with layoutId animation to slide smoothly */}
            {isActive && (
              <motion.div
                layoutId="active-nav-pill"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30
                }}
                className="absolute inset-x-1 inset-y-1.5 rounded-[18px] bg-white/5 border border-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] -z-10"
              />
            )}

            {/* Icon Wrapper with fluid responsive scaling */}
            <div
              className={`p-1.5 rounded-xl transition-all duration-300 relative ${
                isActive
                  ? "scale-[1.12]"
                  : "text-slate-400 group-hover:text-slate-200 group-hover:scale-105"
              }`}
            >
              <Icon 
                className="w-[19px] h-[19px] transition-all duration-300" 
                stroke={isActive ? "url(#activeTabGrad)" : "currentColor"}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            </div>

            {/* Custom high-scannable uppercase label */}
            <span
              className={`text-[8px] font-black uppercase tracking-widest mt-0.5 transition-all duration-300 ${
                isActive 
                  ? "text-white" 
                  : "text-slate-500 group-hover:text-slate-400"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
