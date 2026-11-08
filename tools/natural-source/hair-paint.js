// Original seeded dark-brown strand albedo. No painted specular lights; highlights come from colour variation and actual mesh normals.
function paintHairV1233(g,s){
 let seed=33129;const R=()=>((seed=seed*16807%2147483647)/2147483647),S=s/512;
 g.fillStyle='#251a13';g.fillRect(0,0,s,s);
 // broad tonal variation along the locks, very low contrast so the texture does not supply fake lighting
 for(let k=0;k<42;k++){const x=R()*s,w=(12+R()*25)*S;g.fillStyle=k%3?'rgba(48,32,22,.08)':'rgba(25,15,10,.17)';g.fillRect(x,0,w,s);}
 for(let k=0;k<5200;k++){
  const x=R()*s,y=R()*s,len=(22+R()*95)*S,bend=(R()-.5)*13*S,light=R();
  g.strokeStyle=light<.18?'rgba(64,44,30,.13)':light<.7?'rgba(45,30,20,.22)':'rgba(18,12,9,.2)';
  g.lineWidth=(.35+R()*.8)*S;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+bend,y+len*.3,x-bend*.3,y+len*.7,x+bend*.6,y+len);g.stroke();
 }
}
