import type { NextConfig } from "next";

// -----------------------------------------------------------------------------
// 🛡️ CRASH FIX: Polyfill localStorage for the Server
// This tricks the server into thinking it has localStorage, preventing the crash.
// -----------------------------------------------------------------------------
if (typeof global.localStorage === "undefined" || global.localStorage === null) {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  } as any;
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
