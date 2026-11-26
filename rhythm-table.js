/* Teacher review only: proposals never change the portable student profiles. */
(function(){
 'use strict';
 const R=window.PlecRhythmCode,$=id=>document.getElementById(id),dialog=$('rhythm-table-dialog');
 if(!dialog||!R)return;
 const profiles=R.all(),drafts=new Map(),key='plec-rhythm-label-proposals-v1',pace={2:'2–3',4:'4–5',6:'6–8',10:'9–12'},wait={'0.8':'Pausa breu','1':'Pausa habitual','1.25':'Pausa llarga'};
 let storage=true;
 const status=message=>{$('rhythm-table-status').textContent=message;},sig=p=>[p.pace,p.rate,p.waitFactor].join(':');
 function proposal(p){return drafts.get(p.id)||{code:p.code,picture:p.picture};}
 if(R.editable){try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved?.revision===R.revision)for(const p of profiles){const d=saved.entries?.[p.id];if(d&&typeof d.code==='string'&&typeof d.picture==='string')drafts.set(p.id,{code:d.code.slice(0,12),picture:d.picture.slice(0,100)});}}catch{storage=false;}}
 function changes(){return profiles.filter(p=>{const d=proposal(p);return d.code!==p.code||d.picture!==p.picture;});}
 function validate(){
  const seen=new Map();let invalid=false;
  for(const p of profiles){const d=proposal(p),code=R.normalize(d.code),other=R.decode(code),collision=other&&sig(other)!==sig(p);let error=!/^[A-Z]{2,12}$/.test(code)||collision||!d.picture.trim();
   if(seen.has(code)){error=true;const previous=$('rhythm-code-'+seen.get(code));previous?.setAttribute('aria-invalid','true');}else seen.set(code,p.id);
   const input=$('rhythm-code-'+p.id);input?.setAttribute('aria-invalid',String(Boolean(error)));invalid||=Boolean(error);
  }
  $('rhythm-table-copy').disabled=invalid||!changes().length;
  status(invalid?'Revisa els codis: entre 2 i 12 lletres, sense repeticions ni noms reservats a un altre ajust. Indica també una imatge.':changes().length?changes().length+' propostes per copiar.'+(storage?'':' Es conserven només mentre aquesta pàgina és oberta.'):'Encara no has fet cap canvi.');
  return !invalid;
 }
 function save(){try{localStorage.setItem(key,JSON.stringify({revision:R.revision,entries:Object.fromEntries(drafts)}));}catch{storage=false;}}
 function field(p,kind,label){
  const input=document.createElement('input');input.type='text';input.id='rhythm-'+kind+'-'+p.id;input.value=proposal(p)[kind];input.maxLength=kind==='code'?12:100;input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label',label+' · '+pace[p.pace]+' mots · '+p.rate*100+' % · '+wait[p.waitFactor]);
  input.addEventListener('input',()=>{drafts.set(p.id,{...proposal(p),[kind]:kind==='code'?R.normalize(input.value):input.value});$('rhythm-table-fallback').hidden=true;save();validate();});
  input.addEventListener('change',()=>{input.value=proposal(p)[kind];});return input;
 }
 function render(){
  const content=$('rhythm-table-content');content.replaceChildren();
  $('rhythm-table-review').hidden=!R.editable;$('rhythm-table-actions').hidden=!R.editable;
  for(const factor of [.8,1,1.25]){
   const table=document.createElement('table'),caption=document.createElement('caption');caption.textContent=wait[factor];table.append(caption);
   const head=table.createTHead().insertRow();for(const text of ['Mots', '80 %','90 %','100 %']){const th=document.createElement('th');th.scope='col';th.textContent=text;head.append(th);}
   const body=table.createTBody();
   for(const count of [2,4,6,10]){const row=body.insertRow(),th=document.createElement('th');th.scope='row';th.textContent=pace[count];row.append(th);
    for(const rate of [.8,.9,1]){const p=profiles.find(p=>p.pace===count&&p.rate===rate&&p.waitFactor===factor),cell=row.insertCell(),card=document.createElement('div'),image=document.createElement('img');card.className='rhythm-code-card';image.src=new URL('../'+p.image,location.href).href;image.alt=p.picture;image.width=48;image.height=48;card.append(image);
     if(R.editable){card.append(field(p,'code','Codi proposat'),field(p,'picture','Imatge proposada'));}else{const label=document.createElement('b');label.textContent=p.code;card.append(label);}cell.append(card);
    }
   }content.append(table);
  }
  if(R.editable)validate();else status('Introdueix el codi abans de començar. Si ajustes el ritme, al final rebràs el codi corresponent.');
 }
 $('rhythm-table-open').addEventListener('click',()=>{render();window.PlecMotion.open(dialog);});
 $('rhythm-table-reset').addEventListener('click',()=>{drafts.clear();try{localStorage.removeItem(key);}catch{}$('rhythm-table-fallback').hidden=true;render();});
 $('rhythm-table-copy').addEventListener('click',async()=>{
  if(!R.editable||!validate()||!changes().length)return;
  const text=['Plec · Proposta de codis de ritme',R.revision,...changes().map(p=>{const d=proposal(p);return '\n'+p.code+' → '+d.code+' [ID '+p.id+']\n'+pace[p.pace]+' mots · '+p.rate*100+' % · '+wait[p.waitFactor]+'\nImatge proposada: '+d.picture;})].join('\n');
  try{await navigator.clipboard.writeText(text);status('Propostes copiades. Ja les pots enganxar al xat.');}catch{const area=$('rhythm-table-fallback');area.value=text;area.hidden=false;area.focus();area.select();status('Copia el text seleccionat amb Ctrl+C o el menú del dispositiu.');}
 });
})();
