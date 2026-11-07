const fs=require('fs'),vm=require('vm');const code=fs.readFileSync('/workspace/gc-126/tools/content-source/layers-1217.js','utf8');
const ctx=vm.createContext({console,setInterval:()=>0,clearInterval(){},Math});ctx.window=ctx;
vm.runInContext(`var T={STONE:3,DEEPSLATE:133,GRASS:1,DIRT:2,MOSS:9,LOG:8,WATER:5,LAVA:52,GEODE:190,OBSIDIAN:189,BASALTCOL:200,MAGMA:208,HELLROCK:206,GLOWROCK:209,DSTILE:229,AIR:0,HBEDROCK:211},DIM={cur:null},W=1200,D=3000,H=80,cityGen=false,world=new Uint16Array(1),started=0,paused=0,P={x:0,y:0,z:0},ICONS={},ICON_KEY={};
const idx=()=>0;function generate(){}function serialize(){return{}}function applySave(){};window.__agw={ok:1,box:[420,-50,0,660,-2,1440]};`,ctx);
vm.runInContext(code,ctx);vm.runInContext('__v1217.dl=true',ctx);const g=vm.runInContext('__v1217.gen',ctx),A={},L={};
for(let k=0;k<300;k++){const x=50+Math.floor(Math.random()*350),z=1500+Math.floor(Math.random()*1400);for(let y=-1;y>=-240;y--){const b=g(x,y,z),l=y>=-50?1:y>=-100?2:y>=-153?3:4;A[l]=(A[l]||0)+(b===0?1:0);L[l]=(L[l]||0)+1;}}
for(const l in A)console.log('layer',l,'air%',(100*A[l]/L[l]).toFixed(1));
let bad=0,liq=0;for(let x=100;x<400;x+=2)for(let z=1600;z<1900;z+=2)for(const yr of [[-96,-80],[-230,-215]])for(let y=yr[0];y<=yr[1];y++){const b=g(x,y,z);if(b!==5&&b!==52)continue;liq++;for(const [a,c,e] of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0]])if(g(x+a,y+c,z+e)===0)bad++;}
console.log('liquid cells',liq,'exposed faces',bad);
const st=vm.runInContext('__v1217.stairAt(1,9)',ctx);let col=[];for(let y=-1;y>=-240;y-=1){col.push(g(st[0]+4,y,st[1]))}console.log('stair ring at r4 air count',col.filter(v=>v===0).length,'of',col.length,'bedrock at -238',g(10,-238,10),'agartha keep',g(500,-20,100));
// bedrock column + fire floor; stair headroom/steps
let bed=[];for(const [x,z] of [[10,10],[777,2222],[123,1999]]){let ff=null;for(let y=-160;y>=-240;y--){const b=g(x,y,z);if(ff===null&&b!==0&&y<-200)ff=y;if(y<=-237&&b!==211)bed.push([x,y,z,b]);}console.log('col',x,z,'fire floor top y',ff,'y-236',g(x,-236,z),'y-237',g(x,-237,z));}
console.log('non-bedrock at/below -237:',bed.length);
let minGap=99,maxStep=0;const [sx,sz]=st;for(let dx=-6;dx<=6;dx++)for(let dz=-6;dz<=6;dz++){const r=Math.hypot(dx+.5,dz+.5);if(r<2.2||r>6.2)continue;let tr=[];for(let y=-5;y>=-200;y--)if(g(sx+dx,y,sz+dz)===774)tr.push(y);for(let i=1;i<tr.length;i++)minGap=Math.min(minGap,tr[i-1]-tr[i]-1);}
for(let a=0;a<360;a+=3){const r=4.5,p=(a)*Math.PI/180,q=(a+3)*Math.PI/180;const top=(x,z)=>{for(let y=-60;y>=-80;y--)if(g(x,y,z)===774&&g(x,y+1,z)===0)return y;return null;};const A=top(Math.floor(sx+Math.cos(p)*r),Math.floor(sz+Math.sin(p)*r)),B=top(Math.floor(sx+Math.cos(q)*r),Math.floor(sz+Math.sin(q)*r));if(A!=null&&B!=null){const d=Math.abs(A-B)%6;maxStep=Math.max(maxStep,Math.min(d,6-d));};}
console.log('stair min clear air between treads in a column',minGap,'max step between neighbours (mod turn)',maxStep);
