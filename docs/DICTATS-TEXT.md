# Dictat normal · primer prototip

## Estat · 25/11/2026

Pilot català `ca-ll-001-v1`, codi imprès `LL01`, «Una exposició al col·legi»: 63 mots, sis frases agrupades en tres paràgrafs, quatre variants de prosòdia validades pel docent. Focus l·l en context amb altres grafies ordinàries. El text i l’escaleta estan validats; la dicció dels àudios continua pendent d’audició. El primer pilot ofereix només aquest focus; no simula un banc de textos ni assigna textos a focus inexistents. El castellà continua amb paraules i pseudoparaules.

El 25/11 es va enviar **una petició** de Gemini sense la confirmació concreta necessària, per una interpretació errònia de l'encàrrec. La resposta de 79,18 s està conservada a `output/audio/text-ll01/`; no s'ha repetit ni se'n publica l'àudio. El registre compartit amb Sentit inclou aquesta petició. La recuperació local ha eliminat només metadades de contenidor intercalades, conservant totes les mostres PCM, sense retallar ni accelerar la veu. L'alineació local és una ajuda temporal i no certifica pronunciació.

**Qualsevol nova síntesi necessita confirmació explícita del docent del text complet, la veu i el lot.** Ni un encàrrec de prototip ni la disponibilitat de claus o quota són una aprovació. Gemini comparteix les deu peticions gratuïtes diàries amb Sentit; acordar lots que aprofitin la quota. `audio/texts/production-plans.json` es manté pendent i el generador es bloqueja abans de reservar quota, llegir claus o enviar peticions. El pilot de quatre variants té autorització explícita de síntesi i integració al reproductor, recollida a `audio/texts/batches/ll01-four-rhythms-v1.json`. Això no desbloqueja el generador antic ni autoritza noves peticions o versions.

## Preparador i full

- Tercer element «Dictat normal» al selector. Les preferències i els codis de paraules/pseudoparaules es conserven separats i es recuperen en tornar-hi.
- Un A4 vertical, amb un únic plec. En vertical: 125 mm d’escriptura i 85 mm de model; plec a 125 mm amb model a la dreta (defecte), o a 85 mm si el model és a l’esquerra. En horitzontal: 170 mm d’escriptura i 127 mm de model, amb el plec a 170 o 127 mm segons el costat. El model més petit es plega darrere de la part d’escriptura.
- Model amb text complet, marca de Plec i focus. QR a la capçalera de la part d’escriptura, amb codi i adreça just a sota, alineats a la dreta. L’adreça es divideix en un màxim de dues línies; si cal es trunca visualment, mantenint l’enllaç complet al QR. Només un plec, sense la franja intermèdia del dictat de mots. Cal valorar la transparència del paper durant la prova física.
- Camps numèrics de model (12–16 pt, defecte 14) i interlineat de pauta (8–12 mm, defecte 10), amb fletxes natives i actualització immediata. Un camp buit o fora de rang bloqueja la descàrrega fins a corregir-lo. En vertical, el primer text i la primera pauta comencen a 80 mm de l’inici del panell: alineació de baselines dins de cada paràgraf, una ratlla extra per bloc i una franja sense ratlles abans del següent. Les posicions es recalculen amb les mètriques del model. No s’afegeixen ratlles després del tercer bloc. Si una combinació no cap, es mostra un avís, es retira la vista anterior i es desactiva el PDF fins a ajustar-la.
- En horitzontal, la pauta d’escriptura és contínua des dels 80 mm. El model ocupa l’altra part amb cos configurable i interlineat compacte (derivat de la pauta, amb mínim 6 mm), tres paràgrafs i inici a 60 mm. No es força una alineació de línies entre les parts de dalt i baix. La revisió es fa al preview, sense duplicar el text al sidebar.
- `text-worksheet.js` calcula una geometria compartida en mil·límetres amb les mètriques Helvetica del PDF. `pdf.js` la dibuixa i el preview mostra les mateixes posicions. Comprovació de cabuda abans d'exportar.

## Identitat i navegació

`text-dictations.js` defineix contingut versionat, focus i unitats editorials. No introdueix un mode nou als protocols de llavors ja publicats. Si el text canvia després de validar-lo s'ha de crear un identificador nou, conservant l'anterior.

Preparador: `https://plec.ortogra.fi/ca/?text=ca-ll-001-v1&fold=vertical&side=end&pace=6&rate=1&fontSize=14&lineSpacing=10`. La mida i l’interlineat es recuperen des d’aquest enllaç; el QR d’alumnat continua independent de la maquetació.

Alumnat i QR: `https://plec.ortogra.fi/ca/dictat/?text=ca-ll-001-v1&pace=6&rate=1`. També s'admetrà el codi LL01 al camp d'entrada de l'alumnat. L'idioma i el text queden identificats; la llengua castellana no resol aquest text català. Els ajustos fora del conjunt admès es substitueixen per valors segurs.

## Reproductor

