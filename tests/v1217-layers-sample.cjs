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
