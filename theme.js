/* Shared appearance, applied before styles load to avoid a bright first frame. */
(function () {
  'use strict';
  const key='plec-appearance-v1', html=document.documentElement;
  const system=window.matchMedia('(prefers-color-scheme: dark)');
  let preference='system';
  try { const saved=localStorage.getItem(key); if(['system','light','dark'].includes(saved))preference=saved; } catch {}
  function apply() {
    html.dataset.theme=preference==='system'?(system.matches?'dark':'light'):preference;
    html.dataset.themePreference=preference;
    document.querySelectorAll('[data-theme-choice]').forEach(select=>{select.value=preference;});
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
    document.querySelectorAll('[data-theme-choice]').forEach(select=>select.addEventListener('change',()=>{
      preference=['light','dark'].includes(select.value)?select.value:'system';
      try{localStorage.setItem(key,preference);}catch{}
      apply();
    }));
  });
})();
