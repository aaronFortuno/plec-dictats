export const wordGroups = {
  accent: { label: 'Accentuació', words: 'camí jardí matí camió balcó cançó cafè meló sabó plàtan telèfon música història aquí això després'.split(' ') },
  essa: { label: 'Les esses', words: 'sorra tassa plaça ocell cistella seda sabata espasa classe dansa cirera zero braç pissarra casa pessic'.split(' ') },
  ela: { label: 'Ela geminada', words: 'col·legi il·lusió aquarel·la novel·la goril·la pel·lícula satèl·lit parcel·la medul·la al·lèrgia cal·ligrafia tranquil·la instal·lar il·luminar col·laborar metàl·lica'.split(' ') },
};

export const phraseSamples = [
  { id: 'PROVA-P01', title: 'Un quadern per al viatge', focus: 'Accentuació', stage: 'Cicle mitjà', text: 'Al matí en Martí talla un paper blau i el posa dins del quadern. Demà hi dibuixarà el camí fins al far.' },
  { id: 'PROVA-P02', title: 'La tassa de la Sira', focus: 'Les esses', stage: 'Cicle mitjà', text: 'La Sira deixa la tassa sobre el banc de la plaça. S’asseu a mirar un ocell que passa de branca en branca.' },
  { id: 'PROVA-P03', title: 'Dibuixos a la finestra', focus: 'Ela geminada', stage: 'Cicle superior', text: 'Hem instal·lat una llum al passadís del col·legi. Quan s’encén, il·lumina les aquarel·les de les dues classes.' },
];

export const wordCounts = [8, 12, 16];
export const wordRates = [.85, 1];
export const phraseRates = [.8, .9, 1];
export const varieties = { central: 'Català central', valencia: 'Valencià' };

export function plecStudySettings(query) {
  const mode = query.get('mode') === 'phrases' ? 'phrases' : 'words';
  const focus = Object.keys(wordGroups).find(key => key === query.get('focus')) ?? 'accent';
  const entry = phraseSamples.find(sample => sample.id === query.get('material')) ?? phraseSamples[0];
  const choice = (name, values, fallback) => values.find(value => value === Number(query.get(name))) ?? fallback;
  return {
    mode, focus, entry,
    seed: Number(query.get('seed')) >>> 0,
    count: choice('count', wordCounts, 12),
    rate: choice('rate', mode === 'words' ? wordRates : phraseRates, 1),
    variety: query.get('variety') === 'valencia' ? 'valencia' : 'central',
    pace: choice('pace', [2, 4, 6, 10], 6),
    wait: choice('wait', [.8, 1, 1.25], 1),
  };
}

export function plecStudyLink(page, settings) {
  const { mode, focus, count, seed, variety, rate, entry, pace, wait } = settings;
  const query = mode === 'words' ? { mode, focus, count, seed, variety, rate } : { mode, material: entry.id, pace, rate, wait };
  return `./${page}.html?${new URLSearchParams(query)}`;
}

export function drawStudyWords({ focus, count, seed }) {
  const words = [...wordGroups[focus].words];
  for (let index = words.length - 1; index > 0; index--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const pick = seed % (index + 1);
    [words[index], words[pick]] = [words[pick], words[index]];
  }
  return words.slice(0, count);
}

export function phraseStudyParts({ entry, pace }) {
  const groups = [];
  for (const sentence of entry.text.match(/[^.!?]+[.!?]?/g)) {
    const words = sentence.trim().split(/\s+/);
    for (let index = 0; index < words.length; index += pace) groups.push(words.slice(index, index + pace));
  }
  return groups;
}

export function studyWritingPause(length, factor) {
  return Math.max(4, Math.min(15, Math.ceil((4 + .8 * (length - 2)) * factor)));
}
