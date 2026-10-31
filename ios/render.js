const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const svg=fs.readFileSync(process.argv[2],'utf8');
for(const [n,s,pad] of [['icon-180.png',180,0],['icon-192.png',192,0],['icon-512.png',512,0],['maskable-512.png',512,0.1],['ico-256.png',256,0],['ico-48.png',48,0],['ico-32.png',32,0],['ico-16.png',16,0],['preview.png',512,0]]){
const pg=await b.newPage({viewport:{width:s,height:s}});
const inner=pad?`<div style="width:${s}px;height:${s}px;background:#171B1F;display:flex;align-items:center;justify-content:center"><div style="width:${s*(1-2*pad)}px;height:${s*(1-2*pad)}px">${svg.replace('<svg ','<svg width="100%" height="100%" ')}</div></div>`:svg.replace('<svg ','<svg width="'+s+'" height="'+s+'" ');
const round=n.startsWith('ico')||n==='preview.png';
await pg.setContent(`<html><body style="margin:0;background:transparent">${round?`<div style="width:${s}px;height:${s}px;border-radius:${s*0.22}px;overflow:hidden">${inner}</div>`:inner}</body></html>`);
await pg.screenshot({path:process.argv[3]+'/'+n,omitBackground:true});await pg.close()}await b.close()})();
