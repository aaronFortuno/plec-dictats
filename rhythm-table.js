/* Informational matrix of the approved portable rhythm codes. */
(function(){
 'use strict';
 const R=window.PlecRhythmCode,$=id=>document.getElementById(id),dialog=$('rhythm-table-dialog');
 if(!dialog||!R)return;
 const profiles=R.all(),pace={2:'2–3',4:'4–5',6:'6–8',10:'9–12'},wait={'0.8':'Pausa breu','1':'Pausa habitual','1.25':'Pausa llarga'};
 function render(){
  const content=$('rhythm-table-content');content.replaceChildren();
  for(const factor of [.8,1,1.25]){
   const table=document.createElement('table'),caption=document.createElement('caption');caption.textContent=wait[factor];table.dataset.pause=String(factor);table.append(caption);
   const head=table.createTHead().insertRow();for(const text of ['Mots', '80 %','90 %','100 %']){const th=document.createElement('th');th.scope='col';th.textContent=text;head.append(th);}
   const body=table.createTBody();
   for(const count of [2,4,6,10]){const row=body.insertRow(),th=document.createElement('th');th.scope='row';th.textContent=pace[count];row.append(th);
    for(const rate of [.8,.9,1]){const p=profiles.find(p=>p.pace===count&&p.rate===rate&&p.waitFactor===factor),cell=row.insertCell(),card=document.createElement('div'),image=document.createElement('img');card.className='rhythm-code-card';image.src=new URL('../'+p.image,location.href).href;image.alt=p.picture;image.width=48;image.height=48;card.append(image);
     const label=document.createElement('b');label.textContent=p.code;card.append(label);cell.append(card);
    }
   }content.append(table);
  }
 }
 document.querySelectorAll('[data-rhythm-pause]').forEach(button=>button.addEventListener('click',()=>{dialog.dataset.pause=button.dataset.rhythmPause;document.querySelectorAll('[data-rhythm-pause]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
 $('rhythm-table-open').addEventListener('click',()=>{render();window.PlecMotion.open(dialog);});
})();
