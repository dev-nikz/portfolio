/* Run against npm run dev. Playwright is a development-only external tool. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const url=process.env.TEST_URL || 'http://127.0.0.1:4173';
const output=process.env.QA_OUTPUT_DIR;
const capture=async(page,name)=>{if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:output+'/'+name+'.png'});}};
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portfolioMotion);
    assert.equal(await page.locator('#grid > a').count(),8);
    assert.match(await page.locator('.hero-stats').innerText(),/5\.5 yrs/);
    assert.equal(await page.locator('.nav-toggle').isVisible(),false);
    for(const height of [700,800,900]){
      await page.setViewportSize({width:1440,height});await page.waitForTimeout(250);
      assert.equal(await page.evaluate(()=>window.portfolioMotion.enabled&&window.portfolioMotion.heroEnabled),true,`laptop height ${height} must retain both effects`);
    }
    await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(250);
    const firstName=await page.locator('.hero-masthead').evaluate(el=>getComputedStyle(el).transform);
    await page.evaluate(()=>window.scrollTo({top:400,behavior:'instant'}));
    await page.waitForFunction(()=>window.portfolioMotion.scroll===window.scrollY);
    assert.notEqual(await page.locator('.hero-masthead').evaluate(el=>getComputedStyle(el).transform),firstName);
    await capture(page,'parallax');
    const story=await page.locator('#story').evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,height:el.offsetHeight}));
    const start=story.top-1000*.65,end=story.top+story.height-1000;
    for(const [progress,scene] of [[.18,0],[.4,1],[.63,2],[.81,3],[.4,1],[.18,0]]){
      await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),start+(end-start)*progress);
      await page.waitForFunction(n=>window.portfolioMotion.activeScene===n,scene);
      assert.equal(await page.locator('.story-scene:not([inert])').count(),1);
      assert.equal(await page.locator('.story-scene[aria-hidden="false"]').count(),1);
      if(scene===1)assert.equal(await page.locator('.story-card').first().evaluate(el=>el.inert),true);
      assert.equal(await page.locator('.story-scene[inert] a').first().evaluate(el=>{el.focus();return document.activeElement===el;}),false);
    }
    await page.waitForTimeout(1000);await capture(page,'project-story');
    const heading=await page.getByRole('heading',{name:'Production frontends. Thoughtful AI integration.',exact:true}).count();
    assert.equal(heading,1,'visual split copy must not duplicate the accessible heading');
    const process=await page.locator('#process').evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,height:el.offsetHeight}));
    await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),process.top+process.height*.4);
    await page.locator('[data-step-button="0"]').focus();await page.keyboard.press('End');
    await page.waitForFunction(()=>window.portfolioMotion.activeStep===3&&document.activeElement.dataset.stepButton==='3');
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('[data-step-button="3"]').getAttribute('aria-expanded'),'true');
    await capture(page,'process');
    await page.locator('#faq summary').first().focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#faq details').first().evaluate(el=>el.open),true);
    await page.keyboard.press('Enter');assert.equal(await page.locator('#faq details').first().evaluate(el=>el.open),false);
    // Text must be measured at the new width, with no root-level horizontal overflow.
    const oldWidth=await page.locator('.motion-hero h1').evaluate(el=>el.getBoundingClientRect().width);
    await page.setViewportSize({width:1024,height:900});await page.waitForTimeout(300);
    assert.notEqual(await page.locator('.motion-hero h1').evaluate(el=>el.getBoundingClientRect().width),oldWidth);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('story-enhanced')),false);
    assert.equal(await page.locator('.story-scene[inert]').count(),0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.locator('.nav-toggle').click();assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'false');
    await capture(page,'mobile');
    await page.setViewportSize({width:1440,height:500});await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>window.portfolioMotion.enabled),false);
    await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(300);
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200);
    assert.equal(await page.evaluate(()=>window.portfolioMotion.enabled),false);
    assert.equal(await page.locator('.story-scene[inert],.step-body[inert]').count(),0);
    assert.equal(await page.locator('.process-step button[aria-expanded="true"]').count(),4);
    const reducedPage=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    await reducedPage.goto(url);await reducedPage.waitForFunction(()=>window.portfolioMotion);
    assert.equal(await reducedPage.locator('.story-scene[inert]').count(),0);
    const noJS=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
    await noJS.goto(url);assert.equal(await noJS.locator('#grid > a').count(),8);
    assert.ok(await noJS.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.equal(await noJS.locator('.nav ul').isVisible(),true);
    assert.equal(await noJS.locator('.story-scene').last().isVisible(),true);
    const noObserver=await browser.newPage();await noObserver.addInitScript(()=>{window.IntersectionObserver=undefined;});
    await noObserver.goto(url);await noObserver.waitForFunction(()=>window.portfolioMotion);
    assert.equal(await noObserver.evaluate(()=>window.portfolioMotion.enabled),false);
    assert.equal(await noObserver.locator('.footer-wordmark').getAttribute('data-entered'),'true');
    await page.evaluate(()=>window.portfolioMotion.destroy());
    assert.equal(await page.evaluate(()=>window.portfolioMotion.frame),0);
    assert.equal(await page.locator('[data-split-ready]').count(),0);
    assert.equal(await page.locator('.story-scene[inert]').count(),0);
    assert.deepEqual(errors,[]);
    console.log('PASS: parallax, four scenes, reverse scroll, focus isolation, semantic text, process keyboard, FAQ, resize, mobile menu, short viewport, reduced motion, no JS, no observer, cleanup.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
