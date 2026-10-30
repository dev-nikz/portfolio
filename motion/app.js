import {clamp, range, lerp, damp, storyFrame, sceneAt, processAt} from './math.js';
import {LineReveals} from './text-reveal.js';

export const MOTION = Object.freeze({
  settling: .18, heroTravel: 170, heroDepth: 650,
  storyLead: .65, storyLinkStart:.12, storyLinkEnd:.32,
  processNavOffset:80,
});
const desktopQuery = '(min-width:900px) and (min-height:560px) and (hover:hover) and (prefers-reduced-motion:no-preference)';
const positions = [[.17,.26],[.83,.25],[.17,.76],[.83,.76],[.5,-.015],[.5,1.015]];

export class PortfolioMotion {
  frame=0; lastTime=0; scroll=window.scrollY; target=window.scrollY; measuring=false; resizeTimer=0;
  enabled=false; activeScene=-1; activeStep=-1; destroyed=false;
  constructor() {
    this.abort = new AbortController(); this.signal=this.abort.signal;
    this.root=document.documentElement;
    this.media=matchMedia(desktopQuery);
    this.reduced=matchMedia('(prefers-reduced-motion:reduce)');
    this.story=document.querySelector('#story');
    this.hero=document.querySelector('.motion-hero');
    this.masthead=document.querySelector('.hero-masthead');
    this.heroCopy=document.querySelector('.hero-stage > .wrap');
    this.cards=[...document.querySelectorAll('.story-card')];
    this.scenes=[...document.querySelectorAll('.story-scene')];
    this.process=document.querySelector('#process');
    this.steps=[...document.querySelectorAll('.process-step')];
    this.nav=document.querySelector('#nav');
    this.scenePage=document.querySelector('[data-story-page]');
    document.querySelectorAll('.sec-t,.sec-d,.process-title,.faq-section h2').forEach(el=>el.setAttribute('data-reveal',''));
    this.revealTargets=[...document.querySelectorAll('[data-reveal]')];
    this.lines=new LineReveals(this.revealTargets);
    this.normalTargets=this.revealTargets.filter(el=>!el.closest('.story-scene'));
    this.applyMedia();
    this.lines.refresh();
    this.observe(); this.bind(); this.measure();
    this.root.classList.add('motion-ready');
    this.update(true); this.wake();
  }
  bind() {
    const opts={passive:true,signal:this.signal};
    window.addEventListener('scroll',()=>{this.target=window.scrollY;this.wake();},opts);
    window.addEventListener('resize',()=>{
      clearTimeout(this.resizeTimer);
      this.resizeTimer=setTimeout(()=>{if(this.destroyed)return;this.applyMedia();this.lines.refresh();this.measure();this.wake();},120);
    },opts);
    this.media.addEventListener('change',()=>{this.applyMedia();this.lines.refresh();this.measure();this.wake();},{signal:this.signal});
    this.reduced.addEventListener('change',()=>{
      this.applyMedia();this.revealTargets.forEach(el=>el.dataset.text='in');this.measure();this.wake();
    },{signal:this.signal});
    document.fonts?.addEventListener('loadingdone',()=>{this.lines.refresh(true);this.measure();this.wake();},{signal:this.signal});
    document.querySelectorAll('img').forEach(img=>{
      if(!img.complete)img.addEventListener('load',()=>{this.measure();this.wake();},{once:true,signal:this.signal});
    });
    this.steps.forEach((step,index)=>{
      const button=step.querySelector('button');
      button.addEventListener('click',()=>this.selectStep(index),{signal:this.signal});
      button.addEventListener('keydown',event=>{
        let next=index;
        if(event.key==='ArrowDown'||event.key==='ArrowRight')next=Math.min(3,index+1);
        else if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=Math.max(0,index-1);
        else if(event.key==='Home')next=0;else if(event.key==='End')next=3;else return;
        event.preventDefault();this.steps[next].querySelector('button').focus();this.selectStep(next);
      },{signal:this.signal});
    });
    const toggle=document.querySelector('.nav-toggle'),links=document.querySelector('#nav-links');
    toggle.hidden=false; this.nav.dataset.menuReady='true';
    const close=()=>{toggle.setAttribute('aria-expanded','false');delete links.dataset.open;};
    toggle.addEventListener('click',()=>{
      const open=toggle.getAttribute('aria-expanded')!=='true';
      toggle.setAttribute('aria-expanded',String(open));links.dataset.open=String(open);
    },{signal:this.signal});
    links.addEventListener('click',event=>{if(event.target.closest('a'))close();},{signal:this.signal});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){close();toggle.focus();}},{signal:this.signal});
    document.querySelectorAll('a[href^="mailto:"]').forEach(a=>a.addEventListener('click',()=>{
      const email=a.href.replace(/^mailto:/,'').split('?')[0];
      navigator.clipboard?.writeText(email).then(()=>{const toast=document.querySelector('#toast');if(toast){toast.textContent=`Email copied: ${email}`;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2500);}}).catch(()=>{});
    },{signal:this.signal}));
  }
  observe() {
    if(typeof window.IntersectionObserver !== 'function'){
      this.revealTargets.forEach(el=>el.dataset.text='in');
      document.querySelectorAll('.cta-thumbnails,.footer-wordmark').forEach(el=>el.dataset.entered='true');
      return;
    }
    this.observer=new IntersectionObserver(entries=>{
      for(const {target,isIntersecting,boundingClientRect} of entries){
        if(target.matches('[data-reveal]'))target.dataset.text=this.reduced.matches||isIntersecting?'in':boundingClientRect.bottom<0?'out-above':'out';
        else if(isIntersecting){target.dataset.entered='true';this.observer.unobserve(target);}
      }
    },{threshold:0,rootMargin:'0px 0px -8% 0px'});
    for(const target of this.normalTargets){
      const rect=target.getBoundingClientRect();target.dataset.text=this.reduced.matches||rect.top<innerHeight&&rect.bottom>0?'in':rect.bottom<0?'out-above':'out';
      this.observer.observe(target);
    }
    document.querySelectorAll('.cta-thumbnails,.footer-wordmark').forEach(el=>this.observer.observe(el));
  }
  applyMedia() {
    // Missing browser capabilities keep the entirely normal-flow page.
    this.enabled=this.media.matches && typeof window.IntersectionObserver === 'function';
    this.root.classList.toggle('hero-enhanced',this.enabled);
    this.root.classList.toggle('story-enhanced',this.enabled);
    this.root.classList.toggle('process-enhanced',this.enabled);
    this.activeScene=-1;this.activeStep=-1;
    if(!this.enabled){
      this.masthead.style.transform='';this.heroCopy.style.transform='';this.heroCopy.style.opacity='';
      this.cards.forEach(card=>{card.style.transform='';card.style.removeProperty('--card-dim');card.inert=false;card.removeAttribute('aria-hidden');});
      this.scenes.forEach(scene=>{
        scene.inert=false;scene.removeAttribute('aria-hidden');scene.dataset.active='true';scene.querySelectorAll('[data-reveal]').forEach(el=>el.dataset.text='in');
      });
      this.steps.forEach(step=>{step.dataset.active='true';step.querySelector('button').setAttribute('aria-expanded','true');const body=step.querySelector('.step-body');body.inert=false;body.removeAttribute('aria-hidden');});
    }
  }
  measure() {
    this.heroEnabled=this.enabled;
    this.root.classList.toggle('hero-enhanced',this.heroEnabled);
    if(this.heroEnabled)this.hero.style.setProperty('--hero-stage-height',this.hero.querySelector('.hero-stage').offsetHeight+'px');
    else this.hero.style.removeProperty('--hero-stage-height');
    if(!this.heroEnabled){this.masthead.style.transform='';this.heroCopy.style.transform='';this.heroCopy.style.opacity='';}
    const top=el=>el.getBoundingClientRect().top+window.scrollY;
    this.metrics={w:innerWidth,h:innerHeight,heroTop:top(this.hero),storyTop:top(this.story),storyHeight:this.story.offsetHeight,
      processTop:top(this.process),processHeight:this.process.offsetHeight,cards:this.cards.map(card=>({w:card.offsetWidth,h:card.offsetHeight}))};
  }
  setScene(index) {
    if(this.activeScene===index)return;
    this.activeScene=index;
    this.scenes.forEach((scene,i)=>{
      const active=i===index;scene.dataset.active=String(active);scene.inert=!active;scene.setAttribute('aria-hidden',String(!active));
      scene.querySelectorAll('[data-reveal]').forEach(el=>el.dataset.text=active?'in':i<index?'out-above':'out');
    });
    this.scenePage.textContent=`0${index+1} / 04`;
  }
  setStep(index) {
    if(this.activeStep===index)return;this.activeStep=index;
    this.steps.forEach((step,i)=>{
      const active=i===index;step.dataset.active=String(active);step.querySelector('button').setAttribute('aria-expanded',String(active));
      const body=step.querySelector('.step-body');body.inert=!active;body.setAttribute('aria-hidden',String(!active));
    });
  }
  selectStep(index) {
    if(!this.enabled)return;
    this.setStep(index);
    const start=this.metrics.processTop-MOTION.processNavOffset;
    const distance=this.metrics.processHeight-this.metrics.h+MOTION.processNavOffset;
    window.scrollTo({top:start+distance*(index+.2)/4,behavior:this.reduced.matches?'instant':'smooth'});
  }
  update(immediate=false) {
    const y=immediate?window.scrollY:this.scroll,m=this.metrics;
    this.nav.classList.toggle('scrolled',window.scrollY>12);
    if(!this.enabled)return;
    const hp=this.heroEnabled?range(y,m.heroTop,m.heroTop+m.h*1.05):0;
    this.masthead.style.transform=`translate3d(0,${(-hp*MOTION.heroTravel).toFixed(2)}px,${(-hp*MOTION.heroDepth).toFixed(2)}px)`;
    this.heroCopy.style.transform=`translate3d(0,${(-hp*36).toFixed(2)}px,0)`;
    this.heroCopy.style.opacity=(1-hp*.22).toFixed(3);
    const p=range(y,m.storyTop-m.h*MOTION.storyLead,m.storyTop+m.storyHeight-m.h);
    this.setScene(sceneAt(p));
    const interactive=p>=MOTION.storyLinkStart&&p<MOTION.storyLinkEnd;
    this.cards.forEach((card,i)=>{
      const frame=storyFrame(p,i,this.cards.length),[nx,ny]=positions[i],size=m.cards[i];
      const startX=m.w*.5,startY=lerp(m.h*.5,m.h*.86,frame.gather);
      const x=lerp(startX,m.w*nx,frame.spread)-m.w*.5-size.w/2;
      const cy=lerp(startY,m.h*ny,frame.spread)-m.h*.5-size.h/2;
      const tilt=(nx-.5)*-10*(1-frame.spread);
      card.style.transform=`translate3d(${x.toFixed(2)}px,${cy.toFixed(2)}px,0) rotate(${tilt.toFixed(2)}deg) scale(${frame.scale.toFixed(4)})`;
      card.style.setProperty('--card-dim',frame.dim.toFixed(3));
      if(card.inert===interactive){card.inert=!interactive;card.setAttribute('aria-hidden',String(!interactive));}
    });
    const pp=range(y,m.processTop-MOTION.processNavOffset,m.processTop+m.processHeight-m.h);
    this.setStep(processAt(pp));
  }
  wake=()=>{if(!this.frame&&!this.destroyed)this.frame=requestAnimationFrame(this.tick);};
  tick=time=>{
    this.frame=0;if(this.destroyed)return;
    const dt=this.lastTime?(time-this.lastTime)/1000:1/60;this.lastTime=time;
    this.target=window.scrollY;
    this.scroll=this.enabled?damp(this.scroll,this.target,dt,MOTION.settling):this.target;
    if(Math.abs(this.scroll-this.target)<.15)this.scroll=this.target;
    this.update();
    if(this.scroll!==this.target)this.wake();else this.lastTime=0;
  };
  destroy() {
    this.destroyed=true;this.abort.abort();this.observer?.disconnect();clearTimeout(this.resizeTimer);cancelAnimationFrame(this.frame);this.frame=0;
    this.root.classList.remove('motion-ready','hero-enhanced','story-enhanced','process-enhanced');
    this.enabled=false;this.media={matches:false};this.applyMedia();this.lines.destroy();
    const toggle=document.querySelector('.nav-toggle');toggle.hidden=true;delete this.nav.dataset.menuReady;
  }
}
let controller;
async function mount() {
  if(controller)return;
  try {
    await Promise.race([document.fonts?.ready,new Promise(resolve=>setTimeout(resolve,1500))]);
    controller=new PortfolioMotion();
    // Small public lifecycle surface supports verification and later SPA integration.
    window.portfolioMotion=controller;
  } catch(error) {
    controller?.destroy();controller=undefined;
    document.documentElement.classList.remove('motion-ready','hero-enhanced','story-enhanced','process-enhanced');
    document.querySelectorAll('[inert]').forEach(el=>el.inert=false);
    document.querySelectorAll('.story-scene,.story-card,.step-body').forEach(el=>el.removeAttribute('aria-hidden'));
    document.querySelectorAll('[data-split-ready]').forEach(el=>{
      const source=el.querySelector(':scope > .reveal-source');
      if(source)el.replaceChildren(...source.childNodes);
      el.removeAttribute('data-split-ready');el.removeAttribute('data-text');
    });
    console.error('Motion enhancement unavailable; showing static content.',error);
  }
}
mount();
window.addEventListener('pagehide',()=>{controller?.destroy();controller=undefined;});
window.addEventListener('pageshow',event=>{if(event.persisted)mount();});
