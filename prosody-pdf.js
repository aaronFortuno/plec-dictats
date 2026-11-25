/* Printable editorial comparison: one landscape A4 per paragraph, four rhythms. */
(function(root){
 'use strict';
 async function build(entry,plan,library=root.PDFLib){
  const {PDFDocument,StandardFonts,rgb}=library,doc=await PDFDocument.create(),pt=72/25.4;
  const regular=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const printable=root.PlecPdf?.printable||(typeof module!=='undefined'?require('./pdf.js').printable:String);
  const ink='#233a33',muted='#65736a',accent='#9a412c',rule='#d0d8d1',width=297,height=210,margin=12,gap=5,columnWidth=(width-2*margin-gap*3)/4;
  const color=hex=>rgb(...[1,3,5].map(offset=>parseInt(hex.slice(offset,offset+2),16)/255)),pages=[];
  doc.setTitle('Plec · '+entry.code+' · Escaleta de prosòdia');doc.setAuthor('Plec');doc.setSubject('Escaleta validada. Aoede. Àudio pilot pendent d’audició.');
  function wrap(value,size,maxWidth,weight=false){
   const font=weight?bold:regular,rows=[''];
   for(const word of printable(value).split(/\s+/u)){const last=rows.length-1,next=rows[last]?rows[last]+' '+word:word;if(font.widthOfTextAtSize(next,size)/pt>maxWidth&&rows[last])rows.push(word);else rows[last]=next;}
   return rows;
  }
  for(let paragraph=1;paragraph<=plan.paragraphCount;paragraph++){
   const page=doc.addPage([width*pt,height*pt]),shapes=[];
   function text(value,x,y,size=10,weight=false,fill=ink){value=printable(value);page.drawText(value,{x:x*pt,y:(height-y)*pt,size,font:weight?bold:regular,color:color(fill)});shapes.push({type:'text',value,x,y,size,weight,color:fill});}
   function line(x,y,x2,y2){page.drawLine({start:{x:x*pt,y:(height-y)*pt},end:{x:x2*pt,y:(height-y2)*pt},thickness:.5,color:color(rule)});}
   function paragraphText(value,x,y,size,maxWidth,lineHeight,weight=false,fill=ink){const rows=wrap(value,size,maxWidth,weight);rows.forEach((row,i)=>text(row,x,y+i*lineHeight,size,weight,fill));return y+rows.length*lineHeight;}
   text('Escaleta de prosòdia · '+entry.code,margin,15,18,true);
   text(entry.title,margin,23,12);
   text(`Escaleta validada · Aoede · paràgraf ${paragraph} de ${plan.paragraphCount}`,margin,30,9,false,accent);
   text('Etiquetes entre claudàtors: puntuació locutada, fora del recompte de mots. Els rangs són orientatius.',margin,36,9,false,muted);
   text('Talls: 1 s; canvi de paràgraf/final: 1,6 s. Locucions: 0,25 s abans i 0,35 s després. L’escriptura espera el botó Següent.',margin,42,8.3,false,muted);
   line(margin,46,width-margin,46);
   for(const [column,variant]of plan.variants.entries()){
    const x=margin+column*(columnWidth+gap),fragments=variant.fragments.filter(f=>f.paragraph===paragraph);
    text(variant.label,x,53,12,true);
    const headerEnd=paragraphText(variant.direction,x,58,7.8,columnWidth,3.1,false,muted);
    // Equal starting baseline across the four columns, irrespective of direction length.
    if(headerEnd>73)throw Error('La direcció no cap a la capçalera de l’escaleta.');
    let y=74;
    for(const fragment of fragments){
     text(`F${fragment.number} · mots ${fragment.start}-${fragment.end} · ${fragment.wordCount} mots`,x,y,7.8,false,muted);y+=4;
     let cursor=x,row=y;
     const chunks=fragment.words.flatMap(word=>[{value:word.text,cue:false},...fragment.cues.filter(c=>c.afterWord===word.index).map(c=>({value:'['+c.text+']',cue:true}))]);
     for(const chunk of chunks){
      const size=chunk.cue?8.5:10.5,font=chunk.cue?bold:regular,value=printable(chunk.value),length=font.widthOfTextAtSize(value,size)/pt;
      if(cursor>x&&cursor+length>x+columnWidth){cursor=x;row+=4.4;}
      text(value,cursor,row,size,chunk.cue,chunk.cue?accent:ink);cursor+=length+1.1;
     }
     y=row+3.6;
     text((/[.!?]$/u.test(fragment.text)?'Tancament':'Continuació')+' · tall '+(fragment.pauseMs/1000).toLocaleString('ca')+' s',x,y,7.5,false,muted);y+=3.2;
     if(fragment.exception)y=paragraphText('Ajust: '+fragment.reason,x,y,7.5,columnWidth,3.2,false,accent)+1;
     y+=2;
    }
    if(y>198)throw Error(`Un bloc de l’escaleta no cap al PDF (${paragraph}, ${variant.id}, ${y}).`);
    if(column<3)line(x+columnWidth+gap/2,49,x+columnWidth+gap/2,196);
   }
   text('Plec · Escaleta docent · '+plan.wordCount+' mots de dictat · '+plan.cues.length+' locucions per variant',margin,204,8,false,muted);
   text(paragraph+' / '+plan.paragraphCount,width-22,204,8,false,muted);
   pages.push(shapes);
  }
  return {bytes:await doc.save(),pages,width,height};
 }
 const api={build};root.PlecProsodyPdf=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
