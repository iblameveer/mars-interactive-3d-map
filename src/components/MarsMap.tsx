"use client";

import * as React from "react";
import { useRef, useState, useMemo, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

// Helper to create procedural Mars textures
function createProceduralMarsTextures() {
  if (typeof document === "undefined") return { map: null, bump: null };

  const size = 2048;
  
  // Color Map
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const colorCtx = colorCanvas.getContext("2d")!;
  
  // Base color (Mars Rust - Layered)
  const baseGrad = colorCtx.createLinearGradient(0, 0, 0, size);
  baseGrad.addColorStop(0, "#8b4513");
  baseGrad.addColorStop(0.5, "#a0522d");
  baseGrad.addColorStop(1, "#6b4226");
  colorCtx.fillStyle = baseGrad;
  colorCtx.fillRect(0, 0, size, size);
  
  // High-frequency noise for surface grit
  for (let i = 0; i < 120000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 1.2;
    colorCtx.fillStyle = Math.random() > 0.5 ? "#b25a2b" : "#5a3a22";
    colorCtx.globalAlpha = 0.5;
    colorCtx.beginPath();
    colorCtx.arc(x, y, radius, 0, Math.PI * 2);
    colorCtx.fill();
  }

  // Medium-frequency variance
  for (let i = 0; i < 30000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 80;
    const colors = ["#cd853f", "#d2691e", "#b8860b", "#a0522d", "#3d1f05", "#8b4513"];
    colorCtx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    colorCtx.globalAlpha = Math.random() * 0.3;
    colorCtx.beginPath();
    colorCtx.arc(x, y, radius, 0, Math.PI * 2);
    colorCtx.fill();
  }
  
  // Large scale geological regions
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 800 + 400;
    const grad = colorCtx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, Math.random() > 0.7 ? "rgba(40, 20, 5, 0.6)" : "rgba(180, 90, 40, 0.3)");
    grad.addColorStop(0.7, "rgba(100, 50, 20, 0.1)");
    grad.addColorStop(1, "rgba(100, 50, 20, 0)");
    colorCtx.fillStyle = grad;
    colorCtx.fillRect(0, 0, size, size);
  }
  
  // Craters
  for (let i = 0; i < 2500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 15 + 1.5;
    
    colorCtx.fillStyle = "#1a0d08";
    colorCtx.globalAlpha = 0.7;
    colorCtx.beginPath();
    colorCtx.arc(x, y, radius, 0, Math.PI * 2);
    colorCtx.fill();
    
    colorCtx.strokeStyle = "#e0c090";
    colorCtx.globalAlpha = 0.4;
    colorCtx.lineWidth = Math.random() * 2 + 0.5;
    colorCtx.beginPath();
    colorCtx.arc(x + radius * 0.2, y - radius * 0.2, radius, 0, Math.PI * 2);
    colorCtx.stroke();
  }

  // Polar Ice Caps
  const drawCap = (yPos: number, isNorth: boolean) => {
    const grad = colorCtx.createRadialGradient(size/2, yPos, 0, size/2, yPos, 500);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.3, "rgba(240, 248, 255, 0.7)");
    grad.addColorStop(0.6, "rgba(200, 220, 255, 0.3)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    colorCtx.fillStyle = grad;
    colorCtx.globalAlpha = 1.0;
    colorCtx.beginPath();
    colorCtx.ellipse(size/2, yPos, size/2, isNorth ? 180 : 220, 0, 0, Math.PI * 2);
    colorCtx.fill();
  }
  
  drawCap(0, true);
  drawCap(size, false);

  // Bump Map
  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext("2d")!;
  bumpCtx.fillStyle = "#808080";
  bumpCtx.fillRect(0, 0, size, size);
  
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 40;
    const grey = Math.floor(Math.random() * 100) + (Math.random() > 0.5 ? 155 : 0);
    bumpCtx.fillStyle = `rgb(${grey},${grey},${grey})`;
    bumpCtx.globalAlpha = 0.2;
    bumpCtx.beginPath();
    bumpCtx.arc(x, y, radius, 0, Math.PI * 2);
    bumpCtx.fill();
  }

  const mapTexture = new THREE.CanvasTexture(colorCanvas);
  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  mapTexture.colorSpace = THREE.SRGBColorSpace;
  mapTexture.anisotropy = 16;
  
  return { map: mapTexture, bump: bumpTexture };
}

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
  },
];

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function Marker({ poi, onClick, active }: { poi: typeof POIS[0], onClick: () => void, active: boolean }) {
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
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color={active ? "#ffffff" : poi.color} />
      </mesh>
      
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color={poi.color} transparent opacity={0.3} />
      </mesh>

      {hovered && !active && (
        <Html distanceFactor={10} zIndexRange={[10, 0]}>
          <div className="pointer-events-none select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="group flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full border border-white/20 overflow-hidden bg-black/80 backdrop-blur-sm">
                <img src={poi.image} alt={poi.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
              </div>
              <div className="px-2 py-0.5 rounded-sm bg-black/60 backdrop-blur-md border border-white/10">
                <span className="text-[9px] tracking-[0.2em] uppercase font-['Space_Grotesk'] text-white/80">{poi.name}</span>
              </div>
            </motion.div>
          </div>
        </Html>
      )}

      {active && (
        <Html distanceFactor={8} zIndexRange={[15, 0]}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pointer-events-none"
          >
            <div className="w-28 h-28 rounded-full border-2 border-orange-500 overflow-hidden shadow-[0_0_30px_rgba(251,146,60,0.4)] bg-black">
              <img src={poi.image} alt={poi.name} className="w-full h-full object-cover" />
            </div>
            <div className="h-6 w-px bg-orange-500 mx-auto" />
            <div className="w-2 h-2 rounded-full bg-orange-500 mx-auto shadow-[0_0_10px_#f97316]" />
          </motion.div>
        </Html>
      )}
    </group>
  );
}

