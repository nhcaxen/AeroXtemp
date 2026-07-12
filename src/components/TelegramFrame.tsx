import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  Battery, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Disc,
  Repeat
} from "lucide-react";

interface TelegramFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TelegramFrame({ children, activeTab, onTabChange }: TelegramFrameProps) {
  const [time, setTime] = useState("");
  const [onlineCount, setOnlineCount] = useState(99);

  // Background Music States
  const [playing, setPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [isLooping, setIsLooping] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [audio] = useState(() => {
    const aud = new Audio();
    aud.loop = false;
    return aud;
  });

  const [trackList, setTrackList] = useState<any[]>([
    { title: "Ambient Lounge", artist: "Lofi Dream", url: "/music/ambient.mp3" },
    { title: "Cyber Shift", artist: "Synth Rider", url: "/music/cyber.mp3" },
    { title: "Night Drive", artist: "Neon City", url: "/music/night.mp3" }
  ]);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch("/api/music/list");
        if (res.ok) {
          const data = await res.json();
          if (data.tracks && data.tracks.length > 0) {
            setTrackList(data.tracks);
          }
        }
      } catch (err) {
        console.warn("Failed to load local tracks:", err);
      }
    };
    fetchTracks();
  }, []);

  useEffect(() => {
    // Current time clock
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateClock();
    const timer = setInterval(updateClock, 60000);

    // Minor random online count fluctuation for lifelike UI
    const onlineTimer = setInterval(() => {
      setOnlineCount((prev) => {
        const diff = Math.random() > 0.5 ? 1 : -1;
        const next = prev + diff;
        return next > 120 ? 99 : next < 80 ? 99 : next;
      });
    }, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(onlineTimer);
    };
  }, []);

  // Centralized robust music track and playback state synchronization
  useEffect(() => {
    if (trackList.length === 0) return;
    const targetUrl = trackList[currentTrackIdx]?.url;
    if (!targetUrl) return;

    const currentSrc = audio.src ? new URL(audio.src, window.location.origin).pathname : "";
    
    if (currentSrc !== targetUrl) {
      audio.src = targetUrl;
      audio.load();
    }
    
    audio.volume = volume;
    audio.loop = isLooping;

    if (playing) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio playback was blocked or interrupted:", err);
          if (err.name === "NotAllowedError") {
            setPlaying(false);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [currentTrackIdx, playing, volume, isLooping, audio, trackList]);

  useEffect(() => {
    const handleEnded = () => {
      if (!audio.loop && trackList.length > 0) {
        setCurrentTrackIdx((prev) => (prev + 1) % trackList.length);
      }
    };
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, [audio, trackList]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-0 md:p-6 lg:p-10 purple-mesh relative overflow-hidden font-sans">
      {/* Background glowing blurred decorative orbs */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-cyber-purple/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-hot-pink/5 blur-[100px] pointer-events-none" />

      {/* Main Telegram Application Frame Container */}
      <div className="w-full max-w-[480px] h-screen md:h-[840px] md:rounded-[40px] md:border md:border-neutral-800/80 bg-void-black shadow-2xl flex flex-col relative overflow-hidden z-10">
        
        {/* Device Status Bar (Simulating Mobile Phone Screen) */}
        <div className="hidden md:flex justify-between items-center px-6 pt-3 pb-1 text-xs text-neutral-400 font-medium tracking-tight select-none z-30">
          <span>{time || "9:41"}</span>
          {/* Speaker pill notch */}
          <div className="w-24 h-4 bg-black rounded-full absolute left-1/2 transform -translate-x-1/2 top-2" />
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-neutral-300" />
            <span className="text-[10px]">5G</span>
            <Battery className="w-4 h-4 text-neutral-300" />
          </div>
        </div>

        {/* Clean and elegant top padding replacing the header with safe area support */}
        <div 
          className="z-30 select-none bg-void-black/90 backdrop-blur-md w-full shrink-0" 
          style={{ 
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", 
            paddingBottom: "12px" 
          }} 
        />

        {/* Inner Mini App Webview Panel */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative pb-20 scrollbar-none">
          {children}
        </div>

        {/* Global Music Player Control Module */}
        <div className="absolute bottom-20 right-4 z-50">
          {!playerOpen ? (
            <button 
              onClick={() => setPlayerOpen(true)}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-cyber-purple to-pink-600 hover:from-purple-600 hover:to-pink-500 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(124,58,237,0.5)] border border-white/10 cursor-pointer transition-all active:scale-90"
              title="Open Radio"
            >
              <Disc className={`w-6 h-6 ${playing ? "animate-spin text-pink-300" : "text-white"}`} style={{ animationDuration: "3s" }} />
              {playing && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-pink-500 text-[6px] font-black text-white items-center justify-center">♪</span>
                </span>
              )}
            </button>
          ) : (
            <div className="w-[280px] bg-dark-surface/95 border border-white/[0.08] rounded-2xl p-4 shadow-[0_10px_25px_rgba(0,0,0,0.65)] animate-fade-in backdrop-blur-md flex flex-col gap-3">
              {/* Player Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping shrink-0" />
                  <span className="text-[10px] text-pink-400 font-extrabold uppercase tracking-widest">AeroX Radio Suite</span>
                </div>
                <button 
                  onClick={() => setPlayerOpen(false)}
                  className="text-neutral-400 hover:text-white text-xs font-black cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Disc + Track Details */}
              <div className="flex items-center gap-3 bg-void-black/60 p-2.5 rounded-xl border border-white/[0.03]">
                <div className="relative w-11 h-11 bg-void-black rounded-lg border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyber-purple/20 to-pink-600/20" />
                  <Disc className={`w-7 h-7 text-cyber-purple relative z-10 ${playing ? "animate-spin" : ""}`} style={{ animationDuration: "5s" }} />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white block truncate uppercase tracking-wide">
                    {trackList[currentTrackIdx].title}
                  </span>
                  <span className="text-[9px] text-neutral-400 block truncate font-medium">
                    {trackList[currentTrackIdx].artist}
                  </span>
                </div>
              </div>

              {/* Dynamic Equalizer Visualizer Bars */}
              <div className="h-6 flex items-end justify-center gap-[4px] py-1 bg-void-black/30 rounded-lg overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((bar) => {
                  const randDelay = Math.random() * 0.6;
                  const randDur = 0.4 + Math.random() * 0.7;
                  return (
                    <div 
                      key={bar} 
                      className="w-[3px] bg-cyber-purple rounded-t transition-all"
                      style={{
                        height: playing ? "100%" : "2px",
                        maxHeight: `${8 + Math.random() * 14}px`,
                        animation: playing ? `bounceVisualizer ${randDur}s ease-in-out ${randDelay}s infinite alternate` : "none"
                      }}
                    />
                  );
                })}
              </div>

              {/* Audio Controller Knobs */}
              <div className="flex items-center justify-between px-1">
                {/* Loop Option Toggle */}
                <button 
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-90 ${
                    isLooping 
                      ? "text-pink-400 bg-pink-500/10 border border-pink-500/20" 
                      : "text-neutral-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08]"
                  }`}
                  title={isLooping ? "Looping Enabled" : "Looping Disabled"}
                >
                  <Repeat className="w-3.5 h-3.5" />
                </button>

                {/* Prev */}
                <button 
                  onClick={() => setCurrentTrackIdx((prev) => (prev - 1 + trackList.length) % trackList.length)}
                  className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] active:scale-90 text-neutral-300 hover:text-white transition-all cursor-pointer"
                  title="Previous Track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Play / Pause */}
                <button 
                  onClick={() => setPlaying(!playing)}
                  className="p-2.5 rounded-full bg-gradient-to-tr from-cyber-purple to-pink-600 hover:scale-105 active:scale-95 text-white transition-all shadow-md cursor-pointer"
                  title={playing ? "Pause" : "Play"}
                >
                  {playing ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-[1px]" />}
                </button>

                {/* Next */}
                <button 
                  onClick={() => setCurrentTrackIdx((prev) => (prev + 1) % trackList.length)}
                  className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] active:scale-90 text-neutral-300 hover:text-white transition-all cursor-pointer"
                  title="Next Track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2 px-1">
                <Volume2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-purple"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
