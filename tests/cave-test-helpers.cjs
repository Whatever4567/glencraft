const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=process.env.CAVE_ARTIFACT||require('node:path').join(__dirname,'..','index.html');
const text=fs.readFileSync(file,'utf8');
function run(src,extra={},ctx=null){if(!ctx)ctx=vm.createContext(Object.assign(Object.create(null),{console,Map,Set,Uint8Array,Int16Array,Int32Array,Uint32Array,Float32Array,performance,...extra}));else Object.assign(ctx,extra);new vm.Script(src).runInContext(ctx);ctx.window=ctx;return ctx;}
function production(begin,end,from=0){const a=text.indexOf(begin,from),b=text.indexOf(end,a+begin.length);assert.ok(a>=0&&b>a,'missing production segment: '+begin);return text.slice(a,b);}
function minimalThree(){
 class Attribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize;this.count=array.length/itemSize;this.normalized=(array instanceof Int8Array||array instanceof Uint8Array||array instanceof Int16Array||array instanceof Uint16Array);}}
 class Geometry{constructor(){this.attributes={};this.groups=[];}setAttribute(name,a){this.attributes[name]=a;return this;}setIndex(a){this.index=a instanceof Attribute?a:new Attribute(a,1);return this;}computeBoundingSphere(){}addGroup(start,count,materialIndex){this.groups.push({start,count,materialIndex});}dispose(){this.disposed=true;this.disposeCount=(this.disposeCount||0)+1;}}
 class Mesh{constructor(g,m){this.geometry=g;this.material=m;this.userData={};this.children=[];this.isMesh=true;this.frustumCulled=true;}dispose(){this.disposed=true;}}
 class Group{constructor(){this.children=[];this.userData={};this.position={set(x,y,z){this.x=x;this.y=y;this.z=z;}};this.quaternion={copy(){}};}updateMatrixWorld(){}add(g){this.children.push(g);return this;}traverse(fn){fn(this);for(const g of this.children)if(g.traverse)g.traverse(fn);else fn(g);}remove(g){this.children.splice(this.children.indexOf(g),1);}}
 class InstancedMesh extends Mesh{constructor(g,m,n){super(g,m);this.isInstancedMesh=true;this.count=n;this.matrices=[];this.instanceMatrix={needsUpdate:false};}setMatrixAt(i,m){this.matrices[i]=m;}}
 class Matrix4{makeBasis(){return this;}compose(p,q,s){this.p=p;this.q=q;this.s=s;return this;}}
 class Quaternion{setFromRotationMatrix(){return this;}setFromAxisAngle(up,a){this.a=a;return this;}}
 class Vector3{constructor(x,y,z){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}}
 return{Group,Mesh,InstancedMesh,BufferGeometry:Geometry,BufferAttribute:Attribute,Matrix4,Quaternion,Vector3};
}
module.exports={file,run,production,text,vm,minimalThree,T:{AIR:0,STONE:1,TORCH:2,WATER:3,LAVA:4,LAVAB:5,GLOWROCK:6,LAMP:7,QLANTERN:8,FIRE:9,LEAVES:10}};
