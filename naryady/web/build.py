"""Build the standalone 'Наряды' app page into naryady/src/main/assets/index.html.
Usage: python3 naryady/web/build.py [version]"""
import os,sys,json,base64
W=os.path.dirname(os.path.abspath(__file__));N=os.path.dirname(W)
ver=sys.argv[1] if len(sys.argv)>1 else 'dev'
rd=lambda f:open(os.path.join(W,f),encoding='utf-8').read()
seed=json.dumps(json.load(open(os.path.join(W,'nar_seed.json'),encoding='utf-8')),ensure_ascii=False,separators=(',',':'))
icon=base64.b64encode(open(os.path.join(N,'pwa','icon-192.png'),'rb').read()).decode()
extra='''body.nar main{display:block;max-width:900px;margin:0 auto}
#topbar img{width:30px;height:30px;border-radius:8px}
#iosHint{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:99;background:#1D9E75;color:#fff;border-radius:14px;padding:12px 40px 12px 14px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35)}
#iosHint button{position:absolute;right:6px;top:6px;width:30px;height:30px;border:0;background:transparent;color:#fff;font-size:18px;padding:0}
@media (min-width:1100px) and (hover:hover) and (pointer:fine){body.nar main{max-width:1200px;padding:16px 20px}}
'''
start='''(function(){var st=window.navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(function(){});
var k='iosHintSeen',seen=false;try{seen=localStorage.getItem(k)==='1'}catch(e){}
if(IOS&&!st&&!seen&&/^https?:/.test(location.protocol)){var d=document.createElement('div');d.id='iosHint';d.innerHTML='<b>Установить на iPhone:</b> «Поделиться» внизу Safari → «На экран „Домой“». Будет работать и без интернета.<button aria-label="Закрыть">✕</button>';document.body.appendChild(d);d.querySelector('button').onclick=function(){d.remove();try{localStorage.setItem(k,'1')}catch(e){}}}})();'''
html='''<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Наряды</title>
<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-180.png"><link rel="icon" type="image/png" href="icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black"><meta name="apple-mobile-web-app-title" content="Наряды"><meta name="theme-color" content="#1C1C1A">
<style>'''+rd('base.css')+rd('nar.css')+extra+'''</style></head>
<body class="nar"><main>
<div id="topbar"><img src="data:image/png;base64,'''+icon+'''" alt=""><span id="topTtl">Наряды</span><button id="nGear" class="ib" aria-label="Настройки" title="Настройки" style="width:40px;height:40px;border-radius:10px"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button></div>
'''+rd('nar_section.html')+'''
</main>
<script>'''+rd('app.js')+'\n'+rd('nar.js').replace('__SEED__',seed)+'\n'+rd('upd.js').replace('__VER__',ver)+'\n'+start+'''</script>
</body></html>
'''
out=os.path.join(N,'src','main','assets','index.html');open(out,'w',encoding='utf-8').write(html);print('built',out,len(html))
