# Revisió inicial d’accessibilitat

26/10/2026 · base `6bc8092` (1.26). Complement de l’[auditoria tècnica](AUDITORIA-TECNICA-2026-10.md).

S’ha revisat el preparador, el catàleg, un diàleg d’ajuda, els calaixos laterals i la progressió del dictat en Chrome local. El referent és [WCAG 2.2, nivell AA](https://www.w3.org/TR/WCAG22/). Aquesta revisió parcial **no és una certificació de conformitat**: no inclou lector de pantalla real, tots els navegadors, totes les combinacions de focus/tema ni PDF etiquetat.

## Evidència reproduïble

Amb el servidor local a `127.0.0.1:4176`, Node i Playwright/Chrome disponibles:

```text
node tools/audit-accessibility.cjs
```

Si Playwright no es resol localment, `PLEC_NODE_MODULES` indica el directori de dependències. L’ordre desa les mesures a `output/audit-a11y-2026-10.json` (ignorat per Git). Simula només la finalització de l’àudio i l’analítica, per verificar la interacció sense fer síntesi ni enviar avisos. No avalua la qualitat de les pronunciacions. Els resultats són mesures, no un marcador automàtic d’accessibilitat.

## A01 · P2 · Focus perdut després de les dues primeres escoltes

**Confirmat.** A `dictation.js:299`, el botó d’escoltar es desactiva durant la reproducció. Chrome n’expulsa el focus. Després, `:329` només el restitueix quan ja toca passar de paraula.

**Reproducció:** carregar `ca/dictat/?seed=ADZ52356A`, començar en mode concentració, enfocar «Escolta» i prémer Enter. Després de la primera i de la segona escolta, `document.activeElement` és `BODY`; després de la tercera és `#next-word`. Un segon Enter seguit no torna a escoltar: cal retrobar el botó amb Tab. S’ha reproduït amb un àudio simulat que acaba, sense cap error de reproducció.

**Impacte:** interrupció repetida de la navegació per teclat. Relacionat amb l’ordre i la continuïtat del focus (2.4.3); no és una trampa de teclat, perquè Tab encara permet continuar.

**Correcció proposada:** conservar si l’escolta s’ha iniciat des del botó i, en acabar, retornar-hi el focus mentre quedin escoltes; després de la tercera, passar-lo a «Paraula següent». No recuperar-lo si l’usuari l’ha mogut expressament a un altre control durant la reproducció. Aplicar el mateix criteri als errors, sense segrestar el focus.

**Tancament:** completar dos mots amb Enter/Tab sense haver de recomençar la navegació després de cada escolta; provar error d’àudio, pausa i moviment voluntari de focus durant la reproducció. Preservar el recompte de tres escoltes.

## A02 · P2 · L’alçada fixa col·lapsa el configurador amb molta ampliació

**Confirmat en viewport efectiu 320 × 256 CSS px**, equivalent a l’espai disponible amb una finestra de 1280 × 1024 ampliada al 400 %. S’ha provat la geometria equivalent, no el zoom natiu de tots els navegadors.

`responsive-workspace.css:10–36` manté cos fix, capçalera, peu i desplaçament intern. La capçalera ocupa 125,8 px, el peu 57 px i la barra de calaixos 38 px. Queden **11,2 px de workspace**. En obrir «Filtres», el calaix té 34 px d’alçada per la seva mida mínima, però **`.config-scroll.clientHeight` és 0**. Els controls no es poden consultar. No hi ha desplaçament horitzontal global; el problema és l’espai vertical insuficient.

**Impacte:** l’ampliació pot impedir preparar un dictat. Relacionat amb reflow (1.4.10) i contingut/controls accessibles amb ampliació. La maqueta de full pot necessitar dues dimensions, però aquesta excepció no justifica perdre els formularis.

**Correcció proposada:** una variant de poca alçada que permeti desplaçar la pàgina o obri els calaixos sobre una superfície amb alçada real de pantalla. El peu ancorat és útil a l’ús habitual, però no ha d’absorbir l’espai necessari per operar els controls. Evitar resoldre-ho fent la lletra més petita.

**Tancament:** provar 320 × 256 i 320 × 720, a més de zoom natiu 200–400 %; tots els controls i els tancaments han de quedar accessibles amb teclat i scroll. Preservar el layout de laterals que no s’apilen a les amplades habituals.

## A03 · P3 · Preferència de moviment reduït sense efecte

**Confirmat:** amb `prefers-reduced-motion: reduce`, `--motion-duration` i `PlecMotion.duration` continuen a 220 ms. `motion.js` i `dictation.js` també animen transicions. El comportament segueix la petició anterior d’homogeneïtzar totes les animacions a 220 ms.

**Proposta:** mantenir 220 ms per defecte i afegir una excepció expressa per la preferència del sistema, evitant especialment desplaçaments, rotacions i zoom animat. Cal coordinar CSS i JavaScript: canviar només una variable no afecta les durades literals ni el controlador inicialitzat. És una recomanació d’accessibilitat; **2.3.3 és AAA**, i l’absència d’aquesta excepció no es presenta aquí com un incompliment AA automàtic.

## Resultats favorables de la mostra

- Llengua de document `ca`, títol identificable, un element `main` i nom accessible del titular de marca.
- El primer Tab arriba a «Ves al preparador».
- L’ajuda nativa rep el focus en obrir-se; Escape la tanca i el retorna al botó d’origen.
- El calaix de filtres manté el focus dins durant 75 Tab i Escape el retorna al seu activador.
- Cap botó visible sense nom accessible al catàleg mostrat. A 390 px, altaveus i banderes mesuren 28 × 28 px; els primers enllaços de l’alfabet, uns 24,5 × 26 px. Superen els 24 px del criteri mínim 2.5.8 en aquesta mostra.
- A 390 px i a 320 × 720 no s’ha detectat desbordament horitzontal de pàgina; el peu continua visible.
- Contrast de text calculat sobre colors finals després de les transicions: entre **4,61:1 i 12,07:1** en sis mostres del tema clar, i entre **6,18:1 i 14,36:1** en les mateixes mostres fosques. S’han mesurat lema, peu, ajuda del catàleg, títol de mots obligatoris, PDF i inici del dictat. No s’extrapola a tots els estats ni a vores i icones.
- El comptador de paraula conserva `aria-live="polite"`; en passar a la següent paraula el focus va al titular del reproductor. Cap error JavaScript durant el recorregut final.

## Ordre de consolidació

Incloure A01 i A02 en el primer lot de fiabilitat de la interfície, al costat de la càrrega independent de recursos T01. Tractar A03 com a excepció de preferència del sistema dins la neteja d’interaccions. Abans del pilot digital, completar la prova amb lector de pantalla (NVDA/VoiceOver) i revisar el formulari de respostes quan existeixi. El model de correcció i les adaptacions pedagògiques s’han de definir separadament del motor de reproducció.
