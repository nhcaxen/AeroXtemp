import React, { useState, useEffect } from "react";
import { TabId } from "./types";
import TelegramFrame from "./components/TelegramFrame";
import Navbar from "./components/Navbar";
import HomeTab from "./components/HomeTab";
import ShopTab from "./components/ShopTab";
import TempMailTab from "./components/TempMailTab";
import AddressGenTab from "./components/AddressGenTab";
import ProfileTab from "./components/ProfileTab";
import AdminTab from "./components/AdminTab";
import { getAbsoluteUrl } from "./utils";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const handleTabChange = (newTab: TabId) => {
    setActiveTab(newTab);
  };

  const fetchUserProfile = async (id: string, userNm: string, disp: string, photoUrl: string = "", referrerId: string = "") => {
    setIsLoadingProfile(true);
    try {
      const apiUrl = getAbsoluteUrl(`/api/user-profile?telegramId=${encodeURIComponent(id)}&username=${encodeURIComponent(userNm)}&displayName=${encodeURIComponent(disp)}&photoUrl=${encodeURIComponent(photoUrl)}&referrerId=${encodeURIComponent(referrerId)}`);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (err) {
      console.error("Failed to load user profile from database", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    // Load Telegram WebApp user context if inside Telegram
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    let initialId = "5834920194";
    let initialUser = "AeroX_Developer";
    let initialDisplay = "AeroX VIP Member";
    let initialPhotoUrl = "";
    let referrerId = "";

    if (tgUser) {
      initialId = String(tgUser.id);
      initialUser = tgUser.username || `user_${initialId.substring(0, 5)}`;
      initialDisplay = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || "Telegram Member";
      initialPhotoUrl = tgUser.photo_url || "";
      
      // Save to localStorage immediately so other tabs read the correct TG ID
      localStorage.setItem("aerox_tg_id", initialId);
      localStorage.setItem("aerox_tg_user", initialUser);
      localStorage.setItem("aerox_tg_display", initialDisplay);

      const startParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
      if (startParam) {
        referrerId = startParam;
      }
    } else {
      const savedId = localStorage.getItem("aerox_tg_id");
      const savedUser = localStorage.getItem("aerox_tg_user");
      const savedDisplay = localStorage.getItem("aerox_tg_display");
      if (savedId) initialId = savedId;
      if (savedUser) initialUser = savedUser;
      if (savedDisplay) initialDisplay = savedDisplay;
    }

    fetchUserProfile(initialId, initialUser, initialDisplay, initialPhotoUrl, referrerId);

    // Listen to profile updates to refresh immediately in root state
    const handleProfileUpdated = (e: any) => {
      if (e.detail) {
        setUserProfile(e.detail);
      }
    };
    
    // Add custom event listener for profile sync
    window.addEventListener("aerox_profile_updated", handleProfileUpdated);
    return () => {
      window.removeEventListener("aerox_profile_updated", handleProfileUpdated);
    };
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeTab
            onTabChange={handleTabChange}
          />
        );
      case "cardgen":
        return <ShopTab userRole={userProfile?.role} />;
      case "tempmail":
        return <TempMailTab />;
      case "addressgen":
        return <AddressGenTab />;
      case "profile":
        return <ProfileTab onTabChange={handleTabChange} />;
      case "admin":
        if (userProfile?.role === "owner") {
          return <AdminTab adminTelegramId={userProfile.telegramId} />;
        }
        return (
          <div className="flex items-center justify-center min-h-[50vh] p-8 select-none">
            <div className="text-center">
              <span className="text-red-500 font-black tracking-widest text-sm block mb-1">ACCESS DENIED</span>
              <span className="text-[10px] text-neutral-400 font-bold block uppercase">Unauthorized Portal Access</span>
            </div>
          </div>
        );
      default:
        return (
          <HomeTab
            onTabChange={handleTabChange}
          />
        );
    }
  };

  return (
    <TelegramFrame activeTab={activeTab} onTabChange={handleTabChange}>
      {/* Scrollable content container for active tab with touch gestures for swiping navigation */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none relative w-full h-full"
      >
        <div className="w-full min-h-full">
          {renderActiveTab()}
        </div>
      </div>

      {/* Sticky Bottom Navigation menu bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOwner={userProfile?.role === "owner"}
      />
    </TelegramFrame>
  );
}
