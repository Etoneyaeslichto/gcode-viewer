(function(){
var $=function(i){return document.getElementById(i)};
var MN=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
var MNp=['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре'];
var MNr=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
function monr(k){return MNr[+k.slice(5)-1]+' '+k.slice(0,4)}
var MNg=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
var SEED=__SEED__;
var D=ST.get('nar',null);if(!D||!D.parts){D=JSON.parse(JSON.stringify(SEED));ST.set('nar',D)}if(!D.m)D.m={};if(D.premMs===undefined)D.premMs=90;if(D.msK===undefined)D.msK=0.8;
var pad=function(n){return (n<10?'0':'')+n},now=new Date(),curK=now.getFullYear()+'-'+pad(now.getMonth()+1);
var MK=curK,HALF=now.getDate()<=15?'a':'p',ONLY=false,HN={a:'Аванс',p:'Получка'};
function sv(){ST.set('nar',D)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function num(v){var x=parseFloat(String(v).replace(/\s/g,'').replace(',','.'));return isNaN(x)?null:x}
function shift(k,n){var y=+k.slice(0,4),m=+k.slice(5)-1+n;y+=Math.floor(m/12);m=((m%12)+12)%12;return y+'-'+pad(m+1)}
function mon(k){return MN[+k.slice(5)-1]+' '+k.slice(0,4)}
function monl(k){return MNg[+k.slice(5)-1]}
function rub(v){return (Math.round(v*100)/100).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₽'}
function qs(v){return String(Math.round(v*1000)/1000).replace('.',',')}
function P(id){for(var i=0;i<D.parts.length;i++)if(D.parts[i].id===id)return D.parts[i];return null}
function fixed(p){return p.fx!==null&&p.fx!==undefined&&p.fx!==''}
function base(p){return fixed(p)?+p.fx:(+p.b||0)*D.coef}
function mult(p,k){var f=1;(D.raises||[]).forEach(function(r){if(r.f<=k&&r.f>(p.k||''))f*=1+r.pct/100});return f}
function price(p,k){return base(p)*mult(p,k||MK)}
function fac(p){return p.ms?+D.msK:1}
function M(k,make){if(!D.m[k]&&make)D.m[k]={a:{},p:{}};var m=D.m[k];if(m){m.a=m.a||{};m.p=m.p||{}}return m}
function bv(x){return x&&typeof x==='object'?+x.n||0:+x||0}
function bm(x){return !!(x&&typeof x==='object'&&x.ms)}
function bd(x){return x&&typeof x==='object'?x.d||null:null}
function today(){var t=new Date();return t.getFullYear()+'-'+pad(t.getMonth()+1)+'-'+pad(t.getDate())}
function partEarn(k,id){var p=P(id),m=M(k),t=1-D.tax/100,s=0;if(!p||!m)return 0;['a','p'].forEach(function(h){(m[h][id]||[]).forEach(function(x){s+=price(p,k)*bv(x)*(bm(x)?+D.msK:1)*t*(1+(bm(x)?D.premMs:D.prem)/100)})});return s}
function dayEarn(day){var t=1-D.tax/100,r={n:0,c:0};Object.keys(D.m).forEach(function(k){var m=M(k);['a','p'].forEach(function(h){for(var id in m[h]){var p=P(id);if(!p)continue;m[h][id].forEach(function(x){if(bd(x)!==day)return;var g=price(p,k)*bv(x)*(bm(x)?+D.msK:1)*t;r.n+=g*(1+(bm(x)?D.premMs:D.prem)/100);r.c+=bv(x)})}})});return r}
function sum(a){var s=0;(a||[]).forEach(function(x){s+=bv(x)});return s}
function sumM(a,ms){var s=0;(a||[]).forEach(function(x){if(bm(x)===ms)s+=bv(x)});return s}
function bgross(p,a,k){var s=0;(a||[]).forEach(function(x){s+=price(p,k)*bv(x)*(bm(x)?+D.msK:1)});return s}
if(!D.bm){D.parts.forEach(function(p){if(!p.ms)return;Object.keys(D.m).forEach(function(k){['a','p'].forEach(function(h){var a=D.m[k][h]&&D.m[k][h][p.id];if(a)D.m[k][h][p.id]=a.map(function(x){return bm(x)?x:{n:bv(x),ms:1}})})})});D.bm=1;ST.set('nar',D)}
function q(k,h,id){var m=M(k);return m?sum(m[h][id]):0}
function gross(k,h){var m=M(k),s=0;if(!m)return 0;for(var id in m[h]){var p=P(id);if(p)s+=bgross(p,m[h][id],k)}return s}
function cnt(k,h){var m=M(k),s=0;if(!m)return 0;for(var id in m[h])if(P(id))s+=sum(m[h][id]);return s}
function has(k){return cnt(k,'a')+cnt(k,'p')>0}
function calc(k){var t=1-D.tax/100,r={ga:0,gp:0,pr:0,prm:0},m=M(k);if(m)['a','p'].forEach(function(h){for(var id in m[h]){var p=P(id);if(!p)continue;m[h][id].forEach(function(x){var g=price(p,k)*bv(x)*(bm(x)?+D.msK:1),pr=g*t*(bm(x)?D.premMs:D.prem)/100;r['g'+h]+=g;r.pr+=pr;if(bm(x))r.prm+=pr})}});r.na=r.ga*t;r.np=r.gp*t;r.g=r.ga+r.gp;r.n=r.na+r.np;return r}
function prevPrem(k){var m=M(k);if(m&&m.ppo!==null&&m.ppo!==undefined)return {v:+m.ppo,man:1};var pk=shift(k,-1);return {v:has(pk)?calc(pk).pr:0,man:0}}
/* ---------- render ---------- */
function render(){$('nMon').textContent=mon(MK);var c=calc(MK),pp=prevPrem(MK),tot=c.n+pp.v,pk=shift(MK,-1),nk=shift(MK,1);
$('nTot').textContent=rub(tot);$('nTotSub').textContent='наряды '+rub(c.n)+' + премия за '+monl(pk)+' '+rub(pp.v);
var cell=function(t,v,s,cls){return '<div'+(cls?' class="'+cls+'"':'')+'><small>'+t+'</small><b>'+v+'</b>'+(s?'<i>'+s+'</i>':'')+'</div>'};
var td=dayEarn(today());
$('nGr').innerHTML=cell('Сегодня заработано',rub(td.n),td.c>0?'после налога, с премией · '+qs(td.c)+' шт':'после налога, с премией · сегодня ещё ничего не записано','acc wide')+cell('Аванс',rub(c.ga),'чистыми '+rub(c.na))+cell('Получка',rub(c.gp),'чистыми '+rub(c.np))+
cell('Наряды за месяц',rub(c.g),'после налога '+rub(c.n))+cell('Премия за этот месяц',rub(c.pr),'придёт в '+MNp[+nk.slice(5)-1]+(c.prm>0?' · из неё многостаночка '+rub(c.prm):''),'acc')+
'<div><small>Премия за '+monl(pk)+'</small><b>'+rub(pp.v)+'</b><i>'+(pp.man?'вписана вручную':'из нарядов за '+monl(pk))+' · <button class="lnk" id="nPPed">изменить</button></i></div>'+
cell('Наряды + премия',rub(c.n+c.pr),'после налога, этого месяца');
$('nPPed').onclick=openPP;renderRaises();
[].forEach.call($('nHalf').children,function(b){b.classList.toggle('on',b.dataset.h===HALF)});$('nOnly').classList.toggle('on',ONLY);$('nOnly').classList.toggle('p',ONLY);
$('nCoef').value=String(D.coef).replace('.',',');$('nTax').value=String(D.tax).replace('.',',');$('nPrem').value=String(D.prem).replace('.',',');$('nPremMs').value=String(D.premMs).replace('.',',');$('nMsK').value=String(D.msK).replace('.',',');
list()}
function list(){var f=String($('nQ').value||'').trim().toLowerCase(),L=D.parts.filter(function(p){var t=(p.dw+' '+p.nm).toLowerCase();if(f&&t.indexOf(f)<0)return false;if(ONLY&&q(MK,'a',p.id)+q(MK,'p',p.id)<=0)return false;return true});
L=L.map(function(p,i){return {p:p,i:i,o:q(MK,HALF,p.id)>0?0:1}}).sort(function(a,b){return a.o-b.o||a.i-b.i});
$('nList').innerHTML=L.length?L.map(function(x){var p=x.p,n=q(MK,HALF,p.id),o=q(MK,HALF==='a'?'p':'a',p.id);
return '<div class="nr'+(n>0?' has':'')+'" data-pid="'+p.id+'"><div class="t"><b>'+esc(p.dw||'без номера')+'</b><small>'+(p.nm?esc(p.nm)+' · ':'')+'<em>'+rub(price(p))+'</em>'+(hasMs(p)?' · <em class="ms">МС</em>':'')+(p.dr&&p.dr.length?' · <span class="clip" aria-label="есть чертёж">📎'+(p.dr.length>1?p.dr.length:'')+'</span>':'')+(o>0?' · '+(HALF==='a'?'получка ':'аванс ')+qs(o):'')+'</small>'+(n+o>0?'<small class="earn">заработано '+rub(partEarn(MK,p.id))+'</small>':'')+'</div><div class="nq"><button data-d="-1" aria-label="Минус">−</button><span class="'+(n>0?'':'z')+'">'+qs(n)+'</span><button data-d="1" aria-label="Плюс">+</button></div></div>'}).join(''):'<div class="s" style="padding:12px 4px">'+(ONLY?'В этом месяце на '+HN[HALF].toLowerCase()+' ещё ничего не записано':'Ничего не найдено')+'</div>'}
/* quick ± changes the last batch of the current half */
function hasMs(p){var m=M(MK);if(m&&['a','p'].some(function(h){return (m[h][p.id]||[]).some(bm)}))return true;return !!p.ms}
function bump(id,d){var m=M(MK,1),a=m[HALF][id]=m[HALF][id]||[],p=P(id),ms=!!(p&&p.ms),L=a[a.length-1];if(d>0&&!(L&&bd(L)===today()&&bm(L)===ms)){var nb={n:1,d:today()};if(ms)nb.ms=1;a.push(nb)}else{if(!a.length)return;var i=a.length-1;if(typeof a[i]==='object')a[i].n+=d;else a[i]+=d;if(bv(a[i])<=0)a.pop()}if(!a.length)delete m[HALF][id];sv();render()}
/* ---------- sheets ---------- */
var SH=null,MSNEW={id:null,on:false};
function sheet(html){close();var bg=document.createElement('div');bg.id='nSheetBg';var s=document.createElement('div');s.id='nSheet';s.innerHTML='<div class="grab"></div>'+html;bg.onclick=close;document.body.appendChild(bg);document.body.appendChild(s);SH=s;return s}
function close(){var sb=$('nSetBox');if(sb&&sb.parentNode!==$('nSetHold'))$('nSetHold').appendChild(sb);['nSheet','nSheetBg'].forEach(function(i){var e=$(i);if(e)e.remove()});SH=null}
function openPart(id){var p=P(id);if(!p)return;
if(MSNEW.id!==id)MSNEW={id:id,on:!!p.ms};
var blk=function(h){var a=(M(MK)||{a:{},p:{}})[h][id]||[],n=sum(a),nm=sumM(a,true);return '<div class="nbk'+(h===HALF?' cur':'')+'"><div class="tt"><b>'+HN[h]+'</b><span>'+qs(n)+' шт'+(nm>0?' (МС '+qs(nm)+')':'')+' · '+rub(bgross(p,a))+'</span></div>'+(a.length?'<div class="nbat">'+a.map(function(v,i){return '<span'+(bm(v)?' class="ms"':'')+'><button class="tg" data-tg="'+h+':'+i+'" title="Нажмите, чтобы переключить многостаночку">'+qs(bv(v))+(bm(v)?' МС':'')+'</button><button data-del="'+h+':'+i+'" aria-label="Убрать">✕</button></span>'}).join('')+'</div>':'')+'<div class="nadd"><label class="f"><span>Добавить</span><input id="nIn_'+h+'" inputmode="decimal" placeholder="шт"></label><button class="p" data-add="'+h+'">+</button></div></div>'};
var s=sheet('<div class="hd"><div><b>'+esc(p.dw||'без номера')+'</b><small>'+esc(p.nm||'')+'</small><small>'+(fixed(p)?'конечная цена '+rub(price(p))+' (своя)':'цена '+String(p.b||0).replace('.',',')+' × '+String(D.coef).replace('.',',')+' = '+rub(base(p))+(mult(p,MK)!==1?' → с повышением '+rub(price(p)):''))+'</small><small class="earn">заработано за '+monl(MK)+': '+rub(partEarn(MK,id))+' (после налога, с премией)</small></div><button class="ib" id="nX" aria-label="Закрыть">✕</button></div><label class="sw"><span>Многостаночка<small>для новых партий: сумма ×'+String(D.msK).replace('.',',')+', премия '+D.premMs+'%</small></span><input type="checkbox" id="nMsNew"'+(MSNEW.on?' checked':'')+'><i></i></label>'+blk('a')+blk('p')+drBlock(p)+'<div class="s">Количество за '+mon(MK).toLowerCase()+'. Каждое добавление — отдельная партия: нажмите на партию, чтобы отметить или снять «МС», лишнюю уберите крестиком.</div><div class="row" style="margin:0"><button id="nEd">Изменить деталь</button></div>');
$('nX').onclick=close;$('nEd').onclick=function(){openForm(id)};$('nMsNew').onchange=function(){MSNEW.on=this.checked};
s.addEventListener('click',function(e){var th=e.target.closest('[data-dr]');if(th){view(id,th.dataset.dr);return}var b=e.target.closest('button');if(!b)return;
if(b.dataset.add){var h=b.dataset.add,v=num($('nIn_'+h).value);if(!(v>0))return;var m=M(MK,1);var nb={n:v,d:today()};if(MSNEW.on)nb.ms=1;(m[h][id]=m[h][id]||[]).push(nb);sv();render();openPart(id)}
if(b.dataset.tg){var tp=b.dataset.tg.split(':'),mt=M(MK,1),at=mt[tp[0]][id]||[],x=at[+tp[1]];var o=x&&typeof x==='object'?x:{n:bv(x)};if(o.ms)delete o.ms;else o.ms=1;at[+tp[1]]=o;sv();render();openPart(id)}
if(b.dataset.del){var hp=b.dataset.del.split(':'),m2=M(MK,1),a=m2[hp[0]][id]||[];a.splice(+hp[1],1);if(!a.length)delete m2[hp[0]][id];sv();render();openPart(id)}});
$('drIn').onchange=function(){var fl=[].slice.call(this.files);this.value='';addDrawings(id,fl)};
['a','p'].forEach(function(h){$('nIn_'+h).addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();s.querySelector('[data-add="'+h+'"]').click()}})})}
function openForm(id){var p=id?P(id):{dw:'',nm:'',b:'',fx:null},fx=fixed(p);
var s=sheet('<div class="hd"><div><b>'+(id?'Изменить деталь':'Новая деталь')+'</b></div><button class="ib" id="nX" aria-label="Закрыть">✕</button></div>'+
'<label class="f txt"><span>№ по чертежу</span><input id="fDw" value="'+esc(p.dw)+'" placeholder="170.0206-41"></label>'+
'<label class="f txt"><span>Название</span><input id="fNm" value="'+esc(p.nm)+'" placeholder="для себя"></label>'+
'<label class="f"><span>Цена</span><input id="fB" inputmode="decimal" value="'+(p.b===null||p.b===undefined?'':String(p.b).replace('.',','))+'" placeholder="0"></label>'+
'<label class="sw"><span>Своя конечная цена<small>без умножения на коэффициент</small></span><input type="checkbox" id="fFxOn"'+(fx?' checked':'')+'><i></i></label>'+
'<label class="f" id="fFxW"'+(fx?'':' hidden')+'><span>Конечная цена</span><input id="fFx" inputmode="decimal" value="'+(fx?String(p.fx).replace('.',','):'')+'"></label>'+
'<label class="sw"><span>Многостаночка по умолчанию<small>новые партии отмечаются МС: сумма ×'+String(D.msK).replace('.',',')+', премия '+D.premMs+'% вместо '+D.prem+'%</small></span><input type="checkbox" id="fMs"'+(p.ms?' checked':'')+'><i></i></label><div class="s" id="fPv"></div><div class="row" style="margin:0"><button class="p" id="fOk">Сохранить</button>'+(id?'<button id="fDel" class="danger">Удалить деталь</button>':'')+'</div>');
var pv=function(){var on=$('fFxOn').checked,b=num($('fB').value)||0,f=num($('fFx').value);$('fFxW').hidden=!on;$('fPv').textContent='Конечная цена: '+rub(on&&f!==null?f:b*D.coef)+(on?'':' ('+String(b).replace('.',',')+' × '+String(D.coef).replace('.',',')+')')};
['fB','fFx'].forEach(function(i){$(i).addEventListener('input',pv)});$('fFxOn').addEventListener('change',pv);pv();
$('nX').onclick=close;
$('fOk').onclick=function(){var dw=$('fDw').value.trim(),nm=$('fNm').value.trim();if(!dw&&!nm){$('fPv').textContent='Впишите номер по чертежу или название';return}
var o=id?P(id):{id:'p'+Date.now().toString(36)},ob=o.b,ofx=o.fx;o.dw=dw;o.nm=nm;o.b=num($('fB').value);o.fx=$('fFxOn').checked?num($('fFx').value):null;o.ms=$('fMs').checked?1:0;if(!id||o.b!==ob||o.fx!==ofx)o.k=MK;if(!id)D.parts.unshift(o);sv();render();if(id)openPart(id);else close()};
if(id)$('fDel').onclick=function(){var b=this;if(!b.classList.contains('arm')){b.classList.add('arm');b.textContent='Точно удалить? Нажмите ещё раз';return}
(P(id).dr||[]).forEach(function(x){FS.del(x.id)});D.parts=D.parts.filter(function(x){return x.id!==id});Object.keys(D.m).forEach(function(k){delete D.m[k].a[id];delete D.m[k].p[id]});sv();close();render()}}
function renderRaises(){var L=D.raises||[];$('nRaises').innerHTML=L.length?L.map(function(x,i){return '<div class="nrs"><span>с '+monr(x.f)+'</span><b>+'+String(x.pct).replace('.',',')+'%</b><button data-rdel="'+i+'" aria-label="Отменить повышение">✕</button></div>'}).join(''):'<div class="s">Повышений не было</div>';$('nRhint').textContent='Цены всех деталей вырастут начиная с '+monr(MK)+' (открытый месяц). Прошлые месяцы не изменятся.'}
function openPP(){var m=M(MK),pk=shift(MK,-1),auto=has(pk)?calc(pk).pr:0;
sheet('<div class="hd"><div><b>Премия за '+monl(pk)+'</b><small>приходит в '+mon(MK).toLowerCase()+'</small></div><button class="ib" id="nX" aria-label="Закрыть">✕</button></div><div class="s">Автоматически: '+D.prem+'% (многостаночка '+D.premMs+'% от суммы ×'+String(D.msK).replace('.',',')+') от нарядов за '+monl(pk)+' после налога = '+rub(auto)+(has(pk)?'':' (за '+monl(pk)+' в приложении нет записей)')+'. Если пришло другое число — впишите его.</div><label class="f"><span>Сумма премии</span><input id="ppV" inputmode="decimal" value="'+(m&&m.ppo!=null?String(m.ppo).replace('.',','):'')+'" placeholder="'+String(Math.round(auto*100)/100).replace('.',',')+'"></label><div class="row" style="margin:0"><button class="p" id="ppOk">Сохранить</button><button id="ppAuto">Считать автоматически</button></div>');
$('nX').onclick=close;$('ppOk').onclick=function(){var v=num($('ppV').value);var mm=M(MK,1);if(v===null)delete mm.ppo;else mm.ppo=v;sv();close();render()};
$('ppAuto').onclick=function(){var mm=M(MK);if(mm)delete mm.ppo;sv();close();render()}}
/* ---------- drawings ---------- */
var FS=(function(){var A=window.Android,idb=null;
function db(){if(idb)return idb;idb=new Promise(function(res,rej){try{var r=indexedDB.open('naryady',1);r.onupgradeneeded=function(){r.result.createObjectStore('f')};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}}catch(e){rej(e)}});return idb}
function tx(mode,fn){return db().then(function(d){return new Promise(function(res,rej){var t=d.transaction('f',mode),st=t.objectStore('f'),q=fn(st);t.oncomplete=function(){res(q&&q.result)};t.onerror=function(){rej(t.error)}})})}
function b64(blob){return new Promise(function(res){var r=new FileReader();r.onload=function(){res(String(r.result))};r.readAsDataURL(blob)})}
function toBlob(u){var p=u.split(','),bin=atob(p[1]),a=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:(p[0].match(/data:([^;]+)/)||[])[1]||'image/jpeg'})}
var api={put:function(id,blob){if(A&&A.putFile)return b64(blob).then(function(u){if(!A.putFile(id,u.split(',')[1]))throw new Error('нет места')});return tx('readwrite',function(s){return s.put(blob,id)})},
get:function(id){if(A&&A.getFile){var s=A.getFile(id);return Promise.resolve(s?'data:image/jpeg;base64,'+s:'')}return tx('readonly',function(s){return s.get(id)}).then(function(b){return b?b64(b):''})},
del:function(id){if(A&&A.delFile){A.delFile(id);return Promise.resolve()}return tx('readwrite',function(s){return s.delete(id)}).catch(function(){})}};
api.putUrl=function(id,u){return api.put(id,toBlob(u))};return api})();
function shrink(file,max,q){return new Promise(function(res,rej){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){var k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(function(b){b?res({b:b,c:c}):rej(new Error('не удалось обработать фото'))},'image/jpeg',q)};im.onerror=function(){URL.revokeObjectURL(u);rej(new Error('это не картинка'))};im.src=u})}
function drBlock(p){var L=p.dr||[];return '<div class="nbk"><div class="tt"><b>Чертежи</b><span>'+(L.length?L.length+' шт':'нет')+'</span></div><div class="ndr">'+L.map(function(x){return '<button class="th" data-dr="'+x.id+'" aria-label="Открыть чертёж"><img src="'+x.th+'" alt=""></button>'}).join('')+'<label class="th add" aria-label="Добавить чертёж"><span>+</span><small>Фото</small><input type="file" id="drIn" accept="image/*" multiple hidden></label></div><div class="s" id="drMsg">'+(L.length?'Нажмите на чертёж, чтобы открыть':'Сфотографируйте чертёж или выберите картинку — хранится в приложении')+'</div></div>'}
function addDrawings(id,files){var p=P(id);if(!p||!files.length)return;var m=$('drMsg');if(m)m.textContent='Сохраняю…';
var go=function(i){if(i>=files.length){sv();render();openPart(id);return}var f=files[i];Promise.all([shrink(f,2600,0.88),shrink(f,240,0.7)]).then(function(r){var did='d'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);return FS.put(did,r[0].b).then(function(){(p.dr=p.dr||[]).push({id:did,th:r[1].c.toDataURL('image/jpeg',0.7),t:Date.now()});sv()})}).then(function(){go(i+1)}).catch(function(e){if(m)m.textContent='Не удалось сохранить: '+(e&&e.message||e)})};go(0)}
function view(pid,did){var p=P(pid),x=(p.dr||[]).filter(function(d){return d.id===did})[0];if(!x)return;
var w=document.createElement('div');w.id='nView';w.innerHTML='<img alt=""><div class="vb"><span>'+esc(p.dw||'')+'</span><button id="vDel">Удалить</button><button class="p" id="vX">Закрыть</button></div><div class="vl">Загружаю…</div>';document.body.appendChild(w);
var img=w.querySelector('img'),S={s:1,x:0,y:0},P2=new Map(),ld=0,last=0;
var ap=function(){img.style.transform='translate('+S.x+'px,'+S.y+'px) scale('+S.s+')'};
FS.get(did).then(function(u){var l=w.querySelector('.vl');if(!u){l.textContent='Файл чертежа не найден';return}l.remove();img.src=u});
var close2=function(){w.remove()};$('vX').onclick=close2;
$('vDel').onclick=function(){var b=this;if(!b.classList.contains('arm')){b.classList.add('arm');b.textContent='Точно удалить?';return}FS.del(did);p.dr=p.dr.filter(function(d){return d.id!==did});sv();close2();render();openPart(pid)};
img.addEventListener('pointerdown',function(e){img.setPointerCapture(e.pointerId);P2.set(e.pointerId,[e.clientX,e.clientY]);if(P2.size===2){var a=[].slice.call(P2.values());ld=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1])}
var n=Date.now();if(P2.size===1&&n-last<300){S=S.s>1?{s:1,x:0,y:0}:{s:2.5,x:0,y:0};ap()}last=n});
img.addEventListener('pointermove',function(e){if(!P2.has(e.pointerId))return;var o=P2.get(e.pointerId);P2.set(e.pointerId,[e.clientX,e.clientY]);if(P2.size===1){S.x+=e.clientX-o[0];S.y+=e.clientY-o[1]}else if(P2.size===2){var a=[].slice.call(P2.values()),d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(ld)S.s=Math.max(1,Math.min(8,S.s*d/ld));ld=d}ap()});
['pointerup','pointercancel'].forEach(function(t){img.addEventListener(t,function(e){P2.delete(e.pointerId);ld=0})});
w.addEventListener('wheel',function(e){e.preventDefault();S.s=Math.max(1,Math.min(8,S.s*(e.deltaY<0?1.15:0.87)));ap()},{passive:false})}
/* ---------- send ---------- */
function sendText(h){var m=M(MK)||{a:{},p:{}},rows=[];D.parts.forEach(function(p){var a=m[h][p.id],n0=sumM(a,false),n1=sumM(a,true);if(n0>0)rows.push({p:p,n:n0});if(n1>0)rows.push({p:p,n:n1,ms:1})});
if(!rows.length)return null;
return rows.map(function(r){return (r.p.dw||'')+(r.p.nm?' ('+r.p.nm+')':'')+' — '+qs(r.n)+' шт'+(r.ms?' (многостаночка)':'')}).join('\n')}
function copy(t,cb){var done=function(ok){cb(ok)};try{if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(function(){done(true)},function(){done(fb())});return}}catch(e){}done(fb());
function fb(){try{var ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,t.length);var ok=document.execCommand('copy');ta.remove();return ok}catch(e){return false}}}
function openSend(){var s=sheet('<div class="hd"><div><b>Отправить наряды</b><small>'+mon(MK)+'</small></div><button class="ib" id="nX" aria-label="Закрыть">✕</button></div><div class="seg" id="sdH"><button data-h="a">На аванс</button><button data-h="p">На получку</button></div><textarea id="sdT" readonly style="height:220px"></textarea><div class="row" style="margin:0"><button class="p" id="sdCp">Скопировать</button><button id="sdSh" hidden>Поделиться…</button></div><div class="s" id="sdM"></div>');
var h=HALF,upd=function(){[].forEach.call($('sdH').children,function(b){b.classList.toggle('on',b.dataset.h===h)});var t=sendText(h);$('sdT').value=t||'';$('sdCp').disabled=!t;$('sdM').textContent=t?'':'На '+(h==='a'?'аванс':'получку')+' за '+mon(MK).toLowerCase()+' ничего не записано'};
$('sdH').onclick=function(e){var b=e.target.closest('button');if(b){h=b.dataset.h;upd()}};upd();$('nX').onclick=close;
$('sdCp').onclick=function(){var t=$('sdT').value;if(!t)return;copy(t,function(ok){$('sdM').textContent=ok?'Скопировано — вставьте в сообщение':'Не получилось скопировать: выделите текст выше и скопируйте вручную'})};
if(navigator.share){$('sdSh').hidden=false;$('sdSh').onclick=function(){var t=$('sdT').value;if(t)navigator.share({text:t}).catch(function(){})}}}
/* ---------- events ---------- */
$('nList').addEventListener('click',function(e){var r=e.target.closest('.nr');if(!r)return;var b=e.target.closest('button');if(b&&b.dataset.d){bump(r.dataset.pid,+b.dataset.d);return}openPart(r.dataset.pid)});
$('nHalf').onclick=function(e){var b=e.target.closest('button');if(b){HALF=b.dataset.h;render()}};
$('nOnly').onclick=function(){ONLY=!ONLY;render()};
$('nQ').addEventListener('input',list);
$('nPrev').onclick=function(){MK=shift(MK,-1);render()};$('nNext').onclick=function(){MK=shift(MK,1);render()};
$('nNew').onclick=function(){openForm(null)};$('nSend').onclick=openSend;
[['nCoef','coef'],['nTax','tax'],['nPrem','prem'],['nPremMs','premMs'],['nMsK','msK']].forEach(function(x){$(x[0]).addEventListener('change',function(){var v=num(this.value);if(v!==null&&v>=0){D[x[1]]=v;sv()}render()})});
$('nExp').onclick=function(){var ids=[];D.parts.forEach(function(p){(p.dr||[]).forEach(function(x){ids.push(x.id)})});$('nMsg').textContent=ids.length?'Собираю чертежи…':'';
Promise.all(ids.map(function(i){return FS.get(i).then(function(u){return [i,u]})})).then(function(L){var o=JSON.parse(JSON.stringify(D)),f={};L.forEach(function(x){if(x[1])f[x[0]]=x[1]});o.files=f;
saveFile('naryady_'+curK,'json',JSON.stringify(o),function(m){$('nMsg').textContent=m+(ids.length?' (с чертежами: '+Object.keys(f).length+')':'')})})};
$('nImp').onchange=function(){var f=this.files[0];this.value='';if(!f)return;var r=new FileReader();r.onload=function(){try{var o=JSON.parse(r.result);if(!o||!o.parts||!o.m)throw 0;var fl=o.files||{};delete o.files;D=o;if(D.premMs===undefined)D.premMs=90;if(D.msK===undefined)D.msK=0.8;sv();render();Object.keys(fl).forEach(function(i){FS.putUrl(i,fl[i])});$('nMsg').textContent='Загружено: деталей '+D.parts.length+', месяцев '+Object.keys(D.m).length}catch(e){$('nMsg').textContent='Это не файл нарядов'}};r.readAsText(f)};
/* ---------- start ---------- */
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&SH)close()});
window.NAR={calc:calc,prevPrem:prevPrem,data:function(){return D}};
var filled=Object.keys(D.m).filter(has).sort();if(filled.length)MK=filled[filled.length-1];
$('nRadd').onclick=function(){var v=num($('nRpct').value);if(!(v>0))return;(D.raises=D.raises||[]).push({f:MK,pct:v});D.raises.sort(function(a,b){return a.f<b.f?-1:1});$('nRpct').value='';sv();render()};
$('nRaises').onclick=function(e){var b=e.target.closest('[data-rdel]');if(!b)return;if(!b.classList.contains('arm')){b.classList.add('arm');b.textContent='Отменить?';return}D.raises.splice(+b.dataset.rdel,1);sv();render()};
$('nGear').onclick=function(){var s=sheet('<div class="hd"><div><b>Настройки</b><small>расчёт, резервная копия, обновления</small></div><button class="ib" id="nX" aria-label="Закрыть">✕</button></div>');s.appendChild($('nSetBox'));$('nX').onclick=close};
$('t6').hidden=false;render();
})();
