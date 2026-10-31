(function(){
var API='https://api.github.com/repos/Etoneyaeslichto/gcode-viewer/releases?per_page=100',REL='https://github.com/Etoneyaeslichto/gcode-viewer/releases',A=window.Android;
function ver(s){var m=String(s||'').match(/(\d+)\.(\d+)\.(\d+)/);return m?[+m[1],+m[2],+m[3]]:null}
function newer(a,b){for(var i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i]}return false}
var cur=null;try{cur=A&&A.getVersion?ver(A.getVersion()):null}catch(e){}
if(!A){$('upVer').textContent='Обновляется сама при запуске с интернетом';$('upChk').hidden=true;return}
$('upVer').textContent=cur?'Версия '+cur.join('.'):'Версия неизвестна';
function open(u){if(A&&A.openUrl)A.openUrl(u);else window.open(u,'_blank')}
$('upChk').onclick=function(){var b=this,m=$('upMsg'),g=$('upGet');g.hidden=true;b.disabled=true;m.textContent='Проверяю…';
fetch(API,{headers:{Accept:'application/vnd.github+json'}}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(L){
var j=null,nv=null;(L||[]).forEach(function(x){if(String(x.tag_name).indexOf('naryady-v')!==0||x.draft)return;var v=ver(x.tag_name);if(v&&(!nv||newer(v,nv))){nv=v;j=x}});if(!j)throw 0;
if(cur&&!newer(nv,cur)){m.textContent='Установлена последняя версия';return}
var a=(j.assets||[]).filter(function(x){return x.name.slice(-4)==='.apk'})[0];
m.textContent='Доступна версия '+nv.join('.')+'. Наряды сохранятся.';g.hidden=false;
g.onclick=function(){if(!(A.installUpdate&&a)){open(a?a.browser_download_url:REL);return}g.disabled=b.disabled=true;m.textContent='Скачиваю…';A.installUpdate(a.browser_download_url)}
}).catch(function(){m.textContent='Не удалось проверить: нет интернета или GitHub недоступен'}).then(function(){b.disabled=false})};
window.updProgress=function(s,v){var m=$('upMsg');if(s==='p')m.textContent='Скачиваю… '+v+'%';else if(s==='i'){m.textContent=v;$('upGet').disabled=$('upChk').disabled=false}else{m.textContent='Ошибка обновления: '+v;$('upGet').disabled=$('upChk').disabled=false}};
})();
