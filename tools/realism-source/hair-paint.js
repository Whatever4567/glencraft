// Original seeded dark-brown strand albedo. No painted specular lights; highlights come from colour variation and actual mesh normals.
function paintHairV1233(g,s){
 let seed=33129;const R=()=>((seed=seed*16807%2147483647)/2147483647),S=s/512;
 g.fillStyle='#432a1c';g.fillRect(0,0,s,s);
 // broad tonal variation along the locks, very low contrast so the texture does not supply fake lighting
 for(let k=0;k<42;k++){const x=R()*s,w=(12+R()*25)*S;g.fillStyle=k%3?'rgba(94,58,37,.09)':'rgba(25,15,10,.17)';g.fillRect(x,0,w,s);}
 for(let k=0;k<5200;k++){
  const x=R()*s,y=R()*s,len=(22+R()*95)*S,bend=(R()-.5)*13*S,light=R();
  g.strokeStyle=light<.18?'rgba(115,75,48,.17)':light<.7?'rgba(86,52,32,.3)':'rgba(30,18,12,.25)';
  g.lineWidth=(.35+R()*.8)*S;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+bend,y+len*.3,x-bend*.3,y+len*.7,x+bend*.6,y+len);g.stroke();
 }
}
