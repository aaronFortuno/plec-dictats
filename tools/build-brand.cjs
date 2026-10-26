// Fixed text artwork: native Georgia outlines, no font files distributed.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'prepare-brand-outlines.ps1')],{stdio:'pipe',windowsHide:true});
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8').replace(/^\uFEFF/,'')),layout=read('assets/brand/source-layout.json'),glyphs=read('tmp/brand-outlines.json');
const n=v=>String(Number(v.toFixed(4))),point=p=>p.map(n).join(' ');
function glyph(g){
 let d='',current,start;const extrema=[];
 const add=p=>extrema.push(p),at=(a,b,c,d,t)=>a*(1-t)**3+3*b*(1-t)**2*t+3*c*(1-t)*t*t+d*t**3;
 for(let i=0;i<g.points.length;i++){
  const p=g.points[i],type=g.types[i]&7;
  if(type===0){d+='M '+point(p)+' ';current=start=p;add(p);}
  else if(type===1){d+='L '+point(p)+' ';current=p;add(p);}
  else if(type===3){const a=current,b=p,c=g.points[i+1],e=g.points[i+2];d+='C '+[b,c,e].map(point).join(' ')+' ';add(e);
   for(let axis=0;axis<2;axis++){const A=-a[axis]+3*b[axis]-3*c[axis]+e[axis],B=2*(a[axis]-2*b[axis]+c[axis]),C=b[axis]-a[axis],disc=B*B-4*A*C;
    const roots=Math.abs(A)<1e-9?(Math.abs(B)>1e-9?[-C/B]:[]):disc>=0?[(-B+Math.sqrt(disc))/(2*A),(-B-Math.sqrt(disc))/(2*A)]:[];
    for(const t of roots)if(t>0&&t<1)add([at(a[0],b[0],c[0],e[0],t),at(a[1],b[1],c[1],e[1],t)]);
   }current=e;i+=2;
  }
  if(g.types[i]&128){d+='Z ';current=start;}
 }
 return{d:d.trim(),points:extrema};
}
function group(items,color,component,value){const curves=items.map(glyph);return{d:curves.map(g=>g.d).join(' '),fill:true,color,component,value,points:curves.flatMap(g=>g.points)};}
const iconScale=layout.icon.width/42,iconY=layout.icon.y+(layout.icon.height-44*iconScale)/2;
const iconPaths=[[[3,8],[15,3],[28,8],[39,3],[39,36],[28,41],[15,36],[3,41],[3,8]],[[15,3],[15,36]],[[28,8],[28,41]]].map(points=>{
 const p=points.map(([x,y])=>[layout.icon.x+x*iconScale,iconY+y*iconScale]);return{d:'M '+p.map(point).join(' L '),fill:false,color:'green',width:1.7*iconScale,component:'symbol',points:p};
});
const mark=[...iconPaths,group(glyphs.word.filter(g=>g.letter!=='.'),'ink','word','plec'),group(glyphs.word.filter(g=>g.letter==='.'),'accent','dot','.')],caption=[group(glyphs.caption,'ink','tagline','Escolta. Escriu. Desplega.')];
function band(paths,frame){const all=paths.flatMap(s=>s.points.flatMap(([x,y])=>{const p=(s.width||0)/2;return[[x-p,y-p],[x+p,y+p]];})),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);return{frame,bounds:{x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y},paths:paths.map(({points,...s})=>s)};}
const data={mark:band(mark,layout.frame),tagline:band(caption,{width:layout.caption.width,height:layout.caption.height})};
fs.writeFileSync(path.join(root,'assets/brand/geometry.json'),JSON.stringify(data,null,2)+'\n');
const factory=fs.readFileSync(path.join(__dirname,'brand-runtime.txt'),'utf8');
fs.writeFileSync(path.join(root,'brand.js'),factory.replace('__GEOMETRY__',JSON.stringify(data)));
const brand=require(path.join(root,'brand.js'));
for(const part of ['mark','tagline'])fs.writeFileSync(path.join(root,'assets/brand/'+part+'.svg'),brand.svg(part));
console.log('Shared wordmark/tagline vectors generated from the original Georgia layout.');
