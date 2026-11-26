'use strict';
const assert=require('node:assert/strict'),{createHash}=require('node:crypto'),R=require('../rhythm-code.js'),data=require('../content/rhythm-profiles-v1.json');
assert.equal(createHash('sha256').update(JSON.stringify(data)).digest('hex'),'1013ef9deb620aee47d8f4c88c5eae1ea94331ce87b7653825d23a0471793de7','Published V1 words must never be reassigned.');
assert.equal(R.encode({pace:6,rate:1},1),'ROSA');assert.deepEqual(R.decode('  rosa  '),{code:'ROSA',pace:6,rate:1,waitFactor:1});
for(const p of data.profiles){assert.equal(R.encode(p,p.waitFactor),p.code);assert.deepEqual(R.decode(p.code),p);}
assert.equal(new Set(data.profiles.map(p=>p.code)).size,36);assert.equal(R.decode('LL02'),null);assert.equal(R.decode('ZZZZ'),null);assert.equal(R.decode(''),null);assert.equal(R.encode({pace:999,rate:1},1),null);
const copy=R.decode('ROSA');copy.rate=.8;assert.equal(R.decode('ROSA').rate,1);assert.equal(R.encode({pace:6,rate:1,text:'LL02'},1),'ROSA','Code is independent of dictation and device.');
console.log('Rhythm codes: immutable V1 matrix, 36 complete combinations, portable settings, normalization, invalid inputs and isolated decoded values passed. No storage, network or synthesis.');