function ZoomTracker({ onZoomThreshold }: { onZoomThreshold: () => void }) {
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

const AtmosphereShader = {
  uniforms: {
    color: { value: new THREE.Color("#ff7f50") },
    coeficient: { value: 0.5 },
    power: { value: 4.0 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vEyeVector = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    uniform vec3 color;
    uniform float coeficient;
    uniform float power;
    void main() {
      float dotProduct = dot(vNormal, vEyeVector);
      float intensity = pow(coeficient - dotProduct, power);
      gl_FragColor = vec4(color, intensity);
    }
  `
};

function Mars({ activePoi, onPoiSelect }: { activePoi: typeof POIS[0] | null, onPoiSelect: (poi: typeof POIS[0]) => void }) {
  const marsRef = useRef<THREE.Mesh>(null);
  const textures = useMemo(() => createProceduralMarsTextures(), []);

  useFrame((state, delta) => {
    if (marsRef.current && !activePoi) {
      marsRef.current.rotation.y += delta * 0.04;
    }
  });

  if (!textures.map || !textures.bump) return null;

  return (
    <group>
      <mesh scale={0.99}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#2a0d08" />
      </mesh>

      <mesh ref={marsRef}>
        <sphereGeometry args={[1, 128, 128]} />
        <meshStandardMaterial 
          map={textures.map} 
          bumpMap={textures.bump}
          bumpScale={0.15}
          roughness={0.7}
          metalness={0.15}
        />
        {POIS.map((poi) => (
          <Marker 
            key={poi.name} 
            poi={poi} 
            onClick={() => onPoiSelect(poi)} 
            active={activePoi?.name === poi.name}
          />
        ))}
      </mesh>
      
      <mesh scale={1.08}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          {...AtmosphereShader}
          side={THREE.BackSide}
          transparent
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh scale={1.03}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color="#ff4500"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

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
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent z-0"
      />
    </div>
  );
}

function TelemetryFeed() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const messages = [
      "SCANNING SURFACE...",
      "THERMAL ANOMALY DETECTED",
      "BLOCKCHAIN NODE SYNC: 100%",
      "METAVERSE BUFFERING...",
      "ORBITAL STABILITY: 100%",
      "ATMOSPHERIC DENSITY: 0.020 kg/m³",
      "POI COORDINATES LOCKED",
      "GEOLOGICAL SURVEY IN PROGRESS",
      "RADIATION LEVELS: NOMINAL",
      "DUST STORM WARNING: SECTOR 4",
      "SIGNAL STRENGTH: -84 dBm",
      "OXYGEN EXTRACTION: ACTIVE",
      "WEB3 PROTOCOL: SECURE",
      "VIRTUAL REALITY OVERLAY: STABLE"
    ];

    const interval = setInterval(() => {
      setLogs(prev => [messages[Math.floor(Math.random() * messages.length)], ...prev].slice(0, 5));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-32 left-8 flex flex-col gap-1.5 pointer-events-none z-10">
      <AnimatePresence>
        {logs.map((log, i) => (
          <motion.div
            key={log + i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1 - i * 0.2, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-[9px] font-mono text-white/40 tracking-widest flex items-center gap-2"
          >
            <div className="w-1 h-1 bg-orange-500/50" />
            {log}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function MarsMap() {
  const [selectedPoi, setSelectedPoi] = useState<typeof POIS[0] | null>(null);
  const [isViewingOnline, setIsViewingOnline] = useState(false);
  const controlsRef = useRef<any>(null);

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-['Space_Grotesk'] selection:bg-orange-500 selection:text-white">
        <ScannerHUD />
        <TelemetryFeed />

        <div className="absolute top-8 right-8 flex gap-8 z-10 pointer-events-none">
          <div className="flex flex-col items-end">
            <div className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1">Network Layer</div>
            <div className="text-[11px] text-cyan-400 font-bold tracking-widest flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              BLOCKCHAIN-MAINNET
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1">Environment</div>
            <div className="text-[11px] text-purple-400 font-bold tracking-widest flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] animate-pulse" />
              METAVERSE-L2
            </div>
          </div>
          <div className="flex flex-col items-end border-l border-white/10 pl-8">
            <div className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1">Rarity Index</div>
            <div className="text-[11px] text-orange-500 font-bold tracking-widest">α-7.92</div>
          </div>
        </div>

        <Canvas shadows gl={{ antialias: true, alpha: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 2.5]} fov={45} />
          <OrbitControls 
            ref={controlsRef}
            enablePan={false} 
            minDistance={1.4} 
            maxDistance={4}
            autoRotate={!selectedPoi}
            autoRotateSpeed={0.5}
            enableDamping
            dampingFactor={0.05}
          />
          
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 5, 10]} intensity={4} color="#fff5e6" castShadow />
          <spotLight position={[-10, 10, 10]} angle={0.25} penumbra={1} intensity={2.5} color="#ff7f50" />
          <directionalLight position={[0, 0, 5]} intensity={1.5} color="#ffffff" />
          
          <Stars radius={100} depth={50} count={7000} factor={6} saturation={0} fade speed={1.5} />
          
          <Suspense fallback={null}>
            <Mars activePoi={selectedPoi} onPoiSelect={setSelectedPoi} />
            <ZoomTracker onZoomThreshold={() => setIsViewingOnline(true)} />
          </Suspense>
        </Canvas>

      <AnimatePresence>
        {isViewingOnline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black flex flex-col pointer-events-auto"
          >
            <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-white/10">
              <div className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Feed: Online Viewer Net4
              </div>
              <button 
                onClick={() => setIsViewingOnline(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <iframe 
              src="/online_viewer_net4.htm" 
              className="flex-1 w-full h-full border-none"
              title="Online Viewer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-10 left-10 z-10 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
        <div className="flex flex-col gap-3 pointer-events-auto">
          <div className="text-[10px] text-white/20 uppercase tracking-[0.2em] mb-2 ml-4">Select Target</div>
          <div className="flex flex-col gap-1.5">
            {POIS.map((poi, idx) => (
              <motion.button
                key={poi.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedPoi(poi)}
                className={`group relative text-left px-6 py-2.5 rounded-sm transition-all duration-300 flex items-center gap-4 ${
                  selectedPoi?.name === poi.name 
                    ? "text-white" 
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                {selectedPoi?.name === poi.name && (
                  <motion.div 
                    layoutId="active-bg"
                    className="absolute inset-0 bg-white/5 border-l-2 border-orange-500"
                  />
                )}
                <span className="relative text-[11px] font-bold uppercase tracking-[0.15em]">{poi.name}</span>
                <span className="relative text-[8px] opacity-30 font-mono">[{poi.lat}, {poi.lng}]</span>
              </motion.button>
            ))}
          </div>
          
          <AnimatePresence>
            {selectedPoi && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedPoi(null)}
                className="mt-4 ml-4 flex items-center gap-2 text-[10px] text-orange-500 font-bold uppercase tracking-widest hover:text-orange-400 transition-colors pointer-events-auto"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Return to Orbit
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {selectedPoi && (
            <motion.div
              key={selectedPoi.name}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-black/40 backdrop-blur-2xl border border-white/10 p-8 rounded-sm max-w-md pointer-events-auto overflow-hidden"
            >
              <button 
                onClick={() => setSelectedPoi(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-20"
              >
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
          )}
        </AnimatePresence>
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
