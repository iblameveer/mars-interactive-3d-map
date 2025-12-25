"use client";

import * as React from "react";
import { useRef, useState, useMemo, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html, PerspectiveCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

const POIS = [
{
  name: "Olympus Mons",
  lat: 18.65,
  lng: 226.2,
  description: "The largest volcano in the solar system, three times the height of Everest.",
  color: "#ff4d4d",
  type: "Volcano",
  image: "https://images-assets.nasa.gov/image/PIA02032/PIA02032~medium.jpg"
},
{
  name: "Valles Marineris",
  lat: -13.9,
  lng: 300.8,
  description: "A vast canyon system that would stretch across the entire United States.",
  color: "#ff944d",
  type: "Canyon",
  image: "https://images-assets.nasa.gov/image/PIA04353/PIA04353~medium.jpg"
},
{
  name: "Jezero Crater",
  lat: 18.44,
  lng: 77.45,
  description: "Landing site of the Perseverance rover; a former river delta where life might have existed.",
  color: "#4dff4d",
  type: "Impact Crater",
  image: "https://images-assets.nasa.gov/image/PIA24467/PIA24467~medium.jpg"
},
{
  name: "Gale Crater",
  lat: -4.59,
  lng: 137.44,
  description: "Home to Mount Sharp and landing site of the Curiosity rover.",
  color: "#4d94ff",
  type: "Impact Crater",
  image: "https://images-assets.nasa.gov/image/PIA19920/PIA19920~medium.jpg"
},
{
  name: "Hellas Planitia",
  lat: -42.7,
  lng: 70.0,
  description: "One of the largest impact basins in the solar system.",
  color: "#d14dff",
  type: "Basin",
  image: "https://images-assets.nasa.gov/image/PIA03612/PIA03612~medium.jpg"
}];

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

const markerGeometry = new THREE.SphereGeometry(0.015, 16, 16);
const glowGeometry = new THREE.SphereGeometry(0.02, 16, 16);

const Marker = React.memo(({ poi, onClick, active }: {poi: typeof POIS[0];onClick: () => void;active: boolean;}) => {
  const position = useMemo(() => latLngToVector3(poi.lat, poi.lng, 1.02), [poi.lat, poi.lng]);
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (glowRef.current) {
      const s = 1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.2;
      glowRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={position}>
      <mesh
        geometry={markerGeometry}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}>
        <meshBasicMaterial color={active ? "#ffffff" : poi.color} />
      </mesh>
      
      <mesh ref={glowRef} geometry={glowGeometry}>
        <meshBasicMaterial color={poi.color} transparent opacity={0.3} />
      </mesh>

      {hovered && !active &&
      <Html distanceFactor={10} zIndexRange={[10, 0]}>
          <div className="pointer-events-none select-none">
            <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group flex flex-col items-center">

              <div className="w-24 h-24 rounded-full border-2 border-white/40 overflow-hidden bg-black/80 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:border-orange-500/60 group-hover:shadow-[0_0_25px_rgba(251,146,60,0.3)] transition-all duration-500">
                <img src={poi.image} alt={poi.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 scale-110 group-hover:scale-100 transition-transform duration-700" />
              </div>
              <div className="mt-2 flex flex-col items-center">
                <div className="h-4 w-px bg-gradient-to-b from-white/40 to-transparent" />
              </div>
            </motion.div>
          </div>
        </Html>
      }

      {active &&
      <Html distanceFactor={8} zIndexRange={[15, 0]}>
          <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-none">

            <div className="w-28 h-28 rounded-full border-2 border-orange-500 overflow-hidden shadow-[0_0_30px_rgba(251,146,60,0.4)] bg-black">
              <img src={poi.image} alt={poi.name} className="w-full h-full object-cover" />
            </div>
            <div className="h-6 w-px bg-orange-500 mx-auto" />
            <div className="w-2 h-2 rounded-full bg-orange-500 mx-auto shadow-[0_0_10px_#f97316]" />
          </motion.div>
        </Html>
      }
    </group>);
});

Marker.displayName = "Marker";

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

function Mars({ activePoi, onPoiSelect }: {activePoi: typeof POIS[0] | null;onPoiSelect: (poi: typeof POIS[0]) => void;}) {
  const marsRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/mars.glb");

  useFrame((state, delta) => {
    if (marsRef.current && !activePoi) {
      marsRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group>
        <primitive 
          ref={marsRef} 
          object={scene} 
          scale={0.4} // Explicitly set to 0.4 as requested
          rotation={[0, 0, 0]}
        >
        {POIS.map((poi) => (
          <Marker
            key={poi.name}
            poi={poi}
            onClick={() => onPoiSelect(poi)}
            active={activePoi?.name === poi.name}
          />
        ))}
        </primitive>
        
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

function LoadingScreen({ onComplete }: {onComplete: () => void;}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center font-mono">
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-20" />

      <div className="w-96 flex flex-col gap-6 relative">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <motion.div 
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.1, repeat: Infinity }}
              className="text-[10px] text-cyan-500 uppercase tracking-[0.3em]"
            >
              Establishing Uplink
            </motion.div>
            <div className="text-white text-xs tracking-widest font-bold">ORBITAL-DESCENT-PROTOCOL.exe</div>
          </div>
          <div className="text-cyan-500 text-sm font-bold tabular-nums">{Math.floor(progress)}%</div>
        </div>
        
        <div className="h-1 w-full bg-white/5 relative overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-cyan-500"
            style={{ width: `${progress}%` }} />

          <motion.div
            animate={{ left: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[8px] text-white/30 uppercase tracking-widest">
            <span>Sector Syncing</span>
            <span className={progress > 30 ? "text-cyan-500" : ""}>{progress > 30 ? "COMPLETE" : "SYNCING..."}</span>
          </div>
          <div className="flex justify-between text-[8px] text-white/30 uppercase tracking-widest">
            <span>Thermal Calibration</span>
            <span className={progress > 60 ? "text-cyan-500" : ""}>{progress > 60 ? "COMPLETE" : "CALIBRATING..."}</span>
          </div>
          <div className="flex justify-between text-[8px] text-white/30 uppercase tracking-widest">
            <span>Voxel Rendering</span>
            <span className={progress > 90 ? "text-cyan-500" : ""}>{progress > 90 ? "INITIALIZING" : "READY"}</span>
          </div>
        </div>

        {/* Glitch overlays */}
        <motion.div 
          animate={{ x: [-2, 2, -2], opacity: [0, 0.2, 0] }}
          transition={{ duration: 0.2, repeat: Infinity }}
          className="absolute inset-0 border border-cyan-500/20 -m-4 pointer-events-none"
        />
      </div>

      <div className="absolute bottom-12 text-white/10 text-[10px] tracking-[0.5em] uppercase">
        Initializing Metaverse Layer 2 Integration
      </div>
    </motion.div>
  );
}

function TargetDropdown({ selectedPoi, setSelectedPoi }: { selectedPoi: typeof POIS[0] | null, setSelectedPoi: (poi: typeof POIS[0] | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 pointer-events-auto">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 p-4 hover:border-orange-500/50 transition-all duration-300 overflow-hidden min-w-[260px] rounded-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-orange-500/40" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-orange-500/40" />

        <div className="flex flex-col items-start gap-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <div className="text-[10px] text-orange-500 font-bold tracking-[0.3em] font-mono">PROTOCOL_OVERRIDE</div>
          </div>
          <div className="text-[12px] text-white uppercase tracking-[0.2em] font-bold pl-3.5">
            {selectedPoi ? selectedPoi.name : "SYSTEM_READY"}
          </div>
        </div>
        <div className="ml-auto w-8 h-8 flex items-center justify-center relative z-10 border-l border-white/5 pl-4">
          <motion.div 
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="text-white/40"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="flex flex-col gap-1 p-1 bg-black/80 backdrop-blur-2xl border border-white/10 min-w-[260px] shadow-2xl relative overflow-hidden rounded-sm"
          >
            {/* Background scanner animation */}
            <motion.div 
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none"
            />

            {POIS.map((poi, idx) => (
              <motion.button
                key={poi.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => {
                  setSelectedPoi(poi);
                  setIsOpen(false);
                }}
                className={`group relative text-left px-5 py-3 hover:bg-white/5 transition-all duration-300 flex items-center justify-between gap-4 border-l-2 ${
                  selectedPoi?.name === poi.name 
                    ? "border-orange-500 bg-orange-500/5 text-orange-500" 
                    : "border-transparent text-white/40 hover:text-white/80"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="relative text-[11px] font-bold uppercase tracking-[0.2em]">{poi.name}</span>
                  <span className="relative text-[7px] opacity-40 font-mono tracking-widest uppercase">{poi.type}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 opacity-30 group-hover:opacity-60 transition-opacity">
                  <span className="text-[7px] font-mono tracking-tighter">{poi.lat.toFixed(2)}°N</span>
                  <span className="text-[7px] font-mono tracking-tighter">{poi.lng.toFixed(2)}°E</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MarsMap() {
  const [selectedPoi, setSelectedPoi] = useState<typeof POIS[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewingOnline, setIsViewingOnline] = useState(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPoi(null);
        setIsViewingOnline(false);
        setIsLoading(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleZoomThreshold = () => {
    if (!isViewingOnline && !isLoading) {
      setIsLoading(true);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#050508] overflow-hidden font-['Space_Grotesk'] selection:bg-orange-500 selection:text-white">
        <ScannerHUD />
        <TelemetryFeed />
        
        {/* Backdrop for selected state to catch clicks */}
        {(selectedPoi || isViewingOnline || isLoading) &&
      <div
        className="absolute inset-0 z-0 pointer-events-auto cursor-pointer"
        onClick={() => {
          setSelectedPoi(null);
          setIsViewingOnline(false);
          setIsLoading(false);
        }} />

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
          autoRotate={!selectedPoi && !isViewingOnline && !isLoading}
          autoRotateSpeed={0.5}
          enableDamping
          dampingFactor={0.05} />

          
          <ambientLight intensity={0.6} />
            <pointLight position={[10, 5, 10]} intensity={4} color="#ffffff" castShadow />
            <spotLight position={[-10, 10, 10]} angle={0.25} penumbra={1} intensity={2.5} color="#ffffff" />
            <directionalLight position={[0, 0, 5]} intensity={1.5} color="#ffffff" />
          
          <Stars radius={100} depth={50} count={7000} factor={6} saturation={0} fade speed={1.5} />
          
          <Suspense fallback={null}>
            <Mars activePoi={selectedPoi} onPoiSelect={setSelectedPoi} />
            <ZoomTracker onZoomThreshold={handleZoomThreshold} />
          </Suspense>
        </Canvas>

      <AnimatePresence>
        {isLoading &&
        <LoadingScreen onComplete={() => {
          setIsLoading(false);
          setIsViewingOnline(true);
        }} />
        }

        {isViewingOnline &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] bg-black flex flex-col pointer-events-auto">

            <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-white/10">
              <div className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-3 !whitespace-pre-line">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />Live Feed: mars blocks excavation

            </div>
              <button
              onClick={() => setIsViewingOnline(false)}
              className="text-white/60 hover:text-white transition-colors">

                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <iframe
            src="/online_viewer_net5.htm"
            className="flex-1 w-full h-screen border-none"
            title="Online Viewer" />

          </motion.div>
        }
      </AnimatePresence>

      <div className="absolute top-10 left-10 z-10 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}>

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

      <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end z-10 pointer-events-none">
        <TargetDropdown selectedPoi={selectedPoi} setSelectedPoi={setSelectedPoi} />

        <div className="flex flex-col items-end gap-4">
          <AnimatePresence>
            {selectedPoi &&
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setSelectedPoi(null)}
              className="flex items-center gap-2 text-[10px] text-orange-500 font-bold uppercase tracking-widest hover:text-orange-400 transition-colors pointer-events-auto">

                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Return to Orbit
              </motion.button>
            }
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {selectedPoi &&
            <motion.div
              key={selectedPoi.name}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-black/40 backdrop-blur-2xl border border-white/10 p-8 rounded-sm max-w-md pointer-events-auto overflow-hidden">

                <button
                onClick={() => setSelectedPoi(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-20">

                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-orange-500/50" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-orange-500/50" />
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="px-2 py-0.5 border border-orange-500 text-orange-500 text-[9px] font-bold uppercase tracking-tighter">
                    {selectedPoi.type}
                  </div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <h2 className="text-4xl font-['Syncopate'] font-bold text-white mb-4 tracking-tight uppercase">
                  {selectedPoi.name}
                </h2>

                <p className="text-white/60 leading-relaxed text-sm font-light mb-8 font-['Space_Grotesk']">
                  {selectedPoi.description}
                </p>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                  <div>
                    <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-1">Latitude</div>
                    <div className="text-white font-mono text-xs">{selectedPoi.lat}° N</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-1">Longitude</div>
                    <div className="text-white font-mono text-xs">{selectedPoi.lng}° E</div>
                  </div>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>
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
    </div>);

}
