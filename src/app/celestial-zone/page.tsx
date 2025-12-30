"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Power } from "lucide-react";

export default function CelestialZonePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CelestialTheme = {
        name: "CELESTIAL ZONE",
        subRegion: "PLANUM BOREUM (NORTH POLE)",
        feedId: "POLAR_ORBIT_LIDAR",
        colors: {
            primary: '#e0faff', // Ice White
            dim: '#2a4a5a',     // Slate
            bg: '#02050a',      // Deep Space Navy
            feature: '#0a1520'  
        },
        groundSpeed: 0.2,       
        totalCap: 121000,       
        minedStart: 12000
    };

    class OrbitalCruiser {
        engine: MapEngine;
        id: number = 0;
        x: number = 0;
        y: number = 0;
        speed: number = 0;
        scanAngle: number = 0;

        constructor(engine: MapEngine) {
            this.engine = engine;
            this.reset();
            this.y = Math.random() * engine.height;
        }

        reset() {
            this.id = Math.floor(Math.random() * 99) + 1; 
            this.x = Math.random() * this.engine.width; 
            this.y = -50;
            this.speed = 0.4 + Math.random() * 0.4; 
            this.scanAngle = 0;
        }

        update() {
            this.y += this.speed; 
            if(this.y > this.engine.height + 50) this.reset();
            this.scanAngle += 0.05;
            
            if(Math.random() > 0.995) this.engine.addLog(`SAT-${this.id} // UPLINK`);
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            
            ctx.strokeRect(this.x-10, this.y-4, 20, 8); 
            ctx.beginPath(); 
            ctx.moveTo(this.x-10, this.y); ctx.lineTo(this.x-20, this.y); 
            ctx.moveTo(this.x+10, this.y); ctx.lineTo(this.x+20, this.y); 
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(200, 255, 255, 0.5)';
            ctx.fillRect(this.x-25, this.y-5, 5, 10);
            ctx.fillRect(this.x+20, this.y-5, 5, 10);

            this.engine.units.forEach(other => {
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 180 && other !== this) {
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - (dist/1800)})`;
                    ctx.stroke();
                }
            });
        }
    }

    class MapEngine {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        theme: any;
        width: number;
        height: number;
        scrollY: number = 0;
        units: OrbitalCruiser[] = [];
        stars: {x: number, y: number, speed: number, size: number, alpha: number}[] = [];
        auroraY: number = 0;
        mapCanvas: HTMLCanvasElement;
        totalMined: number;
        totalCap: number;

        constructor(canvas: HTMLCanvasElement, theme: any) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d')!;
            this.theme = theme;
            this.width = window.innerWidth;
            this.height = Math.ceil(window.innerHeight);
            this.mapCanvas = document.createElement('canvas'); 
            this.totalMined = theme.minedStart;
            this.totalCap = theme.totalCap;
            this.init();
        }

        init() {
            this.resize();
            this.spawnUnits(10);
            this.initStars();
            this.addLog("POLAR ORBIT ESTABLISHED...");
            this.addLog("REGION: PLANUM BOREUM");
            this.addLog("DETECTING HIGH-FREQUENCY SIGNALS...");
        }

        resize() {
            this.width = window.innerWidth;
            this.height = Math.ceil(window.innerHeight);
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.mapCanvas.width = this.width;
            this.mapCanvas.height = this.height;
            this.generateTerrain();
        }

        spawnUnits(count: number) {
            this.units = [];
            for(let i=0; i<count; i++) this.units.push(new OrbitalCruiser(this));
        }

        initStars() {
            this.stars = [];
            for(let i=0; i<150; i++) {
                this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    speed: 0.1 + Math.random() * 0.2,
                    size: Math.random() * 1.5,
                    alpha: Math.random()
                });
            }
        }

        addLog(msg: string) {
            const logContainer = document.getElementById('sys-log');
            if (!logContainer) return;
            const el = document.createElement('div');
            el.className = 'log-entry new';
            el.innerText = `> ${msg}`; 
            logContainer.prepend(el);
            if(logContainer.children.length > 8 && logContainer.lastElementChild) logContainer.lastElementChild.remove();
            setTimeout(() => el.classList.remove('new'), 500);
        }

        drawBuilding(ctx: CanvasRenderingContext2D, type: string, x: number, y: number) {
            ctx.fillStyle = this.theme.colors.primary;
            ctx.strokeStyle = '#aaccff'; 
            
            switch(type) {
                case 'ICE_SPIRE':
                    ctx.beginPath();
                    ctx.moveTo(x, y-40); 
                    ctx.lineTo(x+10, y+10);
                    ctx.lineTo(x-10, y+10);
                    ctx.closePath();
                    ctx.fill();
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath(); ctx.arc(x,y+10, 15, 0, Math.PI*2); ctx.fill();
                    ctx.globalAlpha = 1.0;
                    break;
                case 'QUANTUM_ARRAY':
                    for(let ix=0; ix<2; ix++) {
                        for(let iy=0; iy<2; iy++) {
                            ctx.strokeRect(x + ix*12 - 6, y + iy*12 - 6, 8, 8);
                        }
                    }
                    break;
                case 'RELAY_DISH':
                    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI*2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x, y-1200); 
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; 
                    ctx.setLineDash([5, 5]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    break;
            }
        }

        generateTerrain() {
            const mCtx = this.mapCanvas.getContext('2d');
            if (!mCtx) return;
            const w = this.width;
            const h = this.height;
            mCtx.clearRect(0, 0, w, h);

            const drawWrapped = (fn: (ox: number, oy: number) => void) => {
                fn(0,0); fn(0, -h); fn(0, h); fn(-w, 0); fn(w, 0);
            };

            mCtx.fillStyle = '#08101a'; 
            for(let i=0; i<8; i++) {
                const cx = Math.random() * w;
                const cy = Math.random() * h;
                drawWrapped((ox, oy) => {
                    mCtx.beginPath();
                    mCtx.arc(cx+ox, cy+oy, 100 + Math.random()*200, 0, Math.PI*2);
                    mCtx.fill();
                });
            }

            mCtx.strokeStyle = 'rgba(100, 200, 255, 0.15)'; 
            mCtx.lineWidth = 2;
            for(let i=0; i<12; i++) {
                const startY = Math.random() * h;
                drawWrapped((ox, oy) => {
                    let y = startY + oy;
                    mCtx.beginPath();
                    mCtx.moveTo(0+ox, y);
                    for(let x=0; x<=w; x+=30) {
                        mCtx.lineTo(x+ox, y + Math.sin(x*0.02)*40 + (Math.random()-0.5)*10);
                    }
                    mCtx.stroke();
                });
            }

            const types = ['ICE_SPIRE', 'QUANTUM_ARRAY', 'RELAY_DISH'];
            for(let i=0; i<15; i++) {
                const bx = Math.random() * w;
                const by = Math.random() * h;
                const type = types[Math.floor(Math.random() * types.length)];
                drawWrapped((ox, oy) => {
                    this.drawBuilding(mCtx, type, bx+ox, by+oy);
                });
            }
        }

        drawAurora() {
            this.auroraY += 0.005;
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;
            
            ctx.save();
            ctx.globalCompositeOperation = 'screen'; 
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, 'rgba(0, 255, 200, 0)');
            grad.addColorStop(0.5, 'rgba(0, 255, 255, 0.08)'); 
            grad.addColorStop(1, 'rgba(0, 255, 200, 0)');
            
            ctx.fillStyle = grad;
            
            ctx.beginPath();
            ctx.moveTo(0, h/2);
            for(let x=0; x<=w; x+=10) {
                const y = h/2 + Math.sin(x*0.005 + this.auroraY*2)*100 + Math.sin(x*0.02 + this.auroraY)*50;
                ctx.lineTo(x, y);
                ctx.lineTo(x, y - 200); 
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        updateHUD() {
            const latEl = document.getElementById('lat');
            const minedEl = document.getElementById('mined-val');
            const progTxtEl = document.getElementById('progress-text');
            const progFillEl = document.getElementById('progress-fill');

            if (latEl) latEl.innerText = (85.0 + (Date.now()*0.00002)%1).toFixed(4);
            
            const pct = (this.totalMined / this.totalCap) * 100;
            
            if (minedEl) minedEl.innerText = Math.floor(this.totalMined).toLocaleString();
            if (progTxtEl) progTxtEl.innerText = pct.toFixed(5) + "%"; 
            if (progFillEl) progFillEl.style.width = pct + "%";
        }
    }

    const engine = new MapEngine(canvas, CelestialTheme);
    let animationId: number;

    const loop = () => {
        engine.ctx.fillStyle = engine.theme.colors.bg;
        engine.ctx.fillRect(0,0,engine.width, engine.height);

        engine.ctx.fillStyle = '#ffffff';
        engine.stars.forEach(s => {
            s.y += s.speed;
            if(s.y > engine.height) s.y = 0;
            engine.ctx.globalAlpha = s.alpha * (0.5 + Math.random()*0.5);
            engine.ctx.fillRect(s.x, s.y, s.size, s.size);
        });
        engine.ctx.globalAlpha = 1.0;

        engine.drawAurora();

        engine.scrollY += engine.theme.groundSpeed;
        if(engine.scrollY >= engine.height) engine.scrollY = 0;
        const iy = Math.floor(engine.scrollY);
        
        engine.ctx.drawImage(engine.mapCanvas, 0, iy);
        engine.ctx.drawImage(engine.mapCanvas, 0, iy - engine.height);

        engine.units.forEach(u => { u.update(); u.draw(engine.ctx); });
        
        engine.updateHUD();
        animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
        cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#02050a] text-[#e0faff] font-mono font-bold tracking-wider">
      <style dangerouslySetInnerHTML={{ __html: `
        .vignette {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle, transparent 30%, black 100%);
            z-index: 9; pointer-events: none;
        }

        .iso-grid {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-image: 
                linear-gradient(#2a4a5a 1px, transparent 1px),
                linear-gradient(90deg, #2a4a5a 1px, transparent 1px);
            background-size: 60px 60px; 
            pointer-events: none; z-index: 8;
            opacity: 0.15;
        }

        .scanlines {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(
                to bottom,
                rgba(255,255,255,0),
                rgba(255,255,255,0) 50%,
                rgba(0,0,0,0.1) 50%,
                rgba(0,0,0,0.1)
            );
            background-size: 100% 2px;
            z-index: 10; pointer-events: none;
        }

        .hud-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 20; padding: 25px; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
        
        .top-bar { 
            display: flex; justify-content: space-between; 
            border-bottom: 2px solid #2a4a5a; 
            padding-bottom: 10px; 
            text-transform: uppercase; 
            font-size: 14px; 
            background: rgba(2, 10, 20, 0.8);
            backdrop-filter: blur(4px);
        }
        
        .blink { animation: blinker 2s ease-in-out infinite; }
        @keyframes blinker { 50% { opacity: 0.5; color: #fff; } }

        .stats-panel { 
            position: absolute; top: 90px; left: 25px; 
            background: rgba(5, 15, 30, 0.9); 
            border: 1px solid #e0faff; 
            padding: 0; 
            width: 340px; 
            box-shadow: 0 0 25px rgba(200, 240, 255, 0.15); 
            pointer-events: auto;
        }
        .stats-panel h2 { 
            margin: 0; font-size: 16px; color: #000; 
            background: #e0faff; 
            padding: 8px 15px; text-transform: uppercase; 
        }
        
        .stats-content { padding: 15px; }

        .data-row { 
            display: flex; justify-content: space-between; 
            margin-bottom: 8px; font-size: 12px; 
            border-bottom: 1px solid #2a4a5a; 
            padding-bottom: 4px; 
        }
        .data-label { color: #88aacc; text-transform: uppercase; }
        .data-val { color: #fff; text-shadow: 0 0 8px #e0faff; }

        .progress-bar-track { height: 4px; background: #0a1a2a; position: relative; margin-top: 8px; }
        .progress-bar-fill { height: 100%; background: #e0faff; width: 0%; box-shadow: 0 0 10px #e0faff; transition: width 0.1s linear; }

        .terminal-log { 
            position: absolute; bottom: 80px; left: 25px; 
            width: 350px; height: 160px; overflow: hidden; 
            font-size: 11px; line-height: 1.5;
            color: #cceeff; 
            display: flex; flex-direction: column-reverse; 
            background: rgba(0,0,0,0.6);
            padding: 10px;
            border-left: 2px solid #e0faff;
        }
        .log-entry { margin-bottom: 2px; opacity: 0.8; }
        .log-entry.new { color: #fff; opacity: 1; text-shadow: 0 0 5px #fff; }

        .coords { 
            position: absolute; bottom: 25px; right: 25px; 
            text-align: right; font-size: 12px; 
            background: rgba(0,0,0,0.8); padding: 10px; 
            border: 1px solid #e0faff;
            color: #fff;
        }
      ` }} />

      {/* Back Button */}
      <Link href="/" className="fixed top-24 left-8 z-[100] px-4 py-2 bg-black/80 border border-red-500/50 text-red-500 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500 transition-all flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] pointer-events-auto border-l-4">
        <Power className="w-3 h-3" />
        Terminate Link
      </Link>

      <canvas ref={canvasRef} id="sat-feed" className="absolute inset-0 w-full h-full" />
      <div className="iso-grid" />
      <div className="scanlines" />
      <div className="vignette" />

      <div className="hud-layer">
        <div className="top-bar">
          <div>SAT-LINK: <span className="text-white">QUANTUM_RELAY_ALPHA</span></div>
          <div>FEED: <span id="feed-id">POLAR_ORBIT_LIDAR</span></div>
          <div className="blink text-cyan-400">● SYNCHRONIZED</div>
        </div>

        <div className="stats-panel">
          <h2>CELESTIAL // ELITE</h2>
          <div className="stats-content">
            <div className="data-row"><span className="data-label">SECTOR:</span><span className="data-val" id="sector-val">PLANUM BOREUM</span></div>
            <div className="data-row"><span className="data-label">BIOME:</span><span className="data-val">POLAR ICE CAP</span></div>
            <div className="data-row"><span className="data-label">ELEVATION:</span><span className="data-val">HIGH PLATEAU</span></div>
            <br />
            <div className="data-row"><span className="data-label">PARCELS:</span><span className="data-val">121,000 SQM</span></div>
            <div className="data-row"><span className="data-label">ORBITAL TRAFFIC:</span><span className="data-val" id="eva-count">HIGH</span></div>
            <div className="data-row"><span className="data-label">YIELD:</span><span className="data-val" id="mined-val">0</span></div>
            <div className="mt-4">
              <div className="data-row"><span className="data-label">DATA_UPLINK</span><span className="data-val" id="progress-text">0%</span></div>
              <div className="progress-bar-track"><div className="progress-bar-fill" id="progress-fill" /></div>
            </div>
          </div>
        </div>

        <div className="terminal-log" id="sys-log" />

        <div className="coords">
          <div>LAT: <span id="lat">85.000</span> N</div>
          <div>LNG: <span id="lng">0.000</span> E</div>
          <div className="text-[#88aacc] text-[10px] mt-1">TEMP: -125°C // CRYOGENIC</div>
        </div>
      </div>
    </div>
  );
}
