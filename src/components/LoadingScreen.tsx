"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, Radio, Wifi } from "lucide-react";

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
  },
  amber: {
    primary: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    shadow: "shadow-amber-500/20",
    accent: "text-amber-400",
  },
  silver: {
    primary: "text-slate-300",
    bg: "bg-slate-300/10",
    border: "border-slate-300/30",
    shadow: "shadow-slate-300/20",
    accent: "text-slate-100",
  },
  purple: {
    primary: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    shadow: "shadow-purple-500/20",
    accent: "text-purple-400",
  },
};

export function LoadingScreen({ isLoading, color, title }: LoadingScreenProps) {
  const colors = colorMap[color];
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-mono"
        >
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ 
                 backgroundImage: `linear-gradient(${color === 'silver' ? '#475569' : color === 'green' ? '#22c55e' : color === 'amber' ? '#f59e0b' : '#a855f7'} 1px, transparent 1px), linear-gradient(90deg, ${color === 'silver' ? '#475569' : color === 'green' ? '#22c55e' : color === 'amber' ? '#f59e0b' : '#a855f7'} 1px, transparent 1px)`,
                 backgroundSize: '40px 40px'
               }} 
          />

          <div className="relative">
            {/* Satellite Icon Container */}
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className={`p-8 rounded-full border-2 ${colors.border} ${colors.bg} relative`}
            >
              <Satellite className={`w-16 h-16 ${colors.primary}`} />
              
              {/* Pulsing Circles */}
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute inset-0 rounded-full border-2 ${colors.border}`}
              />
            </motion.div>

            {/* Signal Beams */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className={`absolute inset-0 border-t-2 border-r-2 rounded-full ${colors.border} opacity-40`}
                />
            </div>
          </div>

          {/* Loading Text */}
          <div className="mt-12 text-center">
            <h2 className={`text-xl tracking-[0.3em] font-bold uppercase ${colors.primary} mb-2`}>
              {title}
            </h2>
            <div className={`text-sm tracking-[0.2em] ${colors.accent} opacity-70`}>
              ESTABLISHING SECURE SAT-LINK{dots}
            </div>
          </div>

          {/* Status Bar */}
          <div className="absolute bottom-12 w-64">
            <div className={`h-1 w-full bg-white/5 border ${colors.border} overflow-hidden`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, repeat: Infinity }}
                className={`h-full ${color === 'silver' ? 'bg-slate-300' : color === 'green' ? 'bg-green-500' : color === 'amber' ? 'bg-amber-500' : 'bg-purple-500'}`}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] uppercase opacity-50 tracking-wider">
              <span>Uplink Active</span>
              <span>12.4 GB/S</span>
            </div>
          </div>

          {/* HUD Corner Accents */}
          <div className={`absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 ${colors.border}`} />
          <div className={`absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 ${colors.border}`} />
          <div className={`absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 ${colors.border}`} />
          <div className={`absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 ${colors.border}`} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
