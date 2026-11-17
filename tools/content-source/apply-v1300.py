# Re-embed tools/content-source/glx-v1300-volcano.js into index.html (the last <script> block that starts with GLX-V1300).
import io
p = 'index.html'; s = io.open(p, encoding='utf-8').read()
js = io.open('tools/content-source/glx-v1300-volcano.js', encoding='utf-8').read()
a = s.index('<script>\n/* GLX-V1300:'); b = s.index('</script>', a)
s = s[:a] + '<script>\n' + js + s[b:]
io.open(p, 'w', encoding='utf-8').write(s)
print('embedded', len(js))
