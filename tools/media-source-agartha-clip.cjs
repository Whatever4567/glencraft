const {createCanvas}=require('canvas');const fs=require('fs');const W=640,H=360,N=96;
let s=12345;const R=()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296;
const sp=[...Array(14)].map(()=>({x:R()*W,h:60+R()*150,w:10+R()*18,c:R()<.5?'#7ad8ff':'#c49cff'}));
const ppl=[...Array(5)].map((_,i)=>({x:120+i*95+R()*20,s:0.8+R()*0.3,ph:R()*6}));
const dust=[...Array(80)].map(()=>({x:R()*W,y:R()*H,v:.3+R()}));
for(let f=0;f<N;f++){const c=createCanvas(W,H),g=c.getContext('2d'),t=f/24;
 const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#1a0b3a');sky.addColorStop(.55,'#3a2a7a');sky.addColorStop(1,'#0e3a4a');g.fillStyle=sky;g.fillRect(0,0,W,H);
 const sx=W/2,sy=110,pr=38+Math.sin(t*3)*3;const sun=g.createRadialGradient(sx,sy,4,sx,sy,170);sun.addColorStop(0,'#fff8d0');sun.addColorStop(.18,'#ffd86a');sun.addColorStop(.45,'rgba(255,150,80,.35)');sun.addColorStop(1,'rgba(120,60,160,0)');g.fillStyle=sun;g.fillRect(0,0,W,H);
 g.fillStyle='#fffbe8';g.beginPath();g.arc(sx,sy,pr*.55,0,7);g.fill();
 g.strokeStyle='rgba(255,230,160,.25)';g.lineWidth=2;for(let a=0;a<24;a++){const q=a/24*6.283+t*.2;g.beginPath();g.moveTo(sx+Math.cos(q)*pr,sy+Math.sin(q)*pr);g.lineTo(sx+Math.cos(q)*(pr+60+20*Math.sin(t*2+a)),sy+Math.sin(q)*(pr+60+20*Math.sin(t*2+a)));g.stroke();}
 // curved inner-world horizon rising at the edges
 g.fillStyle='#123a3a';g.beginPath();g.moveTo(0,H*.55);g.quadraticCurveTo(W/2,H*.82,W,H*.55);g.lineTo(W,H);g.lineTo(0,H);g.fill();
 for(const p of sp){const base=H*.55+Math.pow((p.x-W/2)/(W/2),2)*-H*.27+H*.27;const x=p.x+Math.sin(t*.4)*4;g.fillStyle=p.c;g.globalAlpha=.85;g.beginPath();g.moveTo(x-p.w/2,base);g.lineTo(x,base-p.h);g.lineTo(x+p.w/2,base);g.fill();g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.moveTo(x-1,base);g.lineTo(x,base-p.h);g.lineTo(x+p.w*.2,base);g.fill();g.globalAlpha=1;}
 for(const p of ppl){const x=p.x+Math.sin(t*.6+p.ph)*6,y=H-60,k=p.s*1.4;g.fillStyle='#1c4fb0';g.beginPath();g.moveTo(x-14*k,y+40*k);g.lineTo(x-7*k,y);g.lineTo(x+7*k,y);g.lineTo(x+14*k,y+40*k);g.fill();g.fillStyle='#e8c890';g.beginPath();g.arc(x,y-8*k,7*k,0,7);g.fill();g.fillStyle='#f0d870';g.beginPath();g.arc(x,y-11*k,7.5*k,Math.PI,0);g.fill();}
 for(const d of dust){const y=(d.y-t*20*d.v+H)%H;g.fillStyle='rgba(255,240,200,.7)';g.fillRect((d.x+Math.sin(t+d.y)*5)%W,y,2,2);}
 const v=g.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.9);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=v;g.fillRect(0,0,W,H);
 g.globalAlpha=Math.min(1,f/8,(N-f)/8);const o=createCanvas(W,H);o.getContext('2d').globalAlpha=g.globalAlpha;
 fs.writeFileSync('/tmp/rb/fr/'+String(f).padStart(3,'0')+'.png',c.toBuffer('image/png'));}
