# Decisions fonètiques de Plec

Registre editorial · 26/10/2026. La [guia pública](https://plec.ortogra.fi/ca/pronunciacio/) presenta aquests criteris als usuaris; la font de la pàgina és `templates/pronunciation-guide.html`.

**Decisió posterior a l’escolta:** síntesi mallorquina en pausa. La mostra de tres veus no és apta per publicar: neutra tònica percebuda com i i b.bl artificial a `amable`. Les propostes IPA continuen en revisió; no es canvien per dissimular aquests errors del resultat sonor. El [feedback](../audio/pronunciation/ca/mallorcan-pilot-feedback.json) queda separat de la integritat tècnica dels MP3. No s’inicien alternatives o nous lots automàticament.

## Compromís i estat de revisió

Es distingeixen **grafia del banc**, **proposta IPA**, **dicció didàctica** i **realització d’una veu**. Cap comprovació de format, descodificació d’MP3 o escolta d’una mostra valida totes quatre capes. Les taules actuals són propostes, amb fonts i decisions editorials per fila; no són transcripcions certificades extretes de diccionaris. El docent ha aprovat la selecció dels 350 mots bàsics, no les seves IPA.

L’autor pot detectar problemes d’accent o d’articulació i orientar la revisió, però **no és parlant nadiu de la varietat balear**. La seva escolta no substitueix el contrast amb parlants del model triat o especialistes. Aquesta limitació és explícita a la guia pública i al perfil en preparació.

Part dels àudios centrals originals prové de síntesi des de la grafia, sense IPA explícita; la taula conté el model objectiu proposat i pot diferir de l’enregistrament actual. Editar la taula no regenera l’àudio. Les proves i substitucions són explícites i versionades.

## F01 · Models de referència

| Perfil | Criteri | Procedència editorial | Pendent |
| --- | --- | --- | --- |
| Central | Reducció general a/e àtones → ə, o àtona → u; timbres tònics, hiats i accent diferenciats. | Branca `ca` de catalan2ipa, pistes centrals i correccions de les mostres. GIEC/GEIEC per contrast general. | Timbres lèxics, excepcions, formes verbals i escolta individual. |
| Valencià | Orientació formal general, habitual conservació del vocalisme àton i /v/ del model triat. | GNV capítol 1 per als criteris; branca `ca-valencia` i pistes explícites, sense copiar central. | No representa tots els parlars ni és una adaptació morfològica del banc. Contrast i escolta individuals. |
| Mallorquí | **Palma com a referència editorial formal/didàctica**, amb neutra tònica i conservació general de o àtona, harmonitzacions documentades i /v/. | Branca `ca-XB`, exemples i orientacions UIB/EBAP; no s’importen les pistes centrals/valencianes. | 410 decisions lèxiques i revisió de les altres propostes; només mostra de veus, encara sense paquet públic. |

Palma fixa una direcció coherent; no certifica que les IPA generades descriguin tots els parlants de la ciutat. No s’adopta l’excepció general de o àtona de Sóller ni es vol cobrir totes les illes, localitats, generacions i registres en una sola columna. Quan hi ha opcions admeses, es fixarà una opció editorial documentada per mot, sense declarar incorrectes les altres. **Escollir Palma no resol automàticament una vocal mitjana desconeguda**: fins a tenir una font o una justificació contrastable, el camp queda buit.

## F02 · Dicció didàctica sense lectura literal de l’ortografia

Es busca accent inequívoc, hiat perceptible i articulació clara. S’han provat l·l més llarga i finals nt/nc explícits per facilitar l’activitat. Cal revisar-ne l’adequació per varietat: el perfil didàctic no converteix en normativa qualsevol pronunciació de consonants habitualment mudes. No s’afegeixen vocals o pauses artificials dins dels mots; h i u mudes continuen mudes. La geminació bl/gl mallorquina té una base dialectal pròpia, independent de remarcar l·l amb finalitat didàctica.

Les formes amb dièresi es revisen cas per cas: no tota ï és tònica. L’adaptació distingeix, entre altres, subjuntius com `canviïn`, `continuïn` o `estudiïn`; els accents d’`atapeït`, les terminacions verbals i els timbres lèxics no es dedueixen només de la presència de dièresi. Són regles/propostes editorials pendents de contrast, amb proves estructurals separades de l’escolta.

## F03 · Representació i motor

L’IPA permet representar molt més detall que el que utilitzen aquestes taules. La notació de Plec és ampla, orientada al mot aïllat i no descriu sistemàticament tots els al·lòfons o assimilacions. `ˈ` marca l’inici de la síl·laba tònica i `.` la frontera sil·làbica. Les simplificacions tècniques com ɡ → g o certes marques d’africació no s’han de confondre amb neutralitzacions dialectals.

L’inventari ca-ES d’Azure és una restricció diferent de l’alfabet IPA. /v/ es conserva en les dades; el motor no el documenta a ca-ES, tot i haver acceptat una prova valenciana anterior. Les excepcions de síntesi s’identifiquen amb polítiques experimentals **separades per varietat**, mai reetiquetant mallorquí com a valencià ni substituint /v/ per /b/. Acceptar SSML no garanteix la qualitat del so, l’accent, la durada o la naturalitat dialectal.

Alba, Enric i Joana són veus ca-ES del proveïdor, no certificacions de central, valencià o mallorquí. La mostra mallorquina conserva les mateixes 18 IPA amb les tres veus i ritme −10 % per comparar-les; no activa encara una tercera veu al dictat de l’alumnat. Les velocitats de reproducció del web són independents de les dades de síntesi.

## F04 · Traçabilitat de dades i àudios

- Font editable: `audio/pronunciation/ca/*-didactic.tsv`. Cada fila conserva ID, grafia, perfil, base, fonts, notes, estat i revisió. Els JSON i TXT es deriven de la taula.
- Pistes de timbre: `central-vowel-hints.json`, `valencian-vowel-hints.json`, `mallorcan-vowel-hints.json`. Es diferencia una excepció documentada del conversor d’una decisió editorial encara pendent; eSpeak no és una font normativa.
- Mallorquí: 2.889 propostes i 410 buits intencionats; dels bàsics, 291 amb proposta i 59 pendents. Els buits no es completen per analogia amb un altre dialecte.
- Síntesi: la instantània a `recordings/` congela les IPA i les identitats utilitzades en un paquet. Canviar després una taula no altera els enregistraments ni les llavors impreses; una regeneració amb altres dades necessita un paquet nou.
- Navegador: els índexs `runtime/` són projeccions lleugeres. La font editorial completa continua disponible. «En procés» indica absència d’enregistrament publicat, no una transcripció validada.
- Feedback: la bandera manté el transport Umami i les proteccions GPC/DNT. Alternativament es pot proposar una correcció/PR al repositori, amb mot, varietat, proposta i font. No s’envia res automàticament a GitHub.

## Fonts explícites

### Autoritat i orientacions lingüístiques

1. [IEC · GIEC](https://giec.iec.cat/) i [GEIEC](https://geiec.iec.cat/): sistemes vocàlics/consonàntics i variació. [OIEC](https://oiec.iec.cat/): grafies i accentuació; no certifica la síntesi.
2. [AVL · Gramàtica normativa valenciana](https://www.upv.es/entidades/spnl/wp-content/uploads/2023/11/gramatica_normativa_valenciana.pdf), capítol 1, còpia a la UPV: orientació formal valenciana.
3. [UIB · GALMIC: vocal neutra tònica](https://galmic.uib.cat/fitxa/vocal-neutra-en-posicio-tonica/): exemples com abella, cera, ple, sec i fred, i variació geogràfica.
4. [UIB · GALMIC: neutralització o/u àtones](https://blocs.uib.cat/galmic/fitxa/neutralitzacio-o-u-atones/): conservació general mallorquina, Sóller, excepcions i harmonització amb opcions admeses.
5. [UIB · GALMIC: fricativa labiodental sonora /v/](https://galmic.uib.cat/fitxa/pronuncia-de-la-fricativa-labiodental-sonora-v-distincio-entre-b-i-v/): distinció b/v.
6. [UIB · GALMIC: grups bl/gl](https://blocs.uib.cat/galmic/fitxa/els-grups-bl-i-gl/): geminació intervocàlica.
7. [EBAP · Fonètica B2 (2025)](https://ebapenobert.caib.es/pluginfile.php/4111/mod_resource/content/6/2%20Fon%C3%A8tica%20%282025%29.pdf), pàgines 2–3 i 8–9: exemples i orientacions formals balears.

### Fonts de programari i restriccions del proveïdor

8. [catalan2ipa](https://github.com/Connum/catalan2ipa), font oberta LGPL: base de regles, no validació lèxica del banc. Còpia llegible i llicència a `tools/vendor/catalan2ipa/`.
9. [eSpeak NG · ca_list](https://github.com/espeak-ng/espeak-ng/blob/master/dictsource/ca_list): part de les pistes centrals/valencianes, no diccionari normatiu ni font importada al mallorquí.
10. [Microsoft · conjunts fonètics SSML](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets) i [llengües/veus](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts): restriccions tècniques, no autoritat dialectal.

Les fonts generals no acrediten cadascuna de les 3.299 propostes: la procedència específica es conserva per fila i a les pistes. Les correccions futures han d’indicar què es modifica, per què i amb quina font o contrast.

## F05 · Pseudoparaules i Matxa · 27/10/2026

Les [96 pseudoparaules](PSEUDOPARAULES-PRONUNCIACIO.md) tenen propostes independents central/valenciana/mallorquina, totes sense validació final. En absència d’una pronúncia lèxica es fixen accent segons grafia i decisions editorials explícites sobre e/o, no una suposada autoritat de diccionari. El contrast entre sons i escriptura pot admetre alternatives; el model no basta per marcar-les com a errors. Els dos primers perfils tenen àudio en revisió; el tercer manté la pausa del motor Azure.

Per petició expressa s’ha fet el [pilot local Matxa v2](MATXA-PILOT.md): mateixos 18 mots, amb Olga/Quim, entrada grafèmica i velocitat nativa. No replica la ruta IPA ni el ritme −10 % d’Azure. Les veus són balears segons el proveïdor, amb origen concret de Palma no verificat; ni la síntesi ni la integritat tècnica acrediten naturalitat. No s’han publicat els WAV ni activat la varietat al dictat de l’alumnat.
