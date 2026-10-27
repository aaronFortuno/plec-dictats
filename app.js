/* Composer with self-contained reproducible codes. Protocol: docs/LLAVORS.md. */
(function(){
  'use strict';
  // Preserve old student links before touching composer state or storage.
  const arrival=new URL(location.href);
  if(arrival.searchParams.get('mode')==='dictat'){
    const student=new URL('./dictat/',location.href);
    arrival.searchParams.delete('mode');student.search=arrival.searchParams.toString();
    location.replace(student.href);return;
  }
  const S=window.PlecSeeds,K=window.PlecCore,L=window.PlecLanguage,LT=window.PlecLanguageTools,R=window.PlecSeedRegistry;
  let edition=R.editions.find(e=>e.slot===R.current),C=edition.catalog;
  const BANK=R.editions.find(e=>e.slot===R.current).catalog;
  const $=id=>document.getElementById(id),escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const STORAGE='plec-seeds-v1:'+L.id;
  const track=(name,data)=>window.PlecAnalytics?.track(name,data);
  const defaults=mode=>({count:mode==='words'?24:20,stage:mode==='words'?'cs':'all',basic:false,tags:[...(mode==='words'?S.WORD_FOCUSES:S.PSEUDO_FOCUSES)],required:[],code:null});
  let state={mode:'words',modelSide:'left',foldStyle:'thirds',variety:'central',sessions:{words:defaults('words'),pseudo:defaults('pseudo')}},current=null,toastTimer;
  const search=window.PlecComposerSearch.create({seeds:S,randomNonce:()=>randomNonce()});
  let legacy=null;
  try{legacy=localStorage.getItem('plec-dictats-v1:'+L.id)||localStorage.getItem('plec-dictats-v1');}catch{}
  const session=()=>state.sessions[state.mode];
  const modeTags=mode=>C.categories.filter(c=>c.mode===mode);
  // Keep the visual and keyboard order together; compact short focuses beside long ones.
  const focusOrder=['accent','essa','hac','gej','beve','erra','verbs','qugu','vocals','dieresi','digrafs','signes'];
  const lookup=id=>C.entries.find(e=>e.id===id)||BANK.entries.find(e=>e.id===id);
  const chosen=()=>current?.entries||[];
  const recipe=()=>({mode:state.mode,count:session().count,stage:session().stage,tags:session().tags});
  const pool=()=>C.entries.filter(e=>e.mode===state.mode&&e.tags.some(t=>session().tags.includes(t))&&S.matchesStage(e,session().stage,edition.profile.stageRules));
  function say(message){$('status').textContent=message;$('status').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('status').classList.remove('visible'),6500);}
  function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({...state,language:L.id,edition:edition.slot}));}catch{say('No es poden desar les preferències. Conserva el codi o copia l’enllaç del dictat.');}}
  function restore(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE)||'null'),data=saved||JSON.parse(legacy||'null');
      if(!data||data.language&&data.language!==L.id)return;
      state.mode=['words','pseudo'].includes(data.mode)?data.mode:'words';state.modelSide=data.modelSide==='right'?'right':'left';state.foldStyle=data.foldStyle==='quarter'?'quarter':'thirds';
      if(window.PlecAudioVarieties.varieties.some(v=>v.id===data.variety))state.variety=data.variety;
      if(saved&&R.editions.some(e=>e.slot===data.edition)){edition=R.editions.find(e=>e.slot===data.edition);C=edition.catalog;}
      for(const mode of ['words','pseudo']){
        const src=data.sessions?.[mode];if(!src)continue;const dest=state.sessions[mode];
        if(S.COUNTS.includes(src.count))dest.count=src.count;
        if(S.STAGES.includes(src.stage))dest.stage=mode==='pseudo'?'all':src.stage;
        dest.basic=mode==='words'&&(typeof src.basic==='boolean'?src.basic:data.edition===R.basic);
        if(Array.isArray(src.tags))dest.tags=K.migrateFocusTags(src.tags,modeTags(mode).map(c=>c.id),['flexio','custom']);
        if(saved){dest.required=Array.isArray(src.required)?[...new Set(src.required.filter(id=>lookup(id)?.mode===mode))].slice(0,5):[];dest.code=typeof src.code==='string'?src.code:null;}
      }
    }catch{}
  }
  function updateURL(){try{const url=new URL(location.href),panel=new URLSearchParams(url.search);url.search='';url.hash='';if(current){url.searchParams.set('seed',S.normalize(current.code));url.searchParams.set('catalogue',current.catalogue);url.searchParams.set('variety',state.variety);}for(const name of ['panel','mot','audio'])if(panel.has(name))url.searchParams.set(name,panel.get(name));history.replaceState(null,'',url);}catch{}}
  function setCode(code,{keepRequired=false}={}){
    const result=S.resolve(R.editions,code),next=R.editions.find(e=>e.slot===result.epoch);
    if(next.language!==L.id)throw new Error('El codi correspon a una altra llengua.');
    edition=next;C=next.catalog;state.mode=result.recipe.mode;
    const s=session();s.count=result.recipe.count;s.stage=result.recipe.stage;s.basic=next.selection?.vocabulary==='basic';s.tags=[...result.recipe.tags];s.code=result.code;if(!keepRequired)s.required=[];
    current=result;search.discardContinuation();persist();updateControls();renderPreview();updateURL();
  }
  const randomNonce=()=>{const values=new Uint32Array(1),ceiling=Math.floor(4294967296/S.VARIANTS)*S.VARIANTS;do{crypto.getRandomValues(values);}while(values[0]>=ceiling);return values[0]%S.VARIANTS;};
  const stopSearch=()=>search.cancel();
  async function generate({resume=false}={}){
    // Recovered codes retain their archive; new exercises use current definitions.
    const continuing=resume&&search.canResume;
    const targetSlot=state.mode==='words'&&session().basic&&R.basic!==undefined?R.basic:R.current;
    if(!continuing&&edition.slot!==targetSlot){edition=R.editions.find(e=>e.slot===targetSlot);C=edition.catalog;updateControls();}
    const outcome=await search.run({edition,recipe:recipe(),required:session().required,previous:current,resume,
      onStart(){current=null;session().code=null;persist();updateURL();renderPreview();updateAvailability();$('search-status').textContent=session().required.length?'Buscant un codi compatible…':'';},
      onProgress:attempts=>{$('search-status').textContent=attempts.toLocaleString(L.locale)+' de '+S.VARIANTS.toLocaleString(L.locale)+' variants comprovades…';}
    });
    if(!search.isCurrent(outcome)||outcome.status==='stale')return;
    const attempts=outcome.attempts?.toLocaleString(L.locale),variants=S.VARIANTS.toLocaleString(L.locale);
    if(outcome.status==='found'){
      setCode(outcome.code,{keepRequired:true});
      $('search-status').textContent=outcome.required.length?'Codi trobat després de '+attempts+' '+(outcome.attempts===1?'intent':'intents')+'.':'';
    }else if(outcome.status==='paused')$('search-status').textContent='Encara no hem trobat cap codi. '+attempts+' de '+variants+' variants comprovades. Pots continuar la cerca o ajustar els mots.';
    else if(outcome.status==='exhausted')$('search-status').textContent='Cap de les '+variants+' variants inclou tots aquests mots. Treu algun mot o ajusta els focus.';
    else if(outcome.status==='error')$('search-status').textContent=outcome.error.message;
    renderPreview();updateAvailability();
  }
  function updateControls(){
    $('pronunciation-variety').value=state.variety;
    const s=session();document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
    $('count-control').value=s.count;$('stage-field').hidden=state.mode==='pseudo';$('stage-control').value=s.stage;
    $('basic-vocabulary-field').hidden=state.mode==='pseudo'||R.basic===undefined;$('basic-vocabulary').checked=!!s.basic;
    $('basic-vocabulary-count').textContent=(R.basicWordCount||0)+' mots';
    $('fold-style-control').value=state.foldStyle;document.querySelectorAll('[data-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.side===state.modelSide)));
    const focuses=modeTags(state.mode);if(state.mode==='words')focuses.sort((a,b)=>focusOrder.indexOf(a.id)-focusOrder.indexOf(b.id));
    $('tag-options').innerHTML=focuses.map(c=>`<label class="tag" title="${escape(c.title)}"><input type="checkbox" value="${c.id}" ${s.tags.includes(c.id)?'checked':''}><span>${window.PlecIcons('check')}${escape(c.label)}</span></label>`).join('');
    $('pseudo-note').hidden=state.mode!=='pseudo';$('word-total').textContent=BANK.entries.filter(e=>e.mode==='words').length;$('pseudo-total').textContent=BANK.entries.filter(e=>e.mode==='pseudo').length;$('seed-language').textContent=L.id.toUpperCase();
    renderRequired();updateAvailability();
  }
  function updateAvailability(){const p=pool();$('pool-count').textContent=p.length;$('pool-status').textContent=!session().tags.length?' · Tria almenys un focus.':p.length<session().count?' · Amplia els filtres o redueix la llargada.':'';$('cancel-search').hidden=!search.busy;$('resume-search').hidden=search.busy||!search.canResume;$('new-dictation').disabled=search.busy;}
  function renderRequired(){
    $('required-list').innerHTML=session().required.map(id=>`<span class="required-chip">${escape(lookup(id)?.text||id)}<button type="button" data-remove-required="${id}" aria-label="Treu ${escape(lookup(id)?.text||id)}">${window.PlecIcons('x')}</button></span>`).join('');suggest();
  }
  function suggest(){const query=K.normalize($('required-word').value.trim());$('required-options').innerHTML=query?pool().filter(e=>!session().required.includes(e.id)&&K.normalize(e.text).includes(query)).slice(0,12).map(e=>`<option value="${escape(e.text)}"></option>`).join(''):'';}
  function addRequired(){
    const texts=[...new Set($('required-word').value.split(',').map(t=>t.trim().normalize('NFC').toLocaleLowerCase(L.locale)).filter(Boolean))];
    if(!texts.length)return;
    const entries=texts.map(text=>BANK.entries.find(e=>e.mode===state.mode&&e.text===text));
    if(entries.some(e=>!e))return say('Tria mots del catàleg, amb la grafia i els accents corresponents.');
    const available=new Set(pool().map(e=>e.id));
    if(entries.some(e=>!available.has(e.id)))return say('Un dels mots queda fora dels filtres actuals. Ajusta els focus o el nivell.');
    const required=[...new Set([...session().required,...entries.map(e=>e.id)])];
    if(required.length>5)return say('Pots demanar fins a cinc mots obligatoris.');
    $('required-word').value='';
    if(required.length===session().required.length){suggest();return;}
    session().required=required;persist();renderRequired();generate();
  }
  const measureCanvas = document.createElement('canvas');
  const measureContext = measureCanvas.getContext('2d');
  const MM = 25.4 / 72;
  function fitSize(shape) {
    if (!shape.maxWidth || !measureContext) return shape.size;
    measureContext.font = `${shape.weight ? 'bold ' : ''}${shape.size * MM}px Arial`;
    return Math.min(shape.size, shape.size * shape.maxWidth / Math.max(1, measureContext.measureText(shape.value).width));
  }
  // Les fonts estàndard del PDF admeten tots els caràcters catalans.
  const printable = window.PlecPdf.printable;
  function svgFor(shapes, layout = K.foldLayout(state.foldStyle, state.modelSide)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" role="img" aria-label="Full A4: ${layout.name}, model a ${layout.side === 'left' ? 'l’esquerra' : 'la dreta'}" data-fold-style="${layout.foldStyle}" data-model-side="${layout.side}"><rect width="210" height="297" fill="white"/>${shapes.map(s => {
      if (s.type === 'line') return `<line x1="${s.x}" y1="${s.y}" x2="${s.x2}" y2="${s.y2}" stroke="${s.color}" stroke-width="${s.width}" ${s.dash ? 'stroke-dasharray="1.5 1.4"' : ''}/>`;
      if (s.type === 'rect') return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${s.color}"/>`;
      if (s.type === 'path') return `<path d="${s.d}" transform="translate(${s.x} ${s.y}) scale(${s.scale})" fill="${s.fill?s.color:'none'}" stroke="${s.fill?'none':s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round" data-brand-part="${s.part}"/>`;
      if (s.type === 'polyline') return `<path d="M ${s.points.map(p=>p.join(' ')).join(' L ')}${s.fill?' Z':''}" fill="${s.fill||'none'}" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round" ${s.dash?'stroke-dasharray=".8 .7"':''}/>`;
      const safeShape = { ...s, value: printable(s.value) };
      return `<text x="${s.x}" y="${s.y}" font-family="Arial,Helvetica,sans-serif" font-size="${fitSize(safeShape) * MM}" font-weight="${s.weight ? 700 : 400}" fill="${s.color}" text-anchor="${s.align === 'right' ? 'end' : s.align === 'center' ? 'middle' : 'start'}">${escape(safeShape.value)}</text>`;
    }).join('')}</svg>`;
  }

  function sheetOptions(){return{entries:chosen(),title:state.mode==='words'?'Dictat de paraules':'Dictat de pseudoparaules',mode:state.mode,modelSide:state.modelSide,foldStyle:state.foldStyle,seedCode:current?.code,seedLanguage:L.id,variety:state.variety,focusLabels:[...(session().basic?['Vocabulari bàsic']:[]),...session().tags.map(id=>C.categories.find(c=>c.id===id)?.label||id)]};}
  const fitPaper=()=>window.PlecPreview.fit();
  function renderPreview(){
    const entries=chosen(),layout=K.foldLayout(state.foldStyle,state.modelSide),ready=!!current&&!search.busy;
    $('sheet-preview').innerHTML=entries.length?svgFor(K.worksheet(sheetOptions()),layout):`<div class="empty-selection">${search.busy?'Buscant un dictat…':'Ajusta els filtres o recupera un codi per veure el full.'}</div>`;
    $('seed-code').textContent=search.busy?'…':current?.code||'—';$('selection-summary').textContent=`${entries.length} / ${session().count} elements`;
    $('preview-layout').textContent=`${layout.name} · model a ${state.modelSide==='left'?'l’esquerra':'la dreta'}`;
    document.querySelector('.dictation-nav').href=new URL('./dictat/?variety='+state.variety,location.href).href;
    for(const id of ['download-pdf','copy-code','copy-link','open-student','copy-student-link'])$(id).disabled=!ready;
    $('sheet-preview').setAttribute('aria-label',`Vista prèvia: ${entries.length} elements. Model visible.`);fitPaper();
  }
  function openCatalog(options={}){
    window.PlecCatalogView.open({entries:BANK.entries,categories:BANK.categories,basic:session().basic,mode:state.mode,revision:BANK.revision,locale:L.locale,matchesStage:(entry,stage)=>S.matchesStage(entry,stage,R.editions.find(e=>e.slot===R.current).profile.stageRules)},options);
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  async function buildPdf() { return window.PlecPdf.build(sheetOptions()); }
  async function exportPdf() {
    const button = $('download-pdf'), original = button.innerHTML;
    const metrics={mode:state.mode,count:session().count,fold:state.foldStyle,stage:state.mode==='pseudo'?'none':session().stage};
    button.disabled = true; button.textContent = 'Preparant…';
    try {
      const bytes = await buildPdf();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `plec-${state.mode === 'words' ? 'paraules' : 'pseudoparaules'}-${session().count}-${state.foldStyle === 'quarter' ? 'quart' : 'tercos'}-${state.modelSide === 'right' ? 'dreta' : 'esquerra'}.pdf`);
      track('worksheet-exported',metrics);
      say('PDF descarregat. Imprimeix-lo en A4 a escala 100 %.');
    } catch (error) { track('technical-error',{kind:'pdf'});say('No s’ha pogut generar el PDF. ' + error.message); }
    finally { button.innerHTML = original; renderPreview(); }
  }

  $('mode-control').addEventListener('click',event=>{const b=event.target.closest('[data-mode]');if(!b||b.dataset.mode===state.mode)return;state.mode=b.dataset.mode;edition=R.editions.find(e=>e.slot===R.current);C=edition.catalog;updateControls();generate();});
  $('count-control').addEventListener('change',event=>{session().count=+event.target.value;persist();generate();});
  $('stage-control').addEventListener('change',event=>{session().stage=event.target.value;persist();generate();});
  $('basic-vocabulary').addEventListener('change',event=>{session().basic=event.target.checked;persist();generate();});
  $('tag-options').addEventListener('change',()=>{session().tags=[...$('tag-options').querySelectorAll('input:checked')].map(e=>e.value);persist();generate();});
  $('all-tags').addEventListener('click',()=>{session().tags=modeTags(state.mode).map(c=>c.id);updateControls();generate();});
  $('fold-style-control').addEventListener('change',event=>{state.foldStyle=event.target.value;persist();updateControls();renderPreview();});
  $('model-side-control').addEventListener('click',event=>{const b=event.target.closest('[data-side]');if(!b)return;state.modelSide=b.dataset.side;persist();updateControls();renderPreview();});
  $('new-dictation').addEventListener('click',generate);
  $('cancel-search').addEventListener('click',()=>{stopSearch();$('search-status').textContent='Cerca cancel·lada.';renderPreview();updateAvailability();});
  $('resume-search').addEventListener('click',()=>generate({resume:true}));
  $('required-word').addEventListener('input',event=>{if(!event.isComposing&&$('required-word').value.includes(','))addRequired();else suggest();});$('add-required').addEventListener('click',addRequired);
  $('required-word').addEventListener('keydown',event=>{if(!event.isComposing&&['Enter',','].includes(event.key)){event.preventDefault();addRequired();}});
  $('required-list').addEventListener('click',event=>{const b=event.target.closest('[data-remove-required]');if(!b)return;session().required=session().required.filter(id=>id!==b.dataset.removeRequired);persist();renderRequired();generate();});
  // A fixed tooltip stays readable outside the scrollable configuration panel.
  function setupHelp(triggerId,buttonId,tipId,{hoverTip=true}={}){
  const helpTrigger=$(triggerId),helpButton=$(buttonId),helpTip=$(tipId);
  let helpPinned=false,helpCloseTimer,helpHideTimer;
  function positionHelp(){
    const rect=helpTrigger.getBoundingClientRect(),width=helpTip.offsetWidth,height=helpTip.offsetHeight;
    helpTip.style.left=Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px';
    const top=rect.top-height-8;
    helpTip.style.top=Math.max(12,Math.min(top>=12?top:rect.bottom+8,innerHeight-height-12))+'px';
  }
  function showRequiredHelp(){
    clearTimeout(helpCloseTimer);clearTimeout(helpHideTimer);helpTip.hidden=false;positionHelp();
    helpButton.setAttribute('aria-expanded','true');
    requestAnimationFrame(()=>{if(helpButton.getAttribute('aria-expanded')==='true')helpTip.classList.add('is-visible');});
  }
  function hideRequiredHelp(){
    clearTimeout(helpCloseTimer);clearTimeout(helpHideTimer);helpTip.classList.remove('is-visible');
    helpButton.setAttribute('aria-expanded','false');helpHideTimer=setTimeout(()=>{helpTip.hidden=true;},220);
  }
  function scheduleHelpClose(){
    clearTimeout(helpCloseTimer);helpCloseTimer=setTimeout(()=>{
      if(!helpPinned&&!helpTrigger.matches(':hover')&&!(hoverTip&&helpTip.matches(':hover'))&&!helpTrigger.contains(document.activeElement))hideRequiredHelp();
    },140);
  }
  for(const target of hoverTip?[helpTrigger,helpTip]:[helpTrigger]){target.addEventListener('pointerenter',showRequiredHelp);target.addEventListener('pointerleave',scheduleHelpClose);}
  helpTrigger.addEventListener('focusin',showRequiredHelp);helpTrigger.addEventListener('focusout',scheduleHelpClose);
  helpButton.addEventListener('click',()=>{helpPinned=!helpPinned;if(helpPinned)showRequiredHelp();else hideRequiredHelp();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){helpPinned=false;hideRequiredHelp();}});
  document.addEventListener('pointerdown',event=>{if(!helpTrigger.contains(event.target)&&!helpTip.contains(event.target)){helpPinned=false;hideRequiredHelp();}});
  document.querySelector('.config-scroll').addEventListener('scroll',()=>{helpPinned=false;hideRequiredHelp();});
  window.addEventListener('scroll',()=>{if(!helpTip.hidden){helpPinned=false;hideRequiredHelp();}},{passive:true});
  window.addEventListener('resize',()=>{if(!helpTip.hidden)positionHelp();});
  }
  setupHelp('required-help-trigger','required-help-toggle','required-help');
  setupHelp('focus-help-toggle','focus-help-toggle','focus-help',{hoverTip:false});
  $('recover-form').addEventListener('submit',event=>{event.preventDefault();try{const resolved=S.resolve(R.editions,$('recover-code').value);stopSearch();setCode(resolved.code);$('recover-code').value='';$('search-status').textContent='';track('code-recovered',{result:'ok'});say('Dictat recuperat amb els mateixos mots, ordre i filtres.');}catch(error){track('code-recovered',{result:'invalid'});say(error.message);}});
  async function copy(value,success,target){try{await navigator.clipboard.writeText(value);if(target)track('share-copied',{target});say(success);}catch{say('No s’ha pogut copiar automàticament. El codi és '+(current?.code||'')+'.');}}
  $('copy-code').addEventListener('click',()=>current&&copy(current.code,'Codi copiat.','code'));
  const shareOptions=()=>({language:L.id,catalogue:current.catalogue,seed:current.code,variety:state.variety});
  $('pronunciation-variety').addEventListener('change',()=>{state.variety=window.PlecAudioVarieties.definition($('pronunciation-variety').value).id;persist();renderPreview();updateURL();});
  const studentURL=()=>LT.publicDictationURL(shareOptions());
  $('open-student').addEventListener('click',()=>{if(current&&!search.busy)location.href=LT.dictationURL(new URL('../',location.href),shareOptions());});
  $('copy-student-link').addEventListener('click',()=>{if(current&&!search.busy)copy(studentURL(),'Enllaç del dictat oral copiat.','student');});
  $('copy-link').addEventListener('click',()=>{if(current&&!search.busy)copy(LT.publicComposerURL(shareOptions()),'Enllaç del full i del configurador copiat.','worksheet');});
  $('catalog-open').addEventListener('click',()=>openCatalog());$('help-open').addEventListener('click',()=>window.PlecMotion.open($('help-dialog')));
  function openInfo(dialogId, titleId) {
    const dialog = $(dialogId);
    window.PlecMotion.open(dialog);
    dialog.querySelector('.dialog-scroll').scrollTop = 0;
    $(titleId).focus({ preventScroll: true });
  }
  $('about-open').addEventListener('click', () => openInfo('about-dialog', 'about-title'));
  $('changelog-open').addEventListener('click', () => openInfo('changelog-dialog', 'changelog-title'));
  let copyTimer;
  $('copy-lightning').addEventListener('click', async () => {
    const address = $('lightning-address'), button = $('copy-lightning'), status = $('lightning-copy-status');
    clearTimeout(copyTimer);
    try {
      await navigator.clipboard.writeText(address.textContent.trim());
      status.textContent = 'Adreça Lightning copiada.';
      button.innerHTML = window.PlecIcons('check'); button.classList.add('copied');
      copyTimer = setTimeout(() => { button.innerHTML = window.PlecIcons('copy'); button.classList.remove('copied'); status.textContent = ''; }, 3500);
    } catch {
      // En fitxers locals o navegadors sense accés al porta-retalls, facilita la còpia manual.
      const range = document.createRange(); range.selectNodeContents(address);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      button.innerHTML = window.PlecIcons('copy'); button.classList.remove('copied');
      status.textContent = 'Selecciona i copia l’adreça amb el menú del navegador o amb Ctrl+C (⌘C al Mac).';
    }
  });
  const releases = [
    ['1.30', '2026-10-27', ['CSS del layout consolidat: columnes, calaixos, peu i impressió agrupats, sense les disposicions antigues que s’anul·laven entre fitxers. Aspecte de pantalla conservat i corregit el retall del full en la impressió directa del navegador.']],
    ['1.29', '2026-10-27', ['Neteja tècnica: gestió de cerques separada de la interfície i retirada de controls antics de revisió que ja no eren accessibles, conservant les dades. Àudios balears en pausa per manca de dicció prou clara i consistent als sistemes provats; IPA disponibles al catàleg.']],
    ['1.28', '2026-10-27', ['Lectures IPA per a les 96 pseudoparaules en tres varietats, amb àudios centrals i valencians en revisió. El catàleg i el mode dictat seleccionen el paquet segons el tipus d’elements i la varietat, conservant els codis existents. Mostra local comparativa de Matxa v2 i Azure amb els mateixos 18 mots balears; encara sense publicació de veus balears.']],
    ['1.27.1', '2026-10-26', ['Àudio mallorquí en pausa: la mostra d’Azure no resol adequadament la neutra tònica i la geminació. Es conserven les propostes IPA i les fonts en revisió, amb l’estat actualitzat al catàleg i la guia. Nous lots bloquejats fins a reprendre explícitament la proposta.']],
    ['1.27', '2026-10-26', ['Catàleg amb recursos independents, reintents selectius i índexs lleugers. Propostes IPA mallorquines amb referència editorial de Palma i àudios en procés. Guia pública de criteris i fonts de pronunciació, i alternativa del repositori per a correccions. Millor continuïtat del teclat al dictat, configurador accessible amb ampliació i respecte pel moviment reduït. Generació segura i comprovacions de desenvolupament reproduïbles.']],
    ['1.26', '2026-10-26', ['Marca vectorial compartida entre web i PDF, amb el lema imprès a la mateixa amplada. Lateral reorganitzat: PDF prioritari i dictat oral separat, còpia i compartició amb icones. Ajuda dels focus només a l’interrogant. Retirada la guia docent i recuperat el format de les notes de l’ajuda, amb una explicació breu del vocabulari bàsic.']],
    ['1.25', '2026-10-26', ['Vocabulari bàsic: selecció editorial de 350 mots, combinable amb nivell i focus, consultable i descarregable al catàleg. Codis antics conservats. Marca plec al full, capçalera i gràfic de l’ajuda alineats, ajuda de plegat simplificada i scroll intern compartit als diàlegs.']],
    ['1.24', '2026-10-26', ['Vista prèvia tàctil: arrossega el full amb un dit i fes zoom amb dos. Instruccions de plec amb esquemes vectorials al peu de la columna del QR, adaptats a terços o quarts i al costat del model. Ajudes dels avisos més clares, separades de la bandera, i passos de privacitat segons el navegador. Número de paraula destacat dins el botó del dictat.']],
    ['1.23', '2026-10-26', ['Analítica agregada amb Umami i controls de privacitat. Avís d’àudio amb un clic, confirmació de recepció i bloqueig de duplicats per mot, varietat i enregistrament durant la pestanya. Els avisos queden inactius quan el tracking no està disponible.']],
    ['1.22.1', '2026-10-25', ['Marca compartida d’ortogra.fi al peu de Plec, amb símbol tipogràfic i enllaç actiu al nou portal de recursos educatius.']],
    ['1.22', '2026-10-25', ['La pronunciació es tria al lateral del docent i queda fixada als enllaços i al QR. L’alumnat veu la varietat indicada sense selector; es conserven els enllaços antics de veu. Marca alineada verticalment al header i peu amb «un projecte d’ortogra.fi», encara inactiu.']],
    ['1.21.2', '2026-10-25', ['Enllaços públics del full, de l’alumnat i dels QR centralitzats a plec.ortogra.fi. Els botons de còpia utilitzen el domini definitiu també quan es treballa en local o des d’una adreça antiga.']],
    ['1.21.1', '2026-10-25', ['QR del full actualitzat a plec.ortogra.fi. L’adreça completa, amb llengua i codi, també s’imprimeix en dues línies sota el QR per poder-la introduir manualment.']],
    ['1.21', '2026-10-25', ['Catàleg únic amb mot, focus, àudios i IPA a la mateixa fila. Cerca global sense canvis automàtics, alfabet centrat i càrrega homogènia de 50 files. Bloc imprès de focus alineat amb Escric i reviso i QR vectorial del dictat amb llengua i codi per a ortogra.fi.']],
    ['1.20', '2026-10-25', ['Catàleg i pronunciacions amb capçalera i filtres compartits. Files compactes amb les dues varietats, IPA interactiva i notificació directa amb bandera. IPA central completa com a proposta. Publicats els 219 àudios centrals que faltaven: 3.299 mots amb Alba i amb Enric. Selector de pronunciació abans de començar el dictat. Focus seleccionats impresos a la banda tapada del full.']],
    ['1.19.1', '2026-10-25', ['Publicats els 3.299 àudios del lot valencià amb Enric, amb IPA congelada i revisió individual oberta. Selector de varietat actiu al catàleg. Tots els MP3 descodificats i comprovats; consum local final de 410.316 caràcters.']],
    ['1.19', '2026-10-25', ['Laterals plegables en pantalles estretes i peu sempre visible, amb desplaçament intern. Pronunciacions i revisió integrades al mateix catàleg. Publicats 3.080 mots centrals i les instruccions. Taula IPA valenciana completa com a proposta i lot d’Enric en generació amb represa i seguiment.']],
    ['1.18', '2026-10-25', ['Taula web amb català central i valencià costat per costat, escolta per enregistrament, polzes i notes locals exportables. Accés des del catàleg i informes preparats per a GitHub, sense enviament automàtic. Represa cada minut davant errors transitoris de síntesi, amb pressupost i aturada conservats.']],
    ['1.17', '2026-10-24', ['Accentuació només amb accent gràfic, dièresi només amb ï o ü, i combinació dels focus amb qualsevol dels triats. Nova edició del banc per conservar exactament els codis anteriors. Taula valenciana independent i primera prova curta amb Enric, pendent d’escolta i contrast.']],
    ['1.16', '2026-10-24', ['Filtres i gestió del dictat en laterals separats, amb entrada al mode dictat més visible. Catàleg amb inicials de text, capçalera i descàrregues fixes, reproducció dels àudios disponibles i varietats previstes. Tema amb un botó al header i marca compartida amb el dictat. Numeració unificada dins de la versió 1. Mostres IPA i taula fonètica oberta per varietats.']],
    ['1.15', '2026-10-24', ['Aparença clara, fosca o del sistema, amb el full sempre clar. Locucions d’instruccions preparades com a MP3 estàtics; generació després del lot actual i revisió abans de publicar. Registre de pronunciacions dubtoses.']],
    ['1.14', '2026-10-24', ['Primera pantalla de dictat al full, amb entrada per codi i enllaç d’alumnat. Tres escoltes per paraula, ritme ajustable abans de començar i pausa en sortir de pantalla completa o canviar de pestanya. Àudios públics encara pendents de revisió; prova local disponible.'] ],
    ['1.13', '2026-10-24', ['Gestió del dictat i PDF al lateral per donar més espai al full. Catàleg per inicials amb cerca global i ajuda ampliada sobre les llavors. Preparació d’àudios amb Azure F0, encara sense reproductor ni àudios publicats.'] ],
    ['1.12', '2026-10-23', ['Codis de 4 + 5 caràcters amb 24,3 milions de variants per configuració. Cerca optimitzada en tandes cancel·lables que es poden continuar sense repetir intents. Ajuda sobre la combinació dels focus i compatibilitat amb els codis antics.'] ],
    ['1.11', '2026-10-23', ['Lateral més ample i focus reorganitzats per aprofitar les files. Mots obligatoris amb Enter o coma i ajuda contextual accessible. Zoom amb Ctrl i roda, amb avís breu; desplaçament natural amb la roda i en pantalles tàctils.'] ],
    ['1.10', '2026-10-23', ['Codis curts recuperables amb filtres i ordre reproduïbles. Cerca de fins a cinc mots obligatoris, sense tria individual ni lateral dret. Codi imprès al full i enllaç compartible. Instantània del banc conservada per recuperar els codis en el futur.'] ],
    ['1.9', '2026-10-23', ['Retirat el filtre Femenins i plurals. Totes les formes continuen al banc i es trien amb els mateixos focus ortogràfics. Les tries i preferències antigues es conserven en retirar el filtre.'] ],
    ['1.8', '2026-10-23', ['Femenins i plurals: 137 formes noves, focus propi i etiquetes ortogràfiques compartides. Retirats ahir-vespre, ahir-nit, blat-de-moro i viuda; es conserva vídua. Incorporat arbitrar en lloc d’arbitre. Contrast exacte de les noves grafies amb el lèxic flexionat de Softcatalà.'] ],
    ['1.7', '2026-10-23', ['Entrada per llengua a /ca/, catàleg separat en JSON i 3.166 paraules per revisar. Descàrregues alfabètiques en text pla i taula de revisió. Identitat verificable del catàleg i dictats guardats amb llengua i versió.'] ],
    ['1.6', '2026-10-23', ['Vista prèvia amb zoom, arrossegament i ajust del full. Menús inicials sintetitzats per donar espai als focus. Retirats els codis aleatoris i la personalització de capçalera. Guia docent a l’ajuda, peu més llegible i animacions de 220 ms.']],
    ['1.5', '2026-10-23', ['Presentació del projecte i V4V com a Pentagrama: foto de l’autor, portfoli, QR i adreça Lightning amb còpia. Historial més compacte, amb capçalera fixa i enllaç al changelog complet.']],
    ['1.4', '2026-10-23', ['Tria automàtica amb els filtres i renovació des del lateral dret.', 'Configuració agrupada, més espai de treball i barres de desplaçament discretes.', 'Formes verbals i focus separats de dièresi i ela geminada.', 'Fulls sense camp Grup, icones Lucide i finestres d’historial i projecte.']],
    ['1.3', '2026-10-23', ['Tres columnes: configuració, full i paraules triades.', 'Capçalera compacta i vista prèvia que aprofita l’alçada disponible.']],
    ['1.2', '2026-10-23', ['Dos formats de plec: terços i quart de full.', 'Esquemes i instruccions adaptats al format i a la posició del model.']],
    ['1.1', '2026-10-23', ['Nivells orientatius amb solapament i ampliació del vocabulari.', 'Model configurable a l’esquerra o a la dreta.']],
    ['1.0', '2026-10-23', ['Primera versió: catàleg, tries, mots propis i exportació de PDF.']]
  ];
  const releaseDate = new Intl.DateTimeFormat(L.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  $('changelog-list').innerHTML = releases.map(([version, date, notes]) => {
    const id = 'release-' + version.replaceAll('.', '-');
    return `<section class="release" aria-labelledby="${id}"><div><h3 id="${id}">${version}</h3><time datetime="${date}">${escape(releaseDate.format(new Date(date + 'T00:00:00Z')))}</time></div><p>${escape(notes.join(' '))}</p></section>`;
  }).join('');
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => window.PlecMotion.close(b.closest('dialog'))));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) window.PlecMotion.close(dialog); } }));

  for(const [id,mode,name] of [['export-words-text','words','paraules'],['export-pseudo-text','pseudo','pseudoparaules']])$(id).addEventListener('click',()=>{
    const text=BANK.entries.filter(e=>e.mode===mode).map(e=>e.text).sort(new Intl.Collator(L.locale,{sensitivity:'variant'}).compare).join('\n')+'\n';
    downloadBlob(new Blob([text],{type:'text/plain;charset=utf-8'}),`plec-${L.id}-${name}.txt`);
  });
  $('export-basic-text').addEventListener('click',()=>{const text=BANK.entries.filter(e=>e.mode==='words'&&e.basicVocabulary).map(e=>e.text).sort(new Intl.Collator(L.locale,{sensitivity:'variant'}).compare).join('\n')+'\n';downloadBlob(new Blob([text],{type:'text/plain;charset=utf-8'}),'plec-ca-vocabulari-basic.txt');});
  $('export-review').addEventListener('click',()=>{
    const rows=[...BANK.entries].sort((a,b)=>a.text.localeCompare(b.text,L.locale));
    const text=['paraula\ttipus\tvocabulari\tortografia\tfocus\tid',...rows.map(e=>[e.text,e.mode,e.vocabulary||'',e.orthography||'',e.tags.join(','),e.id].join('\t'))].join('\n')+'\n';
    downloadBlob(new Blob([text],{type:'text/tab-separated-values;charset=utf-8'}),`plec-${L.id}-revisio.tsv`);
  });
  $('download-pdf').addEventListener('click',exportPdf);
  restore();
  if(arrival.searchParams.has('variety')){try{state.variety=window.PlecAudioVarieties.definition(arrival.searchParams.get('variety')).id;}catch(error){say(error.message);}}
  updateControls();renderPreview();
  const incoming=new URL(location.href).searchParams;
  try{
    if(incoming.has('seed')){
      const result=S.resolve(R.editions,incoming.get('seed'));
      if(incoming.has('catalogue')&&incoming.get('catalogue')!==result.catalogue)throw new Error('El catàleg de l’enllaç no correspon a aquest codi.');
      setCode(result.code);
    }else if(session().code){
      const result=S.resolve(R.editions,session().code);
      if(S.recipeIndex(recipe())!==result.index||!session().required.every(id=>result.entries.some(e=>e.id===id)))generate();else setCode(result.code,{keepRequired:true});
    }else generate();
  }catch(error){current=null;renderPreview();$('search-status').textContent=error.message;}
  if(['pronunciacions','cataleg'].includes(incoming.get('panel')))openCatalog({word:incoming.get('mot')||'',pack:incoming.get('audio')||''});
  window.PlecApp={buildPdf,svgFor};
})();
