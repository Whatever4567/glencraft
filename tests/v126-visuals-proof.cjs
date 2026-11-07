'use strict';
// Pixel proof for v1.2.6 icons/tiles: runs the actual built GLX-V126 module and the actual d259 painter on node-canvas.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {createCanvas}=require('canvas');
const html=fs.readFileSync(process.env.V126_HTML||path.join(__dirname,'../index.html'),'utf8');
const seg=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i,a);return html.slice(i,j);};
let pass=0;const test=(n,f)=>{f();pass++;console.log('PASS',n);};
const document={createElement:()=>createCanvas(1,1)};
const ctx=vm.createContext({document,console,setInterval:()=>0,clearInterval(){},ICONS:{},ICON_KEY:{},spriteMats:{},renderHotbar(){},T:{GRASS:1,CHEST:64,DIAMONDBLOCK:259},IT:{MAP:410,BREAD:35,ROTTEN:320}});ctx.window=ctx;
// actual d259 painter only (paint + rng), without its registry binding
const d=seg('(function d259() {','\n  function bind');vm.runInContext(d+'\n})();',ctx);
vm.runInContext(seg('(function v126() {','\n/* GLX-C400'),ctx);
const V=ctx.__v126;V.build();
const px=(c,x,y)=>Array.from(c.getContext('2d').getImageData(x,y,1,1).data);
const avg=(c)=>{const D=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let r=0,g=0,b=0,n=0;for(let i=0;i<D.length;i+=4)if(D[i+3]>200){r+=D[i];g+=D[i+1];b+=D[i+2];n++;}return [r/n,g/n,b/n,n];};
const P=(x,y,z)=>[128+(x-z)*256*0.36,128+(x+z)*256*0.205-y*256*0.42-256*0.02];
test('diamond tile is aqua (not snow white, not old navy-cyan)',()=>{const c=ctx.__d259.paint(128);const [r,g,b]=avg(c);assert(g>r+40&&b>r+30,'aqua '+[r,g,b]);assert(r<170,'not snow '+r);});
test('grass iso: green top face, brown dirt side face',()=>{const c=V.canvases[1];const t=P(.5,1,.5),s=P(.75,.3,1);const a=px(c,t[0]|0,t[1]|0),b=px(c,s[0]|0,s[1]|0);assert(a[1]>a[0]&&a[1]>a[2],'top '+a);assert(b[0]>b[2]&&b[0]>=b[1],'side '+b);});
test('chest iso: wood faces and gold latch on front',()=>{const c=V.canvases[64];const [r,g,b,n]=avg(c);assert(r>g&&g>b&&n>8000,'wood '+[r,g,b]);let gold=0;const D=c.getContext('2d').getImageData(0,0,256,256).data;for(let i=0;i<D.length;i+=4)if(D[i]>170&&D[i+1]>130&&D[i+2]<110&&D[i+3]>200)gold++;assert(gold>20,'latch '+gold);});
test('diamond block iso uses aqua tile on 3 faces',()=>{const c=V.canvases[259];for(const q of [P(.5,1,.5),P(.5,.5,1),P(1,.5,.5)]){const [r,g,b]=px(c,q[0]|0,q[1]|0);assert(g>r&&b>r,'face '+[r,g,b]);}});
test('map/bread/flesh icons painted, distinct, transparent background',()=>{const urls=[410,35,320].map(k=>V.icons[k]);assert(urls.every(u=>u&&u.startsWith('data:image/png')));assert(new Set(urls).size===3);for(const k of [410,35,320]){assert.equal(px(V.canvases[k],2,2)[3],0);assert(avg(V.canvases[k])[3]>3000);}
 const [r,g,b]=avg(V.canvases[320]);assert(r>b,'flesh '+[r,g,b]);const br=avg(V.canvases[35]);assert(br[0]>br[2]+50,'bread');});
test('apply installs icons and clears sprite/icon-key caches (drop sprites rebuild)',()=>{ctx.spriteMats[35]=1;ctx.ICON_KEY[35]='x';assert(V.apply()===6);assert.equal(ctx.ICONS[35],V.icons[35]);assert(!(35 in ctx.spriteMats));assert(!(35 in ctx.ICON_KEY));assert.equal(V.apply(),0);});
test('blocks stay real 3D cubes in hand and as drops',()=>{assert(html.includes('const cube = PLACEABLE.has(id) && BLOCK_MATS[id];'));assert(html.includes('new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), BLOCK_MATS[id])'));});
console.log(pass,'passed');
{const c2=vm.createContext({document,TEX:{chest_front:'old',chest_top:'old',chest_side:'old'}});c2.window=c2;vm.runInContext(seg('(function v126c() {','\n})();')+'\n})();',c2);
 for(const k of ['chest_front','chest_top','chest_side'])assert(c2.TEX[k].startsWith('data:image/png')&&c2.TEX[k]!=='old',k);
 assert.equal(new Set([c2.TEX.chest_front,c2.TEX.chest_top,c2.TEX.chest_side]).size,3);
 assert(html.indexOf('(function v126c()')<html.indexOf("64:['chest_side','chest_side','chest_top','chest_top','chest_front','chest_side']"));console.log('PASS chest world tiles replaced before face table, 3 distinct faces');}
