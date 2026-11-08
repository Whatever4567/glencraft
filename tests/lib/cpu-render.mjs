// CPU z-buffer rasteriser for actual built THREE meshes (no GPU): flat lambert from vertex normals, material colour; writes a PPM.
import fs from 'node:fs';
export function render(T, cam, roots, W, H, file, opt = {}) { const zb = new Float32Array(W * H).fill(Infinity), px = new Uint8Array(W * H * 3).fill(opt.bg || 40);
  cam.updateMatrixWorld(true); cam.updateProjectionMatrix(); const vp = new T.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse), L = new T.Vector3(0.4, 0.7, 0.6).normalize(); let tris = 0;
  const vis = o => { for (let a = o; a; a = a.parent) if (!a.visible) return false; return true; };
  for (const r of roots) { r.updateMatrixWorld(true); r.traverse(o => { if (!o.isMesh || !vis(o)) return; const g = o.geometry, p = g.attributes.position, n = g.attributes.normal, ix = g.index; if (!p) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material, c = m && m.color ? m.color : new T.Color(0.8, 0.8, 0.8), nm = new T.Matrix3().getNormalMatrix(o.matrixWorld);
    const P = [], N = []; for (let i = 0; i < p.count; i++) { const v = new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld), w = v.clone().applyMatrix4(vp); P.push([(w.x + 1) / 2 * W, (1 - w.y) / 2 * H, w.z]); N.push(n ? new T.Vector3().fromBufferAttribute(n, i).applyMatrix3(nm).normalize() : new T.Vector3(0, 0, 1)); }
    const cnt = ix ? ix.count : p.count; for (let t = 0; t < cnt; t += 3) { const I = ix ? [ix.getX(t), ix.getX(t + 1), ix.getX(t + 2)] : [t, t + 1, t + 2], A = P[I[0]], B = P[I[1]], C = P[I[2]]; if ([A, B, C].some(q => q[2] < -1 || q[2] > 1)) continue; tris++;
      const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(A[0], B[0], C[0]))), y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), y1 = Math.min(H - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      const ar = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]); if (Math.abs(ar) < 1e-9) continue;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const w0 = ((B[0] - x - .5 + 1) * 0 + (B[0] - (x + .5)) * (C[1] - (y + .5)) - (B[1] - (y + .5)) * (C[0] - (x + .5))) / ar, w1 = ((C[0] - (x + .5)) * (A[1] - (y + .5)) - (C[1] - (y + .5)) * (A[0] - (x + .5))) / ar, w2 = 1 - w0 - w1; if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * A[2] + w1 * B[2] + w2 * C[2], k = y * W + x; if (z >= zb[k]) continue; zb[k] = z; const nn = N[I[0]].clone().multiplyScalar(w0).addScaledVector(N[I[1]], w1).addScaledVector(N[I[2]], w2).normalize(), d = Math.abs(nn.dot(L)), s = 0.25 + 0.75 * d;
        px[k * 3] = Math.min(255, c.r * 255 * s); px[k * 3 + 1] = Math.min(255, c.g * 255 * s); px[k * 3 + 2] = Math.min(255, c.b * 255 * s); } } }); }
  fs.writeFileSync(file, Buffer.concat([Buffer.from(`P6 ${W} ${H} 255\n`), Buffer.from(px)])); let cov = 0; for (const z of zb) if (z < Infinity) cov++; return {tris, cov}; }
