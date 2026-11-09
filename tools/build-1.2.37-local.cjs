#!/usr/bin/env node
'use strict';
// Compatibility wrapper: 1.2.37 is the approved release; this path now builds that same output.
const path=require('node:path'),cp=require('node:child_process');
const out=process.argv[2]||path.join(__dirname,'../index.html');
cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.37.cjs'),out],{stdio:'inherit'});
