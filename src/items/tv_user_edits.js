// GLX-TVE v1.1.58: the TV plays your own edits in order, one after another, on a loop. The old cartoon clips are gone. Sound comes from the TV itself (positional).
(function () {
  try { TV_CLIPS = ['assets/tv/edit1.mp4', 'assets/tv/edit2.mp4', 'assets/tv/edit3.mp4', 'assets/tv/edit4.mp4', 'assets/tv/edit5.mp4', 'assets/tv/edit6.mp4', 'assets/tv/edit7.mp4']; window.__tvEdits = TV_CLIPS; } catch (e) {}
  let n = -1; try { tvNextClip = function () { n = (n + 1) % TV_CLIPS.length; tvLastClip = n; try { tvClipLog.push(n); } catch (_) {} return n; }; } catch (e) {}
  try { tvBag = []; } catch (_) {}
})();
