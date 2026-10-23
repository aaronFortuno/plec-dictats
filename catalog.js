/* Catàleg editorial obert. Les etiquetes indiquen els focus de pràctica,
   no totes les dificultats que pot contenir una paraula. */
(function (root) {
  'use strict';
  const groups = [
    ['accent', 'Accentuació', 'Accent sí o no', 'words', `avió|passadís|camió|cançó|jardí|cafè|també|després|perquè|això|allò|arròs|matí|dofí|botó|balcó|ratolí|coixí|futbolí|menú|sofà|català|anglès|francès|pàgina|música|màquina|fàbrica|família|història|memòria|ciència|paciència|diferència|colònia|gràcia|àvia|núvol|fàcil|difícil|llapis|examen|origen|imatge|marge|museu|futbol|paper|animal|escola|cadira|finestra|sabata|motxilla|ordinador|germana|dissabte|diumenge|plàtan|préssec|telèfon|semàfor|mòbil|pèsol`],
    ['essa', 's / ss / c / ç / z', 'Les esses', 'words', `cinema|cirera|ceba|cel|cinturó|cistell|cérvol|cendra|enciam|piscina|bicicleta|policia|passar|passeig|tassa|cassola|classe|professor|massa|bossa|pessic|dissabte|passadís|rossinyol|plaça|braç|força|dolç|feliç|llençol|calçat|eriçó|cançó|adreça|peça|caça|casa|rosa|tisores|camisa|zero|zebra|onze|dotze|esmorzar|alzina`],
    ['hac', 'Amb h / sense h', 'La hac', 'words', `ahir|avui|ara|aleshores|hivern|herba|hora|hort|home|història|hospital|habitació|helicòpter|hipopòtam|humà|humit|humor|higiene|horitzó|harmonia|heroi|hereu|hàmster|vehicle|prohibir|coet|osset|orfe|ou|ombra|orquestra|espagueti|ermita|univers|estiu|esmorzar`],
    ['gej', 'g / j / tg / tj', 'Ge i jota', 'words', `metge|fetge|rellotge|viatge|platja|mitja|mongetes|gerra|gel|genoll|germà|gegant|girafa|girar|gent|gener|gimnàs|pàgina|jardí|joc|joguina|jove|jugar|julivert|justícia|jaqueta|rajola|pluja|pijama|menjar|taronja|esponja|paisatge|formatge|granja|jutge`],
    ['beve', 'b / v', 'Be i ve baixa', 'words', `vaixell|vaca|vent|volar|veí|vida|verd|viure|vuit|vidre|vapor|vestit|vinya|avellana|cavall|núvol|gavina|hivern|avi|avió|beure|boca|bosc|barca|bicicleta|bufanda|banyera|banc|braç|botiga|bombolla|abella|arribar|trobar|canviar|llavi|sabó|fava|treball|cervell`],
    ['erra', 'r / rr', 'Erra i erra doble', 'words', `carro|carrer|terra|serra|torre|gerra|sorra|arròs|arribar|córrer|correu|guitarra|pissarra|barret|esquerra|guerra|arrel|esquirol|ratolí|roda|rosa|roba|riu|rellotge|porta|arbre|marbre|cargol|cara|pera|cadira|farina|pirata|taronja|cirera|paperera`],
    ['qugu', 'c / qu / g / gu / qü / gü', 'Ce, cu i ge', 'words', `casa|cullera|coca|cuc|conte|canya|carta|codi|cosa|quatre|quinze|química|equip|paquet|mosquit|esquena|esquirol|quadern|màquina|formatge|gat|got|gos|goma|gallina|guitarra|guerra|guineu|formiga|mànega|guix|espagueti|aigua|llengua|paraigua|pingüí|aigüera|qüestió|freqüent|següent`],
    ['vocals', 'a / e · o / u àtones', 'Vocals àtones', 'words', `sabata|berenar|davantal|treballar|nedar|navegar|assemblea|meravella|enyorar|empènyer|estendre|espàrrec|espàrrecs|monestir|assassí|vernís|avorrir|avorriment|botifarra|muntanya|conill|cobrir|descobrir|sofrir|sospirar|suportar|torró|joventut|ploma|plomall|fuster|fusteria|sortida|muntar`],
    ['digrafs', 'll / ny / x / ix / tx / ig', 'Dígrafs i xeix', 'words', `lluna|llibre|llapis|llavor|llengua|llit|gallina|ampolla|papallona|colla|any|pinya|canya|muntanya|aranya|banyera|castanya|senyor|xocolata|xarxa|xemeneia|xifra|caixa|peix|vaixell|cuixa|moixaina|motxilla|cotxe|dutxa|despatx|butxaca|maig|raig|passeig|assaig`],
    ['signes', 'Dièresi i ela geminada', 'Dièresi i ela geminada', 'words', `raïm|veïna|veïnat|països|país|agraïment|traïdor|conduïa|produïa|lluïa|oïda|peüc|diürn|pingüí|aigüera|paraigües|llengües|qüestió|freqüència|col·legi|col·lecció|pel·lícula|il·lusió|tranquil·la|goril·la|novel·la|paral·lel|mil·límetre|instal·lar|excel·lent|intel·ligent`],
    ['simples', 'Síl·labes simples', 'Síl·labes simples', 'pseudo', `nupi|fepo|dumi|tapú|binu|pafú|lomí|nufà|tepú|dofípol|mepu|ganu|lutepi|fenupi|dopali|tupena|mifanu|panufi|tedumi|nulapi|fopenu|demufi|nabopi|pumeli`],
    ['grups', 'Grups consonàntics', 'Grups consonàntics', 'pseudo', `sclaf|blis|drall|cluf|plim|bruf|flup|grisp|trufec|crunel|prufal|blanuf|drupel|glafí|frenup|cralop|brunif|clenap|trupol|flanec|graput|plonif|frupel|blenuc`],
    ['pseudodigrafs', 'Dígrafs', 'Dígrafs', 'pseudo', `platoll|cunyi|frisquell|llunep|nyapuf|fanyut|banyup|llunif|palluf|garrup|terrufi|marrup|quifol|guinel|guepuf|xanufi|mixup|feixum|txunel|patxuf|dunyal|jufell|guinop|quepil`],
    ['llargues', 'Més de dues síl·labes', 'Més de dues síl·labes', 'pseudo', `sergaminya|pirotet|blanufeta|grupinola|fresquinal|clopiruna|trumifeta|pladunifa|brufanell|nyuparela|quepinofa|guerunila|fenupali|drapuneta|crufanoli|tupinufa|xemurali|palunefi|flupinera|gomifuna|nuparella|trefunila|blinufeta|carunepi`]
  ];
  const categories = groups.map(([id, label, title, mode]) => ({ id, label, title, mode }));
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
  const entries = [...map.values()];
  root.PlecCatalog = { version: 1, categories, entries };
  if (typeof module !== 'undefined') module.exports = root.PlecCatalog;
})(typeof window === 'undefined' ? globalThis : window);
