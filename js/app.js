// app.js: screens, photo loading, clothing slots, dragging and saving.
'use strict';
(function(){
  const $ = (id) => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  const ORDER = ['shoes', 'pants', 'top', 'hat'];           // drawn back to front
  const st = { photo: null, pts: null, g: {}, sel: null, ptsMode: false, demo: false, sheetSlot: null };

  // ---------- helpers ----------
  let pillTimer = 0;
  function pill(text, ms){
    const p = $('pill'); clearTimeout(pillTimer);
    if (!text){ p.classList.add('hidden'); return; }
    p.textContent = text; p.classList.remove('hidden');
    if (ms) pillTimer = setTimeout(() => p.classList.add('hidden'), ms);
  }
  function render(clean){
    if (!st.photo) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(st.photo, 0, 0);
    for (const s of ORDER) if (st.g[s]) CB.drawGarment(ctx, st.g[s], st.pts);
    if (st.ptsMode && !clean) drawPoints();
  }
  function drawPoints(){
    const P = st.pts, k = cv.width / cv.getBoundingClientRect().width;
    ctx.lineWidth = 3 * k; ctx.strokeStyle = 'rgba(108,78,245,.85)'; ctx.lineCap = 'round';
    for (const [a, b] of CB.BONES){ ctx.beginPath(); ctx.moveTo(P[a].x, P[a].y); ctx.lineTo(P[b].x, P[b].y); ctx.stroke(); }
    for (const hd of CB.HANDLES){
      const p = CB.handlePos(P, hd);
      ctx.beginPath(); ctx.arc(p.x, p.y, 11 * k, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.lineWidth = 4 * k; ctx.strokeStyle = '#ff5c8a'; ctx.stroke();
    }
  }

  // ---------- photo ----------
  async function setPhoto(canvas, pts, status){
    st.photo = canvas; cv.width = canvas.width; cv.height = canvas.height;
    st.pts = pts; st.ptsMode = status !== 'found'; $('ptsBtn').classList.toggle('on', st.ptsMode);
    $('overlay').classList.add('hidden');
    render();
    pill(CB.t(status === 'demo' ? 'demoNote' : status), status === 'found' ? 3500 : 7000);
  }
  async function loadPhoto(file){
    if (!file) return;
    st.demo = false;
    const canvas = await CB.loadCanvas(file, 1400);
    st.photo = canvas; cv.width = canvas.width; cv.height = canvas.height; st.pts = CB.template(canvas.width, canvas.height);
    $('overlay').classList.add('hidden'); render(); pill(CB.t('loading'));
    const res = await CB.detect(canvas);
    setPhoto(canvas, res.pts, res.status);
  }
  function loadDemo(){
    st.demo = true;
    const d = CB.drawDemoKid();
    setPhoto(d.canvas, d.pts, 'demo'); st.ptsMode = false; $('ptsBtn').classList.remove('on'); render();
  }

  // ---------- clothing ----------
  async function addGarment(slot, src){
    const raw = await CB.loadCanvas(src, 900);
    const g = { slot, raw, tol: 38 };
    const c = CB.cutout(raw, g.tol); g.cut = c.canvas; g.hadAlpha = c.hadAlpha;
    g.t = CB.defaults(slot, g.cut.height / g.cut.width);
    st.g[slot] = g; closeSheet(); select(slot); refreshSlots(); render();
  }
  function refreshSlots(){
    document.querySelectorAll('.slot').forEach((b) => {
      const g = st.g[b.dataset.slot], th = b.querySelector('.th');
      b.classList.toggle('full', !!g); b.classList.toggle('sel', st.sel === b.dataset.slot);
      th.style.backgroundImage = g ? `url(${thumb(g.cut)})` : '';
      th.textContent = g ? ' ' : '';
    });
  }
  function thumb(c){
    const k = 96 / Math.max(c.width, c.height), t = document.createElement('canvas');
    t.width = Math.max(1, c.width * k); t.height = Math.max(1, c.height * k);
    t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); return t.toDataURL();
  }
  function select(slot){
    st.sel = slot; const g = slot && st.g[slot];
    $('adjust').classList.toggle('hidden', !g); document.body.classList.toggle('adjusting', !!g);
    if (g){
      $('adjName').textContent = CB.t(slot);
      $('lblH').textContent = CB.t(slot === 'pants' ? 'length' : 'height');
      $('sScale').value = g.t.scale; $('sW').value = g.t.sx; $('sH').value = g.t.sy; $('sRot').value = g.t.rot; $('sTol').value = g.tol;
      $('sTol').disabled = g.hadAlpha; $('sTol').parentElement.style.opacity = g.hadAlpha ? 0.4 : 1;
      $('pairBtn').classList.toggle('hidden', slot !== 'shoes'); $('pairBtn').classList.toggle('on', g.t.pair);
      $('flipBtn').classList.toggle('on', g.t.flip);
    }
    refreshSlots(); requestAnimationFrame(() => render());
  }
  const cur = () => st.sel && st.g[st.sel];
  function openSheet(slot){
    st.sheetSlot = slot;
    $('sheetTitle').textContent = CB.t('addFor') + ' ' + CB.t(slot).toLowerCase();
    const row = $('sampleRow'); row.textContent = '';
    CB.SAMPLES[slot].forEach((url) => {
      const b = document.createElement('button'); b.style.backgroundImage = `url("${url}")`; b.setAttribute('aria-label', CB.t(slot));
      b.onclick = () => addGarment(slot, url); row.appendChild(b);
    });
    $('sheet').classList.remove('hidden'); $('scrim').classList.remove('hidden');
  }
  function closeSheet(){ $('sheet').classList.add('hidden'); $('scrim').classList.add('hidden'); }

  // ---------- pointer: drag points, or move / pinch the selected clothing ----------
  const ptrs = new Map(); let drag = null;
  const toPhoto = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  cv.addEventListener('pointerdown', (e) => {
    if (!st.photo) return;
    cv.setPointerCapture(e.pointerId); const p = toPhoto(e); ptrs.set(e.pointerId, p);
    if (st.ptsMode){
      const k = cv.width / cv.getBoundingClientRect().width; let best = null, bd = 34 * k;
      for (const hd of CB.HANDLES){ const q = CB.handlePos(st.pts, hd), d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd){ bd = d; best = hd; } }
      drag = best ? { kind: 'pt', hd: best, last: p } : null;
    } else if (cur()){
      if (ptrs.size === 2){ const [a, b] = [...ptrs.values()]; drag = { kind: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), a: Math.atan2(b.y - a.y, b.x - a.x), scale: cur().t.scale, rot: cur().t.rot }; }
      else drag = { kind: 'move', last: p };
    }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId) || !drag) return;
    const p = toPhoto(e); ptrs.set(e.pointerId, p);
    if (drag.kind === 'pt'){
      const dx = p.x - drag.last.x, dy = p.y - drag.last.y; drag.last = p;
      for (const i of drag.hd.move){ st.pts[i].x += dx; st.pts[i].y += dy; }
    } else if (drag.kind === 'move' && ptrs.size === 1){
      const S = CB.frame(st.pts).S, g = cur();
      g.t.dx += (p.x - drag.last.x) / S; g.t.dy += (p.y - drag.last.y) / S; drag.last = p;
    } else if (drag.kind === 'pinch' && ptrs.size === 2){
      const [a, b] = [...ptrs.values()], g = cur();
      g.t.scale = Math.min(2, Math.max(0.5, drag.scale * Math.hypot(a.x - b.x, a.y - b.y) / drag.d));
      g.t.rot = Math.max(-45, Math.min(45, drag.rot + (Math.atan2(b.y - a.y, b.x - a.x) - drag.a) * 180 / Math.PI));
      $('sScale').value = g.t.scale; $('sRot').value = g.t.rot;
    }
    render();
  });
  const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size === 0) drag = null; else if (drag && drag.kind === 'pinch') drag = { kind: 'move', last: [...ptrs.values()][0] }; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', (e) => { const g = cur(); if (!g || st.ptsMode) return; e.preventDefault();
    g.t.scale = Math.min(2, Math.max(0.5, g.t.scale * (e.deltaY < 0 ? 1.04 : 0.96))); $('sScale').value = g.t.scale; render(); }, { passive: false });

  // ---------- controls ----------
  const bind = (id, fn) => $(id).addEventListener('input', (e) => { const g = cur(); if (g){ fn(g, +e.target.value); render(); } });
  bind('sScale', (g, v) => g.t.scale = v); bind('sW', (g, v) => g.t.sx = v); bind('sH', (g, v) => g.t.sy = v); bind('sRot', (g, v) => g.t.rot = v);
  $('sTol').addEventListener('change', (e) => { const g = cur(); if (!g) return; g.tol = +e.target.value; g.cut = CB.cutout(g.raw, g.tol).canvas; refreshSlots(); render(); });
  $('flipBtn').onclick = () => { const g = cur(); g.t.flip = !g.t.flip; select(st.sel); };
  $('pairBtn').onclick = () => { const g = cur(); g.t.pair = !g.t.pair; select(st.sel); };
  $('resetBtn').onclick = () => { const g = cur(); g.t = CB.defaults(g.slot, g.cut.height / g.cut.width); select(st.sel); };
  $('delBtn').onclick = () => { delete st.g[st.sel]; select(null); };
  $('doneBtn').onclick = () => select(null);
  document.querySelectorAll('.slot').forEach((b) => b.onclick = () => {
    const s = b.dataset.slot;
    if (!st.g[s]) openSheet(s); else if (st.sel === s) openSheet(s); else select(s);
  });
  $('sheetClose').onclick = closeSheet; $('scrim').onclick = closeSheet;
  $('gUpload').onclick = () => $('fGar').click(); $('gCamera').onclick = () => $('fGarCam').click();
  const onGar = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) addGarment(st.sheetSlot, f); };
  $('fGar').onchange = onGar; $('fGarCam').onchange = onGar;
  $('oUpload').onclick = () => $('fPhoto').click(); $('oCamera').onclick = () => $('fPhotoCam').click();
  const onPhoto = (e) => { const f = e.target.files[0]; e.target.value = ''; loadPhoto(f); };
  $('fPhoto').onchange = onPhoto; $('fPhotoCam').onchange = onPhoto;
  $('oDemo').onclick = loadDemo;
  $('homeBtn').onclick = () => { select(null); $('overlay').classList.remove('hidden'); pill(''); };
  $('ptsBtn').onclick = () => { st.ptsMode = !st.ptsMode; $('ptsBtn').classList.toggle('on', st.ptsMode); if (st.ptsMode){ select(null); pill(CB.t('ptsOn'), 6000); } else pill(''); render(); };
  const swap = () => { CB.setLang(CB.lang() === 'ms' ? 'en' : 'ms'); if (st.sel) select(st.sel); };
  $('langBtn').onclick = swap; $('oLang').onclick = swap;
  $('saveBtn').onclick = () => {
    if (!st.photo) return;
    render(true);
    cv.toBlob((blob) => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cuba-baju.png'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000); render(); pill(CB.t('saved'), 2500);
    }, 'image/png');
  };
  addEventListener('resize', () => render());

  CB.applyText(); refreshSlots();
  CB.state = st; CB.render = render; CB.addGarment = addGarment; CB.loadDemo = loadDemo; CB.setPhoto = setPhoto;   // for testing
  if (new URLSearchParams(location.search).has('demo')) loadDemo();
})();
