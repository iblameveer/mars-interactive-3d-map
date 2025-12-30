"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Power } from "lucide-react";

export default function GenesisProtocolPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // --- PRE-RENDERING SURFACES ---
    const mapCanvas = document.createElement('canvas');
    const mapCtx = mapCanvas.getContext('2d');
    
    let width: number, height: number;
    let scrollY = 0;
    const GROUND_SPEED = 0.5;

    // --- STATE ---
    let totalMined = 4752000;
    const totalCap = 5900000;
    const reserved = 500000;
    const availableCap = totalCap - reserved;

    function resize() {
        width = window.innerWidth;
        height = Math.ceil(window.innerHeight);
        
        canvas.width = width;
        canvas.height = height;
        
        mapCanvas.width = width;
        mapCanvas.height = height; 
        
        generateSeamlessSurface();
    }

    function generateSeamlessSurface() {
        if (!mapCtx) return;
        const w = mapCanvas.width;
        const h = mapCanvas.height;
        
        mapCtx.fillStyle = '#050505';
        mapCtx.fillRect(0, 0, w, h);

        for(let i=0; i<600; i++) {
             mapCtx.fillStyle = Math.random() > 0.6 ? 'rgba(50, 180, 50, 0.2)' : 'rgba(100, 100, 100, 0.1)';
             mapCtx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }

        function drawWrappingShape(drawFn: (ox: number, oy: number) => void) {
            drawFn(0, 0); // Center
            drawFn(0, -h); // Above
            drawFn(0, h);  // Below
            drawFn(-w, 0); // Left
            drawFn(w, 0);  // Right
        }

        for(let i=0; i<25; i++) {
            const cx = Math.random() * w;
            const cy = Math.random() * h;
            const r = 50 + Math.random() * 150;
            
            const points: {dx: number, dy: number}[] = [];
            const sides = 7 + Math.floor(Math.random()*4);
            for(let j=0; j<sides; j++) {
                const angle = (j/sides) * Math.PI * 2;
                const len = r * (0.4 + Math.random() * 0.6);
                points.push({
                    dx: Math.cos(angle) * len,
                    dy: Math.sin(angle) * len
                });
            }

            drawWrappingShape((ox, oy) => {
                if (!mapCtx) return;
                const x = cx + ox;
                const y = cy + oy;
                
                mapCtx.beginPath();
                points.forEach((pt, idx) => {
                    if(idx === 0) mapCtx.moveTo(x + pt.dx, y + pt.dy);
                    else mapCtx.lineTo(x + pt.dx, y + pt.dy);
                });
                mapCtx.closePath();
                
                const grad = mapCtx.createLinearGradient(x-r, y-r, x+r, y+r);
                grad.addColorStop(0, '#1a1a1a'); 
                grad.addColorStop(1, '#000');
                mapCtx.fillStyle = grad;
                mapCtx.fill();
            });
        }

        for(let i = 0; i < 20; i++) {
            const cx = Math.random() * w;
            const cy = Math.random() * h;
            const r = 30 + Math.random() * 60;
            
            const points: {dx: number, dy: number}[] = [];
            const sides = 12 + Math.floor(Math.random()*6);
            for(let j=0; j<sides; j++) {
                const angle = (j/sides) * Math.PI * 2;
                const len = r * (0.8 + Math.random() * 0.4); 
                points.push({
                    dx: Math.cos(angle) * len,
                    dy: Math.sin(angle) * len
                });
            }

            drawWrappingShape((ox, oy) => {
                if (!mapCtx) return;
                const x = cx + ox;
                const y = cy + oy;
                
                mapCtx.beginPath();
                points.forEach((pt, idx) => {
                    if(idx === 0) mapCtx.moveTo(x + pt.dx, y + pt.dy);
                    else mapCtx.lineTo(x + pt.dx, y + pt.dy);
                });
                mapCtx.closePath();

                mapCtx.fillStyle = '#020202';
                mapCtx.fill();
                
                mapCtx.lineWidth = 2;
                mapCtx.strokeStyle = '#222';
                mapCtx.stroke();
            });
        }
    }

    window.addEventListener('resize', resize);
    resize();

    const logContainer = document.getElementById('sys-log');
    function addLog(msg: string) {
        if (!logContainer) return;
        const el = document.createElement('div');
        el.className = 'log-entry new';
        el.innerText = `> ${msg}`;
        logContainer.prepend(el);
        if(logContainer.children.length > 8 && logContainer.lastElementChild) logContainer.lastElementChild.remove();
        setTimeout(() => el.classList.remove('new'), 500);
    }

    const units: Unit[] = [];
    const NUM_UNITS = 20;

    class Unit {
        id: number = 0;
        formattedId: string = "";
        isHeavy: boolean = false;
        x: number = 0;
        y: number = 0;
        tx: number = 0;
        ty: number = 0;
        state: 'moving' | 'mining' = 'moving';
        speed: number = 0;
        timer: number = 0;
        spark: {x: number, y: number, age: number} | null = null;

        constructor() {
            this.reset();
            this.y = Math.random() * height;
        }

        reset() {
            this.id = Math.floor(Math.random() * 1000) + 1; 
            this.formattedId = `UNIT-${this.id.toString().padStart(3, '0')}`;
            this.isHeavy = Math.random() < 0.05;
            
            this.x = Math.random() * width;
            this.y = -50; 
            
            if(this.isHeavy) {
                this.tx = this.x; 
                this.ty = this.y;
                this.state = 'mining';
            } else {
                this.tx = Math.random() * width;
                this.ty = Math.random() * height;
                this.state = 'moving';
            }

            this.speed = this.isHeavy ? 0 : (0.2 + Math.random() * 0.5);
            this.timer = 0;
        }

        update() {
            this.y += GROUND_SPEED;

            if(this.y > height + 50) {
                this.reset();
            }

            if(this.isHeavy) {
                if(Math.random() > 0.98) {
                    this.spark = {x: this.x, y: this.y + 20, age: 5};
                }
                if(Math.random() > 0.997) {
                    addLog(`${this.formattedId} [HVY] // CORE SAMPLE`);
                }
            } else {
                if (this.state === 'moving') {
                    const dx = this.tx - this.x;
                    const dy = this.ty - this.y; 
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if (dist < 10) {
                        this.state = 'mining';
                        this.timer = 100 + Math.random() * 200;
                        addLog(`${this.formattedId} // LOCKING VEIN`);
                    } else {
                        this.x += (dx / dist) * this.speed;
                        this.y += (dy / dist) * this.speed;
                    }
                } else if (this.state === 'mining') {
                    this.timer--;
                    if (this.timer <= 0) {
                        this.state = 'moving';
                        this.tx = Math.random() * width;
                        this.ty = Math.random() * height;
                        addLog(`${this.formattedId} // EXTRACTION COMPLETE`);
                    }
                }
            }

            if ((this.state === 'mining' || this.isHeavy) && totalMined < availableCap) {
                totalMined += this.isHeavy ? 0.8 : 0.1;
            }
        }

        draw() {
            if (!ctx) return;
            if(this.isHeavy) {
                const size = 16;
                ctx.fillStyle = '#4f4';
                ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
                
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x, this.y + 30);
                ctx.lineWidth = 3;
                ctx.strokeStyle = `rgba(100, 255, 100, ${0.5 + Math.random()*0.5})`;
                ctx.stroke();

                if(this.spark && this.spark.age > 0) {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(this.spark.x + (Math.random()-0.5)*10, this.spark.y, 2, 2);
                    this.spark.age--;
                }

            } else {
                const size = 3;
                ctx.fillStyle = '#0f0';
                ctx.fillRect(this.x - size/2, this.y - size/2, size, size);

                if (this.state === 'mining') {
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + (Math.sin(Date.now()*0.05)*5), this.y + 15);
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = `rgba(50, 255, 50, ${Math.random()})`;
                    ctx.stroke();
                }

                if(Math.random() > 0.8) {
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                    ctx.font = '9px monospace';
                    ctx.fillText(this.id.toString(), this.x + 4, this.y - 4);
                }
            }
        }
    }

    for(let i=0; i<NUM_UNITS; i++) units.push(new Unit());

    const latSpan = document.getElementById('lat');
    const lngSpan = document.getElementById('lng');
    const minedSpan = document.getElementById('mined-val');
    const remainingSpan = document.getElementById('remaining-val');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    function updateHUD() {
        if (latSpan) latSpan.innerText = (12.443 + (Date.now() * 0.00001) % 0.1).toFixed(4);
        if (lngSpan) lngSpan.innerText = (44.002 + (Date.now() * 0.00002) % 0.1).toFixed(4);
        
        if (minedSpan) minedSpan.innerText = Math.floor(totalMined).toLocaleString();
        if (remainingSpan) remainingSpan.innerText = Math.floor(availableCap - totalMined).toLocaleString();

        const percent = (totalMined / availableCap) * 100;
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.innerText = `${percent.toFixed(4)}%`;
    }

    let animationId: number;
    function loop() {
        if (!ctx) return;
        ctx.clearRect(0,0,width,height);

        scrollY += GROUND_SPEED;
        if (scrollY >= height) scrollY = 0; 
        const intScrollY = Math.floor(scrollY);

        ctx.drawImage(mapCanvas, 0, intScrollY);
        ctx.drawImage(mapCanvas, 0, intScrollY - height);

        units.forEach(u => {
            u.update();
            u.draw();
        });

        updateHUD();
        animationId = requestAnimationFrame(loop);
    }

    loop();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#020202] text-[#0f0] font-mono">
      <style dangerouslySetInnerHTML={{ __html: `
        .vignette {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, transparent 50%, black 100%);
            z-index: 9;
            pointer-events: none;
        }

        .grid-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                linear-gradient(rgba(0, 50, 0, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 50, 0, 0.1) 1px, transparent 1px);
            background-size: 100px 100px;
            pointer-events: none;
            z-index: 8;
        }

        .hud-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 20;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            pointer-events: none; 
        }

        .top-bar {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #004400;
            padding-bottom: 10px;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 2px;
            background: linear-gradient(to right, rgba(0,20,0,0.8), transparent);
        }

        .blink { animation: blinker 2s linear infinite; }
        @keyframes blinker { 50% { opacity: 0; } }

        .stats-panel {
            position: absolute;
            top: 80px;
            left: 20px;
            background: rgba(0, 10, 0, 0.9);
            border-left: 2px solid #0f0;
            padding: 15px;
            width: 320px;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.05);
            pointer-events: auto;
        }

        .stats-panel h2 {
            margin: 0 0 15px 0;
            font-size: 14px;
            letter-spacing: 1px;
            color: #fff;
            background: #004400;
            padding: 5px;
            text-align: center;
        }

        .data-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 12px;
            border-bottom: 1px solid #002200;
            padding-bottom: 2px;
        }

        .data-label { color: #6fa; text-transform: uppercase; font-size: 11px;}
        .data-val { font-weight: bold; color: #fff; }

        .progress-bar-track {
            height: 6px;
            background: #001100;
            border: 1px solid #004400;
            position: relative;
            margin-top: 5px;
        }
        .progress-bar-fill {
            height: 100%;
            background: #0f0;
            width: 0%;
            transition: width 0.1s linear; 
        }

        .terminal-log {
            position: absolute;
            bottom: 80px;
            left: 20px;
            width: 300px;
            height: 150px;
            overflow: hidden;
            font-size: 11px;
            color: rgba(0, 255, 0, 0.8);
            display: flex;
            flex-direction: column-reverse; 
            text-shadow: 0 0 2px #0f0;
        }
        .log-entry { margin-bottom: 4px; opacity: 0.7; }
        .log-entry.new { color: #fff; font-weight: bold; opacity: 1; }

        .crosshair {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120px;
            height: 120px;
            opacity: 0.6;
        }
        .crosshair-corner {
            position: absolute;
            width: 20px;
            height: 20px;
            border-color: #0f0;
            border-style: solid;
        }
        .tl { top: 0; left: 0; border-width: 2px 0 0 2px; }
        .tr { top: 0; right: 0; border-width: 2px 2px 0 0; }
        .bl { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
        .br { bottom: 0; right: 0; border-width: 0 2px 2px 0; }
        .center-dot {
            position: absolute;
            top: 50%; left: 50%;
            width: 4px; height: 4px;
            background: #0f0;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 5px #fff;
        }

        .coords {
            position: absolute;
            bottom: 20px;
            right: 20px;
            text-align: right;
            font-size: 12px;
            background: rgba(0,0,0,0.6);
            padding: 5px 10px;
            border-right: 2px solid #0f0;
        }
      ` }} />

      {/* Back Button */}
      <Link 
        href="/" 
        className="fixed top-24 left-8 z-[100] px-6 py-2 rounded-none bg-black/80 border-2 border-green-500/50 text-green-500 hover:bg-green-500/10 hover:border-green-500 transition-all flex items-center gap-3 font-mono text-sm uppercase tracking-widest pointer-events-auto group shadow-[0_0_15px_rgba(34,197,94,0.2)]"
      >
        <div className="relative flex items-center justify-center">
          <Power className="w-4 h-4" />
          <div className="absolute inset-0 bg-green-500 blur-sm opacity-0 group-hover:opacity-50 transition-opacity" />
        </div>
        TERMINATE LINK
        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-green-500" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-green-500" />
      </Link>

      <canvas ref={canvasRef} id="sat-feed" className="absolute inset-0 w-full h-full" />
      <div className="grid-overlay" />
      <div className="vignette" />

      <div className="hud-layer">
        <div className="top-bar">
          <div>SAT-LINK: <span className="text-[#0f0]">SECURE_CH_9</span></div>
          <div>FEED: ORBITAL_LIDAR_V4</div>
          <div className="blink text-[#ff3333]">● LIVE</div>
        </div>

        <div className="stats-panel">
          <h2>GENESIS PROTOCOL // COMMAND</h2>
          
          <div className="data-row">
            <span className="data-label">SECTOR:</span>
            <span className="data-val">GENESIS ESTATES</span>
          </div>
          <div className="data-row">
            <span className="data-label">OP STATE:</span>
            <span className="data-val">EXTRACTION_ACTIVE</span>
          </div>
          <div className="data-row">
            <span className="data-label">FLEET SIZE:</span>
            <span className="data-val">UNKNOWN (EST. 1000+)</span>
          </div>

          <br />

          <div className="data-row">
            <span className="data-label">GLOBAL CAP:</span>
            <span className="data-val">5,900,000</span>
          </div>
          <div className="data-row">
            <span className="data-label">DAO RESERVE:</span>
            <span className="data-val">500,000</span>
          </div>
          <div className="data-row">
            <span className="data-label">HARVESTED:</span>
            <span className="data-val" id="mined-val">4,752,000</span>
          </div>
          <div className="data-row">
            <span className="data-label">REMAINING:</span>
            <span className="data-val" id="remaining-val">648,000</span>
          </div>

          <div className="mt-4">
            <div className="data-row">
              <span className="data-label">SEQUENCE COMPLETION</span>
              <span className="data-val" id="progress-text">88.00%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" id="progress-fill" />
            </div>
          </div>
        </div>

        <div className="terminal-log" id="sys-log">
          <div className="log-entry"> &gt; SAT-LINK ESTABLISHED...</div>
          <div className="log-entry"> &gt; SCANNING TERRAIN...</div>
        </div>

        <div className="crosshair">
          <div className="crosshair-corner tl" />
          <div className="crosshair-corner tr" />
          <div className="crosshair-corner bl" />
          <div className="crosshair-corner br" />
          <div className="center-dot" />
        </div>

        <div className="coords">
          <div>LAT: <span id="lat">12.443</span></div>
          <div>LNG: <span id="lng">44.002</span></div>
          <div className="text-[#666] text-[10px] mt-1">ALT: 180km</div>
        </div>
      </div>
    </div>
  );
}
