import React from "react";
import { Home, ShoppingBag, Mail, UserCheck, User, Shield, Sparkles } from "lucide-react";
import { TabId } from "../types";

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



  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-dark-surface/95 border-t border-white/[0.04] backdrop-blur-md flex items-center justify-around px-2 z-40 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            id={`nav-btn-${item.id}`}
            onClick={() => onTabChange(item.id)}
            className="flex flex-col items-center justify-center flex-1 py-1 h-full relative transition-all duration-200 cursor-pointer"
          >
            {/* Soft background glow for active item */}
            {isActive && (
              <span className="absolute inset-x-4 top-0 h-[2px] bg-cyber-purple shadow-[0_-4px_12px_rgba(124,58,237,0.5)]" />
            )}

            <div
              className={`p-1 rounded-xl transition-all duration-300 ${
                isActive
                  ? "text-cyber-purple scale-110"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>

            <span
              className={`text-[10px] font-medium tracking-wide transition-colors ${
                isActive ? "text-cyber-purple font-semibold" : "text-neutral-500"
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
