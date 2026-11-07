"""Insert the 3D simulation module into app/src/main/assets/index.html (idempotent)."""
import os,re
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));P=os.path.join(R,'app','src','main','assets','index.html')
h=open(P,encoding='utf-8').read()
h=re.sub(r'<!--SIM:[a-z]+-->.*?<!--/SIM:[a-z]+-->','',h,flags=re.S)
js=open(os.path.join(R,'sim','sim.js'),encoding='utf-8').read()
def one(s,a,b):
    assert s.count(a)==1,(a,s.count(a));return s.replace(a,b)
h=one(h,'<div class="cw"><canvas id="cv"></canvas><div class="ov">','<div class="cw"><canvas id="cv"></canvas><!--SIM:cv--><canvas id="sim" hidden></canvas><!--/SIM:cv--><div class="ov"><!--SIM:btn--><button id="vs" title="Симуляция съёма" aria-label="Симуляция"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-5 9 5v7l-9 5-9-5z"/><path d="M9 7.5v3.5l3 1.7 3-1.7V7.5"/></svg></button><!--/SIM:btn-->')
h=one(h,'<button id="sStart" class="ib" aria-label="В начало" data-i="first"></button>','<button id="sStart" class="ib" aria-label="В начало" data-i="first"></button><!--SIM:play--><button id="sPlay" class="ib" aria-label="Воспроизвести" style="font-size:14px">▶</button><button id="sSpd" class="ib" aria-label="Скорость" style="font-size:12px;width:auto;padding:0 8px">×10</button><!--/SIM:play-->')
h=one(h,'<div class="s" id="st"></div>','<div class="s" id="st"></div><!--SIM:info--><div class="s" id="simInfo" hidden></div><!--/SIM:info-->')
h=one(h,'</head>','<!--SIM:css--><style>#sim{position:absolute;inset:0;width:100%;height:100%;border-radius:8px;touch-action:none;display:block}#sim[hidden]{display:none}#vs.on,#sPlay.on{background:#1D9E75;color:#fff;border-color:#1D9E75}</style><!--/SIM:css--></head>')
h=one(h,'</body>','<!--SIM:js--><script>'+js+'</script><!--/SIM:js--></body>')
open(P,'w',encoding='utf-8').write(h);print('sim injected',len(h))
