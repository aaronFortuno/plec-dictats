/* Catàleg editorial obert. Les etiquetes indiquen els focus de pràctica,
   no totes les dificultats que pot contenir una paraula. */
(function (root) {
  'use strict';
  const groups = [
    ['accent', 'Accentuació', 'Accent sí o no', 'words', `país|avió|passadís|camió|cançó|jardí|cafè|també|després|perquè|això|allò|arròs|matí|dofí|botó|balcó|ratolí|coixí|futbolí|menú|sofà|català|anglès|francès|pàgina|música|màquina|fàbrica|família|història|memòria|ciència|paciència|diferència|colònia|gràcia|àvia|núvol|fàcil|difícil|llapis|examen|origen|imatge|marge|museu|futbol|paper|animal|escola|cadira|finestra|sabata|motxilla|ordinador|germana|dissabte|diumenge|plàtan|préssec|telèfon|semàfor|mòbil|pèsol`],
    ['essa', 's / ss / c / ç / z', 'Les esses', 'words', `cinema|cirera|ceba|cel|cinturó|cistell|cérvol|cendra|enciam|piscina|bicicleta|policia|passar|passeig|tassa|cassola|classe|professor|massa|bossa|pessic|dissabte|passadís|rossinyol|plaça|braç|força|dolç|feliç|llençol|calçat|eriçó|cançó|adreça|peça|caça|casa|rosa|tisores|camisa|zero|zebra|onze|dotze|esmorzar|alzina`],
    ['hac', 'Amb h / sense h', 'La hac', 'words', `ahir|avui|ara|aleshores|hivern|herba|hora|hort|home|història|hospital|habitació|helicòpter|hipopòtam|humà|humit|humor|higiene|horitzó|harmonia|heroi|hereu|hàmster|vehicle|prohibir|coet|osset|orfe|ou|ombra|orquestra|espagueti|ermita|univers|estiu|esmorzar`],
    ['gej', 'g / j / tg / tj', 'Ge i jota', 'words', `metge|fetge|rellotge|viatge|platja|mitja|mongetes|gerra|gel|genoll|germà|gegant|girafa|girar|gent|gener|gimnàs|pàgina|jardí|joc|joguina|jove|jugar|julivert|justícia|jaqueta|rajola|pluja|pijama|menjar|taronja|esponja|paisatge|formatge|granja|jutge`],
    ['beve', 'b / v', 'Be i ve baixa', 'words', `vaixell|vaca|vent|volar|veí|vida|verd|viure|vuit|vidre|vapor|vestit|vinya|avellana|cavall|núvol|gavina|hivern|avi|avió|beure|boca|bosc|barca|bicicleta|bufanda|banyera|banc|braç|botiga|bombolla|abella|arribar|trobar|canviar|llavi|sabó|fava|treball|cervell`],
    ['erra', 'r / rr', 'Erra i erra doble', 'words', `carro|carrer|terra|serra|torre|gerra|sorra|arròs|arribar|córrer|correu|guitarra|pissarra|barret|esquerra|guerra|arrel|esquirol|ratolí|roda|rosa|roba|riu|rellotge|porta|arbre|marbre|cargol|cara|pera|cadira|farina|pirata|taronja|cirera|paperera`],
    ['qugu', 'c / qu / g / gu / qü / gü', 'Ce, cu i ge', 'words', `casa|cullera|coca|cuc|conte|canya|carta|codi|cosa|quatre|quinze|química|equip|paquet|mosquit|esquena|esquirol|quadern|màquina|formatge|gat|got|gos|goma|gallina|guitarra|guerra|guineu|formiga|mànega|guix|espagueti|aigua|llengua|paraigua|pingüí|aigüera|qüestió|freqüent|següent`],
    ['vocals', 'a / e · o / u àtones', 'Vocals àtones', 'words', `sabata|berenar|davantal|treballar|nedar|navegar|assemblea|meravella|enyorar|empènyer|estendre|espàrrec|espàrrecs|monestir|assassí|vernís|avorrir|avorriment|botifarra|muntanya|conill|cobrir|descobrir|sofrir|sospirar|suportar|torró|joventut|ploma|plomall|fuster|fusteria|sortida|muntar`],
    ['digrafs', 'll / ny / x / ix / tx / ig', 'Dígrafs i xeix', 'words', `lluna|llibre|llapis|llavor|llengua|llit|gallina|ampolla|papallona|colla|any|pinya|canya|muntanya|aranya|banyera|castanya|senyor|xocolata|xarxa|xemeneia|xifra|caixa|peix|vaixell|cuixa|moixaina|motxilla|cotxe|dutxa|despatx|butxaca|maig|raig|passeig|assaig`],
    ['dieresi', 'Dièresi', 'La dièresi', 'words', `raïm|veïna|veïnat|països|agraïment|traïdor|conduïa|produïa|lluïa|oïda|peüc|diürn|pingüí|aigüera|paraigües|llengües|qüestió|freqüència`],
    ['signes', 'Ela geminada · l·l', 'Ela geminada', 'words', `col·legi|col·lecció|pel·lícula|il·lusió|tranquil·la|goril·la|novel·la|paral·lel|mil·límetre|instal·lar|excel·lent|intel·ligent|al·lèrgia|al·lèrgic|al·lucinació|col·laborar|col·laboració|col·lectiu|col·locar|col·locació|il·lustració|il·luminar|síl·laba|aquarel·la`],
    ['verbs', 'Formes verbals', 'Formes verbals', 'words', `atapeït|conduïa|produïa|lluïa|haguessin|haguéssim|haguéssiu|hagués|havia|havíem|havíeu|hauríem|hauríeu|hàgim|hàgiu|hagin|plantejarien|plantejàvem|plantejàveu|plantegéssim|plantegéssiu|plantegessin|menjàvem|menjàveu|mengéssim|mengéssiu|mengessin|jugàvem|juguéssim|juguessin|arribàvem|arribéssim|arribessin|escrivíem|escrivíeu|escrivíssim|escrivíssiu|escrivissin|fèiem|fèieu|faríem|faríeu|féssim|féssiu|fessin|anéssim|anéssiu|anessin|tinguéssim|tinguéssiu|tinguessin|vinguéssim|vinguéssiu|vinguessin|intuïa|intuïes|intuïen|intuïm|intuïu|intuïssis|intuïssin|intuït|intuïda|conduïes|conduïen|conduïm|conduïu|conduït|conduïda|produïes|produïen|produïm|produïu|produït|produïda|agraïa|agraïes|agraïen|agraïm|agraïu|agraït|agraïda|canviï|canviïs|canviïn|estudiï|estudiïs|estudiïn|continuï|continuïs|continuïn`],
    ['simples', 'Síl·labes simples', 'Síl·labes simples', 'pseudo', `nupi|fepo|dumi|tapú|binu|pafú|lomí|nufà|tepú|dofípol|mepu|ganu|lutepi|fenupi|dopali|tupena|mifanu|panufi|tedumi|nulapi|fopenu|demufi|nabopi|pumeli`],
    ['grups', 'Grups consonàntics', 'Grups consonàntics', 'pseudo', `sclaf|blis|drall|cluf|plim|bruf|flup|grisp|trufec|crunel|prufal|blanuf|drupel|glafí|frenup|cralop|brunif|clenap|trupol|flanec|graput|plonif|frupel|blenuc`],
    ['pseudodigrafs', 'Dígrafs', 'Dígrafs', 'pseudo', `platoll|cunyi|frisquell|llunep|nyapuf|fanyut|banyup|llunif|palluf|garrup|terrufi|marrup|quifol|guinel|guepuf|xanufi|mixup|feixum|txunel|patxuf|dunyal|jufell|guinop|quepil`],
    ['llargues', 'Més de dues síl·labes', 'Més de dues síl·labes', 'pseudo', `sergaminya|pirotet|blanufeta|grupinola|fresquinal|clopiruna|trumifeta|pladunifa|brufanell|nyuparela|quepinofa|guerunila|fenupali|drapuneta|crufanoli|tupinufa|xemurali|palunefi|flupinera|gomifuna|nuparella|trefunila|blinufeta|carunepi`]
  ];
  const categories = groups.map(([id, label, title, mode]) => ({ id, label, title, mode }));
  const vocabularyBands = { basic: 'Bàsic', common: 'Habitual', expanded: 'Ampliació', specialized: 'Especialitzat', unrated: 'Sense classificar' };
  const orthographyBands = { low: 'Baixa', medium: 'Mitjana', high: 'Alta', unrated: 'Sense classificar' };
  const stages = { cm: 'Cicle mitjà', cs: 'Cicle superior', eso: 'Institut', all: 'Tot el banc' };
  // Classificació editorial explícita, revisable; no es dedueix de la llargada.
  const basic = new Set(`avió|camió|jardí|cafè|també|després|això|allò|arròs|matí|botó|ratolí|coixí|menú|sofà|pàgina|música|família|àvia|núvol|llapis|imatge|futbol|paper|animal|escola|cadira|finestra|sabata|motxilla|germana|dissabte|diumenge|plàtan|telèfon|cinema|cirera|ceba|cel|cistell|enciam|bicicleta|passar|tassa|classe|professor|massa|bossa|plaça|braç|dolç|feliç|peça|casa|rosa|tisores|camisa|zero|onze|dotze|esmorzar|ahir|avui|ara|hivern|herba|hora|hort|home|hospital|habitació|ou|ombra|estiu|metge|rellotge|viatge|platja|mitja|mongetes|gerra|gel|genoll|germà|gegant|girafa|girar|gent|gener|joc|joguina|jove|jugar|jaqueta|pluja|pijama|menjar|taronja|formatge|granja|vaixell|vaca|vent|volar|veí|vida|verd|viure|vuit|vestit|cavall|avi|beure|boca|bosc|barca|bufanda|banyera|banc|botiga|abella|arribar|trobar|sabó|treball|carro|carrer|terra|serra|torre|sorra|barret|roda|roba|riu|porta|arbre|cargol|cara|pera|farina|pirata|paperera|cullera|coca|cuc|conte|canya|carta|cosa|quatre|quinze|equip|paquet|gat|got|gos|goma|gallina|guix|aigua|llengua|paraigua|berenar|nedar|muntanya|conill|ploma|sortida|lluna|llibre|llavor|llit|ampolla|papallona|colla|any|pinya|aranya|castanya|senyor|xocolata|caixa|peix|cotxe|dutxa|maig|raig|raïm|veïna|país|col·legi|pel·lícula`.split('|'));
  const expanded = new Set(`atapeït|origen|marge|colònia|paciència|diferència|calçat|pessic|rossinyol|aleshores|humà|humit|humor|higiene|horitzó|harmonia|heroi|hereu|vehicle|prohibir|orfe|ermita|univers|justícia|julivert|paisatge|jutge|vinya|gavina|vapor|llavi|fava|cervell|arrel|marbre|codi|freqüent|següent|assemblea|meravella|enyorar|empènyer|estendre|monestir|assassí|vernís|avorrir|avorriment|cobrir|descobrir|sofrir|sospirar|suportar|joventut|plomall|fusteria|moixaina|xifra|assaig|agraïment|traïdor|diürn|freqüència|paral·lel|instal·lar|excel·lent`.split('|'));
  const low = new Set(`avió|camió|botó|ratolí|coixí|cafè|sofà|matí|menú|àvia|pàgina|música|llapis|futbol|paper|animal|escola|cadira|finestra|sabata|germana|telèfon|cinema|cirera|ceba|cel|tassa|classe|bossa|plaça|braç|dolç|casa|rosa|camisa|zero|onze|dotze|avui|ara|ou|ombra|estiu|gel|genoll|germà|gegant|girafa|girar|gent|gener|joc|jove|jugar|pluja|pijama|menjar|taronja|granja|vaca|vent|volar|vida|verd|viure|vuit|avi|boca|bosc|barca|banc|botiga|carro|carrer|terra|serra|torre|sorra|barret|roda|roba|riu|porta|arbre|cargol|cara|pera|pirata|cullera|coca|cuc|conte|canya|carta|cosa|quatre|quinze|gat|got|gos|goma|gallina|guix|aigua|llengua|paraigua|nedar|conill|ploma|lluna|llibre|llavor|llit|ampolla|papallona|colla|any|pinya|aranya|castanya|senyor|caixa|peix|maig|raig`.split('|'));
  const high = new Set(`ciència|paciència|diferència|anglès|francès|examen|préssec|pèsol|cérvol|piscina|passeig|rossinyol|llençol|eriçó|adreça|calçat|esmorzar|alzina|helicòpter|hipopòtam|higiene|harmonia|hàmster|vehicle|prohibir|espagueti|metge|fetge|rellotge|viatge|platja|gimnàs|justícia|paisatge|formatge|jutge|vaixell|beure|canviar|córrer|esquerra|esquirol|guitarra|química|qüestió|freqüent|següent|pingüí|aigüera|assemblea|espàrrec|espàrrecs|assassí|avorrir|avorriment|butxaca|despatx|assaig|raïm|veïna|veïnat|països|agraïment|traïdor|conduïa|produïa|lluïa|oïda|peüc|diürn|paraigües|llengües|freqüència|col·legi|col·lecció|pel·lícula|il·lusió|tranquil·la|goril·la|novel·la|paral·lel|mil·límetre|instal·lar|excel·lent|intel·ligent`.split('|'));
  const map = new Map();
  const stableId = (mode, text) => {
    let hash = 2166136261;
    for (const character of mode + ':' + text) hash = Math.imul(hash ^ character.codePointAt(0), 16777619);
    return `${mode === 'words' ? 'p' : 's'}-${(hash >>> 0).toString(36)}`;
  };
  // Una paraula compartida per diversos focus només apareix una vegada al banc.
  for (const [tag, , , mode, list] of groups) {
    for (const text of list.split('|')) {
      const key = mode + ':' + text.normalize('NFC');
      if (map.has(key)) map.get(key).tags.push(tag);
      else map.set(key, { id: stableId(mode, text), text, mode, tags: [tag] });
    }
  }
  // Ampliació de lèxic general i vocabulari de matèries d'institut.
  const additions = [
    ['expanded', 'essa', `avesar|assolir|escassetat|consciència|essencial|successió|expressió|decisió|precisió|convèncer|esforç|confiança`],
    ['expanded', 'beve', `avesar|esbrinar|esdevenir|desvetllar|advertir|observació|conviure|convivència|abast|debatre|obvietat|versemblant`],
    ['expanded', 'hac', `herència|hipòtesi|coherència|inherent|adherir|exhaurir`],
    ['expanded', 'gej', `suggerir|suggeriment|objectiu|subjectiu|trajecte|avantatge`],
    ['expanded', 'accent', `sòlid|efímer|fràgil|àmbit|propòsit|síntesi|criteri|anàlisi`],
    ['specialized', 'accent', `hipotenusa|catet|diàmetre|perímetre|polígon|isòsceles|equilàter|paràbola|equació|coeficient|múltiple|fracció|algorisme|àtom|molècula|cèl·lula|fotosíntesi|mitocondri|cromosoma|ecosistema|biodiversitat|sintaxi|morfologia|pronom|adverbi|metàfora|hipèrbole|democràcia|oligarquia|arqueologia|geologia|hemisferi`],
    ['specialized', 'hac', `hipotenusa|hipèrbole|hemisferi`],
    ['specialized', 'essa', `isòsceles|equació|coeficient|fracció|cromosoma|ecosistema`],
    ['specialized', 'gej', `geologia|arqueologia`],
    ['specialized', 'beve', `adverbi|biodiversitat`],
    ['specialized', 'qugu', `equilàter|equació|arqueologia|oligarquia`],
    ['specialized', 'signes', `cèl·lula`]
  ];
  for (const [band, tag, list] of additions) {
    for (const text of list.split('|')) {
      const key = 'words:' + text;
      if (!map.has(key)) map.set(key, { id: stableId('words', text), text, mode: 'words', tags: [], vocabulary: band });
      const entry = map.get(key);
      entry.vocabulary = band;
      if (!entry.tags.includes(tag)) entry.tags.push(tag);
    }
  }
  // Les formes verbals comparteixen els focus ortogràfics pertinents.
  const verbFocus = {
    hac: 'haguessin|haguéssim|haguéssiu|hagués|havia|havíem|havíeu|hauríem|hauríeu|hàgim|hàgiu|hagin',
    essa: 'haguessin|haguéssim|haguéssiu|plantegéssim|plantegéssiu|plantegessin|mengéssim|mengéssiu|mengessin|juguéssim|juguessin|arribéssim|arribessin|escrivíssim|escrivíssiu|escrivissin|féssim|féssiu|fessin|anéssim|anéssiu|anessin|tinguéssim|tinguéssiu|tinguessin|vinguéssim|vinguéssiu|vinguessin|intuïssis|intuïssin',
    gej: 'plantejarien|plantejàvem|plantejàveu|plantegéssim|plantegéssiu|plantegessin|menjàvem|menjàveu|mengéssim|mengéssiu|mengessin|jugàvem|juguéssim|juguessin',
    beve: 'havia|havíem|havíeu|plantejàvem|plantejàveu|menjàvem|menjàveu|jugàvem|arribàvem|arribéssim|arribessin|escrivíem|escrivíeu|escrivíssim|escrivíssiu|escrivissin|canviï|canviïs|canviïn|vinguéssim|vinguéssiu|vinguessin',
    erra: 'arribàvem|arribéssim|arribessin',
    qugu: 'juguéssim|juguessin|tinguéssim|tinguéssiu|tinguessin|vinguéssim|vinguéssiu|vinguessin'
  };
  for (const [tag, list] of Object.entries(verbFocus)) for (const text of list.split('|')) {
    const entry = map.get('words:' + text);
    if (!entry.tags.includes(tag)) entry.tags.push(tag);
  }
  for (const entry of map.values()) {
    if (entry.mode !== 'words') continue;
    if (entry.tags.includes('verbs')) {
      entry.tags.push('accent'); // Contrast d'accent sí/no també en la flexió verbal.
      if (/[ïü]/.test(entry.text) && !entry.tags.includes('dieresi')) entry.tags.push('dieresi');
      entry.orthography = ['havia', 'hagin', 'plantejarien'].includes(entry.text) ? 'medium' : 'high';
    }
    if (entry.text.includes('·')) entry.orthography = 'high';
  }
  const entries = [...map.values()];
  for (const entry of entries) {
    if (entry.mode !== 'words') continue;
    entry.vocabulary ||= expanded.has(entry.text) ? 'expanded' : basic.has(entry.text) ? 'basic' : 'common';
    entry.orthography ||= high.has(entry.text) ? 'high' : low.has(entry.text) ? 'low' : 'medium';
  }
  root.PlecCatalog = { version: 3, categories, entries, vocabularyBands, orthographyBands, stages };
  if (typeof module !== 'undefined') module.exports = root.PlecCatalog;
})(typeof window === 'undefined' ? globalThis : window);
