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
  const $=id=>document.getElementById(id),escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const STORAGE='plec-seeds-v1:'+L.id;
  const defaults=mode=>({count:mode==='words'?24:20,stage:mode==='words'?'cs':'all',tags:[...(mode==='words'?S.WORD_FOCUSES:S.PSEUDO_FOCUSES)],required:[],code:null});
  let state={mode:'words',modelSide:'left',foldStyle:'thirds',sessions:{words:defaults('words'),pseudo:defaults('pseudo')}},current=null,busy=false,job=0,controller=null,pendingSearch=null,toastTimer;
  let legacy=null;
  try{legacy=localStorage.getItem('plec-dictats-v1:'+L.id)||localStorage.getItem('plec-dictats-v1');}catch{}
  const session=()=>state.sessions[state.mode];
  const modeTags=mode=>C.categories.filter(c=>c.mode===mode);
  // Keep the visual and keyboard order together; compact short focuses beside long ones.
  const focusOrder=['accent','essa','hac','gej','beve','erra','verbs','qugu','vocals','dieresi','digrafs','signes'];
  const allEntries=()=>C.entries;
  const lookup=id=>C.entries.find(e=>e.id===id);
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
      if(saved&&R.editions.some(e=>e.slot===data.edition)){edition=R.editions.find(e=>e.slot===data.edition);C=edition.catalog;}
      for(const mode of ['words','pseudo']){
        const src=data.sessions?.[mode];if(!src)continue;const dest=state.sessions[mode];
        if(S.COUNTS.includes(src.count))dest.count=src.count;
        if(S.STAGES.includes(src.stage))dest.stage=mode==='pseudo'?'all':src.stage;
        if(Array.isArray(src.tags))dest.tags=K.migrateFocusTags(src.tags,modeTags(mode).map(c=>c.id),['flexio','custom']);
        if(saved){dest.required=Array.isArray(src.required)?[...new Set(src.required.filter(id=>lookup(id)?.mode===mode))].slice(0,5):[];dest.code=typeof src.code==='string'?src.code:null;}
      }
    }catch{}
  }
  function updateURL(){try{const url=new URL(location.href),panel=new URLSearchParams(url.search);url.search='';url.hash='';if(current){url.searchParams.set('seed',S.normalize(current.code));url.searchParams.set('catalogue',current.catalogue);}for(const name of ['panel','mot','audio'])if(panel.has(name))url.searchParams.set(name,panel.get(name));history.replaceState(null,'',url);}catch{}}
  function setCode(code,{keepRequired=false}={}){
    const result=S.resolve(R.editions,code),next=R.editions.find(e=>e.slot===result.epoch);
    if(next.language!==L.id)throw new Error('El codi correspon a una altra llengua.');
    edition=next;C=next.catalog;state.mode=result.recipe.mode;
    const s=session();s.count=result.recipe.count;s.stage=result.recipe.stage;s.tags=[...result.recipe.tags];s.code=result.code;if(!keepRequired)s.required=[];
    current=result;pendingSearch=null;persist();updateControls();renderPreview();updateURL();
  }
  const randomNonce=()=>{const values=new Uint32Array(1),ceiling=Math.floor(4294967296/S.VARIANTS)*S.VARIANTS;do{crypto.getRandomValues(values);}while(values[0]>=ceiling);return values[0]%S.VARIANTS;};
  function stopSearch(){job++;controller?.abort();controller=null;busy=false;pendingSearch=null;}
  async function generate({resume=false}={}){
    const continuing=resume?pendingSearch:null;
    // New exercises use current focus definitions; recovered codes keep their archive.
    if(!continuing&&edition.slot!==R.current){edition=R.editions.find(e=>e.slot===R.current);C=edition.catalog;updateControls();}
    stopSearch();const id=job,previous=current;current=null;session().code=null;persist();updateURL();busy=true;controller=new AbortController();renderPreview();updateAvailability();
    $('search-status').textContent=session().required.length?'Buscant un codi compatible…':'';
    try{
      const p=continuing?.prepared||S.prepare(edition,recipe()),required=continuing?.required||[...session().required],prior=continuing?.attempts||0;
      let start=continuing?.nextNonce??randomNonce();if(!continuing&&previous&&previous.index===p.index&&previous.epoch===p.epoch&&start===previous.nonce)start=(start+1)%S.VARIANTS;
      const result=await S.search(p,required,{start,maxAttempts:continuing?.remaining??S.VARIANTS,signal:controller.signal,onProgress:attempts=>{if(id===job)$('search-status').textContent=`${(prior+attempts).toLocaleString(L.locale)} de ${S.VARIANTS.toLocaleString(L.locale)} variants comprovades…`;}});
      if(id!==job)return;
      if(!result.found){
        if(result.remaining){pendingSearch={prepared:p,required,nextNonce:result.nextNonce,remaining:result.remaining,attempts:prior+result.attempts};$('search-status').textContent=`Encara no hem trobat cap codi. ${(prior+result.attempts).toLocaleString(L.locale)} de ${S.VARIANTS.toLocaleString(L.locale)} variants comprovades. Pots continuar la cerca o ajustar els mots.`;}
        else $('search-status').textContent=`Cap de les ${S.VARIANTS.toLocaleString(L.locale)} variants inclou tots aquests mots. Treu algun mot o ajusta els focus.`;
        return;
      }
      const code=S.encode({epoch:p.epoch,recipe:p.index,nonce:result.nonce});setCode(code,{keepRequired:true});
      const attempts=prior+result.attempts;$('search-status').textContent=required.length?`Codi trobat després de ${attempts.toLocaleString(L.locale)} ${attempts===1?'intent':'intents'}.`:'';
    }catch(error){if(id===job&&!controller?.signal.aborted)$('search-status').textContent=error.message;}
    finally{if(id===job){busy=false;controller=null;renderPreview();updateAvailability();}}
  }
  function updateControls(){
    const s=session();document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
    $('count-control').value=s.count;$('stage-field').hidden=state.mode==='pseudo';$('stage-control').value=s.stage;
    $('fold-style-control').value=state.foldStyle;document.querySelectorAll('[data-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.side===state.modelSide)));
    const focuses=modeTags(state.mode);if(state.mode==='words')focuses.sort((a,b)=>focusOrder.indexOf(a.id)-focusOrder.indexOf(b.id));
    $('tag-options').innerHTML=focuses.map(c=>`<label class="tag" title="${escape(c.title)}"><input type="checkbox" value="${c.id}" ${s.tags.includes(c.id)?'checked':''}><span>${window.PlecIcons('check')}${escape(c.label)}</span></label>`).join('');
    $('pseudo-note').hidden=state.mode!=='pseudo';$('word-total').textContent=C.entries.filter(e=>e.mode==='words').length;$('pseudo-total').textContent=C.entries.filter(e=>e.mode==='pseudo').length;$('seed-language').textContent=L.id.toUpperCase();
    const layout=K.foldLayout(state.foldStyle,state.modelSide);
    $('fold-guide-title').textContent=`${layout.name} · model a ${state.modelSide==='left'?'l’esquerra':'la dreta'}`;
    $('fold-map').innerHTML=layout.panels.map(p=>`<span class="fold-panel ${p.kind}" style="flex:${p.width}"><b>${{model:'Model',writing:'Escric',blank:'Buit'}[p.kind]}</b><small>${p.width} mm</small></span>`).join('');
    $('fold-map').setAttribute('aria-label','Full obert: '+layout.hint);$('fold-sketch').innerHTML=foldSketch(layout);$('fold-step-list').innerHTML=layout.steps.map(step=>`<li>${escape(step)}</li>`).join('');
    renderRequired();updateAvailability();
  }
  function updateAvailability(){const p=pool();$('pool-count').textContent=p.length;$('pool-status').textContent=!session().tags.length?' · Tria almenys un focus.':p.length<session().count?' · Amplia els filtres o redueix la llargada.':'';$('cancel-search').hidden=!busy;$('resume-search').hidden=busy||!pendingSearch;$('new-dictation').disabled=busy;}
  function renderRequired(){
    $('required-list').innerHTML=session().required.map(id=>`<span class="required-chip">${escape(lookup(id)?.text||id)}<button type="button" data-remove-required="${id}" aria-label="Treu ${escape(lookup(id)?.text||id)}">${window.PlecIcons('x')}</button></span>`).join('');suggest();
  }
  function suggest(){const query=K.normalize($('required-word').value.trim());$('required-options').innerHTML=query?pool().filter(e=>!session().required.includes(e.id)&&K.normalize(e.text).includes(query)).slice(0,12).map(e=>`<option value="${escape(e.text)}"></option>`).join(''):'';}
  function addRequired(){
    const texts=[...new Set($('required-word').value.split(',').map(t=>t.trim().normalize('NFC').toLocaleLowerCase(L.locale)).filter(Boolean))];
    if(!texts.length)return;
    const entries=texts.map(text=>C.entries.find(e=>e.mode===state.mode&&e.text===text));
    if(entries.some(e=>!e))return say('Tria mots del catàleg, amb la grafia i els accents corresponents.');
    const available=new Set(pool().map(e=>e.id));
    if(entries.some(e=>!available.has(e.id)))return say('Un dels mots queda fora dels filtres actuals. Ajusta els focus o el nivell.');
    const required=[...new Set([...session().required,...entries.map(e=>e.id)])];
    if(required.length>5)return say('Pots demanar fins a cinc mots obligatoris.');
    $('required-word').value='';
    if(required.length===session().required.length){suggest();return;}
    session().required=required;persist();renderRequired();generate();
  }
  function foldSketch(layout) {
    const mirror = layout.side === 'right', mx = x => mirror ? 360 - x : x;
    const line = (x1,y1,x2,y2,color='#65736a') => `<line x1="${mx(x1)}" y1="${y1}" x2="${mx(x2)}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>`;
    const label = (x,y,text,color='#234d43') => `<text x="${mx(x)}" y="${y}" text-anchor="${mirror?'end':'start'}" fill="${color}">${text}</text>`;
    const headings = '<text x="12" y="17" class="fold-phase">Durant el dictat</text><text x="12" y="118" class="fold-phase">Per corregir</text>';
    const drawing = layout.foldStyle === 'quarter'
      ? line(20,60,340,60)+line(20,60,177,49)+line(26,58,177,49)+label(30,39,'model amagat')+label(193,81,'escriptura')+line(20,167,340,167)+line(20,167,174,139)+line(22,139,174,139)+label(29,132,'model visible')+label(193,188,'escriptura')
      : line(90,51,270,51)+line(90,57,268,57)+line(92,63,270,63)+label(100,41,'escriptura')+label(95,83,'buit i model al darrere')+line(20,161,340,161)+line(180,168,340,168)+label(28,150,'model visible')+label(195,150,'escriptura');
    return `<svg viewBox="0 0 360 202" role="img" aria-label="Vista lateral orientativa del full durant el dictat i durant la correcció">${headings}${drawing}</svg>`;
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
      const safeShape = { ...s, value: printable(s.value) };
      return `<text x="${s.x}" y="${s.y}" font-family="Arial,Helvetica,sans-serif" font-size="${fitSize(safeShape) * MM}" font-weight="${s.weight ? 700 : 400}" fill="${s.color}" text-anchor="${s.align === 'right' ? 'end' : s.align === 'center' ? 'middle' : 'start'}">${escape(safeShape.value)}</text>`;
    }).join('')}</svg>`;
  }

  function sheetOptions(){return{entries:chosen(),title:state.mode==='words'?'Dictat de paraules':'Dictat de pseudoparaules',mode:state.mode,modelSide:state.modelSide,foldStyle:state.foldStyle,seedCode:current?.code,seedLanguage:L.id,focusLabels:session().tags.map(id=>C.categories.find(c=>c.id===id)?.label||id)};}
  const fitPaper=()=>window.PlecPreview.fit();
  function renderPreview(){
    const entries=chosen(),layout=K.foldLayout(state.foldStyle,state.modelSide),ready=!!current&&!busy;
    $('sheet-preview').innerHTML=entries.length?svgFor(K.worksheet(sheetOptions()),layout):`<div class="empty-selection">${busy?'Buscant un dictat…':'Ajusta els filtres o recupera un codi per veure el full.'}</div>`;
    $('seed-code').textContent=busy?'…':current?.code||'—';$('selection-summary').textContent=`${entries.length} / ${session().count} elements`;
    $('preview-layout').textContent=`${layout.name} · model a ${state.modelSide==='left'?'l’esquerra':'la dreta'}`;
    for(const id of ['download-pdf','teacher-pdf','copy-code','copy-link','open-student','copy-student-link'])$(id).disabled=!ready;
    $('sheet-preview').setAttribute('aria-label',`Vista prèvia: ${entries.length} elements. Model visible.`);fitPaper();
  }
  function openCatalog(options={}){
    window.PlecCatalogView.open({entries:C.entries,categories:C.categories,mode:state.mode,revision:C.revision,locale:L.locale,matchesStage:(entry,stage)=>S.matchesStage(entry,stage,edition.profile.stageRules)},options);
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  async function buildPdf(teacher = false) { return window.PlecPdf.build(sheetOptions(), teacher, C.categories); }
  async function exportPdf(teacher) {
    const button = $(teacher ? 'teacher-pdf' : 'download-pdf'), original = button.innerHTML;
    button.disabled = true; button.textContent = 'Preparant…';
    try {
      const bytes = await buildPdf(teacher);
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `plec-${state.mode === 'words' ? 'paraules' : 'pseudoparaules'}-${session().count}-${state.foldStyle === 'quarter' ? 'quart' : 'tercos'}-${state.modelSide === 'right' ? 'dreta' : 'esquerra'}${teacher ? '-guia' : ''}.pdf`);
      say(teacher ? 'Guia docent descarregada, en el mateix ordre que el full.' : 'PDF descarregat. Imprimeix-lo en A4 a escala 100 %.');
    } catch (error) { say('No s’ha pogut generar el PDF. ' + error.message); }
    finally { button.innerHTML = original; renderPreview(); }
  }

  $('mode-control').addEventListener('click',event=>{const b=event.target.closest('[data-mode]');if(!b||b.dataset.mode===state.mode)return;state.mode=b.dataset.mode;edition=R.editions.find(e=>e.slot===R.current);C=edition.catalog;updateControls();generate();});
  $('count-control').addEventListener('change',event=>{session().count=+event.target.value;persist();generate();});
  $('stage-control').addEventListener('change',event=>{session().stage=event.target.value;persist();generate();});
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
  function setupHelp(triggerId,buttonId,tipId){
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
      if(!helpPinned&&!helpTrigger.matches(':hover')&&!helpTip.matches(':hover')&&!helpTrigger.contains(document.activeElement))hideRequiredHelp();
    },140);
  }
  for(const target of [helpTrigger,helpTip]){target.addEventListener('pointerenter',showRequiredHelp);target.addEventListener('pointerleave',scheduleHelpClose);}
  helpTrigger.addEventListener('focusin',showRequiredHelp);helpTrigger.addEventListener('focusout',scheduleHelpClose);
  helpButton.addEventListener('click',()=>{helpPinned=!helpPinned;if(helpPinned)showRequiredHelp();else hideRequiredHelp();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){helpPinned=false;hideRequiredHelp();}});
  document.addEventListener('pointerdown',event=>{if(!helpTrigger.contains(event.target)&&!helpTip.contains(event.target)){helpPinned=false;hideRequiredHelp();}});
  document.querySelector('.config-scroll').addEventListener('scroll',()=>{helpPinned=false;hideRequiredHelp();});
  window.addEventListener('scroll',()=>{if(!helpTip.hidden){helpPinned=false;hideRequiredHelp();}},{passive:true});
  window.addEventListener('resize',()=>{if(!helpTip.hidden)positionHelp();});
  }
  setupHelp('required-help-trigger','required-help-toggle','required-help');
  setupHelp('focus-help-trigger','focus-help-toggle','focus-help');
  $('recover-form').addEventListener('submit',event=>{event.preventDefault();try{const resolved=S.resolve(R.editions,$('recover-code').value);stopSearch();setCode(resolved.code);$('recover-code').value='';$('search-status').textContent='';say('Dictat recuperat amb els mateixos mots, ordre i filtres.');}catch(error){say(error.message);}});
  async function copy(value,success){try{await navigator.clipboard.writeText(value);say(success);}catch{say('No s’ha pogut copiar automàticament. El codi és '+(current?.code||'')+'.');}}
  $('copy-code').addEventListener('click',()=>current&&copy(current.code,'Codi copiat.'));
  const shareOptions=()=>({language:L.id,catalogue:current.catalogue,seed:current.code});
  const studentURL=()=>LT.publicDictationURL(shareOptions());
  $('open-student').addEventListener('click',()=>{if(current&&!busy)location.href=LT.dictationURL(new URL('../',location.href),shareOptions());});
  $('copy-student-link').addEventListener('click',()=>{if(current&&!busy)copy(studentURL(),'Enllaç per a l’alumnat copiat.');});
  $('copy-link').addEventListener('click',()=>{if(current&&!busy)copy(LT.publicComposerURL(shareOptions()),'Enllaç del dictat copiat.');});
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
    const text=C.entries.filter(e=>e.mode===mode).map(e=>e.text).sort(new Intl.Collator(L.locale,{sensitivity:'variant'}).compare).join('\n')+'\n';
    downloadBlob(new Blob([text],{type:'text/plain;charset=utf-8'}),`plec-${L.id}-${name}.txt`);
  });
  $('export-review').addEventListener('click',()=>{
    const rows=[...C.entries].sort((a,b)=>a.text.localeCompare(b.text,L.locale));
    const text=['paraula\ttipus\tvocabulari\tortografia\tfocus\tid',...rows.map(e=>[e.text,e.mode,e.vocabulary||'',e.orthography||'',e.tags.join(','),e.id].join('\t'))].join('\n')+'\n';
    downloadBlob(new Blob([text],{type:'text/tab-separated-values;charset=utf-8'}),`plec-${L.id}-revisio.tsv`);
  });
  $('download-pdf').addEventListener('click',()=>exportPdf(false));$('teacher-pdf').addEventListener('click',()=>exportPdf(true));
  restore();updateControls();renderPreview();
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
