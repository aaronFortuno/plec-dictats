/* Shared appearance, applied before styles load to avoid a bright first frame. */
(function () {
  'use strict';
  const key='plec-appearance-v1', html=document.documentElement;
  const system=window.matchMedia('(prefers-color-scheme: dark)'), reduced=window.matchMedia('(prefers-reduced-motion: reduce)'), animations=new Set();
  reduced.addEventListener('change',event=>{if(event.matches)for(const animation of [...animations]){try{animation.finish();}catch{animation.cancel();}}});
  let preference='system';
  try { const saved=localStorage.getItem(key); if(['system','light','dark'].includes(saved))preference=saved; } catch {}
  function apply() {
    html.dataset.theme=preference==='system'?(system.matches?'dark':'light'):preference;
    html.dataset.themePreference=preference;
    const dark=html.dataset.theme==='dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
      const label=dark?'Activa el tema clar':'Activa el tema fosc';
      button.setAttribute('aria-label',label);button.title=label;button.setAttribute('aria-pressed',String(dark));
      const icon=button.querySelector('[data-theme-icon]');
      if(icon&&window.PlecIcons){
        const name=dark?'sun':'moon',changed=icon.dataset.icon!==name;
        icon.innerHTML=window.PlecIcons(name);icon.dataset.icon=name;
        const timing=parseFloat(getComputedStyle(html).getPropertyValue('--motion-duration'));
        if(changed&&icon.animate&&timing!==0){
          const frames=[{opacity:.2,transform:'rotate(-15deg)'},{opacity:1,transform:'rotate(0)'}];
          if(window.PlecMotion?.animate)window.PlecMotion.animate(icon,frames);
          else {const animation=icon.animate(frames,{duration:220});animations.add(animation);const forget=()=>animations.delete(animation);animation.addEventListener('finish',forget,{once:true});animation.addEventListener('cancel',forget,{once:true});}
        }
      }
    });
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=html.dataset.theme==='dark'?'#101a17':'#f8f6ef';
  }
  apply();
  system.addEventListener('change',()=>{if(preference==='system')apply();});
  window.addEventListener('storage',event=>{
    if(event.key!==key)return;
    preference=['light','dark'].includes(event.newValue)?event.newValue:'system';apply();
  });
  document.addEventListener('DOMContentLoaded',()=>{
    apply();
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{
      preference=html.dataset.theme==='dark'?'light':'dark';
      try{localStorage.setItem(key,preference);}catch{}
      apply();
    }));
  });
})();
