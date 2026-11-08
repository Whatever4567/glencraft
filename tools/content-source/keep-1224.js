/* GLX-KEEP1224 (v1.2.24): saves keep the old north extension data. GLX-C307 was removed, but a save made with it can hold a c307 field
   (the changed 26 x 26 chunks of the old zone, which may include your own digging and building out there). It is kept exactly as it
   was: read from the save on load and written back unchanged on every save, never decoded, generated, drawn or collided with. */
(function keep1224() {
  const U = window.__keep1224 = {err: null, kept: 0, writes: 0};
  let blob = null;
  try { const ew = enterWorld; enterWorld = function (save) { try { blob = save && save.c307 && typeof save.c307 === 'object' ? save.c307 : null; U.kept = blob ? 1 : 0; } catch (e) { blob = null; } return ew.apply(this, arguments); }; } catch (e) { U.err = 'ew ' + e; }
  try { const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && blob && !d.dim && d.c307 === undefined) { d.c307 = blob; U.writes++; } } catch (e) { if (!U.err) U.err = 'ser ' + e; } return d; }; } catch (e) { U.err = 'ser0 ' + e; }
  U.blob = () => blob;
})();
