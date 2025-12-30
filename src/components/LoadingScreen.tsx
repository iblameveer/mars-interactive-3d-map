"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, ShieldAlert, Lock, Cpu, Activity, Zap } from "lucide-react";

interface LoadingScreenProps {
  isLoading: boolean;
  color: "green" | "amber" | "silver" | "purple";
  title: string;
}

const colorMap = {
  green: {
    primary: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    shadow: "shadow-green-500/20",
    accent: "text-green-400",
    glow: "shadow-[0_0_15px_rgba(34,197,94,0.3)]",
  },
  amber: {
    primary: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    shadow: "shadow-amber-500/20",
    accent: "text-amber-400",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
  },
  silver: {
    primary: "text-slate-300",
    bg: "bg-slate-300/10",
    border: "border-slate-300/30",
    shadow: "shadow-slate-300/20",
    accent: "text-slate-100",
    glow: "shadow-[0_0_15px_rgba(203,213,225,0.3)]",
  },
  purple: {
    primary: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    shadow: "shadow-purple-500/20",
    accent: "text-purple-400",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.3)]",
  },
};

export function LoadingScreen({ isLoading, color, title }: LoadingScreenProps) {
  const colors = colorMap[color];
  const [dots, setDots] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
        setProgress(0);
        return;
    }
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + Math.random() * 5));
    }, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#050508] flex flex-col items-center justify-center font-mono overflow-hidden"
        >
          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-10">
            <motion.div 
              animate={{ top: ["-100%", "100%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-white to-transparent"
            />
          </div>

          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ 
                 backgroundImage: `linear-gradient(${color === 'silver' ? '#475569' : color === 'green' ? '#22c55e' : color === 'amber' ? '#f59e0b' : '#a855f7'} 1px, transparent 1px), linear-gradient(90deg, ${color === 'silver' ? '#475569' : color === 'green' ? '#22c55e' : color === 'amber' ? '#f59e0b' : '#a855f7'} 1px, transparent 1px)`,
                 backgroundSize: '30px 30px'
               }} 
          />

          <div className="relative max-w-2xl w-full px-8 flex flex-col items-center">
            
            {/* Top Security Clearance Header */}
            <div className={`w-full flex justify-between items-center mb-16 border-b-2 ${colors.border} pb-4`}>
                <div className="flex items-center gap-3">
                    <ShieldAlert className={`w-6 h-6 ${colors.primary} animate-pulse`} />
                    <div className="flex flex-col">
                        <span className={`text-[10px] uppercase tracking-[0.4em] font-bold ${colors.primary}`}>Security Level: 5</span>
                        <span className="text-[8px] text-white/40 uppercase tracking-[0.2em]">Authorized Personnel Only</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-[10px] uppercase tracking-[0.4em] font-bold ${colors.primary}`}>ARES NETWORK</span>
                    <div className="text-[8px] text-white/40 uppercase tracking-[0.2em]">Protocol: V-8.2.0</div>
                </div>
            </div>

            <div className="relative mb-12">
              {/* Main Icon Container */}
              <motion.div
                animate={{ 
                  scale: [1, 1.02, 1],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`p-10 rounded-sm border-2 ${colors.border} ${colors.bg} relative ${colors.glow}`}
              >
                <Satellite className={`w-20 h-20 ${colors.primary}`} />
                
                {/* Corner Brackets */}
                <div className={`absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 ${colors.primary}`} />
                <div className={`absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 ${colors.primary}`} />
                <div className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 ${colors.primary}`} />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 ${colors.primary}`} />

                {/* Animated Scanner Bar */}
                <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className={`absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-${color}-500 to-transparent opacity-50`}
                />
              </motion.div>

              {/* Orbital Circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none">
                  <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className={`absolute inset-0 border border-dashed rounded-full ${colors.border} opacity-20`}
                  />
                  <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className={`absolute inset-4 border border-dashed rounded-full ${colors.border} opacity-10`}
                  />
              </div>
            </div>

            {/* Loading Content */}
            <div className="w-full space-y-8">
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`text-[10px] ${colors.primary} uppercase tracking-[0.5em] mb-4 font-bold`}
                    >
                        Establishing Uplink
                    </motion.div>
                    <h2 className={`text-4xl tracking-[0.4em] font-black uppercase text-white mb-2 font-['Syncopate']`}>
                        {title}
                    </h2>
                </div>

                {/* Tactical Status Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className={`bg-white/5 border ${colors.border} p-4 flex flex-col gap-2`}>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-white/40 uppercase tracking-widest">Signal Path</span>
                            <Activity className={`w-3 h-3 ${colors.primary}`} />
                        </div>
                        <div className="text-xs text-white tracking-widest uppercase font-bold">Encrypted Burst</div>
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(i => (
                                <motion.div 
                                    key={i}
                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                    transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
                                    className={`w-1 h-3 ${colors.bg} border ${colors.border}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className={`bg-white/5 border ${colors.border} p-4 flex flex-col gap-2`}>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-white/40 uppercase tracking-widest">Encryption</span>
                            <Lock className={`w-3 h-3 ${colors.primary}`} />
                        </div>
                        <div className="text-xs text-white tracking-widest uppercase font-bold">MIL-SPEC-2048</div>
                        <div className="text-[8px] text-white/40 font-mono">HASH: 0x921F...E32</div>
                    </div>
                </div>

                {/* Main Progress Bar */}
                <div className="w-full space-y-2">
                    <div className="flex justify-between items-end">
                        <span className={`text-[10px] ${colors.primary} uppercase tracking-widest font-bold`}>Synchronization Progress</span>
                        <span className={`text-xl font-bold ${colors.primary} tabular-nums`}>{Math.floor(progress)}%</span>
                    </div>
                    <div className={`h-2 w-full bg-white/5 border ${colors.border} relative overflow-hidden`}>
                        <motion.div
                            className={`h-full ${colors.bg} relative overflow-hidden`}
                            style={{ width: `${progress}%` }}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse`} />
                        </motion.div>
                    </div>
                    <div className="flex justify-between text-[8px] text-white/20 uppercase tracking-[0.2em]">
                        <span>Sector: Alpha-9</span>
                        <span>Altitude: 35,000 KM</span>
                        <span>Status: Stable</span>
                    </div>
                </div>
            </div>

            {/* Bottom Tech Details */}
            <div className="mt-16 grid grid-cols-3 gap-12 w-full opacity-30">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] uppercase tracking-widest text-white">CPU_LOAD</span>
                    <div className="h-0.5 w-full bg-white/10 overflow-hidden">
                        <motion.div animate={{ width: ["20%", "80%", "40%"] }} transition={{ duration: 2, repeat: Infinity }} className={`h-full ${colors.bg}`} />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] uppercase tracking-widest text-white">NET_TRAFFIC</span>
                    <div className="h-0.5 w-full bg-white/10 overflow-hidden">
                        <motion.div animate={{ width: ["10%", "95%", "25%"] }} transition={{ duration: 1.5, repeat: Infinity }} className={`h-full ${colors.bg}`} />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] uppercase tracking-widest text-white">AUTH_SYNC</span>
                    <div className="h-0.5 w-full bg-white/10 overflow-hidden">
                        <motion.div animate={{ width: ["60%", "70%", "65%"] }} transition={{ duration: 4, repeat: Infinity }} className={`h-full ${colors.bg}`} />
                    </div>
                </div>
            </div>

          </div>

          {/* Large HUD Background Accents */}
          <div className={`absolute top-0 left-0 w-64 h-64 border-t-2 border-l-2 ${colors.border} opacity-20 -translate-x-32 -translate-y-32 rotate-12`} />
          <div className={`absolute bottom-0 right-0 w-64 h-64 border-b-2 border-r-2 ${colors.border} opacity-20 translate-x-32 translate-y-32 -rotate-12`} />
          
          {/* Animated Tech Lines */}
          <div className="absolute top-0 bottom-0 left-12 w-px bg-white/5" />
          <div className="absolute top-0 bottom-0 right-12 w-px bg-white/5" />
          <div className="absolute left-0 right-0 top-12 h-px bg-white/5" />
          <div className="absolute left-0 right-0 bottom-12 h-px bg-white/5" />
          
        </motion.div>
      )}
    </AnimatePresence>
  );
}

