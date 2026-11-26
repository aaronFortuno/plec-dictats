/* Portable preferences: immutable numeric V1, neutral labels under editorial review. */
(function(root,factory){const node=typeof module==='object'&&module.exports,api=factory(node?require('./content/rhythm-profiles-v1.json'):root.PlecRhythmProfiles,node?require('./content/rhythm-labels.json'):root.PlecRhythmLabels);if(node)module.exports=api;else root.PlecRhythmCode=api;})(typeof globalThis==='undefined'?this:globalThis,function(data,labels){
 'use strict';
 const signature=p=>[p.pace,p.rate,p.waitFactor].join(':'),normalize=value=>String(value??'').trim().normalize('NFD').replace(/\p{M}/gu,'').toUpperCase(),aliases=new Map(),profiles=new Map(),presentation=new Map();
 if(data?.protocol!=='plec-rhythm-v1'||data.schemaVersion!==1||!Array.isArray(data.profiles)||data.profiles.length!==36||labels?.schemaVersion!==1||!['review','final'].includes(labels?.stage)||!labels.entries||Object.keys(labels.entries).length!==36)throw Error('Invalid rhythm protocol.');
 function alias(code,key){const token=normalize(code);if(typeof code!=='string'||!/^[A-Z]{2,12}$/.test(token)||(aliases.has(token)&&aliases.get(token)!==key))throw Error('Conflicting rhythm alias.');aliases.set(token,key);}
 for(const p of data.profiles){if(!/^[A-Z]{3,6}$/.test(p.code)||![2,4,6,10].includes(p.pace)||![.8,.9,1].includes(p.rate)||![.8,1,1.25].includes(p.waitFactor)||profiles.has(signature(p)))throw Error('Invalid rhythm profile.');profiles.set(signature(p),p);alias(p.code,signature(p));}
 for(const p of data.profiles){const c=labels.entries[p.code],key=signature(p);if(!c||typeof c.code!=='string'||c.code!==normalize(c.code)||!/^assets\/rhythm\/[a-z-]+\.svg$/.test(c.image)||typeof c.picture!=='string')throw Error('Invalid rhythm picture.');alias(c.code,key);for(const old of c.aliases||[])alias(old,key);profiles.set(key,Object.freeze({...p,code:c.code}));presentation.set(key,Object.freeze({...c,id:p.code,pace:p.pace,rate:p.rate,waitFactor:p.waitFactor}));}
 function decode(value){const p=profiles.get(aliases.get(normalize(value)));return p?{...p}:null;}
 function encode(value,waitFactor=1){return profiles.get(signature({...value,waitFactor}))?.code||null;}
 function picture(code){const p=presentation.get(aliases.get(normalize(code)));return p?{...p}:null;}
 return {decode,encode,picture,normalize,all:()=>[...presentation.values()].map(p=>({...p})),protocol:data.protocol,editable:labels.stage==='review',revision:labels.revision};
});
