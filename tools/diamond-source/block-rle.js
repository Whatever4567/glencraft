function rleEncode(a) {
  // Preserve exact old encoding for byte-only saves. Extended blocks use tagged triples.
  const wide = a.some(v => v > 255), out = []; let i = 0;
  while (i < a.length) { const v = a[i]; let n = 1;
    while (i + n < a.length && a[i + n] === v && n < 255) n++;
    if(wide) out.push(v & 255, v >>> 8, n); else out.push(v,n); i += n;
  }
  const u=new Uint8Array(out);let s='';
  for(let j=0;j<u.length;j+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(j,j+0x8000));
  return (wide?'u16:':'')+btoa(s);
}
function rleDecode(b64,target) {
  const wide=b64.startsWith('u16:'),s=atob(wide?b64.slice(4):b64);let o=0;
  if(wide && target.BYTES_PER_ELEMENT<2)throw Error('Extended block save requires Uint16 block storage');
  const step=wide?3:2;if(s.length%step)throw Error('Invalid block RLE length');
  for(let j=0;j<s.length;j+=step){const v=s.charCodeAt(j)+(wide?s.charCodeAt(j+1)*256:0),n=s.charCodeAt(j+step-1);
    if(!n||o+n>target.length)throw Error('Invalid block RLE run');target.fill(v,o,o+n);o+=n;
  }
}
