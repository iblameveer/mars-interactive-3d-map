"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SatelliteLoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const messages = [
      "INITIALIZING SATELLITE HANDSHAKE...",
      "ACQUIRING ORBITAL LOCK...",
      "CALIBRATING LIDAR ARRAYS...",
      "ESTABLISHING ENCRYPTED UPLINK...",
      "DOWNLOADING TERRAIN DATA...",
      "SYNCING TACTICAL GRID...",
      "BYPASSING IONOSPHERIC DISTORTION...",
      "UPLINK SECURED. DEPLOYING HUD..."
    ];

    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < messages.length) {
        setLogs(prev => [messages[currentLog], ...prev].slice(0, 8));
        currentLog++;
      }
    }, 600);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 1000);
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 150);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center font-mono text-cyan-500 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(circle,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>

      <div className="w-[500px] flex flex-col gap-6 relative z-10">
        <div className="flex justify-between items-end border-b border-cyan-900 pb-2">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] tracking-[0.4em] font-bold text-cyan-400">SAT-LINK_UPLINK_V.24</div>
            <div className="text-[8px] opacity-50 uppercase">Location: Mars Orbit Station Alpha</div>
          </div>
          <div className="text-2xl font-bold tabular-nums">
            {Math.floor(progress)}%
          </div>
        </div>

        <div className="h-1 w-full bg-cyan-950 relative overflow-hidden">
          <motion.div 
            className="absolute inset-y-0 left-0 bg-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.5)]"
            animate={{ width: `${progress}%` }}
          />
        </div>

        <div className="h-[180px] bg-black/50 border border-cyan-900 p-4 overflow-hidden flex flex-col gap-1">
          <AnimatePresence mode="popLayout">
            {logs.map((log, i) => (
              <motion.div
                key={log + i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1 - i * 0.1, x: 0 }}
                className="text-[10px] tracking-widest flex items-center gap-2"
              >
                <span className="text-cyan-800">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                <span className="uppercase">{log}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-20 opacity-30">
          <div className="flex flex-col items-center">
            <div className="text-[8px] mb-1 uppercase">Signal</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1 h-3 ${progress > i * 20 ? 'bg-cyan-500' : 'bg-cyan-900'}`} />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-[8px] mb-1 uppercase">Encryption</div>
            <div className="text-[10px]">AES-256</div>
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-cyan-500/5 rounded-full pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="w-full h-full relative"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1/2 bg-gradient-to-b from-cyan-500/20 to-transparent" />
        </motion.div>
      </div>
    </motion.div>
  );
}
