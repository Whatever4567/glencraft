# fp-hands-1390

Sculpted bind-pose positions for the existing `GLOVE | R/L articulated finger 0`
HeadSkin primitives (2220 verts each) from `scottish-base-v2/scottish-base.glb`.

- Same vertex count, order, bones and weights as 1.2.137.
- Only the fingertip nail wells are closed into rounded pulps (28 verts
  moved, at most 6.1 mm). The linen primitive is unchanged.
- `skin-R-pos.bin` / `skin-L-pos.bin` are float32 xyz in the original glTF
  accessor order and space. `window.__noArm1390 = 1` skips the swap and
  keeps the 1.2.137 positions.
- The original `scottish-base.glb` is not replaced.
