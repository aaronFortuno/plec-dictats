# Dictat normal · primer prototip

## Estat · 25/11/2026

Pilot català `ca-ll-001-v1`, codi imprès `LL01`, «Una exposició al col·legi»: 63 mots, sis frases agrupades en tres paràgrafs, vint unitats de prosòdia. Focus l·l en context amb altres grafies ordinàries. El text i la dicció encara no tenen validació docent. El primer pilot ofereix només aquest focus; no simula un banc de textos ni assigna textos a focus inexistents. El castellà continua amb paraules i pseudoparaules.

El 25/11 es va enviar **una petició** de Gemini sense la confirmació concreta necessària, per una interpretació errònia de l'encàrrec. La resposta de 79,18 s està conservada a `output/audio/text-ll01/`; no s'ha repetit ni se'n publica l'àudio. El registre compartit amb Sentit inclou aquesta petició. La recuperació local ha eliminat només metadades de contenidor intercalades, conservant totes les mostres PCM, sense retallar ni accelerar la veu. L'alineació local és una ajuda temporal i no certifica pronunciació.

**Qualsevol nova síntesi necessita confirmació explícita del docent del text complet, la veu i el lot.** Ni un encàrrec de prototip ni la disponibilitat de claus o quota són una aprovació. Gemini comparteix les deu peticions gratuïtes diàries amb Sentit; acordar lots que aprofitin la quota. `audio/texts/production-plans.json` es manté pendent i el generador es bloqueja abans de reservar quota, llegir claus o enviar peticions. Publicar una presa necessita una decisió separada. No marcar aprovacions per iniciativa de l'agent.

## Preparador i full

- Tercer element «Dictat normal» al selector. Les preferències i els codis de paraules/pseudoparaules es conserven separats i es recuperen en tornar-hi.
- Un A4 vertical, plegat per una línia vertical (esquerra/dreta) o horitzontal (dalt/baix). «Primera/segona meitat» situa el model; per defecte és a la dreta o a baix i l’escriptura a l’esquerra o a dalt. L’altra meitat té nom, data i ratlles per escriure i revisar.
- Model amb text complet, marca de Plec i focus. QR i adreça a la capçalera de la meitat d’escriptura. Només un plec, sense la franja intermèdia del dictat de mots. Cal valorar la transparència del paper durant la prova física.
- Cos del model de 16 punts amb 10 mm entre línies i 20 mm entre l’última línia d’un paràgraf i la primera del següent. Les línies de pauta tenen els mateixos 10 mm i coincideixen amb les baselines del model, en coordenades relatives a cada meitat. Tres paràgrafs de dues frases, amb el text parlat intacte. La revisió del text es fa al preview, sense un desplegable duplicat al sidebar.
- `text-worksheet.js` calcula una geometria compartida en mil·límetres amb les mètriques Helvetica del PDF. `pdf.js` la dibuixa i el preview mostra les mateixes posicions. Comprovació de cabuda abans d'exportar.

## Identitat i navegació

`text-dictations.js` defineix contingut versionat, focus i unitats editorials. No introdueix un mode nou als protocols de llavors ja publicats. Si el text canvia després de validar-lo s'ha de crear un identificador nou, conservant l'anterior.

Preparador: `https://plec.ortogra.fi/ca/?text=ca-ll-001-v1&fold=vertical&side=start&pace=6&rate=1`.

Alumnat i QR: `https://plec.ortogra.fi/ca/dictat/?text=ca-ll-001-v1&pace=6&rate=1`. També s'admetrà el codi LL01 al camp d'entrada de l'alumnat. L'idioma i el text queden identificats; la llengua castellana no resol aquest text català. Els ajustos fora del conjunt admès es substitueixen per valors segurs.

## Reproductor

Agrupa unitats editorials sense partir un mot. Aproxima 4, 6 o 10 mots i respecta el final de frase; l'opció de frase sencera conserva les sis frases. El ritme determina la llargada del fragment i la velocitat és un ajust independent de reproducció (100/85/75 %, conservant el to amb `preservesPitch`). Es trien abans de començar; no hi ha avanç automàtic.

