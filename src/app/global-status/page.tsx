"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Power } from "lucide-react";

export default function GlobalStatusPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number;
    let rotation = 0;
    
    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const globePoints: {x: number, y: number, z: number, type: string, pulse: number}[] = [];
    const numPoints = 800; // Dense globe
    const globeRadius = 300;

    function initGlobe() {
        globePoints.length = 0;
        for(let i=0; i<numPoints; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
            
            let type = 'BASE';
            const rand = Math.random();
            if(rand > 0.92) type = 'CELESTIAL'; 
            else if(rand > 0.75) type = 'VITALIS'; 
            else if(rand > 0.55) type = 'GENESIS'; 

            globePoints.push({
                x: Math.cos(theta) * Math.sin(phi) * globeRadius,
                y: Math.sin(theta) * Math.sin(phi) * globeRadius,
                z: Math.cos(phi) * globeRadius,
                type: type,
                pulse: Math.random() * Math.PI
            });
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        initGlobe();
    }

    const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX - width/2) * 0.0005;
        mouseY = (e.clientY - height/2) * 0.0005;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();

    // Live Data Simulation
    let nodes = 14205;
    let block = 12400592;

    const intervalId = setInterval(() => {
        const clockEl = document.getElementById('clock');
        const nodesEl = document.getElementById('node-count');
        const blockEl = document.getElementById('block-height');
        const hashEl = document.getElementById('hash-rate');

        // Clock
        const now = new Date();
        if (clockEl) clockEl.innerText = now.toISOString().split('T')[1].split('.')[0];
        
        // Random Data Fluctuations
        nodes += Math.floor(Math.random() * 5) - 2;
        if (nodesEl) nodesEl.innerText = nodes.toLocaleString();
        
        // Block Height Increment
        if(Math.random() > 0.8) {
            block++;
            if (blockEl) {
                blockEl.innerText = block.toString();
                blockEl.style.color = '#00ffff';
                setTimeout(() => blockEl.style.color = '#fff', 500);
            }
        }

        // Hash Rate Jitter
        let hash = 450 + (Math.random() * 2 - 1);
        if (hashEl) hashEl.innerText = hash.toFixed(2) + " PH/s";

    }, 1000);

    let animationId: number;
    function loop() {
        if (!ctx) return;
        ctx.fillStyle = '#05020a';
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;

        // Auto Rotation + Mouse Influence
        rotation += 0.002;
        targetRotationX += (mouseY - targetRotationX) * 0.05;
        targetRotationY += (mouseX - targetRotationY) * 0.05;

        // Draw Rings
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, globeRadius * 1.4, globeRadius * 0.4, rotation*0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, globeRadius * 1.6, globeRadius * 1.6, rotation*0.2, 0, Math.PI * 2); 
        ctx.stroke();

        // Draw Globe
        globePoints.forEach(p => {
            let x = p.x;
            let y = p.y;
            let z = p.z;

            let tx = x * Math.cos(rotation + targetRotationY) - z * Math.sin(rotation + targetRotationY);
            let tz = x * Math.sin(rotation + targetRotationY) + z * Math.cos(rotation + targetRotationY);
            x = tx; z = tz;

            let ty = y * Math.cos(0.4 + targetRotationX) - z * Math.sin(0.4 + targetRotationX);
            tz = y * Math.sin(0.4 + targetRotationX) + z * Math.cos(0.4 + targetRotationX);
            y = ty; z = tz;

            const scale = 400 / (400 + z);
            const screenX = cx + x * scale;
            const screenY = cy + y * scale;
            const alpha = (z + globeRadius) / (2 * globeRadius);

            if (z > -150) {
                ctx.beginPath();
                const size = (p.type === 'CELESTIAL' ? 2.5 : 1.5) * scale;
                ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                
                if(p.type === 'CELESTIAL') ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`; 
                else if(p.type === 'VITALIS') ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`; 
                else if(p.type === 'GENESIS') ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`; 
                else ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.5})`; 
                
                ctx.fill();

                if(Math.random() > 0.998) {
                    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY);
                    ctx.lineTo(cx, cy); 
                    ctx.stroke();
                }
            }
        });

        animationId = requestAnimationFrame(loop);
    }

    loop();

    return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', handleMouseMove);
        clearInterval(intervalId);
        cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#030005] text-[#a855f7] font-mono font-bold tracking-wider">
      <style dangerouslySetInnerHTML={{ __html: `
        .scanlines {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(to bottom, rgba(18, 16, 20, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
            background-size: 100% 4px;
            z-index: 2; pointer-events: none;
        }
        
        .vignette {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle, transparent 30%, #000 100%);
            z-index: 3; pointer-events: none;
        }

        .hud-layer { 
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
            z-index: 10; padding: 20px; 
            display: grid;
            grid-template-columns: 340px 1fr 340px;
            grid-template-rows: 70px 1fr 40px;
            gap: 20px;
            pointer-events: none;
        }

        .header { 
            grid-column: 1 / -1; 
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 2px solid #4c1d95;
            background: rgba(10, 5, 20, 0.9);
            padding: 0 25px;
            text-transform: uppercase;
            box-shadow: 0 0 30px rgba(168, 85, 247, 0.1);
        }
        .header h1 { font-size: 24px; color: #fff; text-shadow: 0 0 10px #a855f7; margin: 0; letter-spacing: 3px; }
        
        .panel {
            background: rgba(10, 5, 20, 0.85);
            border: 1px solid #4c1d95;
            padding: 20px;
            display: flex; flex-direction: column; gap: 15px;
            backdrop-filter: blur(5px);
            pointer-events: auto;
        }
        
        .panel h3 { 
            margin: 0 0 10px 0; font-size: 14px; color: #00ffff; 
            border-bottom: 1px dashed #4c1d95; padding-bottom: 8px;
            letter-spacing: 1px;
        }

        .stat-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
        .stat-label { color: #a78bfa; opacity: 0.8; }
        .stat-val { color: #fff; text-shadow: 0 0 5px #a855f7; }

        .zone-card {
            border-left: 4px solid;
            padding: 10px 15px;
            margin-bottom: 15px;
            background: rgba(255, 255, 255, 0.02);
            transition: all 0.3s ease;
        }
        .zone-genesis { border-color: #0f0; }   
        .zone-vitalis { border-color: #fbbf24; } 
        .zone-celestial { border-color: #e0f2fe; } 

        .zone-card:hover { background: rgba(255, 255, 255, 0.05); }

        .footer {
            grid-column: 1 / -1;
            border-top: 1px solid #4c1d95;
            background: rgba(0,0,0,0.9);
            display: flex; align-items: center;
            overflow: hidden;
            white-space: nowrap;
            font-size: 12px; color: #00ffff;
        }
        .ticker-wrap { width: 100%; overflow: hidden; }
        .ticker { display: inline-block; padding-left: 100%; animation: ticker 30s linear infinite; }
        @keyframes ticker { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }

        .blink { animation: flash 1s infinite; }
        @keyframes flash { 50% { opacity: 0; } }

        .corner-bracket {
            position: absolute; width: 20px; height: 20px;
            border: 2px solid #00ffff;
            opacity: 0.5;
        }
        .top-left { top: 20px; left: 20px; border-right: 0; border-bottom: 0; }
        .top-right { top: 20px; right: 20px; border-left: 0; border-bottom: 0; }
        .bottom-left { bottom: 20px; left: 20px; border-right: 0; border-top: 0; }
        .bottom-right { bottom: 20px; right: 20px; border-left: 0; border-top: 0; }
      ` }} />

      {/* Terminate Link Button */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[150] pointer-events-auto">
        <Link href="/" className="px-10 py-3 bg-black/90 border-2 border-purple-500/40 text-purple-500 hover:bg-purple-500/20 hover:border-purple-500 transition-all flex items-center gap-4 font-mono text-sm uppercase tracking-[0.4em] shadow-[0_0_30px_rgba(168,85,247,0.3)]">
          <Power className="w-5 h-5" />
          Terminate Link
        </Link>
      </div>

      <canvas ref={canvasRef} id="global-canvas" className="absolute inset-0 w-full h-full" />
      <div className="scanlines" />
      <div className="vignette" />

      <div className="hud-layer">
        <div className="header">
          <h1>ARES NETWORK // OVERWATCH</h1>
          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '12px', color: '#aaa' }}>SYSTEM_INTEGRITY: <span style={{ color: '#0f0' }}>100%</span></div>
            <div><span className="blink text-red-500">● LIVE</span> <span id="clock" className="text-white">00:00:00</span> UTC</div>
          </div>
        </div>

        <div className="panel">
          <h3>SECTOR STATUS</h3>
          
          <div className="zone-card zone-genesis">
            <div className="stat-row"><span className="stat-label">REGION:</span> <span style={{ color: '#0f0' }}>GENESIS ESTATES</span></div>
            <div className="stat-row"><span className="stat-label">OP_STATE:</span> <span>EXTRACTION_OPTIMAL</span></div>
            <div className="stat-row"><span className="stat-label">YIELD:</span> <span id="gen-yield">4,752,000</span></div>
            <div className="progress-bar" style={{ height: '4px', background: '#003300', marginTop: '4px' }}>
              <div style={{ width: '80%', height: '100%', background: '#0f0', boxShadow: '0 0 5px #0f0' }}></div>
            </div>
          </div>

          <div className="zone-card zone-vitalis">
            <div className="stat-row"><span className="stat-label">REGION:</span> <span style={{ color: '#fbbf24' }}>VITALIS REGION</span></div>
            <div className="stat-row"><span className="stat-label">OP_STATE:</span> <span className="blink" style={{ color: '#fbbf24' }}>TERRAFORM_SEQ</span></div>
            <div className="stat-row"><span className="stat-label">YIELD:</span> <span id="vit-yield">412,000</span></div>
            <div className="progress-bar" style={{ height: '4px', background: '#331100', marginTop: '4px' }}>
              <div style={{ width: '31%', height: '100%', background: '#fbbf24', boxShadow: '0 0 5px #fbbf24' }}></div>
            </div>
          </div>

          <div className="zone-card zone-celestial">
            <div className="stat-row"><span className="stat-label">REGION:</span> <span style={{ color: '#e0f2fe' }}>CELESTIAL ZONE</span></div>
            <div className="stat-row"><span className="stat-label">OP_STATE:</span> <span>RESTRICTED_ACCESS</span></div>
            <div className="stat-row"><span className="stat-label">YIELD:</span> <span id="cel-yield">12,000</span></div>
            <div className="progress-bar" style={{ height: '4px', background: '#112233', marginTop: '4px' }}>
              <div style={{ width: '10%', height: '100%', background: '#e0f2fe', boxShadow: '0 0 5px #e0f2fe' }}></div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '200px', height: '200px', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '50%', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '10px', height: '10px', border: '1px solid #00ffff', pointerEvents: 'none' }}></div>
        </div>

        <div className="panel">
          <h3>GLOBAL METRICS</h3>
          
          <div className="stat-row">
            <span className="stat-label">TOTAL SUPPLY</span>
            <span className="stat-val">7,321,000</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">MARKET CAP</span>
            <span className="stat-val">$241,050,920</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">24H VOLUME</span>
            <span className="stat-val">$12,400,000</span>
          </div>
          
          <div style={{ margin: '20px 0', borderTop: '1px dashed #4c1d95' }}></div>

          <h3>LIVE TELEMETRY</h3>
          <div className="stat-row">
            <span className="stat-label">ACTIVE NODES</span>
            <span className="stat-val" id="node-count">14,205</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">HASH RATE</span>
            <span className="stat-val" id="hash-rate">450 PH/s</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">BLOCK HEIGHT</span>
            <span className="stat-val" id="block-height">12400592</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">LATENCY</span>
            <span className="stat-val" style={{ color: '#0f0' }}>12ms</span>
          </div>

          <div style={{ marginTop: 'auto', textAlign: 'center', opacity: 0.5, fontSize: '10px', lineHeight: 1.5 }}>
            ARES NETWORK CORE V.4.0.2<br />
            ENCRYPTION: QUANTUM_256<br />
            <span style={{ color: '#00ffff' }}>UNAUTHORIZED ACCESS LOGGED</span>
          </div>
        </div>

        <div className="footer">
          <div className="ticker-wrap">
            <div className="ticker">
              &gt;&gt; ALERT: SEISMIC SHIFT IN SECTOR 7G [GENESIS] &gt;&gt; VITALIS THERMAL FLUX NOMINAL &gt;&gt; CELESTIAL SKYHOOK DOCKING COMPLETE &gt;&gt; NEW BLOCK MINED: 12400593 &gt;&gt; ARES NETWORK STATUS: OPTIMAL &gt;&gt; WEATHER WARNING: DUST STORM INCOMING &gt;&gt;
            </div>
          </div>
        </div>
      </div>

      <div className="corner-bracket top-left"></div>
      <div className="corner-bracket top-right"></div>
      <div className="corner-bracket bottom-left"></div>
      <div className="corner-bracket bottom-right"></div>
    </div>
  );
}
