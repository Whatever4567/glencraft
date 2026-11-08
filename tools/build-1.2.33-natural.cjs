#!/usr/bin/env node
'use strict';
// LOCAL natural-style branch. Supersedes big-eye checks, not the released game. No imported reference assets.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),out=process.argv[2];if(!out)throw Error('output required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'natural33-')),f=path.join(dir,'b.html');let s;
try{if(process.env.GC_SURFACE)fs.copyFileSync(process.env.GC_SURFACE,f);else cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.33-surface.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
const read=(n,folder='natural-source')=>fs.readFileSync(path.join(__dirname,folder,n),'utf8').trimEnd();
function one(a,b){let i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need one '+a.slice(0,90));s=s.slice(0,i)+b+s.slice(i+a.length);}
function block(a,b,v){const i=s.indexOf(a),j=s.indexOf(b,i);if(i<0||j<i)throw Error('missing '+a);s=s.slice(0,i)+v+'\n'+s.slice(j);}
block('    SC.headS =','    SC.headF =',`    SC.headS=SC.K([[-.04,.068,.06,.075,2,-.02],[.018,.076,.09,.10,2,-.015],[.047,.108,.156,.14,2.08],[.082,.132,.176,.17,2.15],[.127,.158,.185,.19,2.18],[.20,.182,.195,.21,2.2],[.28,.188,.196,.218,2.2],[.36,.190,.193,.22,2.2],[.43,.177,.172,.203,2.15],[.48,.128,.118,.148,2],[.505,.02,.02,.03,2]]);`);
block('    const face1232F =','    SC.faceVUV',read('face-shape.js'));
one(read('orbits.js','surface-source')+'\n'+read('nose.js','surface-source'),'    // Natural eyes/nose are authored together in SC.headF2 above.');
block('    function paintFaceV1232','    // One packed authored detail atlas','    '+read('face-paint.js').replace(/\n/g,'\n    '));
one(read('hair-paint.js','realism-source'),read('hair-paint.js'));
block('    SC.earRaw =','    // neck with',read('ears.js'));
one('skin, sx * 0.198, 0.235, -0.01, head','skin, sx * 0.194, 0.235, -0.01, head');
one('SC.headTW = SC.mkTW(t => 1 + 1.6 * Math.exp(-(((t - 0.42) / 0.2) ** 2)));','SC.headTW = SC.mkTW(t => 1 + 3*Math.exp(-(((t-.57)/.065)**2)) + 1.2*Math.exp(-(((t-.41)/.11)**2)));');
one('SC.loftS(SC.headS, 140, 160, SC.headF2','SC.loftS(SC.headS, 152, 156, SC.headF2');
one('SC.loftS(SC.headS, 40, 140, null, {raw: SC.hairRaw','SC.loftS(SC.headS, 36, 136, null, {raw: SC.hairRaw');
// Roughness coverage uses the same new eye locations as paint and geometry.
one('for(const cx of [144,376]){const u=(px-cx)/48,v=(py-235)/29','for(const cx of [( -.085+.22)/.44*512,(.085+.22)/.44*512]){const u=(px-cx)/38.4,v=(py-233.6)/11.7');
// Sculpt a varied swept fringe and clump ridges within the existing scalp mesh, rather than a uniform bowl edge.
one('    const head = new THREE.Group(); head.position.y = 1.5; head.scale.setScalar(0.9); g.add(head);',`    SC.hairY=a=>{const v=a>Math.PI?a-2*Math.PI:a,x=Math.abs(v);let h=.396;
      for(const [c,d,w]of[[-.66,.012,.12],[-.49,.021,.115],[-.31,.016,.12],[-.13,.024,.12],[.07,.018,.12],[.25,.022,.115],[.42,.014,.115],[.59,.020,.12]])h-=d*Math.exp(-(((v-c)/w)**2));
      if(x<.7)return h;const side=.340-.008*Math.sin(v*3);if(x<1.2)return h*(1-SC.sm(.7,1.2,x))+side*SC.sm(.7,1.2,x);if(x<1.95)return side;return side+(.120-side)*SC.sm(1.95,2.65,x);};
    {const h=SC.hairOff2;SC.hairOff2=(a,t,y)=>h(a,t,y)+.0065*Math.cos(19*a+5*Math.sin(y*11)+.4*Math.sin(a*4))*SC.sm(.34,.40,y)*(1-SC.sm(.49,.505,y));}
    const head = new THREE.Group(); head.position.y = 1.5; head.scale.setScalar(0.9); g.add(head);`);
one('y1 + 0.012, st.z0','y1 + 0.004, st.z0');
one('new THREE.SphereGeometry(0.052, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), skin, sx * 0.1, 0.27, 0.188, head','new THREE.SphereGeometry(0.036, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), skin, sx * 0.085, 0.271, 0.184, head');
one('const d = SC.headF(a, 0, y, x, z), o = off(a, t, y);','const d = SC.headF2(a, 0, y, x, z), o = off(a, t, y);');
s=s.replace(/\/\* LOCAL 1\.2\.33 painted-realism experiment:[\s\S]*?\*\//,'/* LOCAL natural-human-reference experiment: smaller embedded blue eyes and deep dark brown hair. Original sculpt and paint, not an imported model. */');
// A real inset fringe underside closes the open scalp edge: 272 near triangles, rather than changing shared outfit material sides.
{const i=s.indexOf('    SC.hairRaw ='),j=s.indexOf('    SC.hairKeep =',i),old=s.slice(i,j);let h=old.replace('      const ct = P.length / 3, st = S(1);',`      const root=P.length/3;for(let j=0;j<=ns;j++){P.push(P[j*3]*.82,P[j*3+1]+.004,P[j*3+2]*.82);UV.push(j/ns,0);}for(let j=0;j<ns;j++){const a=j,b=root+j;I.push(a,a+1,b,b,a+1,b+1);}
      const ct = P.length / 3, st = S(1);`).replace('return {P, UV, I};','return {P, UV, I, rows:nr+1, cols:ns};');if(h===old)throw Error('fringe closure missing');s=s.slice(0,i)+h+s.slice(j);}
one('surface: 1233};','surface: 1233, natural: 1233};');
one('surface-experiment-local','natural-reference-local');fs.writeFileSync(out,s);