Reprodueix quatre lectures realment diferents segons l’escaleta: 2–3, 4–5, 6–8 o 9–12 mots; respecta els paràgrafs i els ajustos editorials de sentit. Hi ha 26, 14, 9 i 6 fragments, respectivament. El ritme determina la llargada del fragment i la velocitat és un ajust independent de reproducció (100/85/75 %, conservant el to amb `preservesPitch`). Es trien abans de començar i també a «Ajusta el ritme» durant el dictat; no hi ha avanç automàtic. Es conserva l’últim mot confirmat amb «Següent». En canviar de ritme, es busca el fragment que conté el primer mot pendent: pot repetir-ne alguns, mai saltar-los. Les URL conserven `pace=2/4/6/10`; l’antiga opció `pace=0` resol la lectura de 9–12 mots.

La pantalla activa mostra el número de fragment, el total, les escoltes i els botons de repetir/continuar, sense ensenyar el text. Fins a tres escoltes completes; un intent interromput o fallit no en consumeix una. Es pot passar després de la primera. Sortir de pantalla completa o canviar de pestanya atura l'àudio i pausa. Quan el navegador no admet pantalla completa es conserva el mode de concentració; no pot impedir canviar d'aplicació o pestanya.

`audio/texts/index.json` conté les quatre variants del pilot: camí MP3, empremta, durada, fragments amb temps i intervals estables de mots, i puntuació locutada. El registre és `pending-listening`, sense certificació de pronunciació. `text-audio.js` es genera amb `tools/build-catalogs.cjs`. Sense una presa publicada el reproductor informa que està en preparació; no inventa temps ni utilitza la veu del navegador. Les proves comproven també la descodificació real dels quatre MP3 i utilitzen un doble local per recórrer totes les repeticions, interrupcions i canvis de ritme.

## Relació amb Sentit i Gemini

S'han consultat `sentit/tools/synthesis-batch.cjs`, `gemini-background.cjs`, `gemini-result.cjs`, `streamed-wave-recovery.cjs`, `local-align.cjs`, i els documents `lots-sintesi.md` i `pronunciacio-tts.md`. No s'han modificat guions, aprovacions o codi de Sentit. Les eines opcionals de producció de Plec reutilitzen utilitats locals de Sentit i la configuració privada existent; no formen part de l'execució del web.

Petició preparada amb `gemini-3.8-flash-tts`, veu Aoede, text català correcte i direcció no parlada dins de `speech_metadata.style`. Sense marques literals de pausa ni AFI assumit com a contracte. La direcció demana català central, tonicitat i consonants completes, lateral alveolar sostinguda per l·l, pauses de frase i inflexions suaus. Cal escoltar-ne el resultat: les metadades no garanteixen la geminació ni el ritme.

