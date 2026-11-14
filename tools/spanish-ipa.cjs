'use strict';

// Broad es-ES phonological transcription with distinción and yeísmo.
const accented = {á:'a', é:'e', í:'i', ó:'o', ú:'u', ü:'u'};
const onsetPairs = new Set(['bl','bɾ','dɾ','fl','fɾ','gl','gɾ','kl','kɾ','pl','pɾ','tɾ']);
const exceptions = new Map([
  ['ahumaron','a.u.ˈma.ɾon'],
  ['cacahuete','ka.ka.ˈwe.te'],
  ['guiaban','gi.ˈa.ban'],
  ['infrahumana','in.fɾa.u.ˈma.na'],
  ['prehistoria','pɾe.is.ˈto.ɾja'],
  ['subrayaban','sub.ra.ˈʝa.ban']
]);

function phonesFor(word) {
  const phones = [];
  for (let index = 0; index < word.length; index++) {
    const letter = word[index], next = word[index + 1] || '';
    if (/[aeiouáéíóúü]/u.test(letter) || (letter === 'y' && !next)) {
      phones.push({sound: letter === 'y' ? 'i' : accented[letter] || letter,
        vowel: true, stress: /[áéíóú]/u.test(letter)});
      continue;
    }
    if (letter === 'h') continue;
    const front = /[eéií]/u.test(next);
    const pair = letter + next;
    if (['ch','ll','rr','qu'].includes(pair) ||
        (pair === 'gu' && /[eéií]/u.test(word[index + 2] || ''))) {
      phones.push({sound: {ch:'t͡ʃ', ll:'ʝ', rr:'r', qu:'k', gu:'g'}[pair]});
      index++;
      continue;
    }
    if (letter === 'x') {
      if (index) phones.push({sound:'k'});
      phones.push({sound:'s'});
      continue;
    }
    const sound = {
      c: front ? 'θ' : 'k', z:'θ', g: front ? 'x' : 'g', j:'x', v:'b',
      r: index === 0 || /[lns]/u.test(word[index - 1]) ? 'r' : 'ɾ',
      y:'ʝ', ñ:'ɲ'
    }[letter] || letter;
    phones.push({sound});
  }
  return phones;
}

function nucleiFor(phones) {
  const nuclei = [];
  for (const [index, phone] of phones.entries()) {
    if (!phone.vowel) continue;
    const weak = /[iu]/u.test(phone.sound) && !phone.stress;
    const previous = nuclei.at(-1);
    const joins = previous && index === previous.last + 1 &&
      (weak ? previous.sound !== phone.sound && !previous.strongWeak : previous.weak && !previous.open);
    if (joins) {
      previous.last = index;
      if (!weak || !previous.open) previous.anchor = index;
      previous.open ||= !weak;
      previous.weak = weak;
      previous.strongWeak ||= /[iu]/u.test(phone.sound) && phone.stress;
      previous.sound = phone.sound;
    } else {
      nuclei.push({first:index,last:index,anchor:index,open:!weak,weak,
        strongWeak:/[iu]/u.test(phone.sound) && phone.stress,sound:phone.sound});
    }
  }
  return nuclei;
}

function transcribe(word) {
  if (exceptions.has(word)) return exceptions.get(word);
  if (!/^[a-záéíóúüñ]+$/u.test(word)) throw Error('Forma fora de l’inventari: ' + word);
  const phones = phonesFor(word), nuclei = nucleiFor(phones);
  if (!nuclei.length) throw Error('Mot sense nucli: ' + word);
  const explicit = nuclei.findIndex(({anchor})=>phones[anchor].stress);
  const fallsOnPenultimate = /[aeiou]$|[aeiouáéíóúü][ns]$/u.test(word);
  const stress = explicit >= 0 ? explicit : Math.max(0, nuclei.length - (fallsOnPenultimate ? 2 : 1));
  const starts = [0];
  for (let index = 1; index < nuclei.length; index++) {
    const {first} = nuclei[index];
    const gap = first - nuclei[index - 1].last - 1;
    const joinsOnset = gap >= 2 && onsetPairs.has(phones[first - 2].sound + phones[first - 1].sound);
    starts.push(first - (joinsOnset ? 2 : Math.min(1,gap)));
  }
  for (const {first,last,anchor} of nuclei) {
    for (let index = first; index <= last; index++) {
      if (index !== anchor) phones[index].sound = phones[index].sound === 'i' ? 'j' : 'w';
    }
  }
  return starts.map((start,index)=>
    (index === stress ? 'ˈ' : '') + phones.slice(start,starts[index + 1]).map(phone=>phone.sound).join('')
  ).join('.');
}

module.exports = {transcribe};
