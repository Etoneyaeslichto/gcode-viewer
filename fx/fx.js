(function(){var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,B=document.body,sp=document.getElementById('splash');
if(sp){if(RM){sp.remove();B.classList.remove('boot')}else setTimeout(function(){sp.classList.add('out');B.classList.remove('boot');B.classList.add('enter');setTimeout(function(){sp.remove()},500);setTimeout(function(){B.classList.remove('enter')},900)},1450)}else B.classList.remove('boot');
if(RM||!Element.prototype.animate)return;
var E='cubic-bezier(.2,.8,.2,1)',an=function(el,kf,o){try{el.animate(kf,o)}catch(e){}};
var stag=function(list,d,max){[].slice.call(list,0,max||10).forEach(function(c,i){if(c.offsetParent===null&&c.tagName!=='DETAILS')return;an(c,[{opacity:0,transform:'translateY('+(d||12)+'px)'},{opacity:1,transform:'none'}],{duration:340,delay:i*35,easing:E,fill:'backwards'})})};
var cur=1;for(var k=1;k<=5;k++){var s=document.getElementById('t'+k);if(s&&!s.hidden)cur=k}
var mo=new MutationObserver(function(ms){ms.forEach(function(m){var t=m.target;if(m.attributeName!=='hidden'||t.hidden)return;
var n=+(t.id||'').replace('t','');if(/^t[1-5]$/.test(t.id)){var dir=n>cur?1:-1;cur=n;an(t,[{opacity:0,transform:'translateX('+(dir*18)+'px)'},{opacity:1,transform:'none'}],{duration:280,easing:E});stag(t.children,10,8)}
else if(t.id==='opEd'){an(t,[{opacity:0,transform:'translateX(24px)'},{opacity:1,transform:'none'}],{duration:300,easing:E});stag(t.children,10,8)}
else if(t.id==='opView'){an(t,[{opacity:0,transform:'translateX(-24px)'},{opacity:1,transform:'none'}],{duration:300,easing:E})}})});
['t1','t2','t3','t4','t5','opEd','opView'].forEach(function(id){var e=document.getElementById(id);if(e)mo.observe(e,{attributes:true,attributeFilter:['hidden']})});
var ol=document.getElementById('opList'),last=ol?ol.children.length:0;
if(ol)new MutationObserver(function(){var n=ol.children.length;if(n>last&&last>=0){var c=ol.children[n-1];if(c)an(c,[{opacity:0,transform:'scale(.92)'},{opacity:1,transform:'none'}],{duration:380,easing:'cubic-bezier(.3,1.5,.5,1)'})}last=n}).observe(ol,{childList:true});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.tabs .tb');if(!b)return;var r=b.getBoundingClientRect(),dot=document.createElement('span');dot.style.cssText='position:fixed;left:'+(e.clientX-4)+'px;top:'+(e.clientY-4)+'px;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.55);pointer-events:none;z-index:400';document.body.appendChild(dot);an(dot,[{transform:'scale(1)',opacity:.8},{transform:'scale('+(Math.max(r.width,r.height)/3)+')',opacity:0}],{duration:420,easing:'ease-out'});setTimeout(function(){dot.remove()},430)},true);
var go=document.getElementById('go');if(go)go.addEventListener('click',function(){var c=document.getElementById('cv');if(c&&c.offsetParent)an(c,[{opacity:.3,transform:'scale(.98)'},{opacity:1,transform:'none'}],{duration:350,easing:E})});
})();
