const s=require('fs').readFileSync(__dirname+'/../index.html','utf8');let bad=0;const ok=(n,v)=>{if(!v){bad++;console.log('FAIL',n);}};
ok('painter skips crystal',/!\/bat\\b\|claymore\|crystal\/\.test\(n\)/.test(s));
ok('keep maps get crystal icons',s.includes("for (const M of [window.__c122 && __c122.MINE, window.__c187 && __c187.MINE]) if (M) M[k] = u;"));
// d-pad repeat timing simulation
const i=s.indexOf("{ const pb = i => !!(gp && gp.buttons");const blk=s.slice(i,s.indexOf('\n',s.indexOf('\n',i)+1));
const f=new Function('E','gp','now','dir','st','menuPadInput',blk+';return dir;');const M={};const gp={buttons:Array.from({length:17},(_,k)=>({pressed:k===13}))};
const E=[];let moves=0;E[13]=true; if(f(E,gp,0,'d','',M))moves++; const E2=[];
for(let t=10;t<=1000;t+=10){ if(f(E2,gp,t,'','',M))moves++; }
ok('dpad hold repeats ~ (1 + (1000-200)/70)',moves>=11&&moves<=13);console.log('dpad moves in 1 s:',moves);
console.log(bad?'FAIL':'icons/nav ok');process.exit(bad?1:0);
