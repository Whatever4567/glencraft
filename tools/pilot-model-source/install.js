/* Install after the final production animation/equipment wrappers. */
(function installApprovedPilotV1(){
  const ensureLibrary=()=>new Promise((resolve,reject)=>{
    if(THREE.GLTFLoader&&THREE.SkeletonUtils){resolve();return;}
    const path='assets/models/lib.js?v1018';let script=Array.from(document.scripts).find(s=>s.getAttribute('src')===path);
    const timer=setTimeout(()=>reject(Error('Pilot loader timeout')),20000);
    const done=()=>{clearTimeout(timer);THREE.GLTFLoader&&THREE.SkeletonUtils?resolve():reject(Error('Pilot loader unavailable'));};
    const fail=()=>{clearTimeout(timer);reject(Error('Pilot loader request failed'));};
    if(!script){script=document.createElement('script');script.src=path;script.async=true;script.addEventListener('load',done,{once:true});script.addEventListener('error',fail,{once:true});document.head.appendChild(script);}
    else{script.addEventListener('load',done,{once:true});script.addEventListener('error',fail,{once:true});if(THREE.GLTFLoader)done();}
  });
  const U=window.__pilot1235=window.PilotRuntimeFactory(THREE,{
    ensureLibrary,
    load:name=>new Promise((resolve,reject)=>new THREE.GLTFLoader().load('assets/models/pilot-v1/'+name+'?v=1.2.35',resolve,undefined,reject)),
    equipment:()=>armour,
    tier:id=>id&&ARMOUR[id]?ARMOUR[id].mat:null,
    distance:model=>(typeof worldModel!=='undefined'&&model===worldModel)?camera.position.distanceTo(model.position):0,
    warn:e=>console.warn('Pilot v1 keeps previous avatar after load failure',e)
  });
  const hookScene=s=>{if(!s||s.userData.pilot1235Hook)return;s.userData.pilot1235Hook=true;const old=s.onBeforeRender;s.onBeforeRender=function(){if(old)old.apply(this,arguments);U.syncAll();};};
  const priorBuild=buildPlayerModel;
  buildPlayerModel=function(){const model=priorBuild.apply(this,arguments);U.attach(model);return model;};
  const priorDress=dressModel;
  dressModel=function(model){const result=priorDress.apply(this,arguments);if(model&&model.userData.pilot)U.dressed(model);return result;};
  hookScene(scene);
  const priorRenderChar=renderChar;
  renderChar=function(){if(typeof charScene!=='undefined')hookScene(charScene);return priorRenderChar.apply(this,arguments);};
  for(const model of [typeof worldModel!=='undefined'&&worldModel,typeof charModel!=='undefined'&&charModel])if(model)U.attach(model);
  // Warm cached templates once. No request is initiated by any render callback.
  U.ready().catch(()=>{});
})();
