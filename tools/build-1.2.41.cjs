#!/usr/bin/env node
'use strict';
// Local 1.2.41 candidate: prism / crystal-facet art for tools, icons, tiles and listed mobs.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const out=process.argv[2]||path.join(__dirname,'../index.html');
cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.40.cjs'),out],{stdio:'inherit'});
let s=fs.readFileSync(out,'utf8');
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('Need exactly one hotfix seam: '+a.slice(0,100));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.40';","const GAME_VERSION = '1.2.41';");
one('<!-- glencraft-build: b1240-v1.2.40 -->','<!-- glencraft-build: b1241-v1.2.41 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.41',d:'2026-11-09',notes:['Tools, inventory icons, block tiles and 3D icons now share the new character\'s prism / crystal-faceted 4K UHD look, without changing each item\'s identity, colour or silhouette.','The same shared, cached facet pass is applied to sheep, haggis, pigs, creepers, Treemen, skeletons, black skeletons, clansmen, farmers, aliens, Agartha people (Paladiens), Egyptians, zombies, spiders, ghosts, the moss hag, the raincloud, and wizards.']})+',');
one("fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.40'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.40')",
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.41'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.41')");
const prism=fs.readFileSync(path.join(__dirname,'visuals-source/prism-1241.js'),'utf8');
// 1.2.40 ends the reload IIFE, then a blank line, then </script>
one("try { U.install(); } catch (e) { U.err = 'install: ' + e; }\n})(typeof window !== 'undefined' ? window : this);\n\n</script>",
    "try { U.install(); } catch (e) { U.err = 'install: ' + e; }\n})(typeof window !== 'undefined' ? window : this);\n"+prism+"\n</script>");
fs.writeFileSync(out,s);fs.writeFileSync(path.join(path.dirname(path.resolve(out)),'version.json'),JSON.stringify({v:'1.2.41'})+'\n');
console.log('Built local 1.2.41 prism-art candidate: '+out);
