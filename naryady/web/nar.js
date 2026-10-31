(function(){
var $=function(i){return document.getElementById(i)};
var MN=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
var MNp=['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре'];
var MNg=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
var SEED=__SEED__;
var D=ST.get('nar',null);if(!D||!D.parts){D=JSON.parse(JSON.stringify(SEED));ST.set('nar',D)}if(!D.m)D.m={};
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
function price(p){return fixed(p)?+p.fx:(+p.b||0)*D.coef}
function M(k,make){if(!D.m[k]&&make)D.m[k]={a:{},p:{}};var m=D.m[k];if(m){m.a=m.a||{};m.p=m.p||{}}return m}
function sum(a){var s=0;(a||[]).forEach(function(x){s+=+x||0});return s}
function q(k,h,id){var m=M(k);return m?sum(m[h][id]):0}
function gross(k,h){var m=M(k),s=0;if(!m)return 0;for(var id in m[h]){var p=P(id);if(p)s+=price(p)*sum(m[h][id])}return s}
function cnt(k,h){var m=M(k),s=0;if(!m)return 0;for(var id in m[h])if(P(id))s+=sum(m[h][id]);return s}
function has(k){return cnt(k,'a')+cnt(k,'p')>0}
function calc(k){var ga=gross(k,'a'),gp=gross(k,'p'),t=1-D.tax/100,na=ga*t,np=gp*t;return {ga:ga,gp:gp,na:na,np:np,g:ga+gp,n:na+np,pr:(na+np)*D.prem/100}}
function prevPrem(k){var m=M(k);if(m&&m.ppo!==null&&m.ppo!==undefined)return {v:+m.ppo,man:1};var pk=shift(k,-1);return {v:has(pk)?calc(pk).pr:0,man:0}}
/* ---------- render ---------- */
function render(){$('nMon').textContent=mon(MK);var c=calc(MK),pp=prevPrem(MK),tot=c.n+pp.v,pk=shift(MK,-1),nk=shift(MK,1);
$('nTot').textContent=rub(tot);$('nTotSub').textContent='наряды '+rub(c.n)+' + премия за '+monl(pk)+' '+rub(pp.v);
var cell=function(t,v,s,cls){return '<div'+(cls?' class="'+cls+'"':'')+'><small>'+t+'</small><b>'+v+'</b>'+(s?'<i>'+s+'</i>':'')+'</div>'};
$('nGr').innerHTML=cell('Аванс',rub(c.ga),'чистыми '+rub(c.na))+cell('Получка',rub(c.gp),'чистыми '+rub(c.np))+
cell('Наряды за месяц',rub(c.g),'после налога '+rub(c.n))+cell('Премия '+D.prem+'% за этот месяц',rub(c.pr),'придёт в '+MNp[+nk.slice(5)-1],'acc')+
'<div><small>Премия за '+monl(pk)+'</small><b>'+rub(pp.v)+'</b><i>'+(pp.man?'вписана вручную':'из нарядов за '+monl(pk))+' · <button class="lnk" id="nPPed">изменить</button></i></div>'+
cell('Наряды + премия',rub(c.n+c.pr),'после налога, этого месяца')+
cell('Сделано деталей',qs(cnt(MK,'a')+cnt(MK,'p'))+' шт','аванс '+qs(cnt(MK,'a'))+' · получка '+qs(cnt(MK,'p')),'wide');
$('nPPed').onclick=openPP;
[].forEach.call($('nHalf').children,function(b){b.classList.toggle('on',b.dataset.h===HALF)});$('nOnly').classList.toggle('on',ONLY);$('nOnly').classList.toggle('p',ONLY);
$('nCoef').value=String(D.coef).replace('.',',');$('nTax').value=String(D.tax).replace('.',',');$('nPrem').value=String(D.prem).replace('.',',');
list()}
function list(){var f=String($('nQ').value||'').trim().toLowerCase(),L=D.parts.filter(function(p){var t=(p.dw+' '+p.nm).toLowerCase();if(f&&t.indexOf(f)<0)return false;if(ONLY&&q(MK,'a',p.id)+q(MK,'p',p.id)<=0)return false;return true});
L=L.map(function(p,i){return {p:p,i:i,o:q(MK,HALF,p.id)>0?0:1}}).sort(function(a,b){return a.o-b.o||a.i-b.i});
$('nList').innerHTML=L.length?L.map(function(x){var p=x.p,n=q(MK,HALF,p.id),o=q(MK,HALF==='a'?'p':'a',p.id);
return '<div class="nr'+(n>0?' has':'')+'" data-pid="'+p.id+'"><div class="t"><b>'+esc(p.dw||'без номера')+'</b><small>'+(p.nm?esc(p.nm)+' · ':'')+'<em>'+rub(price(p))+'</em>'+(o>0?' · '+(HALF==='a'?'получка ':'аванс ')+qs(o):'')+'</small></div><div class="nq"><button data-d="-1" aria-label="Минус">−</button><span class="'+(n>0?'':'z')+'">'+qs(n)+'</span><button data-d="1" aria-label="Плюс">+</button></div></div>'}).join(''):'<div class="s" style="padding:12px 4px">'+(ONLY?'В этом месяце на '+HN[HALF].toLowerCase()+' ещё ничего не записано':'Ничего не найдено')+'</div>'}
/* quick ± changes the last batch of the current half */
function bump(id,d){var m=M(MK,1),a=m[HALF][id]=m[HALF][id]||[];if(d>0){if(a.length)a[a.length-1]+=1;else a.push(1)}else{if(!a.length)return;a[a.length-1]-=1;if(a[a.length-1]<=0)a.pop()}if(!a.length)delete m[HALF][id];sv();render()}
/* ---------- sheets ---------- */
var SH=null;
function sheet(html){close();var bg=document.createElement('div');bg.id='nSheetBg';var s=document.createElement('div');s.id='nSheet';s.innerHTML='<div class="grab"></div>'+html;bg.onclick=close;document.body.appendChild(bg);document.body.appendChild(s);SH=s;return s}
function close(){['nSheet','nSheetBg'].forEach(function(i){var e=$(i);if(e)e.remove()});SH=null}
function openPart(id){var p=P(id);if(!p)return;
var blk=function(h){var a=(M(MK)||{a:{},p:{}})[h][id]||[],n=sum(a);return '<div class="nbk'+(h===HALF?' cur':'')+'"><div class="tt"><b>'+HN[h]+'</b><span>'+qs(n)+' шт · '+rub(n*price(p))+'</span></div>'+(a.length?'<div class="nbat">'+a.map(function(v,i){return '<span>'+qs(v)+'<button data-del="'+h+':'+i+'" aria-label="Убрать">✕</button></span>'}).join('')+'</div>':'')+'<div class="nadd"><label class="f"><span>Добавить</span><input id="nIn_'+h+'" inputmode="decimal" placeholder="шт"></label><button class="p" data-add="'+h+'">+</button></div></div>'};
var s=sheet('<div class="hd"><div><b>'+esc(p.dw||'без номера')+'</b><small>'+esc(p.nm||'')+'</small><small>'+(fixed(p)?'конечная цена '+rub(price(p))+' (своя)':'цена '+String(p.b||0).replace('.',',')+' × '+String(D.coef).replace('.',',')+' = '+rub(price(p)))+'</small></div><button class="ib" id="nX" aria-label="Закрыть">✕</button></div>'+blk('a')+blk('p')+'<div class="s">Количество за '+mon(MK).toLowerCase()+'. Каждое добавление — отдельная партия, лишнюю уберите крестиком.</div><div class="row" style="margin:0"><button id="nEd">Изменить деталь</button></div>');
$('nX').onclick=close;$('nEd').onclick=function(){openForm(id)};
s.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
if(b.dataset.add){var h=b.dataset.add,v=num($('nIn_'+h).value);if(!(v>0))return;var m=M(MK,1);(m[h][id]=m[h][id]||[]).push(v);sv();render();openPart(id)}
if(b.dataset.del){var hp=b.dataset.del.split(':'),m2=M(MK,1),a=m2[hp[0]][id]||[];a.splice(+hp[1],1);if(!a.length)delete m2[hp[0]][id];sv();render();openPart(id)}});
['a','p'].forEach(function(h){$('nIn_'+h).addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();s.querySelector('[data-add="'+h+'"]').click()}})})}
function openForm(id){var p=id?P(id):{dw:'',nm:'',b:'',fx:null},fx=fixed(p);
var s=sheet('<div class="hd"><div><b>'+(id?'Изменить деталь':'Новая деталь')+'</b></div><button class="ib" id="nX" aria-label="Закрыть">✕</button></div>'+
'<label class="f txt"><span>№ по чертежу</span><input id="fDw" value="'+esc(p.dw)+'" placeholder="170.0206-41"></label>'+
'<label class="f txt"><span>Название</span><input id="fNm" value="'+esc(p.nm)+'" placeholder="для себя"></label>'+
'<label class="f"><span>Цена</span><input id="fB" inputmode="decimal" value="'+(p.b===null||p.b===undefined?'':String(p.b).replace('.',','))+'" placeholder="0"></label>'+
'<label class="sw"><span>Своя конечная цена<small>без умножения на коэффициент</small></span><input type="checkbox" id="fFxOn"'+(fx?' checked':'')+'><i></i></label>'+
'<label class="f" id="fFxW"'+(fx?'':' hidden')+'><span>Конечная цена</span><input id="fFx" inputmode="decimal" value="'+(fx?String(p.fx).replace('.',','):'')+'"></label>'+
'<div class="s" id="fPv"></div><div class="row" style="margin:0"><button class="p" id="fOk">Сохранить</button>'+(id?'<button id="fDel" class="danger">Удалить деталь</button>':'')+'</div>');
var pv=function(){var on=$('fFxOn').checked,b=num($('fB').value)||0,f=num($('fFx').value);$('fFxW').hidden=!on;$('fPv').textContent='Конечная цена: '+rub(on&&f!==null?f:b*D.coef)+(on?'':' ('+String(b).replace('.',',')+' × '+String(D.coef).replace('.',',')+')')};
['fB','fFx'].forEach(function(i){$(i).addEventListener('input',pv)});$('fFxOn').addEventListener('change',pv);pv();
$('nX').onclick=close;
$('fOk').onclick=function(){var dw=$('fDw').value.trim(),nm=$('fNm').value.trim();if(!dw&&!nm){$('fPv').textContent='Впишите номер по чертежу или название';return}
var o=id?P(id):{id:'p'+Date.now().toString(36)};o.dw=dw;o.nm=nm;o.b=num($('fB').value);o.fx=$('fFxOn').checked?num($('fFx').value):null;if(!id)D.parts.unshift(o);sv();render();if(id)openPart(id);else close()};
if(id)$('fDel').onclick=function(){var b=this;if(!b.classList.contains('arm')){b.classList.add('arm');b.textContent='Точно удалить? Нажмите ещё раз';return}
D.parts=D.parts.filter(function(x){return x.id!==id});Object.keys(D.m).forEach(function(k){delete D.m[k].a[id];delete D.m[k].p[id]});sv();close();render()}}
function openPP(){var m=M(MK),pk=shift(MK,-1),auto=has(pk)?calc(pk).pr:0;
sheet('<div class="hd"><div><b>Премия за '+monl(pk)+'</b><small>приходит в '+mon(MK).toLowerCase()+'</small></div><button class="ib" id="nX" aria-label="Закрыть">✕</button></div><div class="s">Автоматически: '+D.prem+'% от нарядов за '+monl(pk)+' после налога = '+rub(auto)+(has(pk)?'':' (за '+monl(pk)+' в приложении нет записей)')+'. Если пришло другое число — впишите его.</div><label class="f"><span>Сумма премии</span><input id="ppV" inputmode="decimal" value="'+(m&&m.ppo!=null?String(m.ppo).replace('.',','):'')+'" placeholder="'+String(Math.round(auto*100)/100).replace('.',',')+'"></label><div class="row" style="margin:0"><button class="p" id="ppOk">Сохранить</button><button id="ppAuto">Считать автоматически</button></div>');
$('nX').onclick=close;$('ppOk').onclick=function(){var v=num($('ppV').value);var mm=M(MK,1);if(v===null)delete mm.ppo;else mm.ppo=v;sv();close();render()};
$('ppAuto').onclick=function(){var mm=M(MK);if(mm)delete mm.ppo;sv();close();render()}}
/* ---------- send ---------- */
function sendText(h){var m=M(MK)||{a:{},p:{}},rows=[];D.parts.forEach(function(p){var n=sum(m[h][p.id]);if(n>0)rows.push({p:p,n:n})});
if(!rows.length)return null;var tot=0;rows.forEach(function(r){tot+=r.n});
return 'Наряды на '+(h==='a'?'аванс':'получку')+', '+mon(MK).toLowerCase()+'\n'+rows.map(function(r,i){return (i+1)+'. '+(r.p.dw||'')+(r.p.nm?' ('+r.p.nm+')':'')+' — '+qs(r.n)+' шт'}).join('\n')+'\nВсего: '+qs(tot)+' шт'}
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
[['nCoef','coef'],['nTax','tax'],['nPrem','prem']].forEach(function(x){$(x[0]).addEventListener('change',function(){var v=num(this.value);if(v!==null&&v>=0){D[x[1]]=v;sv()}render()})});
$('nExp').onclick=function(){saveFile('naryady_'+curK,'json',JSON.stringify(D),function(m){$('nMsg').textContent=m})};
$('nImp').onchange=function(){var f=this.files[0];this.value='';if(!f)return;var r=new FileReader();r.onload=function(){try{var o=JSON.parse(r.result);if(!o||!o.parts||!o.m)throw 0;D=o;sv();render();$('nMsg').textContent='Загружено: деталей '+D.parts.length+', месяцев '+Object.keys(D.m).length}catch(e){$('nMsg').textContent='Это не файл нарядов'}};r.readAsText(f)};
/* ---------- start ---------- */
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&SH)close()});
window.NAR={calc:calc,prevPrem:prevPrem,data:function(){return D}};
$('t6').hidden=false;render();
})();
