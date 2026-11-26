/* Portable preferences, independent of the dictation, device and learner identity. */
(function(root,factory){const node=typeof module==='object'&&module.exports,api=factory(node?require('./content/rhythm-profiles-v1.json'):root.PlecRhythmProfiles);if(node)module.exports=api;else root.PlecRhythmCode=api;})(typeof globalThis==='undefined'?this:globalThis,function(data){
 'use strict';
 const signature=p=>[p.pace,p.rate,p.waitFactor].join(':'),codes=new Map(),settings=new Map();
 if(data?.protocol!=='plec-rhythm-v1'||data.schemaVersion!==1||!Array.isArray(data.profiles)||data.profiles.length!==36)throw Error('Invalid rhythm protocol.');
 for(const p of data.profiles){if(!/^[A-Z]{3,6}$/.test(p.code)||![2,4,6,10].includes(p.pace)||![.8,.9,1].includes(p.rate)||![.8,1,1.25].includes(p.waitFactor)||codes.has(p.code)||settings.has(signature(p)))throw Error('Invalid rhythm profile.');codes.set(p.code,Object.freeze({...p}));settings.set(signature(p),p.code);}
 function decode(value){const p=codes.get(String(value??'').trim().toUpperCase());return p?{...p}:null;}
 function encode(value,waitFactor=1){return settings.get(signature({...value,waitFactor}))||null;}
 return {decode,encode,protocol:data.protocol};
});
