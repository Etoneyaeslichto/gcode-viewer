"""Inject launch splash + UI motion into app/src/main/assets/index.html (idempotent)."""
import os,re
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));F=os.path.join(R,'app','src','main','assets','index.html')
W=os.path.dirname(os.path.abspath(__file__));rd=lambda f:open(os.path.join(W,f),encoding='utf-8').read()
h=open(F,encoding='utf-8').read()
h=re.sub(r'<!--FX:[a-z]+-->.*?<!--/FX:[a-z]+-->','',h,flags=re.S)
h=h.replace('<body class="boot">','<body>')
assert h.count('</head>')==1 and h.count('<body>')==1
h=h.replace('</head>','<!--FX:css--><style>'+rd('fx.css')+'</style><!--/FX:css--></head>')
h=h.replace('<body>','<body class="boot"><!--FX:body-->'+rd('fx_body.html').strip()+'<!--/FX:body-->')
i=h.rindex('</body>');h=h[:i]+'<!--FX:js--><script>'+rd('fx.js')+'</script><!--/FX:js-->'+h[i:]
open(F,'w',encoding='utf-8').write(h);print('fx injected',len(h))
