    // One packed authored detail atlas, 1024 px. Alpha: skin .62, sclera/cornea .20, lips .46 plus restrained pore relief.
    function packSurfaceDetail1233(g,w){const im=g.getImageData(0,0,w,w),d=im.data,S=w/512;let sd=7331;const R=()=>((sd=sd*16807%2147483647)/2147483647);
      for(let y=0;y<w;y++)for(let x=0;x<w;x++){const px=x/S,py=y/S,i=(y*w+x)*4;let rough=.64+(R()-.5)*.035;
        for(const cx of [144,376]){const u=(px-cx)/48,v=(py-235)/29,r=Math.hypot(u,v);if(r<.96)rough=.22+(R()-.5)*.006;else if(r<1.12)rough=.52+(R()-.5)*.014;}
        if(Math.abs(px-256)<65&&py>392&&py<427)rough=.48+(R()-.5)*.025;
        if(py<76)rough=.78;
        d[i+3]=Math.round(rough*255);}
      g.putImageData(im,0,0);}
