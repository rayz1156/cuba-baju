// samples.js: built-in example clothes (original SVG drawings) and the example child drawing.
'use strict';
(function(){
  const svg = (w, h, body) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 3}" height="${h * 3}" viewBox="0 0 ${w} ${h}">${body}</svg>`);
  CB.SAMPLES = {
    hat: [
      svg(200, 120, '<path d="M30 92C30 40 60 10 100 10s70 30 70 82z" fill="#ffbe1a" stroke="#b97f00" stroke-width="4"/><path d="M14 92h172c8 0 8 18-4 18H18c-12 0-12-18-4-18z" fill="#ff8a1a" stroke="#b95a00" stroke-width="4"/><circle cx="100" cy="12" r="7" fill="#ff8a1a"/>'),
      svg(200, 110, '<path d="M40 100C36 50 60 12 100 12s64 38 60 88z" fill="#ff5c8a" stroke="#b8305a" stroke-width="4"/><rect x="32" y="84" width="136" height="22" rx="10" fill="#fff" stroke="#b8305a" stroke-width="4"/><circle cx="100" cy="12" r="11" fill="#fff" stroke="#b8305a" stroke-width="4"/>'),
    ],
    top: [
      svg(200, 170, '<path d="M66 8c10 16 58 16 68 0l58 28-20 40-26-10v96H54V66L28 76 8 36z" fill="#ff7a59" stroke="#b5452a" stroke-width="4" stroke-linejoin="round"/><path d="M54 92h92M54 112h92" stroke="#fff" stroke-width="9"/>'),
      svg(200, 170, '<path d="M66 8c10 16 58 16 68 0l58 28-20 40-26-10v96H54V66L28 76 8 36z" fill="#34c3a0" stroke="#1c7d66" stroke-width="4" stroke-linejoin="round"/><circle cx="100" cy="100" r="24" fill="#ffe27a"/><path d="M90 96h.1M110 96h.1" stroke="#2a2156" stroke-width="7" stroke-linecap="round"/><path d="M90 108q10 9 20 0" stroke="#2a2156" stroke-width="4" fill="none" stroke-linecap="round"/>'),
      svg(200, 250, '<path d="M72 8c8 14 48 14 56 0l34 18-14 30-14-6 46 192H20L66 50l-14 6-14-30z" fill="#b085f5" stroke="#6a3fc0" stroke-width="4" stroke-linejoin="round"/><path d="M60 92h80" stroke="#fff" stroke-width="8"/>'),
    ],
    pants: [
      svg(200, 150, '<path d="M14 6h172l8 138H112l-12-78-12 78H6z" fill="#3b82f6" stroke="#1e4fae" stroke-width="4" stroke-linejoin="round"/><path d="M14 22h172" stroke="#1e4fae" stroke-width="4"/>'),
      svg(200, 300, '<path d="M22 6h156l12 288h-66L100 96 76 294H10z" fill="#5b6b8c" stroke="#333f58" stroke-width="4" stroke-linejoin="round"/><path d="M22 24h156" stroke="#333f58" stroke-width="4"/>'),
    ],
    shoes: [
      svg(200, 110, '<path d="M196 30v52c0 8-6 12-14 12H22C6 94 2 80 10 70c12-14 44-10 70-26 12-8 22-22 30-30 18 14 56 22 86 16z" fill="#ff5c5c" stroke="#a92e2e" stroke-width="4" stroke-linejoin="round"/><path d="M6 84h190" stroke="#fff" stroke-width="12"/><path d="M92 40l14 12M106 28l14 12" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'),
      svg(200, 110, '<path d="M196 30v52c0 8-6 12-14 12H22C6 94 2 80 10 70c12-14 44-10 70-26 12-8 22-22 30-30 18 14 56 22 86 16z" fill="#2a8be0" stroke="#17538c" stroke-width="4" stroke-linejoin="round"/><path d="M6 84h190" stroke="#ffe27a" stroke-width="12"/>'),
    ],
  };

  // Toddler proportions, normalised to the picture. Index = MediaPipe pose landmark index.
  // The child faces the camera, so its left side (odd indices) is on the picture's right.
  const T = { 0:[.5,.19], 2:[.535,.165], 5:[.465,.165], 7:[.585,.175], 8:[.415,.175],
    11:[.615,.34], 12:[.385,.34], 13:[.675,.46], 14:[.325,.46], 15:[.695,.57], 16:[.305,.57],
    23:[.57,.585], 24:[.43,.585], 25:[.575,.745], 26:[.425,.745], 27:[.58,.895], 28:[.42,.895],
    29:[.575,.925], 30:[.425,.925], 31:[.605,.94], 32:[.395,.94] };
  CB.template = (w, h) => {
    const s = Math.min(w / 0.62, h), ox = (w - s) / 2, oy = (h - s) / 2, P = [];
    for (const k in T) P[k] = { x: ox + T[k][0] * s, y: oy + T[k][1] * s };
    return P;
  };
  // A simple original cartoon child standing in a vest and shorts, drawn to match the template.
  CB.drawDemoKid = () => {
    const c = document.createElement('canvas'); c.width = 720; c.height = 1080;
    const g = c.getContext('2d'), P = CB.template(c.width, c.height);
    const grad = g.createLinearGradient(0, 0, 0, c.height); grad.addColorStop(0, '#fdf3d7'); grad.addColorStop(1, '#f6e2b8');
    g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#e8cf9c'; g.fillRect(0, c.height * 0.9, c.width, c.height * 0.1);
    const S = Math.hypot(P[11].x - P[12].x, P[11].y - P[12].y);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const limb = (a, b, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); };
    const skin = '#f2c29b';
    [[11,13],[13,15],[12,14],[14,16]].forEach(([a,b]) => limb(P[a], P[b], S * 0.26, skin));
    [[23,25],[25,27],[24,26],[26,28]].forEach(([a,b]) => limb(P[a], P[b], S * 0.34, skin));
    [[29,31],[30,32]].forEach(([a,b]) => limb(P[a], P[b], S * 0.2, skin));
    g.fillStyle = '#fff'; g.strokeStyle = '#d9d2c2'; g.lineWidth = 4;   // vest
    g.beginPath(); g.moveTo(P[12].x - S * 0.1, P[12].y - S * 0.1); g.lineTo(P[11].x + S * 0.1, P[11].y - S * 0.1);
    g.lineTo(P[23].x + S * 0.16, P[23].y + S * 0.05); g.lineTo(P[24].x - S * 0.16, P[24].y + S * 0.05); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#e9e4f7';                                              // shorts
    g.beginPath(); g.moveTo(P[24].x - S * 0.2, P[24].y - S * 0.08); g.lineTo(P[23].x + S * 0.2, P[23].y - S * 0.08);
    g.lineTo(P[23].x + S * 0.22, P[23].y + S * 0.3); g.lineTo(P[24].x - S * 0.22, P[24].y + S * 0.3); g.closePath(); g.fill(); g.stroke();
    const hc = { x: (P[7].x + P[8].x) / 2, y: P[7].y - S * 0.02 }, hr = S * 0.42;
    limb({ x: hc.x, y: hc.y + hr * 0.8 }, { x: hc.x, y: P[11].y - S * 0.05 }, S * 0.2, skin);
    g.fillStyle = skin; g.beginPath(); g.arc(hc.x, hc.y, hr, 0, 7); g.fill();
    g.fillStyle = '#4a342a'; g.beginPath(); g.arc(hc.x, hc.y - hr * 0.2, hr * 1.02, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    g.fillStyle = '#2a2156'; [2, 5].forEach((i) => { g.beginPath(); g.arc(P[i].x, P[i].y + S * 0.05, S * 0.03, 0, 7); g.fill(); });
    g.strokeStyle = '#b5553f'; g.lineWidth = 5; g.beginPath(); g.arc(hc.x, hc.y + hr * 0.3, hr * 0.3, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    return { canvas: c, pts: P };
  };
})();
