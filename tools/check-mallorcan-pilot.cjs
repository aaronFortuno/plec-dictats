'use strict';
const assert=require('node:assert/strict'),A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),{prepare}=require('./prepare-mallorcan-pilot.cjs');
const p=prepare();assert.equal(p.plans.length,3);assert.equal(p.requests,54);assert.equal(p.characters,4608);assert(p.plans.every(plan=>plan.jobs.length===18&&plan.pack.dialect==='mallorqui'&&plan.pack.generationPolicy.ipaInventory==='ca-mallorcan-v-experimental'));
assert.deepEqual(p.plans[0].jobs.map(j=>j.ssml.match(/<phoneme.*<\/phoneme>/u)[0]),p.plans[1].jobs.map(j=>j.ssml.match(/<phoneme.*<\/phoneme>/u)[0]));
const pack=p.plans[0].pack;
assert.throws(()=>A.validatePack({schemaVersion:1,packs:[{...pack,dialect:'central'}]},pack.id));
assert.throws(()=>A.validatePack({schemaVersion:1,packs:[{...pack,generationPolicy:{requireIpa:false,ipaInventory:'ca-mallorcan-v-experimental'}}]},pack.id));
assert.throws(()=>A.buildSsml({...pack,generationPolicy:{requireIpa:true}},'vi','ˈvi'));
assert(A.buildSsml(pack,'vi','ˈvi').ssml.includes('ˈvi'));assert.equal(G.MONTHLY_LIMIT,452000);
assert(!G.evaluateBudget({months:{'2026-10':{reservedCharacters:449000,usedElsewhere:0}}},'2026-10',p.characters).withinBudget);
console.log('Mallorcan pilot: 18 fixed words × 3 voices, 4608 characters, isolated dialect/v inventory and unchanged budget passed; no synthesis.');
require('./run-mallorcan-pilot.cjs').run({execute:true,confirmF0:true},{profile:()=>({audioStatus:'on-hold'}),loadEnvironment:()=>{throw Error('Test must never read credentials');},fetch:()=>{throw Error('Test must never request synthesis');}}).then(result=>{
 assert.deepEqual(result,{ok:false,reason:'mallorcan-audio-on-hold'});
 console.log('Paused Mallorcan synthesis cannot load credentials, create locks or reserve quota.');
}).catch(error=>{console.error(error);process.exitCode=1;});
