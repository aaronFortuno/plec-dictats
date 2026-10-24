'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Fora del repositori i de l'arrel servida pel web local.
const DEFAULT_CREDENTIALS = path.resolve(__dirname, '../../.private/plec/azure-speech.json');

function loadAzureEnvironment(env = process.env, filePath = DEFAULT_CREDENTIALS) {
  // Un entorn explícit té prioritat; no barregis claus i regions de recursos diferents.
  if (env.SPEECH_KEY || env.SPEECH_REGION) return env;
  let data;
  try { data = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')); }
  catch { throw new Error('No es pot llegir el fitxer privat de Speech.'); }
  if (data.pricingTier !== 'F0' || typeof data.key !== 'string' || !data.key.trim() ||
      typeof data.region !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.region.trim())) {
    throw new Error('Completa la clau, la regió i F0 al fitxer privat de Speech.');
  }
  // L'endpoint del fitxer és només una referència: el generador construeix l'endpoint Azure regional.
  return {...env, SPEECH_KEY: data.key.trim(), SPEECH_REGION: data.region.trim()};
}

module.exports = {DEFAULT_CREDENTIALS, loadAzureEnvironment};
