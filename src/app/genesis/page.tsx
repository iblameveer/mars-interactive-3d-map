"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function GenesisProtocolPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const minedSpanRef = useRef<HTMLSpanElement>(null);
  const remainingSpanRef = useRef<HTMLSpanElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const latSpanRef = useRef<HTMLSpanElement>(null);
  const lngSpanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mapCanvas = document.createElement('canvas');
    mapCanvasRef.current = mapCanvas;
    const mapCtx = mapCanvas.getContext('2d');
    if (!mapCtx) return;

    let width: number, height: number;
    let scrollY = 0;
    const GROUND_SPEED = 0.5;

    let totalMined = 4752000;
    const totalCap = 5900000;
    const reserved = 500000;
    const availableCap = totalCap - reserved;

    function resize() {
      width = window.innerWidth;
      height = Math.ceil(window.innerHeight);
      
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
      
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
          drawFn(0, 0); 
          drawFn(0, -h); 
          drawFn(0, h);  
          drawFn(-w, 0); 
          drawFn(w, 0);  
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

    function addLog(msg: string) {
      if (!logContainerRef.current) return;
      const el = document.createElement('div');
      el.className = 'log-entry new';
      el.style.marginBottom = '4px';
      el.style.opacity = '1';
      el.style.color = '#fff';
      el.style.fontWeight = 'bold';
      el.innerText = `> ${msg}`;
      logContainerRef.current.prepend(el);
      if(logContainerRef.current.children.length > 8) logContainerRef.current.lastElementChild?.remove();
      setTimeout(() => {
        el.style.color = 'rgba(0, 255, 0, 0.8)';
        el.style.fontWeight = 'normal';
        el.style.opacity = '0.7';
      }, 500);
    }

    class Unit {
      id: number = 0;
      formattedId: string = '';
      isHeavy: boolean = false;
      x: number = 0;
      y: number = 0;
      tx: number = 0;
      ty: number = 0;
      state: 'mining' | 'moving' = 'moving';
      speed: number = 0;
      timer: number = 0;
      spark?: {x: number, y: number, age: number};

      constructor() {
          this.reset();
          this.y = Math.random() * (height || 800); 
      }

      reset() {
          this.id = Math.floor(Math.random() * 1000) + 1; 
          this.formattedId = `UNIT-${this.id.toString().padStart(3, '0')}`;
          this.isHeavy = Math.random() < 0.05; 
          
          this.x = Math.random() * (width || 1200);
          this.y = -50; 
          
          if(this.isHeavy) {
              this.tx = this.x; 
              this.ty = this.y;
              this.state = 'mining';
          } else {
              this.tx = Math.random() * (width || 1200);
              this.ty = Math.random() * (height || 800);
              this.state = 'moving';
          }

          this.speed = this.isHeavy ? 0 : (0.2 + Math.random() * 0.5);
          this.timer = 0;
      }

      update() {
          this.y += GROUND_SPEED;

          if(this.y > (height || 800) + 50) {
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
                      this.tx = Math.random() * (width || 1200);
                      this.ty = Math.random() * (height || 800);
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

    const units: Unit[] = [];
    resize();
    for(let i=0; i<20; i++) units.push(new Unit());

    function updateHUD() {
      if (latSpanRef.current) latSpanRef.current.innerText = (12.443 + (Date.now() * 0.00001) % 0.1).toFixed(4);
      if (lngSpanRef.current) lngSpanRef.current.innerText = (44.002 + (Date.now() * 0.00002) % 0.1).toFixed(4);
      
      if (minedSpanRef.current) minedSpanRef.current.innerText = Math.floor(totalMined).toLocaleString();
      if (remainingSpanRef.current) remainingSpanRef.current.innerText = Math.floor(availableCap - totalMined).toLocaleString();

      const percent = (totalMined / availableCap) * 100;
      if (progressFillRef.current) progressFillRef.current.style.width = `${percent}%`;
      if (progressTextRef.current) progressTextRef.current.innerText = `${percent.toFixed(4)}%`;
    }

    let animationFrameId: number;
    function loop() {
      if (!ctx || !canvas) return;
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
      animationFrameId = requestAnimationFrame(loop);
    }

    loop();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#020202] overflow-hidden font-mono text-[#0f0]">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-[1]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle,transparent_50%,black_100%)] z-[9] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(0,50,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,50,0,0.1)_1px,transparent_1px)] bg-[length:100px_100px] pointer-events-none z-[8]" />

      <button 
        onClick={() => router.push('/')}
        className="pointer-events-auto absolute top-12 right-5 z-[30] px-4 py-2 border border-[#ff3333] text-[#ff3333] bg-black/80 hover:bg-[#ff3333] hover:text-white transition-all duration-300 flex items-center gap-3 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-[#ff3333]/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
        <span className="text-[10px] tracking-[3px] font-black relative z-10">TERMINATE_UPLINK</span>
        <div className="w-5 h-5 border border-[#ff3333] relative z-10 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
          <div className="w-2 h-[1px] bg-[#ff3333] rotate-45 absolute group-hover:bg-white" />
          <div className="w-2 h-[1px] bg-[#ff3333] -rotate-45 absolute group-hover:bg-white" />
        </div>
        <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-[#ff3333]" />
        <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-[#ff3333]" />
        <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-[#ff3333]" />
        <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-[#ff3333]" />
      </button>

      <div className="absolute top-0 left-0 w-full h-full z-[20] p-5 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between border-b border-[#004400] pb-2.5 uppercase text-[12px] tracking-[2px] bg-[linear-gradient(to_right,rgba(0,20,0,0.8),transparent)]">
          <div>SAT-LINK: <span className="text-[#0f0]">SECURE_CH_9</span></div>
          <div className="mr-48">FEED: ORBITAL_LIDAR_V4</div>
          <div className="animate-pulse text-[#ff3333]">● LIVE</div>
        </div>

        <div className="absolute top-20 left-5 bg-[rgba(0,10,0,0.9)] border-l-2 border-[#0f0] p-[15px] w-[320px] shadow-[0_0_15px_rgba(0,255,0,0.05)] pointer-events-auto">
          <h2 className="m-0 mb-[15px] text-[14px] tracking-[1px] text-white bg-[#004400] p-[5px] text-center">GENESIS PROTOCOL // COMMAND</h2>
          
          {[
            { label: 'SECTOR:', value: 'GENESIS ESTATES' },
            { label: 'OP STATE:', value: 'EXTRACTION_ACTIVE' },
            { label: 'FLEET SIZE:', value: 'UNKNOWN (EST. 1000+)' },
          ].map((row, i) => (
            <div key={i} className="flex justify-between mb-1.5 text-[12px] border-b border-[#002200] pb-[2px]">
              <span className="text-[#6fa] uppercase text-[11px]">{row.label}</span>
              <span className="font-bold text-white">{row.value}</span>
            </div>
          ))}

          <br />

          {[
            { label: 'GLOBAL CAP:', value: '5,900,000' },
            { label: 'DAO RESERVE:', value: '500,000' },
            { label: 'HARVESTED:', value: '4,752,000', ref: minedSpanRef },
            { label: 'REMAINING:', value: '648,000', ref: remainingSpanRef },
          ].map((row, i) => (
            <div key={i} className="flex justify-between mb-1.5 text-[12px] border-b border-[#002200] pb-[2px]">
              <span className="text-[#6fa] uppercase text-[11px]">{row.label}</span>
              <span className="font-bold text-white" ref={row.ref as any}>{row.value}</span>
            </div>
          ))}

          <div className="mt-[15px]">
            <div className="flex justify-between mb-1.5 text-[12px] border-b border-[#002200] pb-[2px]">
              <span className="text-[#6fa] uppercase text-[11px]">SEQUENCE COMPLETION</span>
              <span className="font-bold text-white" ref={progressTextRef}>88.00%</span>
            </div>
            <div className="h-1.5 bg-[#001100] border border-[#004400] relative mt-[5px]">
              <div ref={progressFillRef} className="h-full bg-[#0f0] w-0 transition-[width] duration-100 ease-linear" />
            </div>
          </div>
        </div>

        <div ref={logContainerRef} className="absolute bottom-20 left-5 w-[300px] h-[150px] overflow-hidden text-[11px] text-[rgba(0,255,0,0.8)] flex flex-col-reverse shadow-[0_0_2px_#0f0]" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] opacity-60 pointer-events-none">
          <div className="absolute w-5 h-5 border-[#0f0] border-t-2 border-l-2 top-0 left-0" />
          <div className="absolute w-5 h-5 border-[#0f0] border-t-2 border-r-2 top-0 right-0" />
          <div className="absolute w-5 h-5 border-[#0f0] border-b-2 border-l-2 bottom-0 left-0" />
          <div className="absolute w-5 h-5 border-[#0f0] border-b-2 border-r-2 bottom-0 right-0" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-[#0f0] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_5px_#fff]" />
        </div>

        <div className="absolute bottom-5 right-5 text-right text-[12px] bg-[rgba(0,0,0,0.6)] p-1.25 px-2.5 border-r-2 border-[#0f0]">
          <div>LAT: <span ref={latSpanRef}>12.443</span></div>
          <div>LNG: <span ref={lngSpanRef}>44.002</span></div>
          <div className="text-[#666] text-[10px] mt-0.5">ALT: 180km</div>
        </div>
      </div>
    </div>
  );
}
