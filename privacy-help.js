(function(root){
  'use strict';
  const bravePrivacy='https://support.brave.app/hc/en-us/articles/360017989132-How-do-I-change-my-Privacy-Settings';
  const sources={brave:'https://support.brave.app/hc/en-us/articles/360023646212-How-do-I-configure-global-and-site-specific-Shields-settings',chrome:'https://support.google.com/chrome/answer/2790761',firefox:'https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop',edge:'https://learn.microsoft.com/en-us/microsoft-edge/web-platform/tracking-prevention'};
  function browserFor(nav={}){
    const ua=nav.userAgent||'';
    return nav.brave?'brave':/Edg\//.test(ua)?'edge':/Firefox|FxiOS/.test(ua)?'firefox':/Chrome|CriOS/.test(ua)?'chrome':/Safari/.test(ua)?'safari':'other';
  }
  function guide(browser,state={},nav={}){
    const signal=['gpc','dnt'].includes(state.reason),steps=[];
    const mobile=/Android|iPad|iPhone|iPod/.test(nav.userAgent||'')||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1);
    let source=sources[browser],scope='',intro=signal
      ? (state.reason==='gpc'?'El navegador envia Global Privacy Control (GPC).':'El navegador envia «No em rastregis» (Do Not Track).')+' Plec respecta aquest senyal: permetre Umami o abaixar els escuts no el desactiva.'
      : 'Per enviar un avís, el navegador ha de permetre la connexió amb Umami en aquest web.';
    if(signal){
      scope='Aquest senyal és un ajust general del navegador. Si decideixes canviar-lo, pots restablir-lo després de notificar l’error.';
      if(browser==='brave'&&state.reason==='gpc'){
        const ios=/iPad|iPhone|iPod/.test(nav.userAgent||'')||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1);
        steps.push(ios?'A Brave per a iOS: Configuració → Brave Shields i privacitat → desactiva Global Privacy Control.':'Copia brave://flags/#brave-global-privacy-control-enabled a la barra d’adreces. Tria Disabled (desactivat) i prem Relaunch (reinicia Brave).');source=bravePrivacy;
      }else if(browser==='brave'){
        steps.push('Menú de Brave → Configuració → Privacitat i seguretat → desactiva «Envia una sol·licitud Do Not Track».');source='https://support.brave.app/hc/en-us/articles/360017905612-How-do-I-turn-Do-Not-Track-on-or-off';
      }else if(browser==='chrome'&&state.reason==='dnt')steps.push(mobile?'A Chrome per a Android: menú ⋮ → Configuració → Privacitat i seguretat → Do Not Track → desactiva la sol·licitud.':'Menú ⋮ → Configuració → Privacitat i seguretat → Galetes de tercers → desactiva «Envia una sol·licitud Do Not Track».');
      else if(browser==='firefox'&&state.reason==='gpc'&&!mobile){
        steps.push('Menú ☰ → Paràmetres → Privadesa i seguretat → Preferències de privadesa dels llocs web → desmarca «Demana als llocs web que no venguin ni comparteixin les meves dades».');source='https://support.mozilla.org/en-US/kb/global-privacy-control';
      }else steps.push('Revisa el senyal '+(state.reason==='gpc'?'Global Privacy Control':'Do Not Track')+' als ajustos de privacitat o a l’extensió que l’activa. Consulta l’ajuda del navegador: la ruta depèn de la versió.');
    }
    if(browser==='brave')steps.push('A plec.ortogra.fi, prem el lleó de la barra d’adreces i desactiva els escuts només per a aquest lloc.'+(signal?' Cal resoldre també el senyal de privacitat del pas anterior.':''));
    else if(browser==='firefox')steps.push('A plec.ortogra.fi, prem l’escut a l’esquerra de l’adreça → desactiva la protecció millorada contra el seguiment per a aquest lloc.');
    else if(browser==='edge'&&!mobile)steps.push('A plec.ortogra.fi, obre la informació del lloc a l’esquerra de l’adreça → Prevenció de seguiment per a aquest lloc → desactiva-la per a aquest web.');
    else steps.push('Si tens una extensió bloquejadora, obre’n la icona i permet Umami o pausa el bloqueig només a plec.ortogra.fi. El nom del control depèn de l’extensió.');
    steps.push('Recarrega Plec, obre «Privacitat» i prem «Permet temporalment». Quan aparegui «Umami està disponible», ja podràs prémer la bandera de l’àudio.');
    return {intro,steps,scope,source};
  }
  const api={browserFor,guide};root.PlecPrivacyHelp=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
