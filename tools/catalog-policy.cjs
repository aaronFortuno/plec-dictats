const crypto=require('node:crypto');
function assertStableCatalogue(source,bytes,validation){
 if(!['draft','stable'].includes(source.status))throw new Error('Estat editorial desconegut.');
 if(source.status==='draft')return;
 if(source.reviewedByTeacher!==true)throw new Error('Falta la revisió docent del catàleg estable.');
 const strict=validation?.strictLookup,count=source.entries.filter(e=>e.mode==='words').length;
 const checksum=crypto.createHash('sha256').update(bytes).digest('hex');
 if(!strict||strict.catalogueSHA256!==checksum||strict.wordCount!==count||strict.exactMatches!==count||!Array.isArray(strict.pending)||strict.pending.length)throw new Error('El catàleg estable necessita un contrast lèxic exacte, complet i actualitzat, sense incidències pendents.');
}
module.exports={assertStableCatalogue};