La pantalla activa mostra el número de fragment, el total, les escoltes i els botons de repetir/continuar, sense ensenyar el text. Fins a tres escoltes completes; un intent interromput o fallit no en consumeix una. Es pot passar després de la primera. Sortir de pantalla completa o canviar de pestanya atura l'àudio i pausa. Quan el navegador no admet pantalla completa es conserva el mode de concentració; no pot impedir canviar d'aplicació o pestanya.

`audio/texts/index.json` és el registre públic d'àudio i està buit. `text-audio.js` es genera amb `tools/build-catalogs.cjs`. Sense una presa publicada el reproductor informa que està en preparació; no inventa temps ni utilitza la veu del navegador. Les proves de la mecànica utilitzen un doble local del reproductor.

## Relació amb Sentit i Gemini

S'han consultat `sentit/tools/synthesis-batch.cjs`, `gemini-background.cjs`, `gemini-result.cjs`, `streamed-wave-recovery.cjs`, `local-align.cjs`, i els documents `lots-sintesi.md` i `pronunciacio-tts.md`. No s'han modificat guions, aprovacions o codi de Sentit. Les eines opcionals de producció de Plec reutilitzen utilitats locals de Sentit i la configuració privada existent; no formen part de l'execució del web.

Petició preparada amb `gemini-3.8-flash-tts`, veu Aoede, text català correcte i direcció no parlada dins de `speech_metadata.style`. Sense marques literals de pausa ni AFI assumit com a contracte. La direcció demana català central, tonicitat i consonants completes, lateral alveolar sostinguda per l·l, pauses de frase i inflexions suaus. Cal escoltar-ne el resultat: les metadades no garanteixen la geminació ni el ritme.

[Documentació oficial de síntesi](https://aistudio.google.com/docs/speech-generation) · [Condicions Gemini API](https://ai.google.dev/gemini-api/terms). Guió original de Plec; no atribuir als àudios una llicència CC0 del proveïdor.

### Planificar els lots, sense enviar-los

La [fitxa oficial de Gemini 3.8 Flash TTS](https://aistudio.google.com/docs/models/gemini-3.8-flash-tts), consultada el 25/11/2026, distingeix **8.192 tokens d'entrada** i **16.384 de sortida**, amb **25 tokens per segon d'àudio**. El màxim de sortida equival aproximadament a 655 segons (10 min 55 s), sense que sigui una durada garantida. Comptar separadament text i direcció d'entrada, i veu i pauses de sortida. No confondre aquests límits amb les peticions diàries disponibles.

Després de validar els textos, agrupar-ne diversos amb llengua, veu i dicció compatibles, conservant els límits i la identitat de cadascun. Objectiu inicial orientatiu de 6–8 minuts, amb marge; no afegir text de farciment per omplir una petició. Compartir la direcció sostinguda i usar indicacions locals breus per no repetir-la a cada fragment fins a esgotar l'entrada. La petició antiga del pilot queda conservada tal com es va enviar i no es reutilitza com a autorització d'un lot futur. Presentar text complet, composició del lot i estimació abans de demanar-ne la confirmació explícita.

`tools/synthesize-text-pilot.cjs` només descriu la petició per defecte. Un enviament futur requereix una aprovació expressa vinculada a l'empremta exacta, controla la quota compartida i un lock, conserva l'ID de la interacció i no reenvia intents incerts. `tools/text-pilot-audio.cjs` recupera només una resposta ja conservada. `tools/prepare-text-pilot.cjs` és local i requereix autorització de publicació abans de modificar recursos públics. La recuperació estricta del contenidor està adaptada de Sentit (MIT) a `tools/streamed-text-wave.cjs`; no és una correcció perceptiva de pronunciació.

## Següent validació

Revisar text, cabuda, plecs, navegació i mecànica del reproductor. Acordar després veu, direcció i lot abans d'enviar res nou. Escoltar la presa ja existent quan el docent ho decideixi; comprovar especialment l·l, tonicitat, naturalitat, pauses, atacs i finals abans de publicar-la o fer-ne una versió nova.
