"use client";

import * as React from "react";
import { useRef, useState, useMemo, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html, PerspectiveCamera, useGLTF, useProgress, Center } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { LoadingScreen as SatelliteLoadingScreen } from "./LoadingScreen";

const BASES = [
  { id: "genesis", name: "Genesis Estates", status: "ONLINE", code: "GEN-01", lat: 45, lng: 150, color: "#22c55e" },
  { id: "vitalis", name: "Vitalis Region", status: "SECURE", code: "VIT-04", lat: 5, lng: 290, color: "#f59e0b" },
  { id: "celestial", name: "Celestial Zones", status: "ACTIVE", code: "CEL-09", lat: -40, lng: 85, color: "#cbd5e1" },
  { id: "global", name: "Global Status", status: "STANDBY", code: "GLOB-X", special: true, lat: 0, lng: 0, color: "#a855f7" }
];

const BaseButtons = ({ onSelect }: { onSelect: (base: typeof BASES[0]) => void }) => {
  const activeBases = BASES.filter(b => !b.special);
  
  return (
    <div className="flex gap-4 pointer-events-auto w-full">
      {activeBases.map((base, idx) => (
        <button
          key={base.id}
          onClick={() => onSelect(base)}
          className="group relative flex flex-col items-start gap-1 p-6 flex-1 transition-all duration-300"
        >
          {/* Futuristic Background */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md border-t border-white/5 group-hover:bg-white/5 transition-all duration-500" />
          
          {/* Slanted Accent */}
          <div 
            className="absolute bottom-0 left-0 w-1 h-0 group-hover:h-full transition-all duration-500"
            style={{ backgroundColor: base.color }}
          />
          
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 group-hover:border-white/40 transition-colors" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 group-hover:border-white/40 transition-colors" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-start gap-1 w-full">
            <div className="flex items-center gap-2">
              <div 
                className="w-1 h-1 rounded-full animate-pulse"
                style={{ backgroundColor: base.color, boxShadow: `0 0 10px ${base.color}` }}
              />
              <span className="text-[9px] font-mono tracking-[0.3em] text-white/40 uppercase group-hover:text-white/60 transition-colors">
                {base.code}
              </span>
            </div>
            <span 
              className="text-lg font-black tracking-[0.1em] uppercase font-['Syncopate'] transition-all duration-300 group-hover:translate-x-1"
              style={{ color: base.id === 'celestial' ? '#ffffff' : base.color }}
            >
              {base.name}
            </span>
            <div className="flex items-center gap-4 mt-4 w-full">
              <div className="h-[1px] flex-1 bg-white/5 overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: idx * 0.5 }}
                  className="h-full w-1/2 opacity-30"
                  style={{ background: `linear-gradient(90deg, transparent, ${base.color}, transparent)` }}
                />
              </div>
              <span className="text-[7px] font-mono text-white/20 tracking-tighter uppercase whitespace-nowrap">
                {base.status}
              </span>
            </div>
          </div>
          
          {/* Decorative Glow */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
            style={{ backgroundColor: base.color }}
          />
        </button>
      ))}
    </div>
  );
};

function ZoomTracker({ onZoomThreshold }: {onZoomThreshold: () => void;}) {
  const { camera } = useThree();
  const triggered = useRef(false);

  useFrame(() => {
    const distance = camera.position.length();
    if (distance < 1.41 && !triggered.current) {
      triggered.current = true;
      onZoomThreshold();
    } else if (distance >= 1.41) {
      triggered.current = false;
    }
  });

  return null;
}

function Mars() {
  const marsRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/mars_v2.glb");

  useFrame((state, delta) => {
    if (marsRef.current) {
      marsRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group>
      <Center>
        <primitive 
          ref={marsRef} 
          object={scene} 
          scale={1.2}
          rotation={[0, 0, 0]}
        />
      </Center>

      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[1.2, 1.205, 128]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <ringGeometry args={[1.25, 1.252, 128]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function ScannerHUD() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      <div className="absolute top-12 left-12 w-16 h-16 border-t border-l border-white/20" />
      <div className="absolute top-12 right-12 w-16 h-16 border-t border-r border-white/20" />
      <div className="absolute bottom-12 left-12 w-16 h-16 border-b border-l border-white/20" />
      <div className="absolute bottom-12 right-12 w-16 h-16 border-b border-r border-white/20" />

        <motion.div
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

    </div>);
}

function TelemetryFeed() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const messages = [
      "SCANNING SURFACE...",
      "THERMAL ANOMALY DETECTED",
      "BLOCKCHAIN NODE SYNC: 100%",
      "METAVERSE BUFFERING...",
      "HASH_RATE: 1.2 EH/s",
      "META_SHARD: #774-ALPHA",
      "VOXEL_MINING: ACTIVE",
      "PROOF_OF_SURFACE: VERIFIED",
      "VR_UPLINK: STABLE",
      "L2_SHARD_SYNC: COMPLETE",
      "GENESIS_PROTOCOL: RUNNING",
      "MINING_YIELD: OPTIMAL",
      "VIRTUAL_REALITY: OVERLAY_INIT",
      "SIGNAL_STRENGTH: -84 dBm",
      "OXYGEN_EXTRACTION: ACTIVE",
      "WEB3_PROTOCOL: SECURE"];


    const interval = setInterval(() => {
      setLogs((prev) => [messages[Math.floor(Math.random() * messages.length)], ...prev].slice(0, 5));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-32 left-8 flex flex-col gap-1.5 pointer-events-none z-10">
      <AnimatePresence>
        {logs.map((log, i) =>
        <motion.div
          key={log + i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1 - i * 0.2, x: 0 }}
          exit={{ opacity: 0 }}
          className="text-[9px] font-mono text-white/40 tracking-widest flex items-center gap-2">

            <div className="w-1 h-1 bg-orange-500/50" />
            {log}
          </motion.div>
        )}
      </AnimatePresence>
    </div>);
}

function LoadingScreen({ onComplete, progress: externalProgress, title = "Establishing Uplink", theme = "cyan" }: { onComplete: () => void; progress?: number; title?: string; theme?: "cyan" | "green" | "amber" }) {
  const [internalProgress, setInternalProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const displayProgress = externalProgress !== undefined ? externalProgress : internalProgress;

  const colors = {
    cyan: {
      text: "text-cyan-500",
      bg: "bg-cyan-500",
      border: "border-cyan-500/30",
      gradient: "from-cyan-600 to-cyan-400",
      shadow: "shadow-[0_0_20px_rgba(34,211,238,0.4)]",
      logHeader: "text-cyan-500/60",
      logTimestamp: "text-cyan-500/40",
      glitchBorder: "border-cyan-500/10",
      footer: "text-cyan-500/20",
      accent: "bg-cyan-500/10"
    },
    green: {
      text: "text-green-500",
      bg: "bg-green-500",
      border: "border-green-500/30",
      gradient: "from-green-600 to-green-400",
      shadow: "shadow-[0_0_20px_rgba(34,197,94,0.4)]",
      logHeader: "text-green-500/60",
      logTimestamp: "text-green-500/40",
      glitchBorder: "border-green-500/10",
      footer: "text-green-500/20",
      accent: "bg-green-500/10"
    },
    amber: {
      text: "text-amber-500",
      bg: "bg-amber-500",
      border: "border-amber-500/30",
      gradient: "from-amber-600 to-amber-400",
      shadow: "shadow-[0_0_20px_rgba(245,158,11,0.4)]",
      logHeader: "text-amber-500/60",
      logTimestamp: "text-amber-500/40",
      glitchBorder: "border-amber-500/10",
      footer: "text-amber-500/20",
      accent: "bg-amber-500/10"
    }
  }[theme];

  useEffect(() => {
    if (externalProgress === undefined) {
      const interval = setInterval(() => {
        setInternalProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(onComplete, 500);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 100);
      return () => clearInterval(interval);
    } else if (externalProgress >= 100) {
      const timeout = setTimeout(onComplete, 800);
      return () => clearTimeout(timeout);
    }
  }, [onComplete, externalProgress]);

  useEffect(() => {
    const messages = [
      "DECRYPTING_ORBITAL_VECTORS...",
      "BYPASSING_ATMOSPHERIC_INTERFERENCE...",
      "UPLINKING_TO_MARS_RECON_ORBITER...",
      "INITIALIZING_VOXEL_ENGINE...",
      "SYNCING_QUANTUM_RECORDS...",
      "CALIBRATING_THERMAL_SENSORS...",
      "MAPPING_GEOLOGICAL_ANOMALIES...",
      "ESTABLISHING_L2_SIDECHAIN_CONNECTION...",
      "LOADING_TOPOGRAPHIC_MESH...",
      "AUTHORIZING_PROTOCOL_7-G...",
      "SECURE_UPLINK_ESTABLISHED",
      "QUANTUM_ENCRYPTION_ACTIVE",
      "ARES_NETWORK_ONLINE"
    ];

    const interval = setInterval(() => {
      if (displayProgress < 100) {
        setLogs(prev => [messages[Math.floor(Math.random() * messages.length)], ...prev].slice(0, 10));
      }
    }, 300);

    return () => clearInterval(interval);
  }, [displayProgress]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[200] bg-[#050508] flex flex-col items-center justify-center font-mono overflow-hidden"
    >
      {/* HUD Scanline */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-5">
        <motion.div 
          animate={{ top: ["-100%", "100%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-40 bg-gradient-to-b from-transparent via-white to-transparent"
        />
      </div>

      {/* Military Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(${theme === 'cyan' ? '#06b6d4' : theme === 'green' ? '#22c55e' : '#f59e0b'} 1px, transparent 1px), linear-gradient(90deg, ${theme === 'cyan' ? '#06b6d4' : theme === 'green' ? '#22c55e' : '#f59e0b'} 1px, transparent 1px)`,
             backgroundSize: '40px 40px'
           }} 
      />

      <div className="relative w-full max-w-4xl px-12 flex flex-col items-center">
        
        {/* Top Interface Header */}
        <div className={`w-full flex justify-between items-start mb-20 border-b-2 ${colors.border} pb-6`}>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors.bg} animate-ping`} />
                    <span className={`text-[12px] uppercase tracking-[0.5em] font-black ${colors.text}`}>Command Interface</span>
                </div>
                <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">ARES NETWORK OVERWATCH v8.2.0</div>
            </div>
            <div className="text-right flex flex-col gap-1">
                <div className={`text-[10px] uppercase tracking-[0.4em] font-bold ${colors.text}`}>Authorization Required</div>
                <div className="text-[8px] text-white/20 uppercase tracking-[0.2em]">Protocol: DEEP_SPACE_7</div>
            </div>
        </div>

        <div className="w-full grid grid-cols-12 gap-12 items-center">
            {/* Left Technical Column */}
            <div className="col-span-4 space-y-8">
                <div className={`bg-white/5 border ${colors.border} p-6 relative group overflow-hidden`}>
                    <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${colors.text}`} />
                    <div className="text-[9px] text-white/40 uppercase tracking-widest mb-4">Tactical Feed</div>
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-1">
                                <div className="h-1 w-full bg-white/5 overflow-hidden">
                                    <motion.div 
                                        animate={{ width: [`${20 + i*10}%`, `${80 - i*5}%`, `${40 + i*15}%`] }}
                                        transition={{ duration: 2 + i * 0.5, repeat: Infinity }}
                                        className={`h-full ${colors.bg} opacity-30`}
                                    />
                                </div>
                                <div className="flex justify-between text-[7px] text-white/20 font-mono">
                                    <span>STREAM_{i+1}</span>
                                    <span>ACTIVE</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2 opacity-40">
                    <div className="text-[8px] text-white uppercase tracking-[0.4em]">Environmental Scans</div>
                    <div className="grid grid-cols-4 gap-1">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div 
                                key={i}
                                animate={{ opacity: [0.2, 0.8, 0.2] }}
                                transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                                className={`h-6 ${colors.accent} border border-${theme}-500/20`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Progress Hex/Circle */}
            <div className="col-span-4 flex flex-col items-center justify-center relative py-12">
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className={`w-64 h-64 rounded-full border border-dashed ${colors.border} flex items-center justify-center`}
                    >
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className={`w-56 h-56 rounded-full border border-dashed ${colors.border} opacity-40`}
                        />
                    </motion.div>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`text-5xl font-black tabular-nums ${colors.text} ${colors.shadow} font-['Syncopate']`}
                        >
                            {Math.floor(displayProgress)}%
                        </motion.div>
                        <div className="text-[10px] text-white/40 uppercase tracking-[0.4em] mt-2 font-bold">Uplink Status</div>
                    </div>

                    {/* Scanning Line through the circle */}
                    <motion.div 
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className={`absolute left-0 right-0 h-0.5 bg-${theme}-500/30 blur-sm pointer-events-none`}
                    />
                </div>
            </div>

            {/* Right Status Column */}
            <div className="col-span-4 space-y-6">
                <div className={`bg-white/5 border ${colors.border} p-6 relative h-[240px] flex flex-col`}>
                    <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${colors.text}`} />
                    <div className={`text-[9px] ${colors.logHeader} uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2 font-bold`}>System Initialization Log</div>
                    <div className="flex-1 overflow-hidden space-y-2">
                        <AnimatePresence mode="popLayout">
                            {logs.map((log, i) => (
                                <motion.div
                                    key={log + i}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1 - i * 0.1, x: 0 }}
                                    className="text-[8px] text-white/40 tracking-widest flex items-center gap-2 whitespace-nowrap"
                                >
                                    <span className={`${colors.logTimestamp} font-bold`}>[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                    {log}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className={`bg-white/5 border ${colors.border} p-3 flex flex-col gap-1`}>
                        <div className="text-[7px] text-white/30 uppercase tracking-widest">Network Latency</div>
                        <div className={`text-xs ${colors.text} font-bold tabular-nums`}>12.4ms</div>
                    </div>
                    <div className={`bg-white/5 border ${colors.border} p-3 flex flex-col gap-1`}>
                        <div className="text-[7px] text-white/30 uppercase tracking-widest">Sync Priority</div>
                        <div className={`text-xs ${colors.text} font-bold uppercase`}>CRITICAL</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Section */}
        <div className="w-full mt-24 space-y-8">
            <div className="text-center flex flex-col gap-2">
                <h2 className="text-4xl font-['Syncopate'] font-black text-white tracking-[0.6em] uppercase leading-none">
                    {title}
                </h2>
                <div className="flex items-center justify-center gap-6 mt-4">
                    <div className={`h-px flex-1 bg-gradient-to-r from-transparent to-${theme}-500/30`} />
                    <div className={`text-[10px] ${colors.text} uppercase tracking-[0.4em] font-bold`}>Sector Alpha-9 Secure</div>
                    <div className={`h-px flex-1 bg-gradient-to-l from-transparent to-${theme}-500/30`} />
                </div>
            </div>

            <div className="w-full h-1 bg-white/5 relative overflow-hidden">
                <motion.div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors.gradient} ${colors.shadow}`}
                    animate={{ width: `${displayProgress}%` }}
                    transition={{ duration: 0.3 }}
                />
                <motion.div
                    animate={{ left: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
        </div>

      </div>

      {/* Decorative Corner Elements */}
      <div className={`absolute top-0 left-0 w-64 h-64 border-t-4 border-l-4 ${colors.border} opacity-20 -translate-x-32 -translate-y-32 rotate-12`} />
      <div className={`absolute bottom-0 right-0 w-64 h-64 border-b-4 border-r-4 ${colors.border} opacity-20 translate-x-32 translate-y-32 -rotate-12`} />
      
      {/* Footer Readouts */}
      <div className={`absolute bottom-8 left-12 right-12 flex justify-between items-end opacity-20 ${colors.text} font-bold text-[9px] tracking-[0.4em] uppercase`}>
          <div className="flex gap-8">
              <span>ORBIT: DEEP_RECON_ALPHA</span>
              <span>HD: 852.2 GB/S</span>
          </div>
          <div className="flex gap-8">
              <span>TEMP: -63°C</span>
              <span>STABILITY: 99.9%</span>
          </div>
      </div>
    </motion.div>
  );
}

export function MarsMap() {
  const [selectedBase, setSelectedBase] = useState(BASES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState<{ color: "green" | "amber" | "silver" | "purple"; title: string; route: string }>({ 
    color: "green", 
    title: "GENESIS PROTOCOL", 
    route: "/genesis-protocol" 
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const controlsRef = useRef<any>(null);
  const { progress } = useProgress();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLoading(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        router.push(loadingConfig.route);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingConfig, router]);

  const handleZoomThreshold = () => {
    // Zoom threshold trigger if needed
  };

  const handleBaseSelect = (base: typeof BASES[0]) => {
    setSelectedBase(base);
    if (base.id === "genesis") {
      setLoadingConfig({ color: "green", title: "GENESIS PROTOCOL", route: "/genesis-protocol" });
      setIsLoading(true);
    } else if (base.id === "vitalis") {
      setLoadingConfig({ color: "amber", title: "VITALIS REGION", route: "/vitalis-region" });
      setIsLoading(true);
    } else if (base.id === "celestial") {
      setLoadingConfig({ color: "silver", title: "CELESTIAL ZONE", route: "/celestial-zone" });
      setIsLoading(true);
    } else if (base.id === "global") {
      setLoadingConfig({ color: "purple", title: "GLOBAL OVERWATCH", route: "/global-status" });
      setIsLoading(true);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#050508] overflow-hidden font-['Space_Grotesk'] selection:bg-orange-500 selection:text-white">
      <AnimatePresence>
        {isInitialLoading && (
          <LoadingScreen 
            title="Initializing Mars Uplink"
            progress={progress}
            onComplete={() => setIsInitialLoading(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && (
          <SatelliteLoadingScreen
            isLoading={isLoading}
            color={loadingConfig.color}
            title={loadingConfig.title}
          />
        )}
      </AnimatePresence>

      <ScannerHUD />
      <TelemetryFeed />
      
      {isLoading &&
        <div
          className="absolute inset-0 z-0 pointer-events-auto cursor-pointer"
          onClick={() => {
            setIsLoading(false);
          }} 
        />
      }

      <div className="absolute top-8 right-8 flex gap-8 z-[60] pointer-events-none">
        <div className="flex flex-col items-end">
          <div className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1">Network Layer</div>
          <div className="text-[11px] text-cyan-400 font-bold tracking-widest flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            BLOCKCHAIN-MAINNET
          </div>
          <div className="text-[7px] text-white/20 mt-1">NODE_ID: 0x72a...1f4</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1">Environment</div>
          <div className="text-[11px] text-purple-400 font-bold tracking-widest flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] animate-pulse" />
            METAVERSE-L2
          </div>
          <div className="text-[7px] text-white/20 mt-1">SYNC_FREQ: 60Hz</div>
        </div>
        <div className="flex flex-col items-end border-l border-white/10 pl-8">
          <div className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1">Rarity Index</div>
          <div className="text-[11px] text-orange-500 font-bold tracking-widest">α-7.92</div>
          <div className="text-[7px] text-white/20 mt-1">QUICK_MINT: ENABLED</div>
        </div>
      </div>

      <Canvas shadows gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 2.5]} fov={45} />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={1.4}
          maxDistance={4}
          autoRotate={!isLoading}
          autoRotateSpeed={0.5}
          enableDamping
          dampingFactor={0.05} 
        />
        
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 5, 10]} intensity={4} color="#ffffff" castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.25} penumbra={1} intensity={2.5} color="#ffffff" />
        <directionalLight position={[0, 0, 5]} intensity={1.5} color="#ffffff" />
        
        <Stars radius={100} depth={50} count={7000} factor={6} saturation={0} fade speed={1.5} />
        
        <Suspense fallback={null}>
          <Mars />
          <ZoomTracker onZoomThreshold={handleZoomThreshold} />
        </Suspense>
      </Canvas>

      <div className="absolute top-10 left-10 z-10 pointer-events-none">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-5xl font-['Syncopate'] font-bold tracking-[0.2em] text-white uppercase leading-none">
            MARS <span className="text-orange-500">EXPLORER</span>
          </h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="h-px w-12 bg-orange-500/50" />
            <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-medium">
              Red Planet Geological Survey • 2025.04
            </p>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-10 right-10 flex flex-col items-stretch gap-6 z-10 pointer-events-none">
        <BaseButtons onSelect={handleBaseSelect} />
      </div>

      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-end gap-8 opacity-40 pointer-events-none">
        <div className="flex flex-col items-end">
          <div className="text-[9px] text-white/50 uppercase tracking-[0.3em] mb-1">Gravity</div>
          <div className="text-2xl font-['Syncopate'] text-white">3.71 <span className="text-[10px]">m/s²</span></div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[9px] text-white/50 uppercase tracking-[0.3em] mb-1">Day Length</div>
          <div className="text-2xl font-['Syncopate'] text-white">24.6 <span className="text-[10px]">HRS</span></div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[9px] text-white/50 uppercase tracking-[0.3em] mb-1">Temperature</div>
          <div className="text-2xl font-['Syncopate'] text-white">-63 <span className="text-[10px]">°C</span></div>
        </div>
      </div>
    </div>
  );
}
