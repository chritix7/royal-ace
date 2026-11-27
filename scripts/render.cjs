const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const svg=require('./icon.js');
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1024,height:1024}});
for(const m of ["app","full","mask"]){ await p.setContent(`<html><body style="margin:0;background:transparent">${svg(m)}</body></html>`);
 await p.screenshot({path:`${m}.png`,omitBackground:true,clip:{x:0,y:0,width:1024,height:1024}});}
await b.close();})();
