'use strict';
const assert=require('node:assert/strict');
const B=require('../catalog-browser.js');
const entry=(text,extra={})=>({id:text,text,mode:'words',tags:[],...extra});
const entries=[
  entry('avió'),entry('àbac'),entry('Ànima'),entry('èxit'),entry('ela'),
  entry('ïode'),entry('ull'),entry('ünic'),entry('çaga'),entry('Çac'),entry('casa'),
  entry('orquestra'),entry('brossa'),
  entry('brum',{mode:'pseudo',tags:['beve']}),entry('alim',{mode:'pseudo',tags:['erra']})
];

const accents=B.buildView(entries,{requestedInitial:'A',predicate:item=>item.mode==='words'});
assert.equal(accents.activeInitial,'A');
assert.deepEqual(accents.visibleEntries.map(item=>item.text),['àbac','Ànima','avió']);
assert.equal(B.buildView(entries,{requestedInitial:'E'}).visibleEntries.some(item=>item.text==='èxit'),true);
assert.equal(B.buildView(entries,{requestedInitial:'I'}).visibleEntries.some(item=>item.text==='ïode'),true);
assert.equal(B.buildView(entries,{requestedInitial:'U'}).visibleEntries.some(item=>item.text==='ünic'),true);
const cedillas=B.buildView(entries,{requestedInitial:'C'});
assert.deepEqual(new Set(cedillas.visibleEntries.map(item=>item.text)),new Set(['casa','Çac','çaga']));

const globalSearch=B.buildView(entries,{query:'orquestra',requestedInitial:'A'});
assert.equal(globalSearch.activeInitial,'O');
assert.equal(globalSearch.total,1);
assert.equal(globalSearch.initialCount,1);
assert.deepEqual(globalSearch.visibleEntries.map(item=>item.text),['orquestra']);
assert.equal(B.buildView(entries,{query:'orques',requestedInitial:'A'}).visibleEntries[0].text,'orquestra');

const empty=B.buildView(entries,{query:'no-existeix',requestedInitial:'A'});
assert.equal(empty.total,0);
assert.equal(empty.activeInitial,null);
assert.equal(empty.nextInitial,null);
assert.deepEqual(empty.visibleEntries,[]);

const pseudo=B.buildView(entries,{requestedInitial:'A',predicate:item=>item.mode==='pseudo'&&item.tags.includes('beve')});
assert.equal(pseudo.total,1);
assert.equal(pseudo.activeInitial,'B');
assert.deepEqual(pseudo.visibleEntries.map(item=>item.text),['brum']);
const noFocus=B.buildView(entries,{predicate:item=>item.mode==='pseudo'&&item.tags.includes('gej')});
assert.equal(noFocus.total,0);

const sparse=B.buildView([entry('avió'),entry('casa'),entry('orquestra')],{requestedInitial:'A'});
assert.equal(sparse.nextInitial,'C');
assert.equal(B.buildView(sparse.entries,{requestedInitial:'C'}).nextInitial,'O');

let gesture=B.createWheelState();
let step=B.wheelGesture(gesture,{deltaY:120,atBottom:false,now:1000});
gesture=step.state;
assert.equal(step.advance,false);
step=B.wheelGesture(gesture,{deltaY:120,atBottom:true,now:1050});
gesture=step.state;
assert.equal(step.advance,false,'un gest continu que arriba a la vora no canvia d’inicial');
step=B.wheelGesture(gesture,{deltaY:120,atBottom:true,now:1100});
gesture=step.state;
assert.equal(step.advance,false,'la inèrcia tampoc encadena inicials');
step=B.wheelGesture(gesture,{deltaY:120,atBottom:true,now:1100+B.WHEEL_PAUSE});
assert.equal(step.advance,true,'una empenta nova després de la pausa sí que avança');
assert.equal(step.state.atBottom,false);

console.log('Navegació del catàleg: agrupació, cerca, filtres, buits i gestos correctes.');
