
(() => {
  // canvases
  const canvases = [document.getElementById('c0'),document.getElementById('c1'),document.getElementById('c2')];
  const ctxs = canvases.map(c=>c.getContext('2d'));

  // UI elements
  const ui = document.getElementById('ui');
  const pinBtn = document.getElementById('pinBtn');
  const toggleUI = document.getElementById('toggleUI');
  const particlesEl = document.getElementById('particles');
  const pcntLabel = document.getElementById('pcnt');
  const speedEl = document.getElementById('speed');
  const speedLabel = document.getElementById('speedv');
  const fadeEl = document.getElementById('fade');
  const fadeLabel = document.getElementById('fadev');
  const btnToggle = document.getElementById('btnToggle');
  const btnReset = document.getElementById('btnReset');
  const btnExport = document.getElementById('btnExport');

  let pinned = false; // pin state for the controls
  let hideTimeout = null;
  const HIDE_DELAY = 2500; // ms of inactivity before hide

  // canvas sizing
  function sizeCanvases(){
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvases.forEach((c,i)=>{
      const rect = c.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      c.width = Math.floor(cssW * ratio);
      c.height = Math.floor(cssH * ratio);
      c.style.width = '100%'; c.style.height = '100%';
      ctxs[i].setTransform(ratio,0,0,ratio,0,0);
      ctxs[i].imageSmoothingEnabled = true;
    });
  }
  sizeCanvases();
  window.addEventListener('resize', ()=>{ sizeCanvases(); });

  // Parameters for Lorenz
  const params = {sigma:10, rho:28, beta:8/3};

  // simulation state stored in typed arrays: [x0,y0,z0,x1,y1,z1,...]
  let particleCount = parseInt(particlesEl.value,10);
  let state = null; // Float32Array
  let colors = null; // Uint8ClampedArray rgb triples

  function allocate(n){
    particleCount = n;
    state = new Float32Array(n*3);
    colors = new Uint8ClampedArray(n*3);
  }

  function seedCluster(){
    // cluster center
    const cx = 0.1, cy = 0, cz = 25;
    for(let i=0;i<particleCount;i++){
      const idx = i*3;
      const r = (Math.random()*1e-3);
      state[idx] = cx + (Math.random()-0.5)*r;
      state[idx+1] = cy + (Math.random()-0.5)*r;
      state[idx+2] = cz + (Math.random()-0.5)*r;
      const h = (i/particleCount)*360;
      const rgb = hslToRgb(h/360,0.75,0.55);
      colors[idx] = rgb[0]; colors[idx+1] = rgb[1]; colors[idx+2] = rgb[2];
    }
  }

  // hsl->rgb
  function hslToRgb(h,s,l){
    let r,g,b;
    if(s==0){r=g=b=l;} else {
      function hue2rgb(p,q,t){
        if(t<0)t+=1; if(t>1)t-=1;
        if(t<1/6) return p+(q-p)*6*t;
        if(t<1/2) return q;
        if(t<2/3) return p+(q-p)*(2/3-t)*6;
        return p;
      }
      const q = l<0.5 ? l*(1+s) : l+s - l*s;
      const p = 2*l - q;
      r = hue2rgb(p,q,h+1/3);
      g = hue2rgb(p,q,h);
      b = hue2rgb(p,q,h-1/3);
    }
    return [Math.round(r*255),Math.round(g*255),Math.round(b*255)];
  }

  function resetSimulation(n){
    allocate(n);
    seedCluster();
    // clear canvases using their css sizes
    canvases.forEach((c,i)=>{
      const rect = c.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      const ctx = ctxs[i];
      ctx.save(); ctx.fillStyle='black'; ctx.globalCompositeOperation='source-over'; ctx.fillRect(0,0,cssW,cssH); ctx.restore();
    });
  }

  resetSimulation(particleCount);

  // RK4 integrator
  function lorenzDeriv(x,y,z){
    return [params.sigma*(y-x), x*(params.rho-z)-y, x*y - params.beta*z];
  }
  function stepRK4(idx, h){
    const i3 = idx*3;
    let x = state[i3], y = state[i3+1], z = state[i3+2];
    const k1 = lorenzDeriv(x,y,z);
    const x2 = x + k1[0]*h*0.5, y2 = y + k1[1]*h*0.5, z2 = z + k1[2]*h*0.5;
    const k2 = lorenzDeriv(x2,y2,z2);
    const x3 = x + k2[0]*h*0.5, y3 = y + k2[1]*h*0.5, z3 = z + k2[2]*h*0.5;
    const k3 = lorenzDeriv(x3,y3,z3);
    const x4 = x + k3[0]*h, y4 = y + k3[1]*h, z4 = z + k3[2]*h;
    const k4 = lorenzDeriv(x4,y4,z4);

    state[i3]   = x + (h/6)*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0]);
    state[i3+1] = y + (h/6)*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1]);
    state[i3+2] = z + (h/6)*(k1[2] + 2*k2[2] + 2*k3[2] + k4[2]);
  }

  // render loop
  let paused = false;
  let last = performance.now();

  function render(now){
    const dtMs = Math.min(50, now - last);
    last = now;
    if(!paused){
      const speed = parseFloat(speedEl.value);
      const steps = Math.max(1, Math.round((dtMs/16) * speed*1.5));
      const h = 0.01 * (speed*0.9);
      for(let s=0;s<steps;s++){
        for(let i=0;i<particleCount;i++) stepRK4(i,h);
      }

      // fade overlay
      const fadeAlpha = parseFloat(fadeEl.value);
      fadeLabel.textContent = fadeEl.value;
      const rects = canvases.map(c=>c.getBoundingClientRect());
      for(let ci=0;ci<canvases.length;ci++){
        const ctx = ctxs[ci];
        const cssW = Math.max(1, Math.floor(rects[ci].width));
        const cssH = Math.max(1, Math.floor(rects[ci].height));
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`; ctx.fillRect(0,0,cssW, cssH); ctx.restore();
      }

      // draw particles
      for(let i=0;i<particleCount;i++){
        const idx = i*3; const x = state[idx], y = state[idx+1], z = state[idx+2];
        const r = colors[idx], g = colors[idx+1], b = colors[idx+2];

        const r0 = canvases[0].getBoundingClientRect();
        drawPoint(ctxs[0], mapXY(x,y, r0.width, r0.height), r,g,b, 0.95);
        const r1 = canvases[1].getBoundingClientRect();
        drawPoint(ctxs[1], mapXZ(x,z, r1.width, r1.height), r,g,b, 0.9);
        const r2 = canvases[2].getBoundingClientRect();
        drawPoint(ctxs[2], mapYZ(y,z, r2.width, r2.height), r,g,b, 0.9);
      }
    }

    pcntLabel.textContent = particleCount;
    speedLabel.textContent = speedEl.value;
    window.requestAnimationFrame(render);
  }

  // mapping functions
  function mapXY(x,y,cw,ch){
    const scale = Math.min(cw, ch) / 60;
    const cx = cw/2, cy = ch/2;
    return {x: cx + x*scale, y: cy - y*scale};
  }
  function mapXZ(x,z,cw,ch){
    // shift down by 1/3 of canvas height to lower cloud
    const scale = Math.min(cw, ch) / 60;
    const cx = cw/2, cy = ch/2 + (ch/3);
    return {x: cx + x*scale, y: cy - z*scale};
  }
  function mapYZ(y,z,cw,ch){
    const scale = Math.min(cw, ch) / 60;
    const cx = cw/2, cy = ch/2 + (ch/3);
    return {x: cx + y*scale, y: cy - z*scale};
  }

  function drawPoint(ctx,pos,r,g,b, alpha){
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`; ctx.fillRect(pos.x-0.6, pos.y-0.6, 1.2, 1.2); ctx.restore();
  }

  // UI wiring + auto-hide
  particlesEl.addEventListener('input', (e)=>{ pcntLabel.textContent = parseInt(e.target.value,10); });
  particlesEl.addEventListener('change', (e)=>{ resetSimulation(Math.max(100, Math.min(3000, parseInt(e.target.value,10)))); });
  speedEl.addEventListener('input', (e)=>{ speedLabel.textContent = e.target.value; });
  fadeEl.addEventListener('input', (e)=>{ fadeLabel.textContent = e.target.value; });

  btnToggle.addEventListener('click', ()=>{ paused = !paused; btnToggle.textContent = paused ? 'Resume' : 'Pause'; });
  btnReset.addEventListener('click', ()=>{ resetSimulation(parseInt(particlesEl.value,10)); });

  btnExport.addEventListener('click', ()=>{
    const tmp = document.createElement('canvas'); tmp.width = window.innerWidth; tmp.height = window.innerHeight;
    const tctx = tmp.getContext('2d');
    const leftW = Math.floor(tmp.width*2/3);
    const rightW = tmp.width - leftW;
    tctx.drawImage(canvases[0], 0, 0, leftW, tmp.height);
    tctx.drawImage(canvases[1], leftW, 0, rightW, Math.floor(tmp.height/2));
    tctx.drawImage(canvases[2], leftW, Math.floor(tmp.height/2), rightW, Math.ceil(tmp.height/2));
    const link = document.createElement('a'); link.href = tmp.toDataURL('image/png'); link.download = 'chaos-visualization.png'; link.click();
  });

  // auto-hide logic
  function showUI(){
    if(!ui.classList.contains('hidden')) return;
    ui.classList.remove('hidden');
    toggleUI.textContent = 'Hide';
  }
  function hideUI(){
    if(pinned) return;
    ui.classList.add('hidden');
    toggleUI.textContent = 'Show';
  }
  function resetHideTimer(){
    if(hideTimeout) clearTimeout(hideTimeout);
    if(!pinned) hideTimeout = setTimeout(hideUI, HIDE_DELAY);
  }

  // show on mouse move, hide after delay
  window.addEventListener('mousemove', ()=>{ showUI(); resetHideTimer(); });
  window.addEventListener('touchstart', ()=>{ showUI(); resetHideTimer(); });

  // clicking toggle explicitly hides/shows immediately
  toggleUI.addEventListener('click', ()=>{
    if(ui.classList.contains('hidden')){ showUI(); resetHideTimer(); } else { hideUI(); }
  });
  pinBtn.addEventListener('click', ()=>{
    pinned = !pinned;
    pinBtn.textContent = pinned ? '📌' : '📍';
    if(pinned) showUI(); else resetHideTimer();
  });

  // initial hide after delay
  resetHideTimer();

  // init black backgrounds
  canvases.forEach((c,i)=>{ const rect = c.getBoundingClientRect(); const cssW = Math.max(1, Math.floor(rect.width)); const cssH = Math.max(1, Math.floor(rect.height)); ctxs[i].fillStyle='black'; ctxs[i].fillRect(0,0,cssW,cssH); });

  // start
  requestAnimationFrame(render);

  // performance watch
  (function perfWatch(){ let lastTime = performance.now(); let ticks = 0; function tick(){ const now = performance.now(); ticks++; if(now-lastTime>1000){ const fpsNow = ticks/((now-lastTime)/1000); ticks = 0; lastTime = now; if(fpsNow < 30 && particleCount>600){ const newCount = Math.max(300, Math.floor(particleCount * 0.85)); particlesEl.value = newCount; resetSimulation(newCount); } } requestAnimationFrame(tick); } tick(); })();

})();