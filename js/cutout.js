// cutout.js: load a clothing picture and remove its plain background, all on this device.
'use strict';
(function(){
  CB.loadCanvas = async (src, max) => {
    let bmp;
    if (typeof src === 'string'){
      const im = new Image(); im.src = src; await im.decode(); bmp = im;
    } else {
      try { bmp = await createImageBitmap(src, { imageOrientation: 'from-image' }); }
      catch (e) { const im = new Image(); im.src = URL.createObjectURL(src); await im.decode(); bmp = im; }
    }
    const w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight;
    const k = Math.min(1, max / Math.max(w0, h0));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return c;
  };

  // Returns { canvas, hadAlpha }. Pixels joined to the picture's edge and close to the edge colour become transparent.
  CB.cutout = (src, tol) => {
    const w = src.width, h = src.height, n = w * h;
    const id = src.getContext('2d').getImageData(0, 0, w, h), d = id.data;
    let clear = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 200) clear++;
    const hadAlpha = clear > n * 0.02;
    if (!hadAlpha && tol > 0){
      const rs = [], gs = [], bs = [];
      const edge = (x, y) => { const i = (y * w + x) * 4; rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]); };
      for (let x = 0; x < w; x += 2){ edge(x, 0); edge(x, h - 1); }
      for (let y = 0; y < h; y += 2){ edge(0, y); edge(w - 1, y); }
      const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
      const br = med(rs), bg = med(gs), bb = med(bs), t2 = tol * tol * 3;
      const near = (p) => { const i = p * 4, dr = d[i] - br, dg = d[i + 1] - bg, db = d[i + 2] - bb; return dr * dr + dg * dg + db * db <= t2; };
      const gone = new Uint8Array(n), stack = new Int32Array(n); let sp = 0;
      const push = (p) => { if (!gone[p] && near(p)){ gone[p] = 1; stack[sp++] = p; } };
      for (let x = 0; x < w; x++){ push(x); push((h - 1) * w + x); }
      for (let y = 0; y < h; y++){ push(y * w); push(y * w + w - 1); }
      while (sp){
        const p = stack[--sp], x = p % w;
        if (x > 0) push(p - 1); if (x < w - 1) push(p + 1);
        if (p >= w) push(p - w); if (p < n - w) push(p + w);
      }
      for (let p = 0; p < n; p++){
        if (gone[p]) d[p * 4 + 3] = 0;
        else {
          const x = p % w;
          const e = (x > 0 && gone[p - 1]) || (x < w - 1 && gone[p + 1]) || (p >= w && gone[p - w]) || (p < n - w && gone[p + w]);
          if (e) d[p * 4 + 3] = 150;                       // soften the cut edge
        }
      }
    }
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 24){
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < x0){ x0 = 0; y0 = 0; x1 = w - 1; y1 = h - 1; }      // everything removed: keep the frame
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; tmp.getContext('2d').putImageData(id, 0, 0);
    const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    out.getContext('2d').drawImage(tmp, -x0, -y0);
    return { canvas: out, hadAlpha };
  };
})();
