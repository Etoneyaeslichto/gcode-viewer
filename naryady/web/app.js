var $=function(i){return document.getElementById(i)};
var ST={get:function(k,d){try{var v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function saveFile(nm,ext,t,cb){cb=cb||function(){};
if(window.Android&&window.Android.saveFile){cb(window.Android.saveFile(nm+'.'+ext,t));return}
var f=null;try{f=new File([t],nm+'.'+ext,{type:'application/json'})}catch(e){}
if(IOS&&f&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f]}).then(function(){cb('Готово: '+nm+'.'+ext)}).catch(function(e){cb(e&&e.name==='AbortError'?'Отменено':'Не удалось сохранить')});return}
var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'application/json'}));a.download=nm+'.'+ext;document.body.appendChild(a);a.click();a.remove();cb('Сохранено: '+nm+'.'+ext)}
