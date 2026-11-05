/* GLX-NSKY (v1.1.93): a richer night sky, all made here in code. A deep blue to violet gradient, lots of small crisp stars that twinkle a little,
   a faint milky band and soft wisps of cloud low down, and a gentle glow round the one real Moon. It fades in at dusk and out at dawn.
   It only paints the sky behind the world, so the land keeps its own light (still never darker than 30 percent). */
(function nsky() {
  const U = window.__nsky = {err: null, k: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ': ' + (e && e.message || e); };
  try {
    const mat = new THREE.ShaderMaterial({ uniforms: {uK: {value: 0}, uT: {value: 0}, uRot: {value: 0}, uMoon: {value: new THREE.Vector3(0, 1, 0)}, uMoonOn: {value: 0}},
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w * 0.99999; }',
      fragmentShader: [
        'uniform float uK,uT,uRot,uMoonOn; uniform vec3 uMoon; varying vec3 vD;',
        'float h3(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }',
        'float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f); return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }',
        'float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<4;i++){ s+=a*n3(p); p*=2.03; a*=0.5; } return s; }',
        'float stars(vec3 d, float sc, float th){ vec3 p=d*sc, c=floor(p); float r=h3(c); if(r<th) return 0.0; vec3 o=vec3(h3(c+7.1),h3(c+3.3),h3(c+5.7))*0.6+0.2; float l=length(fract(p)-o); float tw=0.75+0.25*sin(uT*(1.5+r*4.0)+r*60.0); return smoothstep(0.16,0.0,l)*tw*(0.5+0.5*(r-th)/(1.0-th)); }',
        'void main(){ vec3 d=normalize(vD); float h=d.y;',
        ' float cr=cos(uRot), sr=sin(uRot); vec3 s=vec3(cr*d.x-sr*d.z, d.y, sr*d.x+cr*d.z);',
        ' vec3 top=vec3(0.03,0.06,0.28), mid=vec3(0.10,0.17,0.56), hor=vec3(0.42,0.32,0.82);',
        ' float t=clamp(h,0.0,1.0); vec3 col=mix(hor, mid, smoothstep(0.0,0.35,t)); col=mix(col, top, smoothstep(0.3,0.95,t));',
        ' vec3 N=normalize(vec3(0.55,0.35,0.76)); float band=exp(-pow(dot(s,N)/0.2,2.0)); float bn=fbm(s*5.0+3.0); col+=vec3(0.30,0.32,0.55)*band*bn*bn*0.55;',
        ' float st=stars(s,180.0,0.955)+stars(s,420.0,0.965)*0.7+band*stars(s,700.0,0.94)*0.6; col+=vec3(0.95,0.97,1.0)*st*smoothstep(-0.02,0.12,h);',
        ' float w=fbm(vec3(s.x*3.0+uT*0.004, s.y*14.0, s.z*3.0)); float wl=smoothstep(0.02,0.18,h)*smoothstep(0.5,0.15,h); col+=vec3(0.45,0.42,0.80)*smoothstep(0.5,0.8,w)*wl*0.35;',
        ' if(uMoonOn>0.5){ float m=max(dot(d,normalize(uMoon)),0.0); col+=vec3(0.55,0.6,0.9)*(pow(m,60.0)*0.5+pow(m,8.0)*0.12); }',
        ' float a=uK*smoothstep(-0.25,0.02,h); gl_FragColor=vec4(col,a); }'].join('\n'),
      side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false, transparent: true,
      blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24), mat); dome.name = 'nsky'; dome.renderOrder = -100; dome.frustumCulled = false; dome.visible = false; scene.add(dome); U.dome = dome;
    const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try {
        const off = !started || (typeof DIM !== 'undefined' && DIM.cur) || (window.__c295 && __c295.inside) || (window.__c244 && __c244.on) || P.y < SEA - 20;
        const night = 1 - (typeof daylight === 'number' ? daylight : 1), k = off ? 0 : Math.max(0, Math.min(1, (night - 0.3) / 0.45)); U.k = +k.toFixed(2);
        dome.visible = k > 0.01; if (!dome.visible) return r; dome.position.copy(camera.position); mat.uniforms.uK.value = k * 0.93; mat.uniforms.uT.value = performance.now() / 1000;
        mat.uniforms.uRot.value = (typeof dayClock === 'number' && typeof CYCLE === 'number') ? dayClock / CYCLE * 6.283 * 0.35 : 0;
        if (typeof moonDisc !== 'undefined' && moonDisc && moonDisc.visible) { mat.uniforms.uMoon.value.copy(moonDisc.getWorldPosition(new THREE.Vector3())).sub(camera.position); mat.uniforms.uMoonOn.value = 1; } else mat.uniforms.uMoonOn.value = 0;
      } catch (e) { ERR('fr', e); } return r; };
  } catch (e) { ERR('init', e); }
})();
