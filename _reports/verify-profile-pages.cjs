// Browser acceptance for the September 2026 profile refresh. No app dependencies installed.
const {chromium} = require('/Users/russellcole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const out = path.join(__dirname, '2026-09-30-browser');
const live = process.argv.includes('--live');
const types = {'.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.vcf':'text/vcard'};
const server = http.createServer((req,res)=>{
  let rel = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  if(rel.endsWith('/'))rel += 'index.html';
  const target = path.resolve(root, '.'+rel);
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(target,(err,data)=>{res.writeHead(err?404:200, {'Content-Type':types[path.extname(target)]||'application/octet-stream'});res.end(err?'Not found':data);});
});
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 let browser;
 try {
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=live?'https://russellcolevop.github.io':`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const page=await browser.newPage({reducedMotion:'reduce'});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  const rows=[];
  for(const slug of ['', 'dev/','sales/','founders/','investors/','achievements/','hub/']){
   const response=await page.goto(base+'/'+slug,{waitUntil:'networkidle',timeout:45000});
   if(response.status()!==200)throw Error(`${slug} HTTP ${response.status()}`);
   await page.evaluate(()=>document.fonts.ready);
   for(const width of [1440,390]){
    await page.setViewportSize({width,height:900});
    await page.screenshot({path:path.join(out,(live?'live-':'')+(slug.replace('/','')||'root')+'-'+width+'.png')});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    if(overflow)throw Error(`${slug} overflows ${width}`);
   }
   const btn=page.locator('.card-expandable button').first();
   if(await btn.count()){
    await btn.click();
    if(await btn.getAttribute('aria-expanded')!=='true')throw Error(`${slug} card did not open`);
    const panel=page.locator('#'+await btn.getAttribute('aria-controls'));
    if(await panel.evaluate(el=>el.getBoundingClientRect().height)<15)throw Error(`${slug} panel height`);
    await btn.click();
    if(await btn.getAttribute('aria-expanded')!=='false')throw Error(`${slug} card did not close`);
   }
   const metadata=await page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name="description"]').content,canonical:document.querySelector('link[rel="canonical"]').href,image:document.querySelector('meta[property="og:image"]').content}));
   const links=await page.locator('a[href],link[rel="icon"][href]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
   for(const href of links.filter(h=>!h.startsWith('http')&&!h.startsWith('mailto:')&&!h.startsWith('#'))){
    const response=await page.request.get(new URL(href,base+'/'+slug).href);
    if(response.status()!==200)throw Error(`${slug} bad link ${href}: ${response.status()}`);
   }
   rows.push({route:'/'+slug,status:response.status(),overflow:false,metadata});
  }
  if(!live){
   await page.setViewportSize({width:1200,height:630});
   await page.goto(base+'/assets/profile-social-card.html',{waitUntil:'networkidle'});
   await page.screenshot({path:path.join(root,'assets/og-profile-20260930.png')});
  }
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,live?'live-checks.json':'local-checks.json'),JSON.stringify({pages:rows,pageErrors:errors},null,2)+'\n');
  console.log(`PASS: ${rows.length} pages, desktop/mobile, card open/close, local links, metadata, zero page errors`);
 } finally {if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
