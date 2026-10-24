'use strict';
// Microsoft ca-ES inventory. Shared by offline plans and the protected generator.
const VOWELS = 'aɔəeɛiou';
const PHONES = ['t͡ʃ', 'd͡ʒ', ...'aɔəeɛioubβdðfgɣjk lʎmnŋɲpɾrsʃtθwxzʒ'.replace(/ /g, '')];

function analyzeIpa(ipa) {
  if (typeof ipa !== 'string' || (ipa.match(/ˈ/g) || []).length !== 1) throw new Error('Cal exactament un accent primari IPA.');
  const syllables = ipa.split('.');
  let stressedSyllable = 0;
  syllables.forEach((syllable, index) => {
    if (!syllable || !/^[ˈˌ]?[^ˈˌ]+$/u.test(syllable)) throw new Error('Accent o frontera de síl·laba incorrectes.');
    if (syllable.startsWith('ˈ')) stressedSyllable = index + 1;
    let remaining = syllable.replace(/^[ˈˌ]/u, '');
    let nuclei = 0;
    while (remaining) {
      const phone = PHONES.find(candidate => remaining.startsWith(candidate));
      if (!phone) throw new Error(`Fonema no admès per Azure ca-ES: ${remaining}.`);
      if (VOWELS.includes(phone)) nuclei += 1;
      remaining = remaining.slice(phone.length);
    }
    if (nuclei !== 1) throw new Error('Cada síl·laba ha de tenir un nucli vocàlic; usa j/w per a les semivocals.');
  });
  return { syllables: syllables.length, stressedSyllable, stressedIpa: syllables[stressedSyllable - 1].replace('ˈ', '') };
}
module.exports = {analyzeIpa};
