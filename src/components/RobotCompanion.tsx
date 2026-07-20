import React, { useState, useEffect } from "react";
import { TabId } from "../types";

export type MascotEmotion =
  | "blink"
  | "happy"
  | "curious"
  | "thinking"
  | "looking_left"
  | "looking_right"
  | "sleep"
  | "loading"
  | "wink"
  | "excited"
  | "surprise";

interface RobotCompanionProps {
  activeTab?: TabId;
  items?: Array<{ id: TabId; label: string; icon: any }>;
}

export default function RobotCompanion({ activeTab = "home", items = [] }: RobotCompanionProps) {
  const [emotion, setEmotion] = useState<MascotEmotion>("happy");
  const [prevIndex, setPrevIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | "idle">("idle");
  const [isCelebrated, setIsCelebrated] = useState(false);

  // Find index of the active tab
  const activeIndex = items.length > 0 ? items.findIndex((item) => item.id === activeTab) : 0;

  // Monitor activeTab changes to set primary emotions and direction transitions
  useEffect(() => {
    if (items.length > 0) {
      if (activeIndex !== prevIndex) {
        const dir = activeIndex > prevIndex ? "right" : "left";
        setDirection(dir);
        setPrevIndex(activeIndex);

        // Reset movement lean after transition duration
        const timer = setTimeout(() => {
          setDirection("idle");
        }, 550);
        return () => clearTimeout(timer);
      }
    }

    // Assign specific cute interactive emotions based on active tab
    switch (activeTab) {
      case "cardgen":
        setEmotion("excited");
        break;
      case "tempmail":
        setEmotion("surprise");
        break;
      case "addressgen":
        setEmotion("curious");
        break;
      case "profile":
        setEmotion("wink");
        break;
      case "admin":
        setEmotion("thinking");
        break;
      case "home":
      default:
        setEmotion("happy");
        break;
    }
  }, [activeTab, activeIndex, items]);

  // Periodic random micro-behaviors to keep the robot alive
  useEffect(() => {
    if (activeTab !== "home") return;

    const idleInterval = setInterval(() => {
      const roll = Math.random();
      if (roll < 0.15) {
        setEmotion("blink");
        setTimeout(() => setEmotion("happy"), 250);
      } else if (roll < 0.30) {
        setEmotion("looking_left");
      } else if (roll < 0.45) {
        setEmotion("looking_right");
      } else if (roll < 0.60) {
        setEmotion("curious");
      } else if (roll < 0.70) {
        setEmotion("sleep");
      } else {
        setEmotion("happy");
      }
    }, 4500);

    return () => clearInterval(idleInterval);
  }, [activeTab]);

  // Mascot Click handler
  const handleMascotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCelebrated(true);
    const oldEmotion = emotion;
    setEmotion("wink");
    
    setTimeout(() => {
      setIsCelebrated(false);
      setEmotion(oldEmotion);
    }, 850);
  };

  // Render the animated, extremely cute glowing cyan LED eyes & mouth inside the visor
  // Render the animated, extremely cute glowing white LED eyes & mouth inside the visor
  const renderFace = () => {
    switch (emotion) {
      case "blink":
        return (
          <g filter="url(#cyanGlow)">
            {/* Sleeping flat line eyes with tiny cute end flicks */}
            <rect x="28" y="32" width="13" height="3.5" rx="1.7" fill="#ffffff" />
            <rect x="59" y="32" width="13" height="3.5" rx="1.7" fill="#ffffff" />
            {/* Symmetrical cute little smile */}
            <path d="M 45 38.5 Q 50 41.5 55 38.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </g>
        );
      case "happy":
        return (
          <g filter="url(#cyanGlow)">
            {/* Thick vertical capsule eyes just like Faw but with high-end inner shine */}
            <rect x="30" y="24" width="10" height="15" rx="5" fill="#ffffff" className="anim-eye-pulse" />
            <rect x="60" y="24" width="10" height="15" rx="5" fill="#ffffff" className="anim-eye-pulse" />
            
            {/* Super cute highlight stars inside happy capsules */}
            <circle cx="33" cy="28" r="1.8" fill="#a1a1aa" />
            <circle cx="63" cy="28" r="1.8" fill="#a1a1aa" />

            {/* Cute semi-circular open smiling mouth with tongue detail */}
            <path d="M 44 38 A 6 6 0 0 0 56 38 Z" fill="#ffffff" />
          </g>
        );
      case "curious":
        return (
          <g filter="url(#cyanGlow)">
            {/* Adorable tilted expression with a tiny floating curiosity sparkle */}
            <rect x="29" y="25" width="9" height="13" rx="4.5" fill="#ffffff" transform="rotate(-6 33.5 31.5)" />
            <circle cx="32" cy="29" r="1.5" fill="#a1a1aa" />

            <rect x="61" y="22" width="11" height="16" rx="5.5" fill="#ffffff" transform="rotate(8 66.5 30)" />
            <circle cx="64" cy="26" r="2" fill="#a1a1aa" />
            
            {/* Curved questioning tiny mouth */}
            <circle cx="50" cy="38" r="2.8" fill="#ffffff" />
            <path d="M 28 17 L 38 19" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

            {/* Glowing cute question symbol */}
            <path d="M 50 18 Q 52 14 54 16 T 50 20" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" className="animate-pulse" />
            <circle cx="50" cy="22" r="0.6" fill="#ffffff" />
          </g>
        );
      case "thinking":
        return (
          <g filter="url(#cyanGlow)">
            {/* Eyes looking slightly up and in with tiny moving thought sparkles */}
            <rect x="32" y="22" width="9" height="14" rx="4.5" fill="#ffffff" />
            <circle cx="34" cy="25" r="1.5" fill="#a1a1aa" />

            <rect x="59" y="22" width="9" height="14" rx="4.5" fill="#ffffff" />
            <circle cx="61" cy="25" r="1.5" fill="#a1a1aa" />

            {/* Cute tiny straight line mouth */}
            <rect x="46" y="37.5" width="8" height="2.5" rx="1.2" fill="#ffffff" />
            
            {/* Micro cute light thought bubbles rising */}
            <circle cx="49" cy="18" r="1.2" fill="#ffffff" className="animate-ping" style={{ animationDuration: "1.5s" }} />
            <circle cx="53" cy="15" r="0.8" fill="#ffffff" className="animate-pulse" />
          </g>
        );
      case "looking_left":
        return (
          <g filter="url(#cyanGlow)">
            <rect x="26" y="24" width="10" height="15" rx="5" fill="#ffffff" />
            <circle cx="29" cy="28" r="1.5" fill="#a1a1aa" />

            <rect x="56" y="24" width="10" height="15" rx="5" fill="#ffffff" />
            <circle cx="59" cy="28" r="1.5" fill="#a1a1aa" />

            <path d="M 41 38 A 4 4 0 0 0 49 38 Z" fill="#ffffff" />
          </g>
        );
      case "looking_right":
        return (
          <g filter="url(#cyanGlow)">
            <rect x="34" y="24" width="10" height="15" rx="5" fill="#ffffff" />
            <circle cx="37" cy="28" r="1.5" fill="#a1a1aa" />

            <rect x="64" y="24" width="10" height="15" rx="5" fill="#ffffff" />
            <circle cx="67" cy="28" r="1.5" fill="#a1a1aa" />

            <path d="M 51 38 A 4 4 0 0 0 59 38 Z" fill="#ffffff" />
          </g>
        );
      case "sleep":
        return (
          <g filter="url(#cyanGlow)">
            {/* Sleepy curved arches */}
            <path d="M 29 30 Q 35 37 41 30" stroke="#ffffff" strokeWidth="4.2" strokeLinecap="round" fill="none" />
            <path d="M 59 30 Q 65 37 71 30" stroke="#ffffff" strokeWidth="4.2" strokeLinecap="round" fill="none" />
            {/* Tiny sleeping bubble mouth */}
            <circle cx="50" cy="38" r="2" fill="#ffffff" />
            {/* Rising "Zzz" lettering effect done elegantly */}
            <path d="M 72 20 L 76 20 L 72 24 L 76 24" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" className="animate-[bounce_2s_infinite]" />
          </g>
        );
      case "loading":
        return (
          <g className="animate-spin" style={{ transformOrigin: "50px 32px" }}>
            <circle cx="50" cy="32" r="11" stroke="#ffffff" strokeWidth="3.5" strokeDasharray="14,12" fill="none" strokeLinecap="round" />
          </g>
        );
      case "wink":
        return (
          <g filter="url(#cyanGlow)">
            {/* Smiling arch left, happy thick capsule right with high-end spark */}
            <path d="M 28 32 Q 34 23 40 32" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            <rect x="60" y="24" width="10" height="15" rx="5" fill="#ffffff" />
            <circle cx="63" cy="28" r="2" fill="#a1a1aa" />
            
            {/* Floating tiny heart next to the wink for extra premium cuteness */}
            <path d="M 74 25 C 74 24, 72 23, 71 24 C 70 25, 70 27, 72 29 L 74 31 L 76 29 C 78 27, 78 25, 77 24 C 76 23, 74 24, 74 25 Z" fill="#ffffff" className="animate-pulse" />

            {/* Big happy open mouth */}
            <path d="M 44 37 A 6 6 0 0 0 56 37 Z" fill="#ffffff" />
          </g>
        );
      case "excited":
        return (
          <g filter="url(#cyanGlow)">
            {/* Squinting closed eyes (> <) */}
            <path d="M 28 27 L 37 32 L 28 37" stroke="#ffffff" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M 72 27 L 63 32 L 72 37" stroke="#ffffff" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Super happy wide smile */}
            <path d="M 43 36 A 7 7 0 0 0 57 36 Z" fill="#ffffff" />
            {/* Double cheek glow */}
            <circle cx="31" cy="38" r="1.5" fill="#a1a1aa" opacity="0.8" />
            <circle cx="69" cy="38" r="1.5" fill="#a1a1aa" opacity="0.8" />
          </g>
        );
      case "surprise":
        return (
          <g filter="url(#cyanGlow)">
            {/* Giant cute wide open circular eyes with tiny shock reflections */}
            <circle cx="34" cy="30" r="8.5" stroke="#ffffff" strokeWidth="4" fill="none" />
            <circle cx="34" cy="30" r="3" fill="#ffffff" />
            <circle cx="32.5" cy="28.5" r="1" fill="#a1a1aa" />

            <circle cx="66" cy="30" r="8.5" stroke="#ffffff" strokeWidth="4" fill="none" />
            <circle cx="66" cy="30" r="3" fill="#ffffff" />
            <circle cx="64.5" cy="28.5" r="1" fill="#a1a1aa" />
            
            <circle cx="50" cy="39" r="4.5" fill="#ffffff" />
          </g>
        );
      default:
        return (
          <g filter="url(#cyanGlow)">
            {/* Default signature Faw Face: Two capsule eyes + happy glowing semi-circle smile */}
            <rect x="30" y="24" width="10" height="15" rx="5" fill="#ffffff" />
            <rect x="60" y="24" width="10" height="15" rx="5" fill="#ffffff" />
            <circle cx="33" cy="28" r="1.8" fill="#a1a1aa" />
            <circle cx="63" cy="28" r="1.8" fill="#a1a1aa" />
            <path d="M 44 38 A 6 6 0 0 0 56 38 Z" fill="#ffffff" />
          </g>
        );
    }
  };

  // Active page accessories
  const renderAccessory = () => {
    switch (activeTab) {
      case "cardgen":
        return (
          <g transform="translate(73, 56) rotate(-4)" className="animate-pulse">
            <rect x="0" y="0" width="16" height="10" rx="2" fill="url(#holoAccessory)" stroke="#ffffff" strokeWidth="0.6" opacity="0.9" />
            <line x1="0" y1="2.8" x2="16" y2="2.8" stroke="#ffffff" strokeWidth="1" />
            <rect x="2.5" y="5.5" width="3" height="2.2" rx="0.4" fill="#a1a1aa" opacity="0.8" />
            <circle cx="12" cy="6.5" r="1.2" fill="#ffffff" />
          </g>
        );
      case "tempmail":
        return (
          <g transform="translate(72, 55) rotate(10)" className="anim-floating-accessory">
            <path d="M 0 0 L 15 0 L 15 10 L 0 10 Z" fill="url(#holoAccessory)" stroke="#ffffff" strokeWidth="0.6" opacity="0.9" />
            <path d="M 0 0 L 7.5 5.5 L 15 0 M 0 10 L 5.5 6 M 15 10 L 9.5 6" stroke="#ffffff" strokeWidth="0.5" />
          </g>
        );
      case "addressgen":
        return (
          <g transform="translate(71, 54) rotate(-6)" className="anim-floating-accessory">
            <path d="M 0 0 L 5 3 L 10 -1 L 15 2 L 15 11 L 10 8 L 5 12 L 0 9 Z" fill="url(#holoAccessory)" stroke="#ffffff" strokeWidth="0.6" opacity="0.85" />
            <line x1="5" y1="3" x2="5" y2="12" stroke="#ffffff" strokeWidth="0.5" />
            <line x1="10" y1="-1" x2="10" y2="8" stroke="#ffffff" strokeWidth="0.5" />
          </g>
        );
      case "admin":
        return (
          <g transform="translate(73, 54)" className="animate-pulse">
            <path d="M 0 0 L 11 0 C 11 6.5 5.5 10.5 5.5 10.5 C 5.5 10.5 0 6.5 0 0 Z" fill="url(#holoAccessory)" stroke="#ffffff" strokeWidth="0.6" />
            <path d="M 3 5 L 4.8 6.8 L 8 3" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        );
      default:
        return null;
    }
  };

  const getTravelClass = () => {
    if (direction === "right") return "scale-105 rotate-[11deg] skew-x-[6deg] translate-x-1.5";
    if (direction === "left") return "scale-105 rotate-[-11deg] skew-x-[-6deg] -translate-x-1.5";
    return "";
  };

  return (
    <div
      id="aerox-mascot-wrapper"
      className="flex flex-col items-center pointer-events-none select-none relative w-14 h-14"
    >
      {/* Real floor cast shadow underneath */}
      <div className="absolute top-[88%] left-1/2 -translate-x-1/2 w-9 h-2.5 rounded-[100%] bg-[#000000]/22 blur-[2px] -z-10 pointer-events-none" />

      {/* Sparks when active profile / celebratory */}
      {activeTab === "profile" && (
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute left-[3px] top-[7px] w-2 h-2 bg-white rounded-full animate-ping opacity-60" />
          <span className="absolute right-[3px] top-[1px] w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping opacity-80" />
        </div>
      )}

      {/* Faw Mascot Body Frame */}
      <div
        id="aerox-premium-mascot"
        className={`w-14 h-14 flex items-center justify-center transition-all duration-[550ms] cubic-bezier(0.16, 1, 0.3, 1) pointer-events-auto cursor-pointer ${getTravelClass()} ${
          isCelebrated ? "animate-[bounce_0.6s_ease-out_1]" : "anim-premium-float"
        }`}
        onClick={handleMascotClick}
        title="Tap me! I am Faw, your companion!"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_4px_16px_rgba(255,255,255,0.12)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Elegant 3D Apple-style Matte White Satin Chassis */}
            <linearGradient id="matteWhiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fcfdfe" />
              <stop offset="70%" stopColor="#e5ebf0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* High-fidelity 3D shading layer for organic round joints */}
            <linearGradient id="bodyShadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Deep reflective glass screen visor (deep blue shades) */}
            <linearGradient id="fawVisorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#141c30" />
              <stop offset="30%" stopColor="#121828" />
              <stop offset="100%" stopColor="#080a12" />
            </linearGradient>

            {/* Cyan soft bloom neon filter to make face glow like reference */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Holographic held assets */}
            <linearGradient id="holoAccessory" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.45)" />
            </linearGradient>

            {/* Smooth glass highlight sweep */}
            <linearGradient id="glassSweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.4)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>

            {/* Custom rounded Visor Clip boundaries */}
            <clipPath id="fawVisorClip">
              <rect x="23" y="14" width="54" height="36" rx="18" />
            </clipPath>
          </defs>

          {/* Masterclass Premium CSS animation loops with Pixar-like physics (inertia, squash/stretch, secondary lag) */}
          <style>{`
            @keyframes fawFloat {
              0% {
                transform: translateY(0px) scale(1) rotate(0deg);
              }
              50% {
                transform: translateY(-4.5px) scale(0.97, 1.03) rotate(0.6deg);
              }
              100% {
                transform: translateY(0px) scale(1) rotate(0deg);
              }
            }
            @keyframes fawBobHead {
              0% {
                transform: translateY(0px) rotate(0deg);
              }
              45% {
                transform: translateY(-1.8px) rotate(-1.2deg);
              }
              100% {
                transform: translateY(0px) rotate(0deg);
              }
            }
            @keyframes fawLeftArmSwing {
              0% {
                transform: rotate(0deg) translateY(0);
              }
              50% {
                transform: rotate(-10deg) translateY(-0.5px);
              }
              100% {
                transform: rotate(0deg) translateY(0);
              }
            }
            @keyframes fawRightArmSwing {
              0% {
                transform: rotate(0deg) translateY(0);
              }
              50% {
                transform: rotate(10deg) translateY(0.5px);
              }
              100% {
                transform: rotate(0deg) translateY(0);
              }
            }
            @keyframes waveArmAction {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-42deg) translateX(-1px); }
            }
            @keyframes glassShimmer {
              0% { transform: translateX(-60px) translateY(-15px) rotate(-35deg); opacity: 0.1; }
              40%, 100% { transform: translateX(90px) translateY(25px) rotate(-35deg); opacity: 0.6; }
            }
            @keyframes floatAccessory {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-2px) rotate(4deg); }
            }
            @keyframes antennaTilt {
              0% { transform: rotate(-3deg); }
              50% { transform: rotate(4deg) translateY(0.3px); }
              100% { transform: rotate(-3deg); }
            }
            @keyframes cheekPulse {
              0%, 100% { opacity: 0.7; transform: scale(1); }
              50% { opacity: 0.95; transform: scale(1.1); }
            }
            @keyframes eyePulse {
              0%, 100% { filter: drop-shadow(0 0 1px rgba(255,255,255,0.4)); }
              50% { filter: drop-shadow(0 0 3.5px rgba(255,255,255,0.85)); }
            }
            .anim-premium-float {
              animation: fawFloat 3.2s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite;
              transform-origin: bottom center;
            }
            .anim-bob-head {
              animation: fawBobHead 3.2s cubic-bezier(0.37, 0, 0.63, 1) infinite;
              animation-delay: 0.15s; /* Natural secondary action lag */
              transform-origin: 50px 52px;
            }
            .anim-left-arm {
              animation: fawLeftArmSwing 2.4s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite;
              transform-origin: 36px 58px;
            }
            .anim-right-arm {
              animation: fawRightArmSwing 2.4s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite;
              animation-delay: 0.1s;
              transform-origin: 64px 58px;
            }
            .anim-wave-arm-active {
              animation: waveArmAction 0.55s ease-in-out infinite;
              transform-origin: 64px 58px;
            }
            .anim-shimmer {
              animation: glassShimmer 4.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
            }
            .anim-floating-accessory {
              animation: floatAccessory 2s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite;
              transform-origin: center;
            }
            .anim-antenna {
              animation: antennaTilt 2.5s cubic-bezier(0.37, 0, 0.63, 1) infinite;
              animation-delay: 0.22s; /* Secondary action delay matching head motion */
              transform-origin: 49px 12px;
            }
            .anim-blush-pulse {
              animation: cheekPulse 2s ease-in-out infinite;
              transform-origin: center;
            }
            .anim-eye-pulse {
              animation: eyePulse 1.8s ease-in-out infinite;
            }
          `}</style>

          {/* LOWER BODY: Plump stubby little legs */}
          <g>
            {/* Left chubby leg */}
            <path
              d="M 37 72 C 37 84 46 84 46 72"
              fill="url(#bodyShadeGrad)"
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="0.5"
            />
            {/* Subtle organic grey leg seam like reference */}
            <path d="M 39 80 Q 42 81 44 80" stroke="#cbd5e1" strokeWidth="0.8" fill="none" />

            {/* Right chubby leg */}
            <path
              d="M 54 72 C 54 84 63 84 63 72"
              fill="url(#bodyShadeGrad)"
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="0.5"
            />
            {/* Subtle organic grey leg seam */}
            <path d="M 56 80 Q 59 81 61 80" stroke="#cbd5e1" strokeWidth="0.8" fill="none" />
          </g>

          {/* CHUBBY TORSO / PEAR BODY */}
          <path
            d="M 34 50 Q 28 64 36 74 Q 50 78 64 74 Q 72 64 66 50 Z"
            fill="url(#bodyShadeGrad)"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="0.8"
          />
          {/* Subtle organic midline seam for 3D layout realism */}
          <path d="M 36 67 Q 50 71 64 67" stroke="#e2e8f0" strokeWidth="0.8" fill="none" />

          {/* STUBBY CUTE ARMS */}
          {/* Left Arm (tucked / resting) */}
          <g className="anim-left-arm">
            <path
              d="M 32 54 C 23 58 19 66 23 71"
              stroke="url(#bodyShadeGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M 22 66 Q 20 68 22 70" stroke="#cbd5e1" strokeWidth="0.6" fill="none" />
          </g>

          {/* Right Arm: resting or happily waving if profile tab active */}
          {activeTab === "profile" ? (
            <g className="anim-wave-arm-active">
              <path
                d="M 68 54 C 77 49 84 41 81 36"
                stroke="url(#bodyShadeGrad)"
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
              />
              <path d="M 77 41 Q 79 38 81 37" stroke="#cbd5e1" strokeWidth="0.6" fill="none" />
            </g>
          ) : (
            <g className="anim-right-arm">
              <path
                d="M 68 54 C 77 58 81 66 77 71"
                stroke="url(#bodyShadeGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              <path d="M 78 66 Q 80 68 78 70" stroke="#cbd5e1" strokeWidth="0.6" fill="none" />
            </g>
          )}

          {/* Floating active page accessory */}
          {renderAccessory()}

          {/* GIANT ROUNDED PEBBLE HEAD */}
          <g className="anim-bob-head">
            
            {/* Iconic single left antenna tilting up (Faw signature ear piece) */}
            <g className="anim-antenna" transform="translate(-1, 0)">
              <path
                d="M 52 11 Q 48 -2 46 -3 Q 50 -4 53 10 Z"
                fill="url(#bodyShadeGrad)"
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="0.5"
              />
            </g>

            {/* Smooth Head Dome */}
            <rect
              x="18"
              y="11"
              width="64"
              height="44"
              rx="22"
              fill="url(#matteWhiteGrad)"
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="0.8"
            />

            {/* Subtle organic panel lines on head sides just like the Apple AirPods style design */}
            <path d="M 19 28 Q 23 20 27 24" stroke="#cbd5e1" strokeWidth="0.8" fill="none" opacity="0.8" />
            <path d="M 81 28 Q 77 20 73 24" stroke="#cbd5e1" strokeWidth="0.8" fill="none" opacity="0.8" />

            {/* High-fidelity 3D Deep glass visor screen */}
            <rect
              x="22"
              y="14"
              width="56"
              height="38"
              rx="18"
              fill="url(#fawVisorGrad)"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />

            {/* Friendly Inner Visor depth glow */}
            <rect
              x="22"
              y="14"
              width="56"
              height="38"
              rx="18"
              fill="url(#holoAccessory)"
              opacity="0.08"
            />

            {/* Adorable rosy glowing blush spots on cheeks (Cute factor +100!) with animated soft pulse */}
            <circle cx="31" cy="37" r="5" fill="url(#cuteBlush)" className="anim-blush-pulse" style={{ transformOrigin: "31px 37px" }} />
            <circle cx="69" cy="37" r="5" fill="url(#cuteBlush)" className="anim-blush-pulse" style={{ transformOrigin: "69px 37px" }} />

            {/* Glowing animated eye LED vectors */}
            {renderFace()}

            {/* Premium product-level curved reflection highlight on top-edge of visor glass */}
            <path
              d="M 25 16 Q 50 19.5 75 16 Q 73 14.5 50 14.5 Q 27 14.5 25 16 Z"
              fill="#ffffff"
              opacity="0.35"
            />

            {/* Shimmer sweep effect */}
            <g opacity="0.3" clipPath="url(#fawVisorClip)">
              <rect
                x="0"
                y="-10"
                width="14"
                height="70"
                fill="url(#glassSweepGrad)"
                className="anim-shimmer"
              />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

// Named alias export for high-fidelity 3D AeroxMascot compliance
export const AeroxMascot = RobotCompanion;
