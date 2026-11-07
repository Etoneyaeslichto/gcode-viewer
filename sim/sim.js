/* 3D material removal simulation (heightmap) for the Траектория tab */
(function(){
function nf2(v){return String(parseFloat((+v).toFixed(2)))}
var on=false,gl=null,prog=null,buf={},G=null,simIdx=-1,ext32=null,yawS=-0.7,pitS=0.75,zmS=1,pxS=0,pyS=0,play=null,raf=0,dirty=false;
var cvS=$('sim'),btn=$('vs');
function toolsOf(src){var dia={},L=String(src).split('\n'),chg=[];L.forEach(function(l,i){var m=l.match(/\(\s*T(\d+)\s*-[^)]*?\bD\s*([\d.]+)/i);if(m)dia[+m[1]]=+m[2];var t=l.replace(/\([^)]*\)/g,'').toUpperCase().match(/T\s*(\d+)/);if(t&&/M0?6/.test(l.toUpperCase()))chg.push([i+1,+t[1]])});
return function(ln){var t=null;for(var i=0;i<chg.length;i++){if(chg[i][0]<=ln)t=chg[i][1];else break}if(t===null)return 10;if(dia[t])return dia[t];var tl=window.TOOLS&&window.TOOLS.get(t);return tl&&tl.d?+tl.d:10}}
function inPolyS(x,y,Q){var c=false;for(var i=0,j=Q.length-1;i<Q.length;j=i++){var a=Q[i],b=Q[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
/* build stock grid */
function makeGrid(){var P=pts,stk=STK,shape=!stk&&window.MODELAPI&&window.MODELAPI.stockShape?window.MODELAPI.stockShape():null,x0,y0,x1,y1,top,bot,Q=null;
if(stk&&stk.x1!==undefined&&stk.shape&&stk.shape!=='rect'){Q=stockPoly(stk);x0=+stk.x0;y0=+stk.y0;x1=+stk.x1;y1=+stk.y1;top=+stk.zt;bot=+stk.zb}
else if(shape&&shape.Q&&shape.Q.length>2){Q=shape.Q;x0=1e9;y0=1e9;x1=-1e9;y1=-1e9;Q.forEach(function(p){x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])});top=stk&&stk.zt>0?+stk.zt:0;bot=-shape.H}
else if(stk&&stk.x1!==undefined){x0=+stk.x0;y0=+stk.y0;x1=+stk.x1;y1=+stk.y1;top=+stk.zt;bot=+stk.zb}
else{x0=1e9;y0=1e9;x1=-1e9;y1=-1e9;var zmin=0;P.forEach(function(p){if(p.r)return;x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);zmin=Math.min(zmin,p.z)});if(x0>x1)return null;x0-=8;y0-=8;x1+=8;y1+=8;top=0;bot=zmin-3}
var span=Math.max(x1-x0,y1-y0,1),cs=span/254,nx=Math.min(255,Math.max(2,Math.round((x1-x0)/cs)+1)),ny=Math.min(255,Math.max(2,Math.round((y1-y0)/cs)+1)),dx=(x1-x0)/(nx-1),dy=(y1-y0)/(ny-1),H=new Float32Array(nx*ny),E=new Uint8Array(nx*ny);
for(var j=0;j<ny;j++)for(var i=0;i<nx;i++){var k=j*nx+i;H[k]=top;if(Q&&!inPolyS(x0+i*dx,y0+j*dy,Q))E[k]=1}
return {x0:x0,y0:y0,x1:x1,y1:y1,nx:nx,ny:ny,dx:dx,dy:dy,top:top,bot:bot,H:H,E:E,model:!!Q,dia:toolsOf($('src').value)}}
/* sweep one segment of a flat end mill */
function cut(g,o,p,R){var ax=o.x,ay=o.y,Dx=p.x-o.x,Dy=p.y-o.y,L2=Dx*Dx+Dy*Dy,i0=Math.max(0,Math.floor((Math.min(o.x,p.x)-R-g.x0)/g.dx)),i1=Math.min(g.nx-1,Math.ceil((Math.max(o.x,p.x)+R-g.x0)/g.dx)),j0=Math.max(0,Math.floor((Math.min(o.y,p.y)-R-g.y0)/g.dy)),j1=Math.min(g.ny-1,Math.ceil((Math.max(o.y,p.y)+R-g.y0)/g.dy)),Re=Math.max(0.01,R-0.3*Math.min(g.dx,g.dy)),R2=Re*Re,H=g.H,top=Math.min(o.z,p.z);
if(top>=g.top+1e-6&&Math.min(o.z,p.z)>=g.top)return;
for(var j=j0;j<=j1;j++){var cy=g.y0+j*g.dy;for(var i=i0;i<=i1;i++){var cx=g.x0+i*g.dx,k=j*g.nx+i,fx=ax-cx,fy=ay-cy,z;
if(L2<1e-12){if(fx*fx+fy*fy>R2)continue;z=Math.min(o.z,p.z)}
else{var b=2*(fx*Dx+fy*Dy),c=fx*fx+fy*fy-R2,di=b*b-4*L2*c;if(di<0)continue;var sq=Math.sqrt(di),s1=(-b-sq)/(2*L2),s2=(-b+sq)/(2*L2);if(s2<0||s1>1)continue;s1=Math.max(0,s1);s2=Math.min(1,s2);z=Math.min(o.z+(p.z-o.z)*s1,o.z+(p.z-o.z)*s2)}
if(z<H[k])H[k]=Math.max(z,g.bot-0.001)}}}
var PI_=-1,PP=null;
function simTo(n){if(!G||!pts.length)return;if(n<simIdx){G=makeGrid();simIdx=0;PI_=-1;PP=null}if(!G)return;for(var u=Math.max(1,simIdx+1);u<=n&&u<pts.length;u++){var p=pts[u],o=pts[u-1];if(p.brk)continue;cut(G,o,p,G.dia(p.ln)/2)}if(n>simIdx)dirty=true;simIdx=Math.max(simIdx,n);
var nx_=pts[n+1];if(fr>0&&nx_&&!nx_.brk){var tp=tpos(),o2=(PI_===n&&PP)?PP:pts[n];cut(G,o2,tp,G.dia(nx_.ln)/2);PI_=n;PP=tp;dirty=true}}
/* ---------- WebGL ---------- */
function initGL(){gl=cvS.getContext('webgl',{antialias:true})||cvS.getContext('experimental-webgl');if(!gl)return false;
var vs='attribute vec3 p;attribute vec3 n;attribute vec3 c;uniform mat4 M;uniform vec3 Ld;varying vec3 vc;void main(){gl_Position=M*vec4(p,1.0);vec3 nn=normalize(n);float d=max(dot(nn,Ld),0.0);float d2=max(dot(nn,normalize(vec3(-0.4,0.6,0.5))),0.0);vc=c*(0.32+0.58*d+0.18*d2);}',
fs='precision mediump float;varying vec3 vc;void main(){gl_FragColor=vec4(vc,1.0);}';
var sh=function(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o};prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,vs));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);
['p','n','c'].forEach(function(k){buf[k]=gl.createBuffer()});buf.i=gl.createBuffer();return true}
function mat(){var W=cvS.clientWidth,Hh=cvS.clientHeight,g=G,cx=(g.x0+g.x1)/2,cy=(g.y0+g.y1)/2,cz=(g.top+g.bot)/2,r=Math.max(1,Math.hypot(g.x1-g.x0,g.y1-g.y0,g.top-g.bot)/2),s=0.46*Math.min(W,Hh)/r*zmS,
c1=Math.cos(yawS),s1=Math.sin(yawS),cp=Math.cos(pitS),sp=Math.sin(pitS),ax=s/(W/2),ay=s/(Hh/2),k=0.9/r,
r0=[ax*c1,-ax*s1,0,-ax*(c1*cx-s1*cy)+2*pxS/W],r1=[ay*s1*sp,ay*c1*sp,ay*cp,-ay*((s1*cx+c1*cy)*sp+cz*cp)-2*pyS/Hh],r2=[k*s1*cp,k*c1*cp,-k*sp,-k*((s1*cx+c1*cy)*cp-cz*sp)];
return {M:[r0[0],r1[0],r2[0],0, r0[1],r1[1],r2[1],0, r0[2],r1[2],r2[2],0, r0[3],r1[3],r2[3],1]}}
function hexc(h){return [parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255]}
var CS=hexc('#C9CDD2'),CC=hexc('#2BB58A'),CD=hexc('#147A5C'),CW=hexc('#9AA0A6'),CT=hexc('#E07B4F');
var MS=null;
function meshInit(){var g=G,nx=g.nx,ny=g.ny,E=g.E,I=[],W=[];
for(var j2=0;j2<ny-1;j2++)for(var i2=0;i2<nx-1;i2++){var a=j2*nx+i2,b=a+1,c=a+nx,d=c+1;if(E[a]||E[b]||E[c]||E[d])continue;I.push(a,b,d,a,d,c)}
var wall=function(i,j,i2,j2,nxw,nyw){var ka=j*nx+i,kb=j2*nx+i2;if(E[ka]||E[kb])return;W.push(ka,kb,nxw,nyw)};
for(var j3=0;j3<ny;j3++)for(var i3=0;i3<nx;i3++){var k3=j3*nx+i3;if(E[k3])continue;
if(i3<nx-1&&(j3===0||E[k3-nx]||E[k3-nx+1]))wall(i3,j3,i3+1,j3,0,-1);if(i3<nx-1&&(j3===ny-1||E[k3+nx]||E[k3+nx+1]))wall(i3+1,j3,i3,j3,0,1);
if(j3<ny-1&&(i3===0||E[k3-1]||E[k3+nx-1]))wall(i3,j3+1,i3,j3,-1,0);if(j3<ny-1&&(i3===nx-1||E[k3+1]||E[k3+nx+1]))wall(i3,j3,i3,j3+1,1,0)}
var nw=W.length/4,nv=nx*ny+nw*4,base=nx*ny;for(var q=0;q<nw;q++){var v=base+q*4;I.push(v,v+1,v+2,v,v+2,v+3)}
var big=nv>65535;if(big)ext32=ext32||gl.getExtension('OES_element_index_uint');
MS={g:g,P:new Float32Array(nv*3),N:new Float32Array(nv*3),C:new Float32Array(nv*3),W:W,n:I.length,big:big};
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buf.i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,big?new Uint32Array(I):new Uint16Array(I),gl.STATIC_DRAW);dirty=true}
function meshFill(){var g=G,nx=g.nx,ny=g.ny,H=g.H,P=MS.P,N=MS.N,C=MS.C,depth=Math.max(0.5,g.top-g.bot),W=MS.W;
var h=function(i,j){i=i<0?0:i>nx-1?nx-1:i;j=j<0?0:j>ny-1?ny-1:j;return H[j*nx+i]};
for(var j=0;j<ny;j++)for(var i=0;i<nx;i++){var k=j*nx+i,z=H[k],o=k*3;P[o]=g.x0+i*g.dx;P[o+1]=g.y0+j*g.dy;P[o+2]=z;N[o]=-(h(i+1,j)-h(i-1,j))/(2*g.dx);N[o+1]=-(h(i,j+1)-h(i,j-1))/(2*g.dy);N[o+2]=1;
if(z>=g.top-0.005){C[o]=CS[0];C[o+1]=CS[1];C[o+2]=CS[2]}else{var t=Math.min(1,(g.top-z)/depth);C[o]=CC[0]+(CD[0]-CC[0])*t;C[o+1]=CC[1]+(CD[1]-CC[1])*t;C[o+2]=CC[2]+(CD[2]-CC[2])*t}}
for(var q=0,o2=nx*ny*3;q<W.length;q+=4){var ka=W[q],kb=W[q+1],xa=g.x0+(ka%nx)*g.dx,ya=g.y0+Math.floor(ka/nx)*g.dy,xb=g.x0+(kb%nx)*g.dx,yb=g.y0+Math.floor(kb/nx)*g.dy,vv=[xa,ya,H[ka],xb,yb,H[kb],xb,yb,g.bot,xa,ya,g.bot];for(var r=0;r<12;r++)P[o2+r]=vv[r];for(var r2=0;r2<4;r2++){N[o2+r2*3]=W[q+2];N[o2+r2*3+1]=W[q+3];N[o2+r2*3+2]=0;C[o2+r2*3]=CW[0];C[o2+r2*3+1]=CW[1];C[o2+r2*3+2]=CW[2]}o2+=12}}
function toolMesh(){var P=[],N=[],C=[],I=[];if(!pts.length||!G)return null;var t=tpos(),R=G.dia(t.ln)/2,hc=Math.max(R*3,8),seg=24;
var add=function(r0,z0,r1,z1,col){var v0=P.length/3;for(var q=0;q<=seg;q++){var an=q/seg*Math.PI*2,cx=Math.cos(an),sy=Math.sin(an);P.push(t.x+r0*cx,t.y+r0*sy,z0,t.x+r1*cx,t.y+r1*sy,z1);N.push(cx,sy,0.2,cx,sy,0.2);C.push(col[0],col[1],col[2],col[0],col[1],col[2])}for(var q3=0;q3<seg;q3++){var a2=v0+q3*2;I.push(a2,a2+2,a2+1,a2+1,a2+2,a2+3)}};
add(R,t.z,R,t.z+hc,CT);var sr=Math.max(R*0.85,R-1);add(sr,t.z+hc,sr,t.z+hc*2.2,[.62,.65,.68]);
var vb=P.length/3;P.push(t.x,t.y,t.z);N.push(0,0,-1);C.push(CT[0]*.8,CT[1]*.8,CT[2]*.8);for(var q4=0;q4<=seg;q4++){var an2=q4/seg*Math.PI*2;P.push(t.x+R*Math.cos(an2),t.y+R*Math.sin(an2),t.z);N.push(0,0,-1);C.push(CT[0]*.8,CT[1]*.8,CT[2]*.8)}for(var q5=0;q5<seg;q5++)I.push(vb,vb+1+q5,vb+2+q5);
return {P:new Float32Array(P),N:new Float32Array(N),C:new Float32Array(C),I:new Uint16Array(I)}}
function bindDraw(B,P,N,C){[['p',P],['n',N],['c',C]].forEach(function(x){gl.bindBuffer(gl.ARRAY_BUFFER,B[x[0]]);if(x[1])gl.bufferData(gl.ARRAY_BUFFER,x[1],gl.DYNAMIC_DRAW);var l=gl.getAttribLocation(prog,x[0]);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,gl.FLOAT,false,0,0)})}
function render(){raf=0;if(!on||!G)return;var dpr=window.devicePixelRatio||1,W=cvS.clientWidth,Hh=cvS.clientHeight;if(!W||!Hh)return;if(cvS.width!==Math.round(W*dpr)||cvS.height!==Math.round(Hh*dpr)){cvS.width=Math.round(W*dpr);cvS.height=Math.round(Hh*dpr)}
gl.viewport(0,0,cvS.width,cvS.height);var bgc=getComputedStyle(document.documentElement).getPropertyValue('--sf').trim()||'#262624';var b=hexc(bgc.length===7?bgc:'#262624');gl.clearColor(b[0],b[1],b[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
gl.useProgram(prog);gl.uniformMatrix4fv(gl.getUniformLocation(prog,'M'),false,new Float32Array(mat().M));gl.uniform3fv(gl.getUniformLocation(prog,'Ld'),new Float32Array([0.35,-0.45,0.82]));
if(!MS||MS.g!==G)meshInit();if(dirty){meshFill();bindDraw(buf,MS.P,MS.N,MS.C);dirty=false}else bindDraw(buf);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buf.i);gl.drawElements(gl.TRIANGLES,MS.n,MS.big?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT,0);
var tm=toolMesh();if(tm){if(!buf.tp){buf.tp={p:gl.createBuffer(),n:gl.createBuffer(),c:gl.createBuffer()};buf.ti=gl.createBuffer()}bindDraw(buf.tp,tm.P,tm.N,tm.C);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buf.ti);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,tm.I,gl.DYNAMIC_DRAW);gl.drawElements(gl.TRIANGLES,tm.I.length,gl.UNSIGNED_SHORT,0)}
var t=pts[Math.min(idx,pts.length-1)];$('simInfo').textContent=(STK?(STK.shape==='cyl'?'Заготовка: круг Ø'+nf2(STK.x1-STK.x0):STK.shape==='model'?'Заготовка по контуру 3D-модели':'Заготовка: брусок '+nf2(STK.x1-STK.x0)+'×'+nf2(STK.y1-STK.y0)+'×'+nf2(STK.zt-STK.zb)):G.model?'Заготовка по 3D-модели':'Заготовка по габаритам траектории (задайте её в «Операциях»)')+' · фреза Ø'+G.dia(t?t.ln:0)}
function req(){if(!raf)raf=requestAnimationFrame(render)}
function update(){if(!on)return;if(!G){G=makeGrid();simIdx=0}simTo(idx);req()}
function reset(){G=null;simIdx=-1;if(on)update()}
function setOn(v){on=v;btn.classList.toggle('on',on);cvS.hidden=!on;$('cv').style.visibility=on?'hidden':'';$('simInfo').hidden=!on;if(on){if(!gl&&!initGL()){on=false;cvS.hidden=true;$('cv').style.visibility='';$('ms').textContent='Симуляция не поддерживается на этом устройстве';return}G=null;simIdx=-1;update()}}
btn.onclick=function(){setOn(!on)};
/* hook into the viewer */
var _run=run;window.run=run=function(s){_run(s);reset()};
var _draw=draw;window.draw=draw=function(){_draw();update()};
/* camera */
var P2=new Map(),ld=0;var pd=function(){var a=Array.from(P2.values());return a.length<2?0:Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1])};
cvS.addEventListener('pointerdown',function(e){cvS.setPointerCapture(e.pointerId);P2.set(e.pointerId,[e.clientX,e.clientY]);ld=pd()});
cvS.addEventListener('pointermove',function(e){if(!P2.has(e.pointerId))return;var o=P2.get(e.pointerId),dx=e.clientX-o[0],dy=e.clientY-o[1];if(P2.size===1){yawS+=dx*0.01;pitS=Math.min(1.55,Math.max(-0.2,pitS+dy*0.01))}else{pxS+=dx/2;pyS+=dy/2}P2.set(e.pointerId,[e.clientX,e.clientY]);if(P2.size===2){var d=pd();if(ld)zmS=Math.max(0.3,Math.min(30,zmS*d/ld));ld=d}req()});
['pointerup','pointercancel'].forEach(function(t){cvS.addEventListener(t,function(e){P2.delete(e.pointerId);ld=0})});
cvS.addEventListener('wheel',function(e){e.preventDefault();zmS=Math.max(0.3,Math.min(30,zmS*(e.deltaY<0?1.1:0.9)));req()},{passive:false});
var _vt=$('vt').onclick,_vi=$('vi').onclick,_vf=$('vf').onclick;
$('vt').onclick=function(){if(on){yawS=0;pitS=Math.PI/2-0.001;req()}else _vt()};$('vi').onclick=function(){if(on){yawS=-0.7;pitS=0.75;req()}else _vi()};$('vf').onclick=function(){if(on){zmS=1;pxS=0;pyS=0;req()}else _vf()};
window.addEventListener('resize',function(){if(on)req()});
/* play */
var pb=$('sPlay'),sb=$('sSpd'),SP=[1,2,5,10,20,50,100,200,500],mult=0,lastT=0;
function autoMult(){var T=bb&&bb.time?bb.time*60:60,m=T/40;for(var i=0;i<SP.length;i++)if(SP[i]>=m)return SP[i];return SP[SP.length-1]}
function showSpd(){if(sb)sb.textContent='×'+(mult||autoMult())}
function stopP(){if(play){cancelAnimationFrame(play);play=null}pb.classList.remove('on');pb.textContent='▶';pb.setAttribute('aria-label','Воспроизвести')}
function tick(ts){if(!play)return;var dt=lastT?Math.min(0.1,(ts-lastT)/1000):0;lastT=ts;var bud=dt*(mult||autoMult()),g0=Math.max(1000,mach().g0)/60,guard=0;
while(bud>0&&idx<pts.length-1&&guard++<100000){var a=pts[idx],b=pts[idx+1];if(b.brk){idx++;fr=0;continue}var L=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);if(L<1e-6){idx++;fr=0;continue}var v=b.r?g0:Math.max(1,b.f||500)/60,rem=L*(1-fr)/v;if(rem<=bud){bud-=rem;idx++;fr=0}else{fr+=bud*v/L;bud=0}}
$('sl').value=idx;draw();if(idx>=pts.length-1){fr=0;stopP();return}play=requestAnimationFrame(tick)}
pb.onclick=function(){if(play){stopP();draw();return}if(!pts.length)return;if(idx>=pts.length-1){idx=0;fr=0}pb.classList.add('on');pb.textContent='❚❚';pb.setAttribute('aria-label','Пауза');lastT=0;showSpd();play=requestAnimationFrame(tick)};
if(sb){sb.onclick=function(){var c=mult||autoMult(),k=SP.indexOf(c);mult=SP[(k+1)%SP.length];showSpd()};showSpd()}
['sl','sPrev','sNext','sStart'].forEach(function(id){var e=$(id);if(e)e.addEventListener('pointerdown',function(){if(play)stopP()})});
var _run2=run;window.run=run=function(s){if(play)stopP();_run2(s);if(!mult)showSpd()};
window.SIM={grid:function(){return G},on:function(){return on},setOn:setOn};
})();
