"""Insert the 'Наряды' module and side menu into app/src/main/assets/index.html (idempotent)."""
import os,re,base64,json
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W=os.path.join(R,'web');P=os.path.join(R,'app','src','main','assets','index.html')
rd=lambda f:open(os.path.join(W,f),encoding='utf-8').read()
h=open(P,encoding='utf-8').read()
h=re.sub(r'<!--NAR:[a-z]+-->.*?<!--/NAR:[a-z]+-->','',h,flags=re.S)
icon=base64.b64encode(open(os.path.join(R,'ios','icon-192.png'),'rb').read()).decode()
seed=json.dumps(json.load(open(os.path.join(W,'nar_seed.json'),encoding='utf-8')),ensure_ascii=False,separators=(',',':'))
def one(s,a,b):
    assert s.count(a)==1,(a,s.count(a));return s.replace(a,b)
h=one(h,'</head>','<!--NAR:css--><style>'+rd('nar.css')+'</style><!--/NAR:css--></head>')
h=one(h,'<main>','<main><!--NAR:menu-->'+rd('nar.html').replace('__ICON__',icon)+'<!--/NAR:menu-->')
h=one(h,'</main>','<!--NAR:sec-->'+rd('nar_section.html')+'<!--/NAR:sec--></main>')
h=one(h,'</body>','<!--NAR:js--><script>'+rd('nar.js').replace('__SEED__',seed)+'</script><!--/NAR:js--></body>')
open(P,'w',encoding='utf-8').write(h)
print('injected',len(h))
