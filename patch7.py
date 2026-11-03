s=open('s1.js').read()
def R(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:70]); s=s.replace(a,b)
# per-pixel lighting on blocks (r128 Lambert is per-vertex, so torch light on a block face only reached its corners)
R("    : new THREE.MeshLambertMaterial({map: tex(key)});","    : new THREE.MeshPhongMaterial({map: tex(key), shininess: 2, specular: 0x000000});")
R("key === 'glass' ? new THREE.MeshLambertMaterial({map: tex(key), transparent: true,","key === 'glass' ? new THREE.MeshPhongMaterial({map: tex(key), shininess: 60, specular: 0x222222, transparent: true,")
R("for (let i = 0; i < (HIGH ? 6 : 3); i++) { const l = new THREE.PointLight(0xffa45a, 0, 15, 1.25);","for (let i = 0; i < (HIGH ? 8 : 5); i++) { const l = new THREE.PointLight(0xffa45a, 0, 16, 1.1); l.userData.k = 0;")
# smooth cave transition + ambient floor
R("  caveK += (caveT - caveK) * Math.min(1, dt * 5 + (dt ? 0 : 1));","  // GLX-B4: ease in/out over ~1.5 s, never snap\n  caveK += (caveT - caveK) * Math.min(1, dt * 1.9 + (dt ? 0 : 1));")
R("flashA * 1.4 * (1 - caveK)) * (1 - caveK * 0.78);","flashA * 1.4 * (1 - caveK)) * (1 - caveK * 0.72);\n  hemi.intensity = Math.max(hemi.intensity, 0.13 + 0.05 * caveK);   // caves are dim, never pitch black")
# sticky, fading torch light assignment
R("""    torchLights.forEach((l, i) => {
      const e = list[i];
      if (e) { l.position.set(e[1], e[2], e[3]); l.userData.on = 1; l.userData.red = e[4]; l.color.setHex(e[4] ? 0xff3020 : 0xffa45a); l.distance = e[4] ? 6 : 15; }
      else l.userData.on = 0;
    });""","""    // GLX-B4: lights stay on their torch while it is still among the nearest, new torches take a free light and fade in
    const want = list.slice(0, torchLights.length), key = e => e[1] + ',' + e[2] + ',' + e[3];
    const wantK = new Set(want.map(key));
    torchLights.forEach(l => { l.userData.on = l.userData.src && wantK.has(l.userData.src) ? 1 : 0; });
    const used = new Set(torchLights.filter(l => l.userData.on).map(l => l.userData.src));
    for (const e of want) {
      const k = key(e); if (used.has(k)) continue;
      const free = torchLights.find(l => !l.userData.on && l.userData.k < 0.05) || null;
      if (!free) break;
      free.position.set(e[1], e[2], e[3]); free.userData.src = k; free.userData.on = 1; free.userData.red = e[4];
      free.color.setHex(e[4] ? 0xff3020 : 0xffa45a); free.distance = e[4] ? 6 : 16; used.add(k);
    }""")
R("""    l.intensity = l.userData.on ? (l.userData.red ? 0.55 + fl * 0.5 : 1.75 + fl) : 0;
    l.decay = 1.25;""","""    l.userData.k += ((l.userData.on ? 1 : 0) - l.userData.k) * Math.min(1, dt * 6);
    l.intensity = l.userData.k * (l.userData.red ? 0.55 + fl * 0.5 : 1.9 + fl * 0.8);
    l.decay = l.userData.red ? 1.25 : 1.1;""")
open('s1.js','w').write(s)
