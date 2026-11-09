#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const out = process.argv[2] || path.join(__dirname, '..', 'index.html');
const root = path.join(__dirname, '..');
let src = fs.readFileSync(path.resolve(out) === path.resolve(root, 'index.html') ? path.join(root, 'index.html') : path.join(root, 'index.html'), 'utf8');
const mod = fs.readFileSync(path.join(__dirname, 'content-source', 'sunny-llm-1222.js'), 'utf8');
fs.mkdirSync(path.join(root, 'assets', 'sunny'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'sunny-brain', 'browser', 'sunny-worker.js'), path.join(root, 'assets', 'sunny', 'sunny-worker.js'));
if (src.includes('GLX-SUNNY1222')) {
  src = src.replace(/\n<script>\n\/\* GLX-SUNNY1222[\s\S]*?\n<\/script>\n(?=<\/body>)/, '\n');
}
const inject = '\n<script data-sunny-base="assets/sunny">\n' + mod + '\n</script>\n';
const i = src.lastIndexOf('</body>');
if (i < 0) throw new Error('</body> not found');
const next = src.slice(0, i) + inject + src.slice(i);
fs.writeFileSync(out, next);
const v = (next.match(/GAME_VERSION = '([^']+)'/) || [])[1];
console.log(JSON.stringify({ out: path.resolve(out), bytes: next.length, injected: 'sunny-llm-1222', baseVersion: v, worker: 'assets/sunny/sunny-worker.js' }));
