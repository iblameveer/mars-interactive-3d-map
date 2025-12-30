"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Power } from "lucide-react";

export default function VitalisRegionPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const VitalisTheme = {
        name: "VITALIS REGION",
        subRegion: "ARCADIA PLANITIA",
        feedId: "THERMAL_IR_V9",
        colors: {
            primary: '#ffaa00', // Amber
            dim: '#552200',
            bg: '#1a0500',      // Deep thermal background
            feature: '#331100'  
        },
        groundSpeed: 0.3,       
        totalCap: 1300000,
        minedStart: 412000
    };

    class Drone {
        engine: MapEngine;
        id: number = 0;
        x: number = 0;
        y: number = 0;
        speed: number = 0;
        state: 'PATROL' | 'TASK' = 'PATROL';
        timer: number = 0;
        tx: number = 0;
        ty: number = 0;

        constructor(engine: MapEngine) {
            this.engine = engine; 
            this.reset(); 
            this.y = Math.random() * engine.height;
        }

        reset() {
            this.id = Math.floor(Math.random() * 999) + 1;
            this.x = Math.random() * this.engine.width; 
            this.y = -50;
            this.speed = 0.3 + Math.random() * 0.3;
            this.state = 'PATROL'; 
            this.timer = 0;
            this.tx = Math.random() * this.engine.width; 
            this.ty = Math.random() * this.engine.height;
        }

        update() {
            this.y += this.engine.theme.groundSpeed;
            if(this.y > this.engine.height + 50) this.reset();
            if(this.state === 'PATROL') {
                const dx = this.tx - this.x; 
                const dy = this.ty - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 5) {
                    this.state = 'TASK'; 
                    this.timer = 150 + Math.random() * 100;
                    if(Math.random() > 0.8) this.engine.addLog(`UNIT-${this.id} // CHARGING`);
                } else {
                    this.x += (dx/dist)*this.speed; 
                    this.y += (dy/dist)*this.speed;
                }
            } else if(this.state === 'TASK') {
                this.timer--; 
                this.engine.totalMined += 0.02; 
                if(this.timer <= 0) {
                    this.state = 'PATROL';
                    this.tx = Math.random() * this.engine.width; 
                    this.ty = Math.random() * this.engine.height;
                }
            }
        }

        draw(ctx: CanvasRenderingContext2D) {
            const size = 6;
            ctx.fillStyle = this.engine.theme.colors.primary;
            ctx.beginPath(); 
            ctx.moveTo(this.x, this.y - size); 
            ctx.lineTo(this.x + size, this.y + size); 
            ctx.lineTo(this.x - size, this.y + size); 
            ctx.closePath(); 
            ctx.fill();
            ctx.shadowBlur = 8; 
            ctx.shadowColor = this.engine.theme.colors.primary; 
            ctx.fill(); 
            ctx.shadowBlur = 0;
            if(this.state === 'TASK') {
                ctx.beginPath(); 
                ctx.moveTo(this.x, this.y); 
                ctx.lineTo(this.x, this.y + 20);
                ctx.strokeStyle = `rgba(255, 170, 0, ${0.2 + Math.random()*0.3})`; 
                ctx.lineWidth = 2; 
                ctx.stroke();
            }
        }
    }

    class Astronaut {
        engine: MapEngine;
        startX: number;
        startY: number;
        x: number;
        y: number;
        tx: number;
        ty: number;
        speed: number;

        constructor(engine: MapEngine, x: number, y: number) {
            this.engine = engine;
            this.startX = x; 
            this.startY = y; 
            this.x = x; 
            this.y = y;
            this.tx = x + (Math.random()-0.5)*50; 
            this.ty = y + (Math.random()-0.5)*50;
            this.speed = 0.05 + Math.random() * 0.05;
        }

        update() {
            this.y += this.engine.theme.groundSpeed;
            this.startY += this.engine.theme.groundSpeed;
            this.ty += this.engine.theme.groundSpeed;
            if(this.y > this.engine.height + 20) {
                this.y -= this.engine.height; 
                this.startY -= this.engine.height; 
                this.ty -= this.engine.height;
            }
            const dx = this.tx - this.x; 
            const dy = this.ty - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 2) {
                this.tx = this.startX + (Math.random()-0.5)*80; 
                this.ty = this.startY + (Math.random()-0.5)*80;
            } else {
                this.x += (dx/dist)*this.speed; 
                this.y += (dy/dist)*this.speed;
            }
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = '#ffffff'; 
            ctx.fillRect(this.x, this.y, 1.5, 1.5);
            ctx.fillStyle = 'rgba(255, 170, 0, 0.3)';
            ctx.fillRect(this.x-1, this.y-1, 3.5, 3.5);
        }
    }

    class MapEngine {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        theme: any;
        width: number;
        height: number;
        scrollY: number = 0;
        units: Drone[] = [];
        astronauts: Astronaut[] = [];
        vents: {x: number, y: number}[] = [];
        buildings: {x: number, y: number}[] = [];
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
            this.spawnDrones(8);
            this.spawnAstronauts(30);
            this.addLog("SYSTEM INITIALIZED...");
            this.addLog("SAT-LINK // SECURE_CH_4 ESTABLISHED");
            this.addLog("FEED // THERMAL_IR_V9");
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

        spawnDrones(count: number) {
            this.units = [];
            for(let i=0; i<count; i++) this.units.push(new Drone(this));
        }

        spawnAstronauts(count: number) {
            this.astronauts = [];
            for(let i=0; i<count; i++) {
                const b = this.buildings[Math.floor(Math.random() * this.buildings.length)];
                const startX = b ? b.x + (Math.random()-0.5)*100 : Math.random() * this.width;
                const startY = b ? b.y + (Math.random()-0.5)*100 : Math.random() * this.height;
                this.astronauts.push(new Astronaut(this, startX, startY));
            }
            const el = document.getElementById('eva-count');
            if (el) el.innerText = `${count} [ONLINE]`;
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
            const alpha = 0.6 + Math.random() * 0.4;
            ctx.fillStyle = this.theme.colors.primary;
            ctx.strokeStyle = this.theme.colors.dim;
            this.buildings.push({x, y});

            switch(type) {
                case 'COMMAND_HUB':
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    for(let i=0; i<6; i++) {
                        const angle = (i/6) * Math.PI * 2;
                        ctx.lineTo(x + Math.cos(angle)*15, y + Math.sin(angle)*15);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(x,y,5,0,Math.PI*2);
                    ctx.stroke();
                    break;
                case 'MED_BAY':
                    ctx.globalAlpha = 0.9;
                    ctx.fillRect(x-5, y-15, 10, 30);
                    ctx.fillRect(x-15, y-5, 30, 10);
                    break;
                case 'CARGO_YARD':
                    ctx.globalAlpha = 0.5;
                    for(let ix=0; ix<3; ix++) {
                        for(let iy=0; iy<3; iy++) {
                            ctx.strokeRect(x + (ix*10)-15, y + (iy*10)-15, 8, 8);
                        }
                    }
                    break;
                case 'ORE_PROCESSOR':
                    ctx.globalAlpha = 1.0;
                    ctx.fillRect(x-15, y-10, 30, 20);
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.arc(x+10, y-5, 4, 0, Math.PI*2);
                    ctx.stroke();
                    break;
                case 'SOLAR_ARRAY':
                    for(let ix=0; ix<3; ix++) {
                        for(let iy=0; iy<3; iy++) {
                            ctx.globalAlpha = 0.5 + Math.random()*0.3;
                            ctx.fillRect(x + ix*12, y + iy*8, 10, 6);
                        }
                    }
                    break;
                case 'HAB_MODULE':
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(x, y, 12, 0, Math.PI*2);
                    ctx.fill();
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = this.theme.colors.primary;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    break;
                case 'LAUNCH_PAD':
                    ctx.globalAlpha = 0.4;
                    ctx.fillRect(x-20, y-20, 40, 40);
                    ctx.globalAlpha = 1.0;
                    ctx.strokeRect(x-20, y-20, 40, 40);
                    ctx.beginPath();
                    ctx.moveTo(x-10, y-10); ctx.lineTo(x+10, y+10);
                    ctx.moveTo(x+10, y-10); ctx.lineTo(x-10, y+10);
                    ctx.stroke();
                    break;
                case 'GREENHOUSE':
                    ctx.globalAlpha = 0.3;
                    ctx.fillRect(x-30, y-10, 60, 20);
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    for(let i=0; i<=6; i++) {
                        ctx.moveTo(x-30 + (i*10), y-10);
                        ctx.lineTo(x-30 + (i*10), y+10);
                    }
                    ctx.stroke();
                    break;
                case 'WATER_TANK':
                    ctx.globalAlpha = 0.9;
                    ctx.beginPath();
                    ctx.arc(x, y, 8, 0, Math.PI*2);
                    ctx.arc(x+10, y+6, 6, 0, Math.PI*2);
                    ctx.fill();
                    break;
                case 'THERMAL_VENT':
                    ctx.globalAlpha = 1.0;
                    ctx.beginPath();
                    ctx.moveTo(x, y); ctx.lineTo(x-5, y+20); ctx.lineTo(x+5, y+20);
                    ctx.fill();
                    break;
            }
            ctx.globalAlpha = 1.0; 
        }

        generateTerrain() {
            this.buildings = [];
            const mCtx = this.mapCanvas.getContext('2d');
            if (!mCtx) return;
            const w = this.width;
            const h = this.height;
            
            mCtx.fillStyle = this.theme.colors.bg;
            mCtx.fillRect(0, 0, w, h);

            const drawWrapped = (fn: (ox: number, oy: number) => void) => {
                fn(0,0); fn(0, -h); fn(0, h); fn(-w, 0); fn(w, 0);
            };

            mCtx.strokeStyle = '#331100'; mCtx.lineWidth = 2; mCtx.globalAlpha = 0.6;
            for(let i=0; i<10; i++) {
                const sx = Math.random() * w; const sy = Math.random() * h;
                drawWrapped((ox, oy) => {
                    let cx = sx+ox, cy = sy+oy;
                    mCtx.beginPath(); mCtx.moveTo(cx, cy);
                    for(let s=0; s<15; s++) { cx+=(Math.random()-0.5)*60; cy+=(Math.random()-0.5)*60; mCtx.lineTo(cx, cy); }
                    mCtx.stroke();
                });
            }
            mCtx.globalAlpha = 1.0;

            mCtx.strokeStyle = '#552200'; mCtx.lineWidth = 4;
            const nodes: {x: number, y: number}[] = [];
            for(let i=0; i<6; i++) nodes.push({x: Math.random()*w, y: Math.random()*h});
            drawWrapped((ox, oy) => {
                mCtx.beginPath();
                for(let i=0; i<nodes.length-1; i++) {
                    mCtx.moveTo(nodes[i].x+ox, nodes[i].y+oy);
                    mCtx.lineTo(nodes[i+1].x+ox, nodes[i+1].y+oy);
                }
                mCtx.stroke();
            });

            const types = ['SOLAR_ARRAY', 'HAB_MODULE', 'LAUNCH_PAD', 'GREENHOUSE', 'WATER_TANK', 'THERMAL_VENT', 'COMMAND_HUB', 'MED_BAY', 'CARGO_YARD', 'ORE_PROCESSOR'];
            for(let i=0; i<16; i++) {
                const bx = Math.random() * w;
                const by = Math.random() * h;
                const type = types[Math.floor(Math.random() * types.length)];
                if(type === 'THERMAL_VENT') this.vents.push({x: bx, y: by});
                drawWrapped((ox, oy) => {
                    this.drawBuilding(mCtx, type, bx+ox, by+oy);
                });
            }
        }

        updateHUD() {
            const latEl = document.getElementById('lat');
            const lngEl = document.getElementById('lng');
            const minedEl = document.getElementById('mined-val');
            const progTxtEl = document.getElementById('progress-text');
            const progFillEl = document.getElementById('progress-fill');

            if (latEl) latEl.innerText = (47.1 + (Date.now()*0.0001)%1).toFixed(4);
            if (lngEl) lngEl.innerText = (175.2 + (Date.now()*0.0002)%1).toFixed(4);
            
            const pct = (this.totalMined / this.totalCap) * 100;
            
            if (minedEl) minedEl.innerText = Math.floor(this.totalMined).toLocaleString();
            if (progTxtEl) progTxtEl.innerText = pct.toFixed(4) + "%";
            if (progFillEl) progFillEl.style.width = pct + "%";
        }
    }

    const engine = new MapEngine(canvas, VitalisTheme);
    let animationId: number;

    const loop = () => {
        engine.ctx.clearRect(0, 0, engine.width, engine.height);
        
        engine.scrollY += engine.theme.groundSpeed;
        if(engine.scrollY >= engine.height) engine.scrollY = 0;
        const iy = Math.floor(engine.scrollY);
        
        engine.ctx.drawImage(engine.mapCanvas, 0, iy);
        engine.ctx.drawImage(engine.mapCanvas, 0, iy - engine.height);

        engine.vents.forEach(v => {
            let vy = v.y + iy;
            if(vy > engine.height) vy -= engine.height;
            if(Math.random() > 0.92) {
                engine.ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
                const puffSize = 2 + Math.random() * 4;
                engine.ctx.beginPath();
                engine.ctx.arc(v.x, vy - 10 - (Math.random()*10), puffSize, 0, Math.PI*2);
                engine.ctx.fill();
            }
        });

        engine.astronauts.forEach(a => { a.update(); a.draw(engine.ctx); });
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
    <div className="relative w-full h-screen overflow-hidden bg-[#1a0500] text-[#ffaa00] font-mono font-bold tracking-wider">
      <style dangerouslySetInnerHTML={{ __html: `
        .vignette {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle, transparent 40%, black 100%);
            z-index: 9; pointer-events: none;
        }

        .scanlines {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(
                to bottom,
                rgba(255,255,255,0),
                rgba(255,255,255,0) 50%,
                rgba(0,0,0,0.2) 50%,
                rgba(0,0,0,0.2)
            );
            background-size: 100% 4px;
            z-index: 10; pointer-events: none;
        }

        .plot-grid {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-image: 
                linear-gradient(rgba(255, 170, 0, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 170, 0, 0.1) 1px, transparent 1px);
            background-size: 100px 100px; 
            pointer-events: none; z-index: 8;
            opacity: 0.3;
        }

        .hud-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 20; padding: 25px; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
        
        .top-bar { 
            display: flex; justify-content: space-between; 
            border-bottom: 2px solid #552200; 
            padding-bottom: 10px; 
            text-transform: uppercase; 
            font-size: 14px; 
            background: rgba(20, 5, 0, 0.8);
        }
        
        .blink { animation: blinker 2s linear infinite; }
        @keyframes blinker { 50% { opacity: 0; } }

        .stats-panel { 
            position: absolute; top: 90px; left: 25px; 
            background: rgba(30, 10, 0, 0.9); 
            border: 1px solid #ffaa00; 
            padding: 0; 
            width: 340px; 
            box-shadow: 5px 5px 0px rgba(0,0,0,0.5); 
            pointer-events: auto;
        }
        .stats-panel h2 { 
            margin: 0; font-size: 16px; color: #000; 
            background: #ffaa00; 
            padding: 8px 15px; text-transform: uppercase; 
        }
        
        .stats-content { padding: 15px; }

        .data-row { 
            display: flex; justify-content: space-between; 
            margin-bottom: 8px; font-size: 12px; 
            border-bottom: 1px dashed #552200; 
            padding-bottom: 4px; 
        }
        .data-label { color: #ffaa00; text-transform: uppercase; }
        .data-val { color: #fff; text-shadow: 0 0 2px #ffaa00; }

        .progress-bar-track { height: 8px; background: #220500; border: 1px solid #552200; position: relative; margin-top: 5px; }
        .progress-bar-fill { height: 100%; background: #ffaa00; width: 0%; transition: width 0.1s linear; box-shadow: 0 0 10px #ffaa00; }

        .terminal-log { 
            position: absolute; bottom: 80px; left: 25px; 
            width: 350px; height: 160px; overflow: hidden; 
            font-size: 12px; line-height: 1.4;
            color: #ffaa00; 
            display: flex; flex-direction: column-reverse; 
            text-shadow: 0 0 4px #ffaa00;
            background: rgba(0,0,0,0.3);
            padding: 10px;
            border-left: 2px solid #552200;
        }
        .log-entry { margin-bottom: 2px; opacity: 0.8; }
        .log-entry.new { color: #fff; opacity: 1; background: rgba(255, 170, 0, 0.1); }

        .coords { 
            position: absolute; bottom: 25px; right: 25px; 
            text-align: right; font-size: 12px; 
            background: rgba(0,0,0,0.8); padding: 10px; 
            border: 1px solid #ffaa00;
        }
      ` }} />

      {/* Back Button */}
      <Link href="/" className="fixed top-24 left-8 z-[100] px-6 py-2 bg-black/80 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-black transition-all flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.3em] pointer-events-auto shadow-[0_0_15px_rgba(220,38,38,0.3)] border-l-[8px] hover:border-l-[12px]">
        <Power className="w-3 h-3" />
        TERMINATE LINK
      </Link>

      <canvas ref={canvasRef} id="sat-feed" className="absolute inset-0 w-full h-full" />
      <div className="plot-grid" />
      <div className="scanlines" />
      <div className="vignette" />

      <div className="hud-layer">
        <div className="top-bar">
          <div>SAT-LINK: <span className="text-white">SECURE_CH_4</span></div>
          <div>FEED: <span id="feed-id">THERMAL_IR_V9</span></div>
          <div className="blink text-red-500">● LIVE STREAM</div>
        </div>

        <div className="stats-panel">
          <h2>VITALIS // COMMAND</h2>
          <div className="stats-content">
            <div className="data-row"><span className="data-label">SECTOR:</span><span className="data-val" id="sector-val">ARCADIA PLANITIA</span></div>
            <div className="data-row"><span className="data-label">OP STATE:</span><span className="data-val">HABITATION_ACTIVE</span></div>
            <div className="data-row"><span className="data-label">ENV_RISK:</span><span className="data-val">CLASS II (ICE)</span></div>
            <br />
            <div className="data-row"><span className="data-label">SECTOR CAP:</span><span className="data-val">1,300,000</span></div>
            <div className="data-row"><span className="data-label">EVA UNITS:</span><span className="data-val" id="eva-count">30 [ONLINE]</span></div>
            <div className="data-row"><span className="data-label">HARVESTED:</span><span className="data-val" id="mined-val">0</span></div>
            <div className="mt-4">
              <div className="data-row"><span className="data-label">TERRAFORMING_SEQ</span><span className="data-val" id="progress-text">0%</span></div>
              <div className="progress-bar-track"><div className="progress-bar-fill" id="progress-fill" /></div>
            </div>
          </div>
        </div>

        <div className="terminal-log" id="sys-log" />

        <div className="coords">
          <div>LAT: <span id="lat">47.000</span> N</div>
          <div>LNG: <span id="lng">175.000</span> W</div>
          <div className="text-gray-400 text-[10px] mt-1">SURFACE_TEMP: -35°C // FLUX_STABLE</div>
        </div>
      </div>
    </div>
  );
}
