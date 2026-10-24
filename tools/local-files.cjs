'use strict';
const fs = require('node:fs');
const RETRY_DELAYS = [25, 50, 100, 200, 400, 800];
const TRANSIENT = new Set(['EACCES', 'EPERM', 'EBUSY']);
const syncWaitBuffer = new Int32Array(new SharedArrayBuffer(4));

// Windows readers/scanners can briefly hold a destination open. Retry only the
// local rename of already-written bytes; never repeat an Azure request here.
async function replaceFile(source, destination, dependencies = {}) {
  const rename = dependencies.rename || fs.promises.rename;
  const sleep = dependencies.sleep || (ms => new Promise(resolve => setTimeout(resolve, ms)));
  for (let attempt = 0; ; attempt++) {
    try { await rename(source, destination); return; }
    catch (error) {
      if (!TRANSIENT.has(error.code) || attempt >= RETRY_DELAYS.length) throw error;
      await sleep(RETRY_DELAYS[attempt]);
    }
  }
}

function replaceFileSync(source, destination, dependencies = {}) {
  const rename = dependencies.rename || fs.renameSync;
  const sleep = dependencies.sleep || (ms => Atomics.wait(syncWaitBuffer, 0, 0, ms));
  for (let attempt = 0; ; attempt++) {
    try { rename(source, destination); return; }
    catch (error) {
      if (!TRANSIENT.has(error.code) || attempt >= RETRY_DELAYS.length) throw error;
      sleep(RETRY_DELAYS[attempt]);
    }
  }
}

module.exports = { RETRY_DELAYS, replaceFile, replaceFileSync };
