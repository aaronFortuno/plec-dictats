'use strict';
const assert=require('node:assert/strict'),R=require('../text-repeat.js');
assert.equal(R.delay(2),4);assert.equal(R.delay(3),5);assert.equal(R.delay(6),8);assert.equal(R.delay(12),12);assert.equal(R.delay(12,1.25),15);assert.equal(R.delay(12,.8),10);assert.equal(R.delay(NaN),4);for(let words=0;words<100;words++)for(const factor of [.8,1,1.25])assert(R.delay(words,factor)>=4&&R.delay(words,factor)<=15);
let now=0,nextId=0,completed=0,ticks=[],pending=new Map();
const clock=R.create({now:()=>now,setTimer:fn=>{pending.set(++nextId,fn);return nextId;},clearTimer:id=>pending.delete(id),onTick:n=>ticks.push(n),onEnd:()=>completed++});
function tickAt(time){now=time;const entries=[...pending];pending.clear();for(const [,fn]of entries)fn();}
clock.start(2);assert.equal(ticks.at(-1),4);tickAt(3000);assert.equal(completed,0);assert.equal(ticks.at(-1),1);tickAt(4000);assert.equal(completed,1);assert.equal(pending.size,0);
clock.start(12);const stale=[...pending.values()][0];clock.cancel();now+=100000;stale();assert.equal(completed,1,'A cancelled callback cannot start another listen.');assert.equal(pending.size,0);
clock.start(2);const replaced=[...pending.values()][0];clock.start(12,1.25);replaced();assert.equal(ticks.at(-1),15);tickAt(now+15000);assert.equal(completed,2);
clock.start(2);tickAt(now+1000000);assert.equal(completed,3,'Late timers cause one callback, never catch-up bursts.');
console.log('Text repeat timing: word-based writing time, extra-time choices, deadlines, cancellation, replacement and delayed callback safety passed. No audio or network.');
