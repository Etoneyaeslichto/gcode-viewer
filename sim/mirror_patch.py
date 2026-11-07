"""One-off patch: mirror tool in the CAD tab of app/src/main/assets/index.html."""
import os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));P=os.path.join(R,'app','src','main','assets','index.html')
h=open(P,encoding='utf-8').read()
def one(a,b):
    global h
    assert h.count(a)==1,(a[:70],h.count(a));h=h.replace(a,b)
one('data-k="cham" data-i="cham">Фаска</button>','data-k="cham" data-i="cham">Фаска</button><button data-k="mir" data-i="mir">Зеркало</button>')
one('<input id="chA" inputmode="decimal" value="1"></label></div><div class="cw"><canvas id="c2">',
    '<input id="chA" inputmode="decimal" value="1"></label></div><div class="tl" id="mrr" style="display:none"><button id="mAll">Выбрать всё</button><button id="mClr">Сбросить</button><label class="ck"><input type="checkbox" id="mKeep" checked> оставить исходные</label><button id="mV" class="p">Ось Y (верт.)</button><button id="mH" class="p">Ось X (гориз.)</button><button id="mL" class="p">По линии…</button></div><div class="cw"><canvas id="c2">')
one("$('chr').style.display=tool==='cham'?'':'none';","$('chr').style.display=tool==='cham'?'':'none';$('mrr').style.display=tool==='mir'?'':'none';")
one("b.onclick=function(){tool=b.dataset.k;pend=null;ref=null;sel=-1;mark();edFill();draw2()}","b.onclick=function(){tool=b.dataset.k;pend=null;ref=null;sel=-1;MS=[];MAX=false;mark();edFill();draw2()}")
one("else if(t==='cham'){corner(s2u(q))}","else if(t==='cham'){corner(s2u(q))}\nelse if(t==='mir'){i=hit(q);if(MAX){if(i>=0&&(D[i].t==='l'||D[i].t==='x')){var LL=lp(D[i]),dl=Math.hypot(LL[1][0],LL[1][1]);mirror(LL[0],[LL[1][0]/dl,LL[1][1]/dl])}else info='Ось — это отрезок или вспомогательная прямая';MAX=false}else if(i>=0&&D[i].t!=='d'&&D[i].t!=='r'){var k_=MS.indexOf(i);if(k_>=0)MS.splice(k_,1);else MS.push(i);info='Выбрано объектов: '+MS.length}}")
one("if(t==='cham')return 'Нажмите на угол","if(t==='mir')return MAX?'Нажмите на линию — она станет осью зеркала':(MS.length?'Выбрано: '+MS.length+'. Выберите ещё или нажмите ось ниже':'Нажмите на объекты, которые отразить, или «Выбрать всё»');\nif(t==='cham')return 'Нажмите на угол")
one("D.forEach(function(o,i){var s=i===sel,dm=","D.forEach(function(o,i){var s=i===sel||(tool==='mir'&&MS.indexOf(i)>=0),dm=")
one("function act(w){","""var MS=[],MAX=false;
function mirror(P0,u){if(!MS.length){info='Сначала выберите объекты';return}var rf=function(p){var t=(p[0]-P0[0])*u[0]+(p[1]-P0[1])*u[1],f=[P0[0]+u[0]*t,P0[1]+u[1]*t];return [2*f[0]-p[0],2*f[1]-p[1]]},rd=function(d){var t=d[0]*u[0]+d[1]*u[1];return [2*t*u[0]-d[0],2*t*u[1]-d[1]]},keep=$('mKeep').checked,n=0;
var mk=function(o){var c=JSON.parse(JSON.stringify(o));if(o.t==='l'){c.a=rf(o.a);c.b=rf(o.b)}else if(o.t==='x'){c.p=rf(o.p);c.d=rd(o.d)}else if(o.t==='c'){c.c=rf(o.c);if(o.a0!==undefined){var e0=rf(cp(o,o.a0)),e1=rf(cp(o,o.a1));c.a0=mod(ang(c.c,e1));c.a1=mod(ang(c.c,e0))}}else return null;return c};
var idx=MS.slice();mut(function(){idx.forEach(function(i){var c=mk(D[i]);if(!c)return;n++;if(keep)D.push(c);else D[i]=c})},1);MS=[];info='Отражено объектов: '+n+(keep?' (исходные оставлены)':'')+'. «Отмена» вернёт'}
function act(w){""")
one("window.addEventListener('resize',draw2);","""$('mAll').onclick=function(){MS=[];D.forEach(function(o,i){if((o.t==='l'||o.t==='c')&&!o.u)MS.push(i)});info='Выбрано объектов: '+MS.length;draw2()};
$('mClr').onclick=function(){MS=[];MAX=false;info='';draw2()};
$('mV').onclick=function(){mirror([Z0[0],Z0[1]],[0,1]);draw2()};$('mH').onclick=function(){mirror([Z0[0],Z0[1]],[1,0]);draw2()};
$('mL').onclick=function(){if(!MS.length){info='Сначала выберите объекты';draw2();return}MAX=true;draw2()};
window.addEventListener('resize',draw2);""")
one("cham:'<path d=\"M4 20V11l7-7h9\"/>","mir:'<path d=\"M12 3v18\" stroke-dasharray=\"2 2\"/><path d=\"M9 7L4 17h5zM15 7l5 10h-5z\"/>',cham:'<path d=\"M4 20V11l7-7h9\"/>")
open(P,'w',encoding='utf-8').write(h);print('mirror patched')
