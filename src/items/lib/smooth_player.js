/* Original smooth low-poly player surfaces. Single-quality geometry plus existing distance LOD;
   the silhouette is deliberately smoother rather than advertised as photoreal or 4K. */
(function (root) {
  'use strict';
  function head() {
    const rows = [[-0.012, 0.077, 0.065, -0.012], [0.025, 0.127, 0.101, 0.004], [0.065, 0.176, 0.145, 0.005], [0.125, 0.204, 0.177, 0.008], [0.205, 0.219, 0.194, 0.006], [0.280, 0.223, 0.205, 0.002], [0.355, 0.216, 0.205, 0], [0.422, 0.187, 0.183, -0.008], [0.475, 0.118, 0.122, -0.012], [0.495, 0.022, 0.030, -0.012]];
    function sample(y, col) { for (let i = 0; i < rows.length - 1; i++) if (y <= rows[i + 1][0]) { const a = rows[i], b = rows[i + 1], t = Math.max(0, (y - a[0]) / (b[0] - a[0])); return a[col] + (b[col] - a[col]) * (t * t * (3 - 2 * t)); } return rows[rows.length - 1][col]; }
    const P = [], UV = [], I = [], N = 48, R = 33;
    for (let j = 0; j <= R; j++) {
      const y = -0.005 + 0.50 * j / R, w = Math.max(0.004, sample(y, 1)), d = Math.max(0.004, sample(y, 2)), zc = sample(y, 3);
      for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, x = Math.sin(a) * w, front = Math.sqrt(Math.max(0, 1 - x * x / (w * w))); let z = zc + Math.cos(a) * d;
        if (front > 0.55 && y > 0.17 && y < 0.33) z += 0.012 * Math.exp(-(x * x / 0.004 + (y - 0.245) * (y - 0.245) / 0.002));
        P.push(x, y, z); UV.push(0.5 + Math.sin(a) * 0.5, y / 0.50); }
    }
    for (let j = 0; j < R; j++) for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + (i + 1) % N; I.push(a, a + N, b, b, a + N, b + N); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
  }
  function clothTorso() {
    const N = 32, P = [], UV = [], I = [];
    const rows = [[0.86, 0.23, 0.139], [0.91, 0.235, 0.142], [1.03, 0.242, 0.146], [1.19, 0.265, 0.154], [1.34, 0.272, 0.149], [1.43, 0.239, 0.138], [1.48, 0.140, 0.102]];
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, [y, w, d] = rows[j]; P.push(Math.sin(a) * w, y, Math.cos(a) * d); UV.push(i / N, j / (rows.length - 1)); }
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + (i + 1) % N; I.push(a, b, a + N, b, b + N, a + N); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
  }
  root.GlenPlayerSurfaces = {head, clothTorso};
})(typeof window !== 'undefined' ? window : globalThis);
