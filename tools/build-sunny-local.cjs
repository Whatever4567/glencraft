#!/usr/bin/env node
'use strict';
// Local unpublished preview: append Sunny clansmen LLM+voice module onto live 1.2.34 index.
const fs = require('node:fs');
const path = require('node:path');
const out = process.argv[2] || path.join(__dirname, '..', 'index.html');
const root = path.join(__dirname, '..');
const srcPath = out === path.join(root, 'index.html') || path.resolve(out) === path.resolve(root, 'index.html')
  ? path.join(root, 'index.html')
  : path.join(root, 'index.html');
let src = fs.readFileSync(srcPath, 'utf8');
const mod = fs.readFileSync(path.join(__dirname, 'content-source', 'sunny-llm-1222.js'), 'utf8');
if (src.includes('GLX-SUNNY1222')) {
  // rebuild idempotently: strip previous injection
  src = src.replace(/\n<script>\n\/\* GLX-SUNNY1222[\s\S]*?\n<\/script>\n(?=<\/body>)/, '\n');
}
const inject = '\n<script>\n' + mod + '\n</script>\n';
const i = src.lastIndexOf('</body>');
if (i < 0) throw new Error('</body> not found');
const next = src.slice(0, i) + inject + src.slice(i);
fs.writeFileSync(out, next);
console.log(JSON.stringify({ out: path.resolve(out), bytes: next.length, injected: 'sunny-llm-1222', baseVersion: '1.2.34' }));
