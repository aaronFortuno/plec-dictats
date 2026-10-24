'use strict';
const assert = require('node:assert/strict');
const { RETRY_DELAYS, replaceFile, replaceFileSync } = require('./local-files.cjs');
const error = code => Object.assign(new Error('Test-only local error'), { code });
(async () => {
  for (const code of ['EPERM','EACCES','EBUSY']) {
    let count=0; const waits=[];
    await replaceFile('source','target',{rename:async()=>{if(++count<3)throw error(code);},sleep:async ms=>waits.push(ms)});
    assert.equal(count,3);assert.deepEqual(waits,RETRY_DELAYS.slice(0,2));
    count=0;waits.length=0;
    replaceFileSync('source','target',{rename:()=>{if(++count<3)throw error(code);},sleep:ms=>waits.push(ms)});
    assert.equal(count,3);assert.deepEqual(waits,RETRY_DELAYS.slice(0,2));
  }
  let count=0;
  await assert.rejects(replaceFile('source','target',{rename:async()=>{count++;throw error('ENOENT');},sleep:async()=>assert.fail('No retry for non-transient error')}),{code:'ENOENT'});
  assert.equal(count,1);
  count=0;
  await assert.rejects(replaceFile('source','target',{rename:async()=>{count++;throw error('EPERM');},sleep:async()=>{}}),{code:'EPERM'});
  assert.equal(count,RETRY_DELAYS.length+1);
  count=0;
  assert.throws(()=>replaceFileSync('source','target',{rename:()=>{count++;throw error('EBUSY');},sleep:()=>{}}),{code:'EBUSY'});
  assert.equal(count,RETRY_DELAYS.length+1);
  console.log('Desament local: bloqueigs transitoris reintentats amb límit, altres errors propagats, cap petició de xarxa.');
})().catch(e=>{console.error(e);process.exitCode=1;});
