'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(process.env.DIAMOND_ARTIFACT||path.join(__dirname,'../index.html'),'utf8');
const base=fs.readFileSync(path.join(__dirname,'../tools/cave-source/checkpoints/pre-loader.html'),'utf8');
const segment=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j)};
let count=0;function test(name,f){f();count++;console.log('PASS',name)}
const ctx=vm.createContext({Uint8Array,Uint16Array,btoa,atob,console});
vm.runInContext(segment('function rleEncode(a)','let current = null;'),ctx);
test('legacy bytes decode and byte-only encoding unchanged',()=>{
 const old=btoa(String.fromCharCode(255,3,250,2,0,1));const out=new Uint16Array(6);ctx.rleDecode(old,out);
 assert.deepEqual([...out],[255,255,255,250,250,0]);assert.equal(ctx.rleEncode(out),old);
});
test('diamond259 world RLE roundtrip and no silent byte decode',()=>{
 const src=Uint16Array.from([0,259,259,255,250,1,258]);const packed=ctx.rleEncode(src);assert(packed.startsWith('u16:'));
 const restored=new Uint16Array(src.length);ctx.rleDecode(packed,restored);assert.deepEqual([...restored],[...src]);
 assert.throws(()=>ctx.rleDecode(packed,new Uint8Array(src.length)));
});
test('actual incremental autosave encoder preserves259',()=>{
 vm.runInContext(segment('function rleRange(a, from, to)','  const re = rleEncode;')+';this.packParts=toB64;',ctx);
 const a=Uint16Array.from([255,259,259,250]);const p=ctx.packParts([ctx.rleRange(a,0,2),ctx.rleRange(a,2,4)],true);
 const b=new Uint16Array(4);ctx.rleDecode(p,b);assert.deepEqual([...b],[...a]);
 assert(html.includes('pre = toB64(parts,a.BYTES_PER_ELEMENT===2);'));
});
test('actual placed setB/getB retain259',()=>{
 Object.assign(ctx,{W:2,H:2,D:2,world:new Uint16Array(8),T:{AIR:0},idx:(x,y,z)=>(x*2+y)*2+z,markDirty(){}});
 vm.runInContext(segment('function getB(x, y, z)','function solid(x, y, z)'),ctx);
 ctx.setB(0,1,0,259);assert.equal(ctx.getB(0,1,0),259);
 ctx.setB(0,0,0,255);assert.equal(ctx.getB(0,0,0),255);
});
const {createCanvas}=require('canvas');const styles={};
class Texture{constructor(image){this.image=image}}
class Material{constructor(o){Object.assign(this,o)}}
Object.assign(ctx,{window:ctx,PHONE:false,PERF:false,THREE:{Texture,MeshStandardMaterial:Material,Color:class{constructor(v){this.v=v}},RepeatWrapping:1,LinearMipmapLinearFilter:2,LinearFilter:3},
 document:{createElement(t){return t==='canvas'?createCanvas(1,1):{textContent:''}},getElementById(id){return styles[id]||null},head:{appendChild(el){styles[el.id]=el}}},
 T:{PACKSNOW:255,DIAMONDBLOCK:255},FACES:{255:'packsnow',250:'juniper_leaves'},NAMES:{255:'Packed snow',250:'Juniper leaves'},ICON_KEY:{255:'packsnow',250:'juniper_leaves'},HARD:{},MC_HARD:{},REQ:{},AVG:{},texCache:{},texImg:{},matCache:{},ICONS:{},BLOCK_MATS:{255:{snow:true},250:{leaf:true}},NEEDS_PICK:new Set(),SHOVEL_ON:new Set([255]),PLACEABLE:new Set([255,250]),ORDER:[255,250],CREATIVE_ALL:[255,250],BUILT_T:new Uint8Array(1024),
 IT:{DIAMOND:123},RECIPES:[],dropsFor(){return []},mat(){return {}},
});
vm.runInContext(segment('const rc = (name, hint','const RECIPES = ['),ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../tools/diamond-source/diamond-block.js'),'utf8'),ctx);
test('actual diamond module boots without caught error',()=>assert.equal(ctx.__d259.err,null));
test('snow255 and juniper250 untouched; diamond259 exposed',()=>{
 assert.equal(ctx.FACES[255],'packsnow');assert.equal(ctx.FACES[250],'juniper_leaves');assert.equal(ctx.T.DIAMONDBLOCK,259);
 assert(ctx.PLACEABLE.has(259));assert(ctx.CREATIVE_ALL.includes(259));assert(ctx.ORDER.includes(259));
 assert.equal(ctx.ICON_KEY[259],'diamond_block');assert(ctx.ICONS[259].startsWith('data:image/png'));
});
test('actual recipes convert9 diamonds both ways and drop diamond259',()=>{
 const craft=ctx.RECIPES.find(r=>r.out===259),un=ctx.RECIPES.find(r=>r.out===123);
 assert.equal(craft.n,1);assert.equal(craft.need[0][0],123);assert.equal(craft.need[0][1],9);
 assert.equal(un.n,9);assert.equal(un.need[0][0],259);assert.equal(un.need[0][1],1);
 assert.equal(ctx.dropsFor(259)[0][0],259);
});
test('material shared world/held matCache; atlas six coherent faces',()=>{
 assert.equal(ctx.matCache.diamond_block,ctx.BLOCK_MATS[259]);assert.equal(ctx.BLOCK_MATS[259].map,ctx.texCache.diamond_block);
 Object.assign(ctx,{typeL:new Map(),chunkST:new Uint8Array(1024),layerOf:m=>({i:m===ctx.BLOCK_MATS[259]?17:0})});
 vm.runInContext(segment('function layers6(t)','  const NEM ='),ctx);
 assert.deepEqual(Array.from(ctx.layers6(259)),[17,17,17,17,17,17]);
});
test('actual painted pixels cyan/blue contrast, not snow; bounded tile',()=>{
 const c=ctx.texImg.diamond_block;assert.equal(c.width,256);
 const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
 let blue=0,dark=0,white=0;for(let i=0;i<data.length;i+=4){if(data[i+2]>data[i]+30)blue++;if(data[i]<60&&data[i+1]<100)dark++;if(data[i]>220&&data[i+1]>230)white++;}
 assert(blue>c.width*c.height*.4);assert(dark>100);assert(white>100);
});
test('all cell buffers extended; atlas layer attributes stay bytes',()=>{
 for(const expr of ['W * H * D','PW*NB*PW','SW * SL * SW','C * C * N','PW * N * PW'])assert(html.includes('new Uint16Array('+expr+')'),expr);
 assert(!html.includes('world = new Uint8Array(W * H * D)'));
 assert(html.includes('lay = new Uint8Array(nf * 4)')); // layer number, not block type
 assert(html.includes('chunkST = new Uint8Array(1024)'));
});
test('cave1.2.2 terrain source preserved verbatim',()=>{
 const terrain=fs.readFileSync(path.join(__dirname,'../tools/cave-source/deep-world-terrain.js'),'utf8');assert(html.includes(terrain));
 assert(html.includes('b1203-v1.2.3'));assert(html.includes('GLX-D259'));
});
console.log('ALL PASS',count);
