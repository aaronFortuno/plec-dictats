const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLEC_NODE_MODULES?require('node:path').join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
const fakeAnalytics=`(()=>{let s={status:'disabled',reason:'gpc'},listeners=[];window.testAnalyticsState=n=>{s=n;listeners.forEach(f=>f(s));};window.PlecAnalytics={getState:()=>s,subscribe:f=>{listeners.push(f);f(s);},refresh:()=>s,track(){},reportState:()=>'idle',reportAudio:async()=>true,disable:()=>window.testAnalyticsState({status:'disabled',reason:'local'}),allowTemporarily:async()=>window.testAnalyticsState({status:'ready',reason:''})};})();`;
(async()=>{fs.mkdirSync('output',{recursive:true});const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(Error('Emulated windowed mode'));});
 await p.goto('http://127.0.0.1:4176/ca/?seed=ADZ52356A');await p.waitForSelector('#sheet-preview svg');await p.waitForTimeout(300);
 for(let i=0;i<6;i++)await p.locator('#zoom-in').tap();await p.waitForTimeout(250);
 const cdp=await p.context().newCDPSession(p),host=await p.locator('#paper-viewport').boundingBox(),cx=host.x+host.width/2,cy=host.y+host.height/2;
 const read=()=>p.locator('#sheet-preview').evaluate(el=>({x:parseFloat(el.style.getPropertyValue('--pan-x')),y:parseFloat(el.style.getPropertyValue('--pan-y')),zoom:parseFloat(el.style.getPropertyValue('--zoom'))}));
 const start=await read();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1}]});
 for(let n=1;n<=8;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx+n*9,y:cy+n*8,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);const moved=await read();assert(moved.x>start.x+50&&moved.y>start.y+45,'Native touch pans in both axes after button zoom');
 await p.screenshot({path:'output/preview124-touch-pan.png'});
 await p.locator('#zoom-fit').tap();await p.waitForTimeout(250);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-30,y:cy,id:1},{x:cx+30,y:cy,id:2}]});
 for(let n=1;n<=8;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-30-n*5,y:cy,id:1},{x:cx+30+n*5,y:cy,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);assert((await read()).zoom>2,'Native two-finger gesture zooms the sheet');
 await p.locator('#zoom-fit').tap();await p.waitForTimeout(250);assert.equal((await read()).zoom,1);assert.equal((await read()).x,0);assert(!await p.locator('#paper-viewport').evaluate(el=>el.classList.contains('is-panning')));
 await p.setViewportSize({width:1440,height:900});await p.reload();await p.waitForSelector('#sheet-preview svg');await p.waitForTimeout(250);
 await p.locator('#paper-viewport').hover();const z=(await read()).zoom;await p.mouse.wheel(0,80);await p.waitForTimeout(250);assert.equal((await read()).zoom,z);assert(await p.locator('#zoom-scroll-hint').isVisible());await p.keyboard.down('Control');await p.mouse.wheel(0,-100);await p.keyboard.up('Control');assert((await read()).zoom>z);
 await p.route('**/analytics.js?*',r=>r.fulfill({contentType:'text/javascript',body:fakeAnalytics}));
 // A fresh checkout has no generated output/audio index. Use the committed
 // recording metadata explicitly rather than depending on the author's files.
 await p.route('**/output/audio/review-manifest.json',r=>r.fulfill({json:require('../audio/review-manifest.json')}));
 await p.addInitScript(()=>Object.defineProperty(navigator,'brave',{value:{isBrave:async()=>true},configurable:true}));
 await p.reload();await p.waitForSelector('#sheet-preview svg');await p.locator('#catalog-open').click();await p.waitForSelector('.pronunciation-row');await p.waitForFunction(()=>document.querySelector('.report-control')?.dataset.reportTooltip.includes('Global Privacy Control'));
 const caption=p.locator('.catalog-report-help');await caption.hover();await p.waitForTimeout(250);assert((await p.locator('#audio-report-tooltip').textContent()).includes('al costat de l’àudio concret'));
 const flag=p.locator('.report-control').first();await flag.hover();await p.waitForTimeout(250);
 let rects=await p.evaluate(()=>{const a=document.querySelector('.report-control').getBoundingClientRect(),t=document.querySelector('#audio-report-tooltip').getBoundingClientRect(),d=document.querySelector('#catalog-dialog').getBoundingClientRect();return {a:{x:a.x,y:a.y,right:a.right,bottom:a.bottom},t:{x:t.x,y:t.y,right:t.right,bottom:t.bottom},d:{x:d.x,y:d.y,right:d.right,bottom:d.bottom}};});
 assert(rects.t.bottom<=rects.a.y-8||rects.t.y>=rects.a.bottom+8,'Tooltip never covers flag');assert(rects.t.x>=rects.d.x&&rects.t.right<=rects.d.right);assert((await p.locator('#audio-report-tooltip').textContent()).includes('Global Privacy Control'));
 await p.screenshot({path:'output/catalog124-tooltip.png'});
 await p.locator('#catalog-dialog [data-analytics-settings]').click();await p.waitForTimeout(260);assert.equal(await p.locator('#analytics-browser').inputValue(),'brave');assert(await p.locator('#analytics-temporary').isDisabled());assert((await p.locator('#analytics-help-steps').textContent()).includes('brave://flags/#brave-global-privacy-control-enabled'));
 await p.screenshot({path:'output/privacy124-brave.png'});
 await p.selectOption('#analytics-browser','chrome');await p.evaluate(()=>window.testAnalyticsState({status:'disabled',reason:'dnt'}));assert((await p.locator('#analytics-help-steps').textContent()).includes('Galetes de tercers'));
 await p.evaluate(()=>window.testAnalyticsState({status:'unavailable',reason:'network'}));assert(!await p.locator('#analytics-help-scope').isVisible());assert(await p.locator('#analytics-temporary').isEnabled());await p.click('#analytics-temporary');assert(!await p.locator('#analytics-browser-help').isVisible());
 await p.locator('[data-analytics-close]').click();await p.waitForTimeout(250);assert(await p.locator('.report-flag').first().isEnabled());
 for(const width of [320,390]){await p.setViewportSize({width,height:844});await p.waitForTimeout(250);await p.locator('.catalog-report-help').tap();await p.waitForTimeout(240);const bounds=await p.evaluate(()=>{const d=document.querySelector('#catalog-dialog').getBoundingClientRect(),t=document.querySelector('#audio-report-tooltip').getBoundingClientRect();return {left:d.left,right:d.right,tipLeft:t.left,tipRight:t.right};});assert(bounds.tipLeft>=bounds.left&&bounds.tipRight<=bounds.right,'Mobile tooltip stays inside the dialog');}await p.locator('.catalog-report-help').tap();await p.waitForTimeout(240);assert(await p.locator('#audio-report-tooltip').evaluate(el=>el.classList.contains('is-visible')),'Touch helper remains visible after lifting the finger');await p.locator('.report-control').first().tap();await p.waitForTimeout(250);await p.screenshot({path:'output/catalog124-mobile.png'});
 await p.unroute('**/analytics.js?*');await p.goto('http://127.0.0.1:4176/ca/dictat/?seed=ADZ52356A');await p.waitForSelector('#ready-panel:not([hidden])');
 await p.click('#start-dictation');await p.click('#windowed-start');assert.equal(await p.locator('#listen-word [data-word-number]').textContent(),'1');
 const counterSize=await p.locator('#listen-word [data-word-number]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));assert(counterSize>=40);
 await p.waitForTimeout(300);await p.screenshot({path:'output/dictation124-mobile.png'});
 for(let i=0;i<3;i++){await p.click('#listen-word');await p.waitForFunction(()=>document.querySelector('#listen-word').hidden||!document.querySelector('#listen-word').disabled,{},{timeout:10000});}
 assert(await p.locator('#next-word').isVisible());assert.equal(await p.locator('#next-word [data-word-number]').textContent(),'1');await p.click('#next-word');assert.equal(await p.locator('#listen-word [data-word-number]').textContent(),'2');
 assert.equal(await p.locator('#word-progress').textContent(),'Paraula 2 de 24');
 assert.deepEqual(errors,[]);console.log('Native touch pan/pinch, Ctrl-wheel, tooltip separation/touch, browser-specific privacy/GPC/DNT states, and prominent dictation counters with three-play progression passed.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
