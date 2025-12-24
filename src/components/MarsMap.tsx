"use client";

import React, { useRef, useState, useMemo, Suspense, useEffect, Component, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, PerspectiveCamera, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

// Reliable Mars textures using Wikimedia and Three.js mirrors
const MARS_TEXTURES = {
  map: "https://unpkg.com/three-globe/example/img/mars-color.jpg",
  bump: "https://unpkg.com/three-globe/example/img/mars-topo.jpg",
};

const POIS = [
  {
    name: "Olympus Mons",
    lat: 18.65,
    lng: 226.2,
    description: "The largest volcano in the solar system, three times the height of Everest.",
    color: "#ff4d4d",
  },
  {
    name: "Valles Marineris",
    lat: -13.9,
    lng: 300.8,
    description: "A vast canyon system that would stretch across the entire United States.",
    color: "#ff944d",
  },
  {
    name: "Jezero Crater",
    lat: 18.44,
    lng: 77.45,
    description: "Landing site of the Perseverance rover; a former river delta where life might have existed.",
    color: "#4dff4d",
  },
  {
    name: "Gale Crater",
    lat: -4.59,
    lng: 137.44,
    description: "Home to Mount Sharp and landing site of the Curiosity rover.",
    color: "#4d94ff",
  },
  {
    name: "Hellas Planitia",
    lat: -42.7,
    lng: 70.0,
    description: "One of the largest impact basins in the solar system.",
    color: "#d14dff",
  },
];

// Simple Error Boundary for Three.js components
function ErrorFallback() {
  return (
    <Html center>
      <div className="bg-black/80 text-white p-4 rounded-lg border border-red-500/50 backdrop-blur-md text-center min-w-[200px]">
        <p className="text-sm font-bold text-red-400">Visualization Error</p>
        <p className="text-[10px] opacity-70 mt-1">Failed to load Mars textures. Please check your connection.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-3 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] transition-all"
        >
          Retry
        </button>
      </div>
    </Html>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}


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
      {(hovered || active) && (
        <Html distanceFactor={10}>
          <div className={`px-2 py-1 rounded-md text-[10px] whitespace-nowrap transition-all ${active ? 'bg-white text-black font-bold scale-110' : 'bg-black/80 text-white backdrop-blur-sm'}`}>
            {poi.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Mars({ activePoi, onPoiSelect }: { activePoi: typeof POIS[0] | null, onPoiSelect: (poi: typeof POIS[0]) => void }) {
  const marsRef = useRef<THREE.Mesh>(null);
  const textures = useTexture(MARS_TEXTURES);

  useFrame((state, delta) => {
    if (marsRef.current && !activePoi) {
      marsRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={marsRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          map={textures.map} 
          bumpMap={textures.bump}
          bumpScale={0.05}
          roughness={0.8}
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
      
      {/* Atmospheric Glow */}
      <mesh scale={1.03}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color="#ff7f50"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

export function MarsMap() {
  const [selectedPoi, setSelectedPoi] = useState<typeof POIS[0] | null>(null);

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-sans">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 0, 2.5]} />
          <OrbitControls 
            enablePan={false} 
            minDistance={1.5} 
            maxDistance={4}
            autoRotate={!selectedPoi}
            autoRotateSpeed={0.5}
          />
          
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
            <Suspense fallback={null}>
              <ErrorBoundary>
                <Mars activePoi={selectedPoi} onPoiSelect={setSelectedPoi} />
              </ErrorBoundary>
            </Suspense>
        </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-8 left-8 z-10">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
          Mars <span className="text-orange-500">Explorer</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1 max-w-[200px]">
          An interactive 3D visualization of the Red Planet and its legendary landmarks.
        </p>
      </div>

      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end z-10 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          {POIS.map((poi) => (
            <button
              key={poi.name}
              onClick={() => setSelectedPoi(poi)}
              className={`text-left px-4 py-2 rounded-full border transition-all duration-300 backdrop-blur-md ${
                selectedPoi?.name === poi.name 
                  ? "bg-white text-black border-white" 
                  : "bg-white/5 text-white border-white/10 hover:bg-white/10"
              }`}
            >
              <span className="text-xs font-medium uppercase tracking-widest">{poi.name}</span>
            </button>
          ))}
          {selectedPoi && (
            <button
              onClick={() => setSelectedPoi(null)}
              className="text-left px-4 py-2 rounded-full border border-orange-500/50 text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 transition-all pointer-events-auto mt-2"
            >
              <span className="text-xs font-medium uppercase tracking-widest">Reset View</span>
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {selectedPoi && (
            <motion.div
              key={selectedPoi.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl max-w-sm pointer-events-auto"
            >
              <div 
                className="w-8 h-1 mb-4 rounded-full" 
                style={{ backgroundColor: selectedPoi.color }}
              />
              <h2 className="text-2xl font-bold text-white mb-2">{selectedPoi.name}</h2>
              <div className="flex gap-4 mb-4 text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
                <span>Lat: {selectedPoi.lat}°</span>
                <span>Lng: {selectedPoi.lng}°</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm">
                {selectedPoi.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative HUD Elements */}
      <div className="absolute top-0 right-0 p-8 flex flex-col items-end gap-1 opacity-20 pointer-events-none uppercase text-[8px] tracking-[0.3em] text-white">
        <div>Sector: 42-B</div>
        <div>Signal: Stable</div>
        <div>Orbit: 3,390 KM</div>
      </div>
    </div>
  );
}
