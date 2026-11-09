import fs from 'node:fs';import vm from 'node:vm';import {createRequire}from 'node:module';const {createCanvas,loadImage}=createRequire('/workspace/qa/tools/index.js')('@napi-rs/canvas');
export const C={exports:{},module:{exports:{}},console,Blob,URL,fetch,TextDecoder,TextEncoder,ArrayBuffer,Uint8Array,WebAssembly,setTimeout,clearTimeout,performance,navigator:{userAgent:'node-CPU'},document:{createElementNS(){return createCanvas(1,1)},createElement(){return createCanvas(1,1)}}};C.self=C;C.window=C;C.createImageBitmap=async b=>{const im=await loadImage(Buffer.from(await b.arrayBuffer()));const cv=createCanvas(im.width,im.height);cv.getContext('2d').drawImage(im,0,0);cv.close=()=>{};return cv;};vm.createContext(C);const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8'),ci=html.indexOf('Copyright 2010-2021 Three.js'),st=html.lastIndexOf('<script>',ci)+8,en=html.indexOf('</script>',ci);vm.runInContext(html.slice(st,en),C);export const T=C.THREE=C.exports;vm.runInContext(fs.readFileSync(new URL('../../assets/models/lib.js',import.meta.url),'utf8'),C);export async function load(path){let b=fs.readFileSync(path);return await new Promise((res,rej)=>new T.GLTFLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'',res,rej));}

export function runtime(options){const W={};new Function('window',fs.readFileSync(new URL('../../tools/pilot-model-source/runtime.js',import.meta.url),'utf8'))(W);return W.PilotRuntimeFactory(T,options);}
export function legacy(equip=[0,0,0,0,0]){
 const materials=new Map(),ARMOUR={};for(const [base,mat]of [[104,'copper'],[108,'iron'],[112,'gold'],[129,'diamond']])for(let i=0;i<4;i++)ARMOUR[base+i]={mat};
 ARMOUR[291]={mat:'iron'};ARMOUR[777]={mat:'gold'};
 const G={THREE:T,document:C.document,window:{},performance,Math,console,setTimeout:()=>0,camera:new T.PerspectiveCamera(),playerTextures(){},faceTexP:new T.Texture(),tartanTex:new T.Texture(),fitPiece(){},updateWorldModel(){},dressModel(){},armour:equip,ARMOUR,armourMat:(id,pbr)=>{const k=id+':'+pbr;if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial({color:0x5fe0dc}));return materials.get(k);},buildPlayerModel:null};G.window=G;
 const i=html.indexOf('/* GLX-TP-HD '),j=html.indexOf('/* GLX-',i+8),dress=html.slice(html.indexOf('function dressModel(model) {'),html.indexOf('let worldModel = null;')),names=Object.keys(G);
 return new Function(...names,dress+html.slice(i,j)+'\nreturn{build:buildPlayerModel,fit:fitPiece,dress:dressModel,U:window.__tph};')(...names.map(k=>G[k]));
}
export function animation(model,U){
 const scene=new T.Scene();scene.add(model);const P={x:0,y:0,z:0,yaw:Math.PI,pitch:0,onGround:true,vy:0};model.rotation.y=P.yaw+Math.PI;model.visible=true;
 const W={__pilot1235:U},G={THREE:T,window:W,performance,scene,P,worldModel:model,camMode:1,sprinting:false,swingT:0,swingD:.3,heldMesh3p:null,heldId:0,held:new T.Group(),GUN:{13:{},14:{}},IT:{PISTOL:13,MUSKET:14},camera:new T.PerspectiveCamera(),console};
 const a=html.indexOf('/* GLX-TP-ANIM '),b=html.indexOf('/* GLX-',a+8),names=Object.keys(G);
 const source=html.slice(a,b)+`\nreturn{P,scene,held,tick:()=>{worldModel.position.x=P.x;worldModel.position.z=P.z;worldModel.rotation.y=P.yaw+Math.PI;scene.onBeforeRender();window.__pilot1235.sync(worldModel);},set:(k,v)=>{if(k==='heldId')heldId=v;if(k==='heldMesh3p')heldMesh3p=v;if(k==='sprinting')sprinting=v;},setAim:v=>{window.__c340={k:v?1:0};__c340.k=v?1:0;},G:window};`;
 // The production aiming code intentionally uses both window and browser-global spellings.
 const H=new Function(...names,'__c340',source)(...names.map(k=>G[k]),{k:0});
 return H;
}
export function skinnedVertices(root){const out=new Map();root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,points=[];if(o.isSkinnedMesh)o.skeleton.update();for(let i=0;i<a.count;i++){const p=new T.Vector3().fromBufferAttribute(a,i);if(o.isSkinnedMesh)o.boneTransform(i,p);p.applyMatrix4(o.matrixWorld);points.push(p);}out.set(o.name,points);});return out;}
