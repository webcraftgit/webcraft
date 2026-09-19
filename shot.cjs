const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/opt/google/chrome/chrome',
    headless: 'new',
    protocolTimeout: 180000,
    args: ['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage','--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
  await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  page.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text()); });
  page.on('response',r=>{ if(r.status()>=400) errs.push(r.status()+' '+r.url()); });

  await page.goto('http://localhost:3123/#showcase',{waitUntil:'domcontentloaded'});
  await new Promise(r=>setTimeout(r,2500));
  // open the blackwood card fullscreen
  const opened = await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('button,[role=button]')];
    const c=cards.find(b=>/blackwood/i.test(b.textContent||'')||/blackwood/i.test(b.getAttribute('aria-label')||''));
    if(c){ c.scrollIntoView({block:'center'}); c.click(); return true; }
    return false;
  });
  console.log('opened card:',opened);
  await new Promise(r=>setTimeout(r,9000));
  const info = await page.evaluate(()=>{
    const cv=[...document.querySelectorAll('canvas')].map(c=>({w:c.width,h:c.height}));
    const sc=document.querySelector('[data-lenis-prevent]');
    return {canvases:cv, scrollH: sc? sc.scrollHeight:null, clientH: sc? sc.clientHeight:null};
  });
  console.log(JSON.stringify(info));
  const sc = await page.$('[data-lenis-prevent]');
  for (const p of (process.env.PS||"0").split(",").map(Number)) {
    await page.evaluate((p)=>{
      const s=document.querySelector('[data-lenis-prevent]');
      s.scrollTop = (s.scrollHeight-s.clientHeight)*p;
    },p);
    await new Promise(r=>setTimeout(r,+(process.env.W||15000)));
    await page.screenshot({path:`/tmp/bw_${String(p).replace('.','_')}.png`});
  }
  console.log('errors:',JSON.stringify([...new Set(errs)].slice(0,12),null,1));
  await browser.close();
})();
