export const speechRates = Object.freeze([.8, .85, .9, .95, 1, 1.05, 1.1, 1.15, 1.2]);

const captions = {
  ca: 'Velocitat de la locució',
  es: 'Velocidad de la locución',
  gl: 'Velocidade da locución',
  eu: 'Lokuzioaren abiadura',
};

export function mountAudioRate(root, { rates = speechRates, id, name = 'rate', locale = 'ca' } = {}) {
  const field = document.createElement('label');
  const caption = document.createElement('span');
  const select = document.createElement('select');
  field.className = 'of-audio-rate';
  if (id) select.id = id;
  select.name = name;
  select.replaceChildren(...rates.map(rate => new Option('', rate.toFixed(2), rate === 1)));
  field.append(caption, select);
  root.append(field);

  function localise(language) {
    const numbers = new Intl.NumberFormat(language, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    caption.textContent = captions[language] ?? captions.ca;
    select.setAttribute('aria-label', caption.textContent);
    for (const option of select.options) option.textContent = '×' + numbers.format(Number(option.value));
  }

  localise(locale);
  return { select, localise };
}
