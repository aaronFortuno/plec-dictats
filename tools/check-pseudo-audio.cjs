'use strict';
const assert=require('node:assert/strict'),A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),{prepare}=require('./prepare-pseudo-audio.cjs');
const p=prepare(),expected=A.readJson(A.DEFAULT_CATALOG).catalog.entries.filter(e=>e.mode==='pseudo');
assert.equal(p.plans.length,2);assert.equal(p.requests,192);assert.equal(p.characters,16513);assert.equal(G.MONTHLY_LIMIT,452000);
for(const item of p.plans){assert.equal(item.config.mode,'pseudo');assert.equal(item.plan.jobs.length,96);assert.deepEqual(new Set(item.plan.jobs.map(j=>j.id)),new Set(expected.map(e=>e.id)));assert(item.plan.jobs.every(j=>j.relativePath.startsWith('pseudo/')&&j.id.startsWith('s-')&&j.ssml.includes('<phoneme')));assert.equal(item.plan.pack.contentFingerprint,require('./prepare-pseudo-audio.cjs').hash(item.snapshot));}
const ledger={months:{'2026-10':{reservedCharacters:434390,usedElsewhere:0}}};
const budget=G.evaluateBudget(ledger,'2026-10',p.characters);assert.equal(budget.total,450903);assert(budget.withinBudget);assert(!G.evaluateBudget(ledger,'2026-10',p.characters,0,450000).withinBudget);assert(budget.total<500000);
console.log('Pseudo audio plans: two frozen 96-ID profiles, exact 16513-character estimate and authorised 452000 cap; no credentials or synthesis.');
