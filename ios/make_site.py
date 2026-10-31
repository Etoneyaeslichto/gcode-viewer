import sys,shutil,os
src,out,ver=sys.argv[1],sys.argv[2],sys.argv[3]
here=os.path.dirname(os.path.abspath(__file__))
os.makedirs(out,exist_ok=True)
h=open(src,encoding='utf-8').read()
head=open(os.path.join(here,'inject_head.html'),encoding='utf-8').read()
body=open(os.path.join(here,'inject_body.html'),encoding='utf-8').read().replace('BUILD_VER',ver)
assert h.count('</head>')==1 and h.count('</body>')==1
h=h.replace('</head>',head+'</head>').replace('</body>',body+'</body>')
open(os.path.join(out,'index.html'),'w',encoding='utf-8').write(h)
open(os.path.join(out,'sw.js'),'w',encoding='utf-8').write(open(os.path.join(here,'sw.js'),encoding='utf-8').read().replace("'gcode-BUILD'","'gcode-"+ver+"'"))
for f in ['manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','maskable-512.png']:shutil.copy(os.path.join(here,f),os.path.join(out,f))
open(os.path.join(out,'.nojekyll'),'w').close()
print('site ok',ver)
