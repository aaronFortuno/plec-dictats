/* Shared measured geometry for the asymmetric text worksheet preview and PDF. */
(function(root){
 'use strict';
 const T=root.PlecTexts||(typeof module!=='undefined'?require('./text-dictations.js'):null);
 const Brand=root.PlecBrand||(typeof module!=='undefined'?require('./brand.js'):null);
 const QR=root.PlecWorksheetQR||(typeof module!=='undefined'?require('./worksheet-qr.js'):null);
 const Pdf=root.PlecPdf||(typeof module!=='undefined'?require('./pdf.js'):null);
 const mm=25.4/72,ink='#233a33',muted='#65736a';
 async function prepare(entry,input={},library=root.PDFLib){
  if(!entry||entry.language!=='ca')throw Error('Aquest prototip només està disponible en català.');
  const settings=T.options(input),doc=await library.PDFDocument.create(),font=await doc.embedFont(library.StandardFonts.Helvetica),bold=await doc.embedFont(library.StandardFonts.HelveticaBold);
  const shapes=[],vertical=settings.fold==='vertical',modelFirst=settings.side==='start';
  // The smaller model folds behind the larger writing panel.
  const model=vertical?{x:modelFirst?0:125,y:0,w:85,h:297}:{x:0,y:modelFirst?0:170,w:210,h:127};
  const writing=vertical?{x:modelFirst?85:0,y:0,w:125,h:297}:{x:0,y:modelFirst?127:0,w:210,h:170};
  const crease=vertical?(modelFirst?85:125):(modelFirst?127:170);
  const text=(value,x,y,size=11,weight=false,color=ink,extra={})=>shapes.push({type:'text',value,x,y,size,weight,color,...extra});
  function lines(value,width,size,weight=false){
   const face=weight?bold:font,out=[''];
   for(const word of Pdf.printable(value).split(/\s+/u)){
    const last=out.length-1,next=out[last]?(out[last]+' '+word):word;
    if(face.widthOfTextAtSize(next,size)*mm>width&&out[last])out.push(word);else out[last]=next;
   }
   return out;
  }
  function paragraph(value,x,y,width,size=12,lineHeight=5.6){const rows=lines(value,width,size);rows.forEach((row,i)=>text(row,x,y+i*lineHeight,size));return y+rows.length*lineHeight;}
  const line=(x,y,x2,y2,color='#ccd4ce',dash=false,extra={})=>shapes.push({type:'line',x,y,x2,y2,color,width:.2,...(dash?{dash:true}:{}),...extra});
  if(vertical)line(crease,7,crease,290,muted,true);else line(7,crease,203,crease,muted,true);
  for(const area of [model,writing])shapes.push(...Brand.shapes(area.x+10,area.y+10,30));
  const bodyTop=80,modelBodyTop=vertical?bodyTop:60,fontSize=settings.fontSize,rowHeight=settings.lineSpacing;
  const modelRowHeight=vertical?rowHeight:Math.max(6,rowHeight*.65),paragraphGap=vertical?rowHeight:modelRowHeight;
  text('Model de correcció',model.x+10,model.y+30,12,true);
  paragraph(entry.title,model.x+10,model.y+38,model.w-20,12,5);
  text('Focus de pràctica: '+entry.focusLabels.join(' · '),model.x+10,model.y+46,10,false,muted);
  let y=modelBodyTop;
  const paragraphRows=entry.paragraphs.map((value,index)=>{
   const rows=lines(value,model.w-20,fontSize),start=y;
   rows.forEach((row,i)=>text(row,model.x+10,model.y+start+i*modelRowHeight,fontSize,false,ink,{role:'text-model-line',paragraph:index}));
   const writingRows=vertical?rows.length+1:0;
   if(vertical)for(let i=0;i<writingRows;i++)line(writing.x+10,writing.y+start+i*rowHeight,writing.x+writing.w-10,writing.y+start+i*rowHeight,'#ccd4ce',false,{role:'text-writing-rule',paragraph:index});
   y+=(vertical?writingRows:rows.length)*modelRowHeight+paragraphGap;
   return {start,rows:rows.length,writingRows};
  });
  const last=paragraphRows.at(-1),lastModelBaseline=last.start+(last.rows-1)*modelRowHeight;
  const lastWritingBaseline=vertical?last.start+(last.writingRows-1)*rowHeight:0;
  if(lastModelBaseline>model.h-(vertical?20:12)||lastWritingBaseline>writing.h-10)throw Error('Amb aquesta mida i aquest interlineat, el dictat no cap al full. Redueix la mida del model o l’interlineat.');
  paragraph('Plega el model cap enrere. En acabar, desplega i revisa.',model.x+10,model.y+model.h-(vertical?12:5),model.w-20,8,3.4);
  const url=T.url(entry,settings,true);
  const qrRight=writing.x+writing.w-10;
  shapes.push(...QR.shapes(url,qrRight-25,writing.y+9,25));
  text('CA / '+entry.code,qrRight,writing.y+39,8,true,ink,{align:'right'});
  // Keep the address below the QR, away from the name/date fields. The QR
  // retains the full URL even if a future address needs visual truncation.
  const visible=url.replace('https://',''),limit=Math.min(52,writing.w-75),rows=[''];
  for(const char of visible){
   const last=rows.length-1;
   if(font.widthOfTextAtSize(rows[last]+char,6.8)*mm<=limit){rows[last]+=char;continue;}
   if(rows.length<2){rows.push(char);continue;}
   while(font.widthOfTextAtSize(rows[last]+'...',6.8)*mm>limit)rows[last]=rows[last].slice(0,-1);
   rows[last]+='...';break;
  }
  rows.forEach((row,i)=>text(row,qrRight,writing.y+45+i*3,6.8,false,muted,{align:'right',role:'text-dictation-url'}));
  text('Escric i reviso',writing.x+10,writing.y+30,12,true);
  text('Nom: __________________',writing.x+10,writing.y+40,10);
  text('Data: __________________',writing.x+10,writing.y+48,10);
  if(!vertical)for(let row=bodyTop;row<=writing.h-10;row+=rowHeight)line(writing.x+10,writing.y+row,writing.x+writing.w-10,writing.y+row,'#ccd4ce',false,{role:'text-writing-rule'});
  const bytes=await Pdf.build({title:entry.title,seedCode:entry.code},library,{worksheet:()=>shapes});
  return {bytes,shapes,settings,url,layout:{model,writing,crease,bodyTop,modelBodyTop,fontSize,rowHeight,modelRowHeight,paragraphGap,paragraphRows}};
 }
 function svg(shapes){
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nodes=shapes.map(s=>{
   if(s.type==='line')return `<line x1="${s.x}" y1="${s.y}" x2="${s.x2}" y2="${s.y2}" stroke="${s.color}" stroke-width="${s.width}" ${s.dash?'stroke-dasharray="1.5 1.4"':''}/>`;
   if(s.type==='rect')return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${s.color}"/>`;
   if(s.type==='path')return `<path d="${s.d}" transform="translate(${s.x} ${s.y}) scale(${s.scale})" fill="${s.fill?s.color:'none'}" stroke="${s.fill?'none':s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
   return `<text x="${s.x}" y="${s.y}" font-family="Arial,Helvetica,sans-serif" font-size="${s.size*mm}" font-weight="${s.weight?700:400}" fill="${s.color}" text-anchor="${s.align==='right'?'end':'start'}">${escape(s.value)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" role="img" aria-label="Dictat normal: full A4 amb més espai per escriure"><rect width="210" height="297" fill="white"/>${nodes.join('')}</svg>`;
 }
 const api={prepare,svg};root.PlecTextWorksheet=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
