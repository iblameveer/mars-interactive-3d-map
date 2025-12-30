"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function GenesisPage() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col pointer-events-auto overflow-hidden"
    >
      <div className="flex justify-between items-center p-4 bg-zinc-900/50 border-b border-white/10 backdrop-blur-md">
        <div className="text-cyan-500 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#22d3ee]" />
          ORBITAL_UPLINK: GENESIS_PROTOCOL_FEED
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold group"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Return to Command</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <iframe
        src="/genesis_protocol.htm"
        className="flex-1 w-full h-full border-none"
        title="Genesis Protocol Feed"
      />
    </motion.div>
  );
}
