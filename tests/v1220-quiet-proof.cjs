const fs=require('fs');const src=fs.readFileSync(__dirname+'/../tools/content-source/quiet-1220.js','utf8');
const Q=eval('['+src.match(/const QUIET = \[([\s\S]*?)\];/)[1]+']');
const drop=['Welcome back to My Glen','Find a tree and hold MINE on the trunk.','The rain eases off.','Thunder rumbles. A storm is coming!','A full moon rises over the glen.','You come upon the Ash Keep...','2 old worlds found on this device and put back in your list','Your XP is back: level 4'];
const keep=['Could not save: this device is out of storage space','The chest is full','Loaded X (some parts were skipped - the world is safe)','A tornado is coming!','Equipped Iron Sword','Brand new world! Your house','Thunder rumbles','Backup failed - nothing changed'];
let bad=0;for(const m of drop)if(!Q.some(r=>r.test(m))){bad++;console.log('NOT DROPPED',m);}for(const m of keep)if(Q.some(r=>r.test(m))){bad++;console.log('WRONGLY DROPPED',m);}
console.log(bad?'FAIL':'quiet ok',drop.length,keep.length);process.exit(bad?1:0);
