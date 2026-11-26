// fit.js: place each piece of clothing on the body from the pose points, then warp its picture onto the photo.
// Every fit returns meshes: { src: rows of {u,v} in 0..1 of the clothing picture, dst: rows of {x,y} photo pixels }.
'use strict';
(function(){
  const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y }), sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
  const mul = (a, k) => ({ x: a.x * k, y: a.y * k }), len = (a) => Math.hypot(a.x, a.y);
  const norm = (a, fb) => { const l = len(a); return l > 1e-6 ? mul(a, 1 / l) : fb; };
  const mid = (a, b) => mul(add(a, b), 0.5), lerp = (a, b, t) => add(a, mul(sub(b, a), t));
  const dot = (a, b) => a.x * b.x + a.y * b.y, perp = (a) => ({ x: -a.y, y: a.x });
  const rot = (a, r) => ({ x: a.x * Math.cos(r) - a.y * Math.sin(r), y: a.x * Math.sin(r) + a.y * Math.cos(r) });

  // Body frame. "L" and "R" here mean left and right in the picture, whichever way the child faces.
  CB.frame = (P) => {
    const odd = P[11].x < P[12].x;                    // odd landmark indices are on the picture's left
    const L = (a, b) => P[odd ? a : b], R = (a, b) => P[odd ? b : a];
    const f = { shL: L(11, 12), shR: R(11, 12), hipL: L(23, 24), hipR: R(23, 24), knL: L(25, 26), knR: R(25, 26),
      anL: L(27, 28), anR: R(27, 28), heL: L(29, 30), heR: R(29, 30), toL: L(31, 32), toR: R(31, 32) };
    const earL = P[7].x < P[8].x ? P[7] : P[8], earR = P[7].x < P[8].x ? P[8] : P[7];
    f.earL = earL; f.earR = earR; f.eyes = mid(P[2], P[5]); f.nose = P[0];
    f.S = Math.max(8, len(sub(f.shR, f.shL)));
    f.Ms = mid(f.shL, f.shR); f.Mh = mid(f.hipL, f.hipR);
    f.r = norm(sub(f.shR, f.shL), { x: 1, y: 0 });
    f.u = norm(sub(f.Mh, f.Ms), { x: 0, y: 1 });
    f.T = Math.max(f.S * 0.6, len(sub(f.Mh, f.Ms)));
    return f;
  };

  const rect = (A, r, u, W, H) => ({                      // A = top centre
    src: [[{ u: 0, v: 0 }, { u: 1, v: 0 }], [{ u: 0, v: 1 }, { u: 1, v: 1 }]],
    dst: [[add(A, mul(r, -W / 2)), add(A, mul(r, W / 2))],
          [add(add(A, mul(r, -W / 2)), mul(u, H)), add(add(A, mul(r, W / 2)), mul(u, H))]] });
  const post = (m, A, t, S, mirrorRot) => {               // the parent's rotate and move, about anchor A
    const a = (mirrorRot ? -1 : 1) * t.rot * Math.PI / 180, o = { x: t.dx * S, y: t.dy * S };
    m.dst = m.dst.map((row) => row.map((p) => add(add(A, rot(sub(p, A), a)), o)));
    return m;
  };
  const flipU = (m) => { m.src = m.src.map((row) => row.map((s) => ({ u: 1 - s.u, v: s.v }))); return m; };

  // point at fraction s (0..1, may pass 1) along start -> knee -> ankle, plus the local direction
  function legPoint(a, k, b, s){
    const l1 = len(sub(k, a)), l2 = len(sub(b, k)), d = s * (l1 + l2);
    if (d <= l1) return { p: lerp(a, k, l1 ? d / l1 : 0), dir: norm(sub(k, a), { x: 0, y: 1 }) };
    return { p: lerp(k, b, l2 ? (d - l1) / l2 : 0), dir: norm(sub(b, k), { x: 0, y: 1 }) };
  }

  CB.defaults = (slot, aspect) => {                       // aspect = picture height / width
    const t = { dx: 0, dy: 0, scale: 1, sx: 1, sy: 1, rot: 0, flip: false, pair: false };
    if (slot === 'pants') t.sy = aspect < 0.95 ? 0.42 : aspect < 1.3 ? 0.7 : 1.05;   // sy = leg length covered
    return t;
  };

  CB.fit = (g, P) => {
    const f = CB.frame(P), t = g.t, asp = g.cut.height / g.cut.width, S = f.S, out = [];
    if (g.slot === 'top'){
      const W = S * 1.7 * t.scale * t.sx, H = S * 1.7 * asp * t.scale * t.sy;
      const A = add(f.Ms, mul(f.u, -0.27 * S));
      out.push(post(rect(A, f.r, f.u, W, H), A, t, S));
    } else if (g.slot === 'hat'){
      let hw = len(sub(f.earR, f.earL)); if (hw < S * 0.2) hw = S * 0.55;
      const re = norm(sub(f.earR, f.earL), { x: 1, y: 0 });
      let up = perp(re); if (dot(up, sub(f.eyes, f.nose)) < 0 || (Math.abs(dot(up, sub(f.eyes, f.nose))) < 1 && up.y > 0)) up = mul(up, -1);
      const W = hw * 1.75 * t.scale * t.sx, H = hw * 1.75 * asp * t.scale * t.sy;
      const B = add(f.eyes, mul(up, hw * 0.16)), A = add(B, mul(up, H));
      out.push(post(rect(A, re, mul(up, -1), W, H), B, t, S));
    } else if (g.slot === 'shoes'){
      const cL = mid(f.heL, f.toL), cR = mid(f.heR, f.toR), X = { x: 1, y: 0 }, Y = { x: 0, y: 1 };
      if (t.pair){
        const W = (len(sub(cR, cL)) + S * 0.55) * t.scale * t.sx, H = W * asp * t.sy / t.sx, C = mid(cL, cR);
        out.push(post(rect(add(C, mul(Y, -H * 0.55)), X, Y, W, H), C, t, S));
      } else {
        const W = S * 0.6 * t.scale * t.sx, H = S * 0.6 * asp * t.scale * t.sy;
        const one = (C, mirror) => {
          let m = rect(add(C, mul(Y, -H * 0.6)), X, Y, W, H);
          if (mirror) m = flipU(m);
          const tt = mirror ? Object.assign({}, t, { dx: -t.dx }) : t;
          return post(m, C, tt, S, mirror);
        };
        out.push(one(cL, false), one(cR, true));
      }
    } else if (g.slot === 'pants'){
      const W = S * 1.25 * t.scale * t.sx, v0 = asp < 0.95 ? 0.45 : 0.3;
      const Wc = add(f.Mh, mul(f.u, -0.12 * f.T)), K = add(f.Mh, mul(f.u, 0.2 * f.T));
      const rows = [0.25, 0.5, 0.75, 1];
      const half = (side) => {                           // side -1 = picture left, +1 = picture right
        const kn = side < 0 ? f.knL : f.knR, an = side < 0 ? f.anL : f.anR;
        const start = add(K, mul(f.r, side * W / 4));
        const uo = side < 0 ? 0 : 1;
        const src = [[{ u: uo, v: 0 }, { u: 0.5, v: 0 }], [{ u: uo, v: v0 }, { u: 0.5, v: v0 }]];
        const dst = [[add(Wc, mul(f.r, side * W / 2)), Wc], [add(start, mul(f.r, side * W / 4 * 1.05)), K]];
        for (const s of rows){
          const q = legPoint(start, kn, an, s * t.sy);
          let n = perp(q.dir); if (dot(n, f.r) * side < 0) n = mul(n, -1);
          const hw = W / 4 * (1.05 - 0.2 * s);
          src.push([{ u: uo, v: v0 + (1 - v0) * s }, { u: 0.5, v: v0 + (1 - v0) * s }]);
          dst.push([add(q.p, mul(n, hw)), add(q.p, mul(n, -hw))]);
        }
        return post({ src, dst }, Wc, t, S);
      };
      out.push(half(-1), half(1));
    }
    if (t.flip) out.forEach(flipU);
    return out;
  };

  // ---- drawing: each mesh cell is split finely and drawn as affine-mapped triangles ----
  function tri(ctx, img, s0, s1, s2, d0, d1, d2){
    const den = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
    if (Math.abs(den) < 1e-6) return;
    const cx = (d0.x + d1.x + d2.x) / 3, cy = (d0.y + d1.y + d2.y) / 3;
    const grow = (p) => { const vx = p.x - cx, vy = p.y - cy, l = Math.hypot(vx, vy) || 1; return { x: p.x + vx / l * 0.7, y: p.y + vy / l * 0.7 }; };
    const e0 = grow(d0), e1 = grow(d1), e2 = grow(d2);
    const A = (k) => (d0[k] * (s1.y - s2.y) + d1[k] * (s2.y - s0.y) + d2[k] * (s0.y - s1.y)) / den;
    const B = (k) => (d0[k] * (s2.x - s1.x) + d1[k] * (s0.x - s2.x) + d2[k] * (s1.x - s0.x)) / den;
    const C = (k) => (d0[k] * (s1.x * s2.y - s2.x * s1.y) + d1[k] * (s2.x * s0.y - s0.x * s2.y) + d2[k] * (s0.x * s1.y - s1.x * s0.y)) / den;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(e0.x, e0.y); ctx.lineTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y); ctx.closePath(); ctx.clip();
    ctx.transform(A('x'), A('y'), B('x'), B('y'), C('x'), C('y'));
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
  CB.drawMesh = (ctx, img, m, n) => {
    const w = img.width, h = img.height, bl = (a, b, c, d, x, y) => lerp(lerp(a, b, x), lerp(c, d, x), y);
    for (let r = 0; r < m.dst.length - 1; r++) for (let c = 0; c < m.dst[r].length - 1; c++){
      const S = (x, y) => { const s = bl({ x: m.src[r][c].u, y: m.src[r][c].v }, { x: m.src[r][c + 1].u, y: m.src[r][c + 1].v },
        { x: m.src[r + 1][c].u, y: m.src[r + 1][c].v }, { x: m.src[r + 1][c + 1].u, y: m.src[r + 1][c + 1].v }, x, y); return { x: s.x * w, y: s.y * h }; };
      const D = (x, y) => bl(m.dst[r][c], m.dst[r][c + 1], m.dst[r + 1][c], m.dst[r + 1][c + 1], x, y);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
        const x0 = i / n, x1 = (i + 1) / n, y0 = j / n, y1 = (j + 1) / n;
        tri(ctx, img, S(x0, y0), S(x1, y0), S(x0, y1), D(x0, y0), D(x1, y0), D(x0, y1));
        tri(ctx, img, S(x1, y0), S(x1, y1), S(x0, y1), D(x1, y0), D(x1, y1), D(x0, y1));
      }
    }
  };
  CB.drawGarment = (ctx, g, P) => { for (const m of CB.fit(g, P)) CB.drawMesh(ctx, g.cut, m, g.slot === 'pants' ? 3 : 4); };
})();