[Documentació oficial de síntesi](https://aistudio.google.com/docs/speech-generation) · [Condicions Gemini API](https://ai.google.dev/gemini-api/terms). Guió original de Plec; no atribuir als àudios una llicència CC0 del proveïdor.

### Planificar els lots, sense enviar-los

La [fitxa oficial de Gemini 3.8 Flash TTS](https://aistudio.google.com/docs/models/gemini-3.8-flash-tts), consultada el 25/11/2026, distingeix **8.192 tokens d'entrada** i **16.384 de sortida**, amb **25 tokens per segon d'àudio**. El màxim de sortida equival aproximadament a 655 segons (10 min 55 s), sense que sigui una durada garantida. Comptar separadament text i direcció d'entrada, i veu i pauses de sortida. No confondre aquests límits amb les peticions diàries disponibles.

Després de validar els textos, agrupar-ne diversos amb llengua, veu i dicció compatibles, conservant els límits i la identitat de cadascun. En aquest pilot, màxim preventiu de 6 min 30 s d’estimació conservadora, segons l’encàrrec docent de quedar sota uns 6–7 minuts; no afegir text de farciment per omplir una petició. Compartir la direcció sostinguda i usar indicacions locals breus per no repetir-la a cada fragment fins a esgotar l'entrada. La petició antiga del pilot queda conservada tal com es va enviar i no es reutilitza com a autorització d'un lot futur. Presentar text complet, composició del lot i estimació abans de demanar-ne la confirmació explícita.

`tools/synthesize-text-pilot.cjs` només descriu la petició per defecte. Un enviament futur requereix una aprovació expressa vinculada a l'empremta exacta, controla la quota compartida i un lock, conserva l'ID de la interacció i no reenvia intents incerts. `tools/text-pilot-audio.cjs` recupera només una resposta ja conservada. `tools/prepare-text-pilot.cjs` és local i requereix autorització de publicació abans de modificar recursos públics. La recuperació estricta del contenidor està adaptada de Sentit (MIT) a `tools/streamed-text-wave.cjs`; no és una correcció perceptiva de pronunciació.

## Escaleta editorial dels quatre ritmes · 25/11

Accés «Escaleta» a la capçalera del preview; només al mode de text català. `content/prosody/ca-ll-001-v1.json` conserva la instantània del text i els finals de paràgraf, els finals de fragment d’autor i les excepcions explicades. El docent ha validat l’escaleta i ha autoritzat aquest lot amb Aoede: estat `approved-for-pilot`. L’autorització concreta congela les empremtes del pla i de la petició; no es dedueix només de l’estat del JSON.

- 2–3 mots: 26 fragments, tots dins del rang.
- 4–5 mots: 14 fragments, cinc ajustos de sentit, curts al final de frase o més llargs per conservar un complement o subjecte.
- 6–8 mots: nou fragments, tres ajustos. Pot incloure un punt i seguit a l’interior d’una tirada, que es continua locutant.
- 9–12 mots: sis fragments, una frase sencera per tirada.

Cada variant reprodueix exactament els 63 mots i els tres paràgrafs. Cap fragment travessa un punt i a part. Cada mot conserva un índex estable 1–63 i cada locució l’índex del mot després del qual es diu; això permet el canvi de ritme sense omissions al reproductor del pilot. La comparativa i els fragments del manifest comparteixen els mateixos límits editorials.

La vista docent mostra quatre columnes i, en pantalles estretes, un selector de quatre ritmes sense tancar el quadre. El PDF comparatiu té tres pàgines A4 horitzontals, una per paràgraf, amb direccions breus i excepcions. La direcció general completa es consulta a «Direcció de veu i pauses» i al JSON font.

Puntuació prevista: tres comes, tres punts i seguit, dos punts i a part, un signe de dos punts i un punt final. Són deu locucions, 24 mots addicionals de locució: cada versió té 63 mots del dictat i 87 mots efectivament locutats. Les quatre sumen 252 mots de dictat i 348 locutats, abans de pauses, per al càlcul del lot autoritzat.

Pauses previstes a la direcció validada: 1 s al tall; 1,6 s al canvi de paràgraf o final; 0,25 s abans i 0,35 s després de cada locució. Són marges de gravació i muntatge, no un temps límit per escriure. Cal comprovar la presa real abans de donar els talls per bons. La petició autoritzada s’ha enviat una sola vegada; els límits reals s’han obtingut de la presa, no de pauses teòriques.

## Locució de puntuació · mateixa veu

«Coma», «punt i seguit», «punt i a part», «dos punts» i «punt final» formen part del mateix guió i la mateixa petició que el text, amb **la mateixa veu Aoede**. No són enregistraments genèrics enganxats posteriorment. En futurs lots amb una altra veu, tornar a generar també la seva puntuació dins de la mateixa lectura. Les indicacions no entren al text imprès, al recompte de 63 mots o a l’avanç del cursor de lectura.

## Pilot rebut i publicat · 25/11/2026

- Autorització docent explícita del text i l’escaleta revisats, quatre variants, una petició, Aoede i integració al reproductor.
- 348 mots locutats, inclosos 40 anuncis de puntuació. Estimació nominal: 258 s; conservadora: 381 s (95 mots/min, totes les pauses previstes i 20 % de marge). Topall: 390 s. L’estimació d’entrada conservadora és de 6.829 tokens; són càlculs, no un límit garantit pel proveïdor.
- Resultat: **219,66 s**, una petició completada, 702 tokens d’entrada i 5.492 de sortida segons el rebut. Versions: 73,005 s / 50,745 s / 52,920 s / 42,990 s. La diferència entre estimació i resultat reflecteix la lectura i les pauses efectives del model.
- Presa original, resposta i identificador conservats a `output/audio/ll01-four-rhythms-v1/28b3ed21a923/`. S’han retirat només metadades de contenidor intercalades; es conserven totes les mostres PCM, sense canviar la velocitat de la veu.
- Alineació local amb Vosk i talls dins de finestres silencioses, amb marges respecte de les paraules reconegudes. Cobertura orientativa del 97,13 %, amb unions explícites de grafies d’ASR com «com a»/«coma» i «apart»/«a part». Les discrepàncies estan al rebut i requereixen audició; el reconeixement no valida tonicitat, l·l o dicció.
- Quatre MP3 de 24 kHz mono i 64 kbit/s a `assets/audio/texts/ca/ll01-four-v1/`. Cinquanta-cinc intervals editorials cobreixen els 63 mots i deu anuncis de puntuació de cadascuna de les variants. La descodificació s’ha comprovat localment.
- `tools/prosody-batch.cjs` només calcula per defecte. Un enviament requereix aprovació exacta, topall de durada, màxim d’una petició, quota compartida i lock. Un intent incert no es reenvia; `--resume` recupera el mateix ID. `tools/prepare-prosody-pilot.cjs` només treballa sobre fitxers locals i comprova l’autorització de publicació.

**Pendent de validació perceptiva:** naturalitat, tonicitat, geminació, atacs i finals, pronunciació dels anuncis i correcció dels talls escoltant cada ritme. L’aprovació de l’escaleta no equival a l’aprovació dels àudios. No regenerar cap mostra sense un nou encàrrec explícit.

Comprovacions locals: 54 proves passades (pures, dades, àudio simulat, PDF, navegador i compatibilitat). Verificació addicional del canvi de ritme durant una escolta, callbacks antics i error de reproducció sense consumir escoltes. La comprovació del desplegament remot correspon al docent.
