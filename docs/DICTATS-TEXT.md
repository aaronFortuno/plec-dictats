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

Reprodueix quatre lectures realment diferents segons l’escaleta: 2–3, 4–5, 6–8 o 9–12 mots; respecta els paràgrafs i els ajustos editorials de sentit. Hi ha 26, 14, 9 i 6 fragments, respectivament. El ritme determina la llargada del fragment i la velocitat és un ajust independent de reproducció (100/90/80 %, conservant el to amb `preservesPitch`). Es trien abans de començar i també als controls visibles durant el dictat; es poden repetir automàticament les escoltes, però el pas al fragment següent continua sent manual. Es conserva l’últim mot confirmat amb «Següent». En canviar de ritme, es busca el fragment que conté el primer mot pendent: pot repetir-ne alguns, mai saltar-los. Les URL conserven `pace=2/4/6/10`; l’antiga opció `pace=0` resol la lectura de 9–12 mots.

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

## Audició docent contínua · 1.39.1

«Escaleta i àudios» permet escoltar les versions completes (2–3, 4–5, 6–8 o 9–12 mots), amb pausa, cerca temporal i tots els fragments seguits. Utilitza els mateixos quatre MP3 que l’alumnat; no remunta ni sintetitza res. Des de la versió 1.43 hi ha quatre reproductors fixos, un per columna, i s’elimina el selector desplegable. En mòbil es coordinen amb les pestanyes de l’escaleta. Només pot sonar una versió alhora; tancar el diàleg, amagar la pestanya o sortir de la pàgina pausa tots els reproductors.

Incidència comunicada pel docent el 25/11/2026: a la versió `r912` (9–12 mots), inici del primer fragment, «Al col·legi» sona «Al col·leja». **Pendent de corregir**, amb la presa original conservada. No regenerar sense autorització; completar primer l’audició de les quatre versions per agrupar les correccions necessàries.

## Marques i còpia d’errors · 1.39.2

El reproductor queda fora del scroll, fix sobre les quatre columnes. Cada quadre de fragment és un botó accessible per ratolí, tacte i teclat; marcar-lo desplega una nota opcional. Un segon clic el desmarca. «Copia errors», sempre accessible al peu del diàleg, genera un únic text pla de totes les versions marcades. Inclou identitat de la presa, versió, fragment, mots, text, puntuació locutada, interval temporal, arxiu i empremta d’àudio, i observació. Si el navegador denega el porta-retalls, es mostra el mateix text seleccionat per copiar manualment. No s’ofereix una descàrrega de document.

`prosody-review.js` conserva les marques en local, separades per text, petició i presa PCM; només l’exportació voluntària les comparteix. Sense emmagatzematge, es mantenen durant la sessió amb un avís explícit. `audio/texts/review-notes.json` recull les incidències ja comunicades: `r912/F1` («col·legi» → «col·leja») i `r23/F5` («Ha enganxat» → «Ha enganjat» o similar). Es mostren marcades en una primera revisió; una desmarcació explícita es respecta en tornar-hi. El docent ha donat per bones les altres locucions. Cap síntesi ni correcció automàtica autoritzada per aquestes marques.

Verificació 1.39.2: 55 comprovacions locals passades, incloent marques per fragment, notes, còpia al porta-retalls i alternativa manual, persistència, selectors, reproducció contínua i reproductor fix. Comprovació addicional del quadre en pantalla horitzontal baixa.

## Repeticions automàtiques · 1.40

Per defecte, «Comença» inicia la primera escolta i cada fragment es repeteix fins a tres vegades sense haver de tornar a prémer el botó. L’espera comença quan acaba l’àudio. El recompte continua excloent els anuncis de puntuació. L’alumne pot tornar a sentir-lo abans prement el botó gran o passar manualment al fragment següent després d’una escolta completa. Després de la tercera no hi ha cap avanç automàtic: el temps per acabar d’escriure continua sent lliure.

Espera habitual: arrodonir cap amunt `min(12, 4 + 0,8 × (mots − 2))`, amb un mínim de 4 segons. Exemples: 2 mots → 4 s; 3 → 5 s; 6 → 8 s; 12 → 12 s. El control «Pausa» ofereix Àgil (×0,8), Habitual (×1) i Més marge (×1,25); després del factor s’aplica sempre un topall entre **4 i 15 segons**. Són valors provisionals de funcionament per validar a l’aula, no una mesura de velocitat personal. L’opció inicial de 2,5 s per mot i el multiplicador doble s’han descartat expressament pel docent; no reintroduir esperes tan llargues.

El botó «Atura l’escolta automàtica» cancel·la l’espera i interromp l’àudio si s’està reproduint; una escolta incompleta no compta. Permet continuar manualment o tornar a activar les repeticions. Es pot desmarcar l’automatisme abans de començar. Els ajustos són visibles; tocar-los no desactiva l’automatisme. Canviar la quantitat de mots cancel·la la presa en curs i prepara el nou fragment sense saltar mots; la repetició següent espera el termini complet. En canviar de ritme, avançar de fragment, sortir, amagar la pestanya o perdre la pantalla completa es cancel·la el compte enrere. La represa des d’una pausa dona de nou l’espera completa abans de repetir.

`text-repeat.js` aïlla el càlcul i el temporitzador, amb termini temporal i invalidació dels callbacks antics. No acumula reproduccions quan el navegador reprèn un temporitzador tardà. `text-player.js` manté el límit de tres, la posició de lectura i els gestos explícits d’inici/represa. Un error d’àudio atura l’automatisme i no es reintenta indefinidament. Els ajustos són de sessió; el codi del text, les URL, el PDF i les preses originals no canvien. El mode de paraules i pseudoparaules conserva el funcionament anterior.

## Controls directes i velocitats · 1.41 · 26/11/2026

S’elimina l’acordió d’ajustos i tots els selectors desplegables de l’alumnat del dictat normal. Abans i durant l’activitat apareixen els mateixos tres controls: **Mots**, **Velocitat** i **Pausa**, amb botons −/+ i valor visible. Els botons dels extrems es desactiven al mínim o màxim; tenen noms accessibles i àrea tàctil de 44 × 44 px. A mòbil són tres files compactes; el comptador gran del botó d’escolta es disposa en una línia per mantenir els controls visibles.

Les velocitats són ara **80 %, 90 % i 100 %**. El preparador docent, els enllaços i el reproductor comparteixen aquestes opcions. Els antics `rate=0.75` i `rate=0.85` es recuperen com 80 % i 90 %, respectivament. Els controls del mode de paraules i pseudoparaules no canvien.

La velocitat es pot canviar mentre sona el fragment, conservant posició i to; no reinicia l’escolta ni en consumeix una de nova. La pausa d’escriptura segueix limitada a 4–15 s; canviar-la durant la lectura afecta l’espera següent. Canviar els mots manté l’últim mot confirmat i tria el fragment que conté el primer pendent, amb possible repetició però sense omissions. No es creen àudios nous ni es modifiquen les preses publicades.

## LL02 · Llavors al jardí · 26/11/2026

57 mots en tres paràgrafs; set paraules amb l·l (col·lecció, il·lusió, parcel·la, col·labora, col·loca, il·lustració, excel·lent). Text validat expressament pel docent, amb autorització d’una única petició de quatre ritmes, Aoede, català central i puntuació amb la mateixa veu. S’han preparat 26/12/8/6 fragments; els ajustos de sentit fora dels rangs estan justificats a l’escaleta.

Estimació nominal 244 s; conservadora 359 s, sota el topall de 390 s. La petició s’ha enviat abans del canvi de quota diària, després d’esperar el lock compartit i la separació respecte de Sentit. Els dos bloqueigs previs no han reservat ni enviat peticions. Resultat únic: **211,83 s**, 662 tokens d’entrada i 5.296 de sortida. Resposta i presa originals conservades a `output/audio/ll02-four-rhythms-v1/fc409397881b/`; aprovació i rebut públics a `audio/texts/batches/`.

El proveïdor ha retornat un prefix PCM de 70 ms (3.360 bytes) abans del C2PA i del flux intercalat. La recuperació local accepta aquest nou format observat mantenint totes les comprovacions anteriors i totes les mostres PCM. No s’ha reenviat la petició ni s’ha modificat la velocitat de la presa. Les quatre versions duren 70,65 / 48,12 / 52,41 / 40,65 s, MP3 mono de 24 kHz i 64 kbit/s.

Alineació orientativa del 95,06 %. El límit després de F7 en 4–5 mots («…les arrels») s’ha situat amb àncores de context i una finestra silenciosa verificada perquè Vosk no reconeix bé els mots finals. Consta com `asrBoundaryUncertain` al rebut. Això no valida la pronunciació: prioritzar l’audició de F6–F8 d’aquesta versió i comprovar també la resta. No s’han afegit banderes d’error a partir de l’ASR; les marca el docent escoltant.

Els textos passen a `content/texts/`, amb una llista indexada i el paquet generat `text-catalogue.js`. LL01 conserva exactament text, pla, MP3, empremtes, notes i codi; el selector docent permet alternar sense modificar les llavors de paraules/pseudoparaules. Els enllaços i QR de LL02 identifiquen `ca-ll-002-v1`; el codi LL02 també s’admet a l’entrada de l’alumnat. L’escaleta, l’escolta seguida i l’exportació de marques funcionen separadament per a cada presa.

`tools/prosody-batch.cjs --batch=ll02-four-rhythms-v1` només prepara i estima per defecte. Qualsevol intent de generació exigeix aprovació exacta i un màxim explícit d’una petició. Una presa rebuda no es reenvia. `tools/prepare-prosody-pilot.cjs --batch=ll02-four-rhythms-v1` treballa exclusivament sobre la resposta local. Els lots LL01 i LL02 estan enumerats expressament: no s’accepten identificadors arbitraris.

Validació local de LL02: 58 comprovacions passades, inclosos selector i recàrrega de cada text, recuperació per codi/URL, descodificació dels vuit MP3, escaletes independents, exportació de marques, integritat dels rangs i quatre variants de plec en una pàgina. Sense comprovació del desplegament remot.

## Tancar el dictat · 1.43

La creu de la interfície de text atura l’àudio i el temporitzador i torna al mateix preparador que l’enllaç del logotip, conservant text, nombre de mots i velocitat. Funciona des de la preparació, durant l’escolta, en espera i després d’acabar. Abans només retornava a la pantalla inicial del reproductor, i semblava no fer res si ja s’hi era. «Torna a començar» continua disponible al final de l’activitat. El mode de paraules conserva el retorn al camp de codi.

## Quatre reproductors de revisió · 1.43

L’escaleta ofereix quatre reproductors independents fixos sobre les columnes de 2–3, 4–5, 6–8 i 9–12 mots. No hi ha cap desplegable per escollir l’àudio. El marge dret del grid es calcula amb l’amplada real del scroll per alinear cada reproductor amb la seva columna. Els fragments continuen desplaçant-se per sota; la còpia de marques segueix fixa al peu.

En iniciar una versió es pausa qualsevol altra; es conserva el punt de cada àudio i no es torna a carregar l’arxiu en alternar-los. Tancar el quadre, amagar la pestanya o sortir de la pàgina els pausa tots. En pantalles estretes, les pestanyes existents mostren una columna amb el seu reproductor corresponent, amb les mateixes quatre instàncies i sense menú desplegable. Cada àudio mostra el seu error i permet reintentar-ne la càrrega de forma independent.

Comprovacions locals: X des de la pantalla inicial, reproducció i espera, retorn al text i ajustos correctes, absència de repeticions tardanes; quatre MP3 reals, alineació dels reproductors amb les columnes, continuïtat entre fragments, pausa mútua, conservació del punt, pausa en tancar, marques/porta-retalls i vista estreta/fosca/horitzontal baixa. Cap síntesi nova ni comprovació remota.

## Revisió docent de LL02 i nom Frases · 1.44

El mode visible passa de «Dictat normal» a **Frases**, també a la capçalera del preparador i de l’alumnat. No es canvien el valor intern `text`, els codis ni els enllaços existents.

S’incorporen literalment set incidències de la presa `fc409397881b…`, després de comprovar les empremtes dels MP3, els rangs i els textos: r45/F7–F10, «castellanitzat»; r912/F2, «una mica massa ràpid»; r912/F3, «punt i seguit» molt més lent que el text; r912/F6, «punto final». Els informes inicials de l’escaleta les mostren marcades; les notes locals desades de l’usuari continuen tenint prioritat. No es dona la resta per validada només per absència de marca.

La deriva de llengua en un bloc consecutiu i en una locució de puntuació està confirmada per l’audició docent. La causa del comportament del model no està demostrada. La proposta de correcció reforça català central en cada fragment i indicació oral, i un ritme homogeni entre text i puntuació.

Proposta preparada, **no autoritzada ni enviada**, a `audio/texts/batches/ll01-ll02-corrections-proposal-v1.json`: refer quatre versions completes en una petició amb Aoede (LL01 r23/r912 i LL02 r45/r912), mantenint intactes les altres. Així es cobreixen els nou fragments comunicats entre els dos dictats i es preserva la coherència de veu dins de cada versió. Textos i talls originals; 336 mots locutats, estimació nominal 254 s i conservadora 366 s, sota 390 s. És una estimació de planificació, pendent de compilar, validar i autoritzar la petició exacta. El generador no reconeix aquest identificador de proposta com un lot executable.

## Codi de ritme portable · 1.44

Pilot disponible al mode **Frases**. A la pantalla inicial hi ha un camp discret «Codi de ritme (opcional)»: introduir la paraula i prémer Enter o «Aplica». Un codi vàlid recupera immediatament mots per fragment, velocitat i pausa. Un codi desconegut informa de l’error, manté els valors previs i permet començar sense codi. Es pot deixar el camp buit i ajustar directament els controls.

Al final es mostra la paraula corresponent als **últims ajustos seleccionats**, amb resum dels valors i botó de còpia. No hi ha test inicial ni inferència de capacitat o de velocitat d’escriptura; les tres escoltes i el temps manual no es converteixen en una avaluació. Si l’alumne afina els valors durant el dictat, el codi final reflecteix aquesta elecció. És el mateix per a qualsevol text i qualsevol dispositiu, i no es desa al navegador ni identifica l’alumne.

Matriu de 36 perfils: 4 quantitats de mots × 3 velocitats (80/90/100 %) × 3 pauses (àgil/habitual/més marge, sempre limitades a 4–15 s). La reproducció automàtica es tria separadament; no forma part del codi. **ROSA** representa 6–8 mots, 100 % i pausa habitual. Les paraules dels codis són identificadors neutres, sense jerarquia de nivell ni etiquetes de rendiment.

Font immutable `content/rhythm-profiles-v1.json`, protocol `plec-rhythm-v1`, paquet generat `rhythm-profiles.js` i conversió pura a `rhythm-code.js`. El test fixa l’empremta de la matriu: no reassignar mai un codi existent a una combinació diferent. Una futura ampliació necessitarà codis nous o un protocol nou compatible amb els anteriors. Els codis de ritme són independents de les llavors, LL01/LL02, la veu, la llengua i les transcripcions. Els codis funcionen actualment a Frases; no s’afegeix una dependència a emmagatzematge local o serveis externs.

Proves: 36 conversions reversibles, invalidesa i normalització, codi dels ajustos finals després de canviar la pausa, còpia, recuperació en un context de navegador nou amb LL02 i sense les dades del primer, camps opcionals i instruccions compactes per al mòbil. No es genera cap àudio.

Validació de la versió 1.44: 59 comprovacions locals passades, incloses les 36 correspondències del protocol, la recuperació en un navegador nou, el codi final després de modificar la pausa, la còpia, els camps opcionals, les set marques de LL02 i la resta de funcionalitats de Plec. Cap nova petició de síntesi ni comprovació remota.


## Taula de noms i imatges · 1.45

Al preparador de **Frases**, l’enllaç **Codis de ritme** del sidebar dret obre la taula completa: tres pauses, quatre quantitats de mots i tres velocitats. Els 36 codis tenen una il·lustració SVG pròpia, mostrada també en aplicar un codi i al final del dictat. Objectes, plantes i paisatges sense jerarquia de rendiment; descartem persones i animals associables a rapidesa. Dibuixos originals de Plec a `assets/rhythm/`, sense dependències externes.

`content/rhythm-labels.json` separa la presentació del protocol numèric immutable. Els noms nous preferits substitueixen BOCA/NENA/NINA/LILA/PATI/GAT/GOS/CARGOL/BRISA per TAULA/LLAPIS/TASSA/PILOTA/TEST/CLAU/GOMA/BOLA/NOU. Els noms anteriors continuen acceptats amb exactament els mateixos valors. Si es canvia un nom en el futur, cal conservar-lo a `aliases` de la seva entrada i comprovar que no col·lideix amb cap altre perfil. Mai reassignar un nom publicat.

Amb `stage: "review"`, la taula permet suggerir un codi i una imatge per cel·la. Són propostes locals del docent: no modifiquen la font ni les preferències de l’alumnat. «Copia canvis» copia només les diferències com a text pla, amb ID estable i ajustos per revisar-les al xat; si falla el porta-retalls, ofereix el text seleccionat. Les propostes es conserven per revisió del catàleg en aquest navegador, separadament del reproductor. «Desfés les propostes» les elimina. Es rebutgen codis repetits o que reassignin un nom reservat. La descripció d’imatge és una idea editorial; no genera cap dibuix automàticament.

Un cop aprovats els noms i les imatges, integrar els canvis i posar `stage: "final"`: el mateix diàleg esdevé informatiu, sense camps editables ni còpia/exportació. Els codis d’alumnat no es desen ni depenen d’aquest esborrany docent. Cap petició de síntesi en aquesta iteració.

Validació 1.45: 60 comprovacions locals passades. Inclou la matriu immutable, els àlies anteriors, les 36 imatges, les propostes independents del reproductor, col·lisions de noms, persistència, còpia i alternativa manual, restabliment, focus de teclat, mòbil/tema fosc i estat final de només lectura. La comprovació nova s’ha repetit després de corregir l’espera de tancament del test i el títol de pausa breu detectat a la revisió visual. No s’ha comprovat el desplegament remot.

### Graella compacta · 1.45.1

Els tres blocs de pausa es mostren de costat en un diàleg ample, amb quatre files i tres velocitats per bloc. Cada cel·la només conté la imatge i el nom editable, sense vores ni descripció addicional. Les propostes anteriors es conserven; la còpia només inclou les diferències. En pantalles estretes s’alterna entre les pauses amb tres pestanyes, conservant una graella llegible. El mode final continua sent de només lectura.

Comprovat sense scroll a 1440×900, 1366×768, 1280×720 i 1024×768; revisió de pestanyes a 390/320 px, edició, còpia, recuperació de propostes i mode final. Passades també les comprovacions del protocol, generació de catàlegs i interfície castellana. Sense síntesi ni comprovació remota.

### Codis aprovats · 1.45.2

El docent ha aprovat els 36 codis i les seves imatges. `content/rhythm-labels.json` passa a `stage: "final"`, revisió `rhythm-labels-v1`, sense canviar cap correspondència. La taula és només informativa: s’han retirat el codi d’edició, la persistència de propostes, els botons de còpia/restabliment i els camps d’exportació. Les propostes antigues del navegador no es llegeixen ni alteren la taula. Es mantenen el disseny compacte, les pestanyes mòbils i una explicació breu d’ús. El botó de l’alumne per copiar el seu codi final continua disponible.

Validació local: matriu i àlies, 36 imatges i absència de controls d’edició/exportació, propostes antigues ignorades, graella sense scroll en ordinador, pestanyes mòbils/tema fosc, reproductor de Frases i generació coherent dels catàlegs. Sense síntesi ni comprovació remota.

## Catàleg de tria de textos · 1.46

Al mode Frases, «Canvia el dictat» obre un catàleg emergent de targetes amb títol, codi, nivell, nombre de mots i focus. Cerca per títol/codi sense distingir accents ni majúscules. Els focus disponibles es deriven dels textos de la llengua activa i es combinen amb OR: qualsevol dels seleccionats. No es mostren focus sense textos. Ara mateix LL01/LL02 treballen l·l. Es fan servir les etiquetes precises `focusLabels`, perquè el grup genèric `signes` del catàleg de mots no distingeix aquesta norma.

Triar una targeta actualitza el resum del sidebar, el full, l’enllaç i l’escaleta, conservant els ajustos de maquetació i de ritme. Reobrir mostra tot el banc, sense arrossegar cap cerca anterior ni emplenar-la amb el text triat. Els filtres no alteren els focus ni les llavors de paraules/pseudoparaules. Cap canvi en textos, àudios o identificadors publicats.

`text-picker.js` gestiona només el catàleg emergent; `text-mode.js` conserva la selecció i el full. Capçaleres/filtres fixos, scroll intern als resultats, focus de teclat i variants de mòbil/tema fosc. Les proves de filtratge amb diversos focus i banc ampli utilitzen dades efímeres al navegador; no publiquen textos ficticis.

Validació 1.46: 61 comprovacions locals passades. Cerca i selecció reals de LL01/LL02, filtres combinats sense duplicats, cap resultat/restabliment, resum/URL/PDF/escaleta, conservació dels ajustos, reobertura neta, creixement del banc i controls fixos, mòbil/tema fosc i regressions de la resta de Plec. Sense síntesi ni comprovació remota.

## Llegir abans de confirmar · 1.47

«Explora els textos» se situa al capdamunt del configurador de Frases. El diàleg presenta una llista compacta a l’esquerra i el text complet a la dreta. La llista inclou tres mots de mostra del focus; «Al full» identifica el dictat vigent i el contorn actiu identifica el text que s’està llegint. Cercar, filtrar o clicar textos només canvia una selecció provisional. «Fes servir aquest dictat» és l’única acció que aplica el text al preparador. Tancar o cancel·lar descarta aquesta selecció; reobrir recupera el dictat real del full, amb filtres nets.

El camp editorial `focusWords` de cada text enumera, per etiqueta precisa, els mots que es ressalten: 8 a LL01 i 7 a LL02. La lectura conserva íntegres els paràgrafs i la puntuació. Es marquen mots complets, conservant majúscules i accents, segons els focus filtrats. No es dedueixen els mots a partir del grup genèric `signes`. Les proves comproven que els mots existeixen al text i que es cobreixen els casos de l·l; els continguts, les escaletes, les autoritzacions i els àudios congelats no canvien.

Llista i lectura tenen scroll independent; capçalera, filtres i confirmació queden fixos. En mòbil i en pantalles baixes, la navegació és llista → lectura, amb retorn a la llista i confirmació visible. Les proves comproven la invariància del full i URL durant l’exploració/cancel·lació, l’aplicació explícita amb conservació dels ajustos, els ressaltats exactes, els filtres combinats i els dos scrolls.

Validació 1.47: 61 comprovacions locals passades, inclosa la invariància del full i URL abans de confirmar, la cancel·lació sense canvis, la confirmació amb preservació dels ajustos, els 8/7 mots ressaltats, els paràgrafs exactes, els filtres combinats, els scrolls independents, mòbil i paisatge, i els fluxos de PDF, escaleta i alumnat. Sense síntesi ni comprovació remota.

## Codificació i noves propostes · 1.48

Decisió docent del 26/11/2026: codis de text independents del focus, amb prefix de llengua i número correlatiu. `CA0001`, `CA0002`…; en castellà s’utilitzarà `ES0001`… El número té quatre xifres com a mínim i pot créixer (`CA10000`), sense representar ni dificultat, ni llargada, ni norma. Els focus són etiquetes separades i un text en pot tenir diversos. El codi es manté quan es corregeixen les etiquetes; un text diferent rep un número nou. Els noms dels pilots LL01/LL02 volien dir ela geminada i passen a mostrar-se com CA0001/CA0002. Els identificadors tècnics dels dos pilots, els arxius d’àudio i les autoritzacions congelades es conserven per identitat de producció; no es mantenen els antics codis impresos com a àlies. Els codis de ritme (ROSA, etc.) i les llavors de mots continuen sent sistemes independents.

| Codi | Text | Focus | Mots | Estat |
| --- | --- | --- | ---: | --- |
| CA0003 | Una parada a la plaça | b / v | 56 | Per validar |
| CA0004 | El mocador perdut | s / ss / c / ç | 60 | Per validar |
| CA0005 | Una gerra per a l’avi | g / j | 60 | Per validar |
| CA0006 | Una sortida amb previsió | Formes verbals i dièresi | 60 | Per validar |

Totes quatre tenen tres paràgrafs, fragments base i mots del focus anotats. Revisió independent superada el 26/11/2026 de les versions exactes registrades a `editorialReview.sourceSha256`, sobre codi/títol/nivell/focus/paràgrafs/frases/mots anotats. La validació docent es manté pendent per a cadascun dels textos. El catàleg els mostra amb «Text per validar»; no es pot iniciar el seu dictat oral. Es poden llegir amb ressaltats i preparar el PDF per revisar-lo.

Les escaletes tenen un registre independent (`content/prosody/index.json`): disposar d’un text per revisar no implica tenir una escaleta validada o àudio. La planificació inicial (actualitzada a la versió 1.49) recull els quatre textos i les seves empremtes, proposta de veu Aoede/català central i quatre ritmes. No conté cap petició ni aprovació de síntesi, i no és un lot executable. Després de validar cada text, preparar-ne l’escaleta, les locucions de puntuació amb la mateixa veu i el lot exacte amb estimació inferior a 6 min 30 s; caldrà l’aprovació explícita de text/veu/lot abans d’enviar res. No agrupar quatre textos complets amb quatre ritmes en una sola petició sense comprovar la durada.

Validació 1.48: 62 comprovacions locals passades. Sis codis coherents, recuperació al preparador i a l’entrada d’alumnat, identitat d’àudio dels dos pilots, quatre PDFs d’una pàgina en ambdós formats de plec, empremtes de revisió, mots anotats i ressaltats, combinació de formes verbals/dièresi sense duplicats i bloqueig del dictat oral pendent. La planificació no és executable ni té autorització de síntesi. Cap petició de síntesi ni comprovació remota.

## Escaletes per validar i codis curts · 1.49

El 27/11/2026 el docent confirma els quatre textos CA003–CA006 i demana codis de tres xifres. Els sis codis visibles passen a CA001…CA006; el prefix identifica la llengua i el número és independent dels focus. No es creen àlies dels codis beta de quatre xifres. Els identificadors tècnics i les preses publicades continuen intactes. `teacherReview` registra la validació i l’empremta del text, mentre `prosodyReview` continua pendent. La revisió editorial anterior conserva `codeAtReview` per comprovar la seva empremta original.

Cada text nou té quatre variants d’escaleta (2–3, 4–5, 6–8 i 9–12 mots), amb talls numerats, cobertura completa dels paràgrafs, locucions de puntuació i excepcions de llargada justificades. Revisió independent superada el 27/11 després de corregir el tall «passeja amb» de CA004 r23: ara «Dissabte, la Cèlia passeja» / «amb el seu cosí». La veu proposada és Aoede, català central, i la mateixa veu anunciarà la puntuació. Els textos no han canviat.

Accés: Frases → Explora els textos → Fes servir aquest dictat → Escaleta de prosòdia, al visor del full. Sense àudio, la comparativa és de lectura: no mostra reproductors ni controls per notificar errors d’una gravació inexistent. El PDF compara els quatre ritmes en tres A4 horitzontals, un per paràgraf; conserva la mida del text i redueix el marge entre fragments als paràgrafs més densos.

### Estimació i proposta de lots

`tools/prosody-estimate.cjs` és una eina local de planificació, sense client de xarxa ni claus. `--write` actualitza `audio/texts/batches/ca003-ca006-prosody-proposal-v1.json`; `prosody-planning.js` és el paquet generat per mostrar la durada al web. Es manté el càlcul dels pilots: 130 mots locutats/min per a la previsió nominal; 95 mots/min, pauses i factor 1,2 per a la previsió prudent. Compta les locucions de puntuació, pauses de gravació i separacions entre lectures; el temps d’escriptura de l’alumne no forma part de la síntesi.

| Lot proposat | Lectures | Previsió nominal | Previsió prudent | Reserva fins a 6:30 |
| --- | ---: | ---: | ---: | ---: |
| CA003 | 4 ritmes | 3:43 | 5:29 | 1:01 |
| CA004 | 4 ritmes | 3:53 | 5:44 | 0:46 |
| CA005 | 4 ritmes | 4:07 | 6:04 | 0:26 |
| CA006 | 4 ritmes | 4:05 | 6:00 | 0:30 |

Les setze lectures juntes sumarien 1.276 mots locutats i 140 avisos de puntuació: uns 15:49 nominals i 23:19 prudents. No caben en una petició amb el topall preventiu local de 6:30. La proposta conserva els quatre ritmes d’un mateix dictat junts i cobreix tots els textos en quatre lots, sense tallar-los ni repetir-los. Sota aquest càlcul prudent calen com a mínim quatre peticions. Les reserves no permeten afegir un altre text de llargada semblant amb tots quatre ritmes.

És una proposta per validar: no conté cos de petició, no s’ha comprovat encara el pressupost d’entrada d’un payload final i `synthesisAuthorized` continua fals. Validar els textos no equival a aprovar les escaletes ni a autoritzar l’enviament. Després de la validació d’escaletes cal congelar els lots exactes, comprovar-ne també l’entrada i obtenir la confirmació d’enviament. Cap petició nova en aquesta iteració.

Validació 1.49: 63 comprovacions locals passades. Cobertura exacta de les setze lectures, justificació de les excepcions, separació de paràgrafs, empremtes de revisió independent, càlcul contrastat amb els pilots, proposta de quatre lots dins del topall i un lot únic rebutjat per durada. Dotze pàgines PDF renderitzades i revisades, sense desbordaments; comparatives web, pressupost visible, PDF, mòbil/paisatge, pilots amb àudio i escaletes sense àudio verificats. Cap petició de síntesi ni comprovació remota.

## Quatre lots rebuts i navegació directa · 1.50

El 27/11/2026 el docent valida les quatre escaletes i autoritza explícitament una petició per CA003–CA006 amb Aoede, català central i els quatre ritmes, i la integració dels resultats. Les autoritzacions exactes, empremtes i estimacions són als fitxers `audio/texts/batches/ca003-four-rhythms-v1.json` fins a `ca006-four-rhythms-v1.json`. `prosodyReview` conserva l’aprovació i l’empremta de cada escaleta; `independentReview.statusAtReview` permet verificar la revisió editorial anterior al canvi d’estat.

S’han fet **exactament quatre enviaments**, seqüencials i sota el comptador compartit amb Sentit. CA006 ha patit una interrupció en consultar l’estat: s’ha recuperat la mateixa interacció amb l’ID persistent, mitjançant GET, sense repetir el POST. Les respostes originals i els justificants locals es conserven a `output/audio/<lot>/<empremta>/`. Ni l’alineació ni la preparació dels MP3 envien peticions de síntesi.

| Dictat | Durada total rebuda | Fragments r23 / r45 / r68 / r912 |
| --- | ---: | ---: |
| CA003 | 165,59 s | 21 / 11 / 9 / 6 |
| CA004 | 201,08 s | 21 / 13 / 9 / 6 |
| CA005 | 214,30 s | 23 / 14 / 8 / 6 |
| CA006 | 202,60 s | 24 / 13 / 10 / 6 |

Els setze MP3 són a `assets/audio/texts/ca/ca003-four-v1/` fins a `ca006-four-v1/`. `audio/texts/index.json` en registra la identitat, les empremtes i els intervals dels fragments. Cada rebut `*-receipt.json` detalla la durada, les correspondències del reconeixement local, els mots no reconeguts i els talls. La cobertura temporal del reconeixement **no valida la pronunciació**: tots els àudios continuen `pending-listening`, amb `pronunciationValidated:false`. La puntuació forma part de la mateixa presa amb Aoede.

### Talls i punts que cal escoltar

Es conserva tot el PCM rebut i no s’accelera ni s’alenteix la veu en preparar els MP3. Els límits es busquen en finestres de baixa energia entre marques locals de mots. CA004 r23 F4 connecta «Al costat» amb «de la font» sense la pausa sol·licitada: el rebut registra una frontera breu de baixa energia pendent d’audició. CA005 r23 F12–F13 connecta «deixen» i «la gerra» sense silenci separador; la frontera de reproducció és una estimació temporal amb pas per zero, **no un tall acústic validat**. La presa contínua no es modifica. També cal escoltar «l’obre al menjador» en r23 F21–F22 i r45 F13–F14: Vosk ho transcriu «l’obra el menjador». No es dona per fet que sigui un error de la veu ni del reconeixedor.

Aquestes propostes temporals de CA005 estan congelades a `ca005-four-rhythms-v1-timing-review.json`, vinculades a les empremtes de la presa i de la petició. No alteren el text ni impliquen aprovació auditiva. El reproductor i la comparativa permeten escoltar cada versió i comunicar incidències. Qualsevol regeneració necessita una nova autorització explícita.

### Tria des del sidebar

Els focus de Frases es mostren directament al sidebar esquerre, seguits dels dictats coincidents amb codi, títol i nombre de mots. Sense focus seleccionats es mostren tots; amb diversos focus es fa la unió (qualsevol dels seleccionats). Filtrar no canvia el full. «Fes servir» aplica un text directament; clicar-ne el títol obre opcionalment la lectura completa amb els mots del focus ressaltats. Tancar-la descarta la proposta; «Fes servir aquest dictat» la confirma. La configuració del plec es conserva i els filtres de paraules/llavors són independents.

El document conjunt de planificació continua sent de lectura (`planning-only`, sense payload executable). Les autoritzacions i el nombre d’enviaments reals es consulten als quatre lots i rebuts, no al comptador zero d’una eina que només calcula durades.

Validació 1.50: 63 comprovacions locals passades (62 en la passada completa i la prova del nou sidebar repetida satisfactòriament després de corregir el nom del focus al selector del test). Verificades les empremtes dels 24 MP3 de Frases, les cobertures i transicions de ritme, la càrrega dels setze àudios nous al navegador, les URL d’alumnat, l’aplicació explícita de la tria, la conservació del full en filtrar/llegir/cancel·lar, els PDFs i els panells en mòbil i tema fosc. Captures locals i PDF revisats visualment. Sense comprovació del desplegament remot; l’audició docent de les noves preses queda pendent.

## Propostes bilingües per completar els focus · 1.51

El 28/11/2026 el docent encarrega nous textos en català i castellà per cobrir els focus encara absents i validar-los abans de preparar la síntesi. CA007–CA012 completen els sis focus catalans pendents. ES001–ES012 són les primeres Frases en castellà, una per cada focus. El catàleg passa a dotze textos de cada llengua; només els sis catalans previs tenen àudio. La cobertura és de focus generals: cada text no pretén reunir totes les subgrafies o excepcions possibles.

| Codi | Títol | Focus | Mots |
| --- | --- | --- | ---: |
| CA007 | La ràdio de l’escola | Accentuació | 59 |
| CA008 | Un hort al pati | Amb h / sense h | 60 |
| CA009 | El carretó del jardí | r / rr | 62 |
| CA010 | Una guineu de paper | c / qu / g / gu / qü / gü | 63 |
| CA011 | La motxilla de diumenge | a / e · o / u àtones | 63 |
| CA012 | Una capsa de records | ll / ny / x / ix / tx / ig | 66 |
| ES001 | Una excursión en autobús | Con tilde | 65 |
| ES002 | Una visita al museo | Sin tilde | 64 |
| ES003 | El huerto de Hugo | h | 64 |
| ES004 | Un regalo tejido | g / j | 65 |
| ES005 | Una biblioteca viajera | b / v | 65 |
| ES006 | Una carrera en el patio | r / rr | 66 |
| ES007 | Un almuerzo en el parque | c / z / qu | 62 |
| ES008 | Una guía de animales | g / gu / gü | 65 |
| ES009 | La llave del cobertizo | ll / y | 64 |
| ES010 | Una casa de cartón | ñ / ch | 66 |
| ES011 | Un experimento en clase | x | 64 |
| ES012 | Un plan para el viernes | Formas verbales | 65 |

Els divuit textos tenen tres paràgrafs, registre de cicle superior i una llista editorial de mots ressaltats. Revisió independent de naturalitat, coherència narrativa i grafies superada abans de presentar-los com a provisionals. Les empremtes es calculen sobre els mateixos camps editorials que les peces anteriors. `teacherReview` continua pendent; `prosodyReview` indica `not-prepared` i `synthesis` `not-requested`. No hi ha plans nous a l’índex de prosòdia, cossos de petició ni autoritzacions de síntesi.

Accés: triar la llengua → Frases → filtrar per focus → clicar el títol per llegir el text complet amb ressaltats. Llegir i cancel·lar conserva el full; «Fes servir» en permet veure el preview i imprimir el model per revisar-lo. Els textos pendents no habiliten ni el dictat oral ni una escaleta inexistent. Recull complet en text pla: `content/review/frases-ca-es-2026-11-28.txt`.

La plantilla compartida admet ara català i castellà, amb els camps i les instruccions impreses corresponents, URL/QR de cada llengua i focus llargs ajustats a l’amplada del model. S’han preparat i comprovat els 36 PDFs dels divuit textos en les dues orientacions de plec. Els codis, àudios i aprovacions anteriors es conserven. Les escaletes i la preparació dels lots es faran després de la validació docent dels textos.

Validació 1.51: 64 comprovacions locals passades, incloses les proves de navegació de Frases repetides sobre el catàleg ampliat. Verificades la cobertura dels focus, les empremtes editorials, els mots ressaltats i les seves grafies, la separació de llengües, els models impresos, els bloqueigs d’aprovació/àudio i la navegació amb mòbil i tema fosc. La llista del sidebar té scroll intern limitat per conservar espai per als filtres i la configuració. Cap síntesi ni comprovació remota del desplegament.

## Textos validats, 72 escaletes i proposta de 18 lots · 1.52

El 28/11/2026 el docent valida CA007–CA012 i ES001–ES012 i encarrega les escaletes i propostes de lots abans d’autoritzar síntesi. `teacherReview` registra l’aprovació i l’empremta exacta dels paràgrafs, que no han canviat. `prosodyReview` continua pendent i `synthesis` no encarregada. Les divuit escaletes tenen quatre ritmes aproximats (2–3, 4–5, 6–8 i 9–12 mots), amb cobertura exacta, puntuació locutada en la llengua del text i excepcions de llargada visibles.

Revisió editorial independent de totes les variants superada. Els talls conserven locucions com «al costat dels arbres», «detrás de la montaña», «por detrás de un árbol», «cerca de la puerta» i «deje de llover». Els ritmes grans agrupen dins de cada frase; les excepcions permeten conservar unitats de sentit més llargues o tancar una frase més curta. Alguns grups de r23 tenen quatre o cinc mots i alguns de r912 catorze o quinze: són ajustos editorials explícits, no límits ocults. Les empremtes de revisió identifiquen les versions finals exactes.

La proposta conserva els quatre ritmes del mateix text dins d’una única petició: sis lots de català central i dotze d’español de España. Aoede és la veu proposada per a totes dues llengües, amb el mateix ritme base entre versions i les locucions de puntuació integrades a la mateixa presa. En castellà es locutaran «Coma», «Punto y seguido», «Punto y aparte» i «Punto final»; no s’hi reutilitzen locucions catalanes.

| Text / lot proposat | Nominal | Prudent | Reserva fins a 6:30 |
| --- | ---: | ---: | ---: |
| CA007 | 4:03 | 5:59 | 31 s |
| CA008 | 4:05 | 6:02 | 28 s |
| CA009 | 4:00 | 5:55 | 35 s |
| CA010 | 4:10 | 6:08 | 22 s |
| CA011 | 4:09 | 6:08 | 22 s |
| CA012 | 4:12 | 6:13 | 17 s |
| ES001 | 4:08 | 6:06 | 24 s |
| ES002 | 4:11 | 6:10 | 20 s |
| ES003 | 4:06 | 6:04 | 26 s |
| ES004 | 4:09 | 6:07 | 23 s |
| ES005 | 4:08 | 6:06 | 24 s |
| ES006 | 4:02 | 5:58 | 32 s |
| ES007 | 4:03 | 5:58 | 32 s |
| ES008 | 4:07 | 6:05 | 25 s |
| ES009 | 4:04 | 6:01 | 29 s |
| ES010 | 4:10 | 6:09 | 21 s |
| ES011 | 4:02 | 5:58 | 32 s |
| ES012 | 4:12 | 6:12 | 18 s |

Estimacions amb 130 mots locutats/min nominals, 95 mots/min prudents, pauses i factor 1,2. Tots els lots queden per sota de 390 s en l’estimació prudent. Són estimacions de durada, no una garantia del proveïdor. El límit inferior teòric per temps pot ser menor si es redistribueixen lectures entre peticions; la proposta prioritza mantenir les quatre variants de cada text juntes. El pressupost d’entrada del payload encara no està comprovat: es verificarà en congelar els encàrrecs després de la validació docent.

L’índex `audio/texts/planning-index.json` agrega les dues propostes noves i la planificació històrica de CA003–CA006. `tools/prosody-estimate.cjs --proposal=ca007-ca012 --write` i `--proposal=es001-es012 --write` recalculen les propostes locals. El comandament per defecte conserva l’abast CA003–CA006; afegir textos validats al catàleg no n’amplia implícitament l’encàrrec. El generador del web rebutja registres de planificació amb autorització o cos executable. Les propostes mantenen `synthesisAuthorized:false`, `newRequestsSent:0`, `inputBudgetValidated:false` i `requestBody:null`.

Accés: Frases → triar text → Escaleta de prosòdia (a la cantonada del preview). Els plans sense àudio són només de lectura, sense reproductors ni controls per marcar errors d’una gravació absent. «Proposta de lots» mostra una taula del conjunt de la llengua; «PDF de l’escaleta» exporta tres A4 horitzontals per text. La comparativa i les locucions es mostren en català o castellà segons la llengua. Reculls: `content/review/escaletes-ca-es-2026-11-28.txt` i `lots-prosodia-ca-es-2026-11-28.txt`.

Cap petició de síntesi en aquesta iteració. Cal validar les escaletes, la veu proposada i els lots abans de preparar l’enviament exacte.

Validació 1.52: 64 comprovacions locals passades, sense errors. Revisades les 72 variants pendents, les 54 pàgines PDF, les empremtes editorials i d’aprovació de text, les locucions en cada llengua, els 18 lots amb quatre lectures i els topalls temporals. Verificades al navegador les comparatives de lectura sense àudio, les taules de lots, la descàrrega de PDF i la navegació de les dues llengües. Els sis pilots i els seus àudios conserven les empremtes anteriors. Cap síntesi ni comprovació remota del desplegament.

## Producció autoritzada de divuit lots · 1.53

El 28/11/2026 el docent valida les escaletes i autoritza explícitament Aoede, els quatre ritmes i els divuit lots CA007–CA012 / ES001–ES012. Les metadades passen a `prosodyReview:approved` i `synthesis:approved`. Les empremtes dels textos i talls editorials no canvien; la revisió independent conserva l’estat del pla en què es va fer. El compilador `tools/prosody-approved-batch.cjs` comprova les aprovacions i congela el cos de cada petició. Entrada estimada entre 6.016 i 7.037 tokens i durada prudent entre 355 i 373 segons, per sota dels topalls preventius de 7.900 tokens i 390 segons.

Les autoritzacions executables són els divuit `audio/texts/batches/*-four-rhythms-v1.json` i la cua `ca007-es012-production-v1.json`. Els documents `*-prosody-proposal-v1.json` continuen sent resums de planificació sense cos executable: `approved-planning` indica que el docent ja ha validat el pla, no que s’hagi rebut tot l’àudio. La taula del web diferencia els àudios disponibles dels que s’estan preparant.

### Quota i recuperació

Una única petició nova per lot, amb almenys 120 segons entre POST i un màxim compartit de deu peticions per dia de quota (`America/Los_Angeles`). El registre i el lock de peticions es comparteixen amb Sentit. El 29/11/2026 el canvi de dia de quota és a les 08:00 UTC, 09:00 a la península. Cap petició extra de prova ni regeneració queda inclosa en aquest encàrrec.

`node tools/run-phrase-production.cjs --run-authorized-queue --today` processa només la quota disponible del dia. Sense `--today`, espera el restabliment abans de continuar. L’estat és a `output/audio/phrase-production-v1/status.json`; el lock propi evita dos executors de la mateixa cua. La resposta i l’ID es conserven abans de la recuperació. Un intent previ no rebut, errors HTTP o format desconegut aturen l’enviament per revisar-los; mai es torna a enviar una petició amb resultat ambigu. Els CA008, CA012 i ES001 s’han recuperat de les respostes desades, sense repetir-los: contenidors amb marc PCM inicial de 10, 30 i 100 ms, respectivament. La recuperació conserva totes les mostres i elimina només les metadades del contenidor.

### Integració local i publicació

`tools/local-prosody-align.cjs` obté marques de temps locals amb Vosk: model català `vosk-model-small-ca-0.4` i castellà `vosk-model-small-es-0.42`. El model castellà petit és Apache 2.0, obtingut de la [llista oficial de models Vosk](https://alphacephei.com/vosk/models); no es publica amb el web. Les empremtes de model, presa, petició i pla es registren en el rebut. Les marques ASR són una ajuda temporal, no una validació de la pronunciació.

`tools/prepare-prosody-pilot.cjs --batch=ID` exigeix cobertura local suficient, identitat exacta de presa/pla i fronteres segures. Genera quatre MP3 mono de 24 kHz i 64 kbit/s a `assets/audio/texts/ca/` o `assets/audio/texts/es/`. La durada total i els intervals de mots es conserven, sense accelerar la veu. Els rebuts i `audio/texts/index.json` s’integren al web amb `tools/build-catalogs.cjs`. Els àudios són sempre `pending-listening` i `pronunciationValidated:false`. El docent els pot revisar a Escaleta, marcar talls i copiar les observacions; cap correcció automàtica implica una nova síntesi.

La publicació és progressiva, després de comprovar empremtes, cobertura, descodificació dels MP3, navegació i reproducció locals. No es comprova el desplegament remot: ho fa el docent.

Per continuar sense intervenció entre dies: `node tools/run-phrase-production.cjs --run-authorized-queue --publish`. Aquest comandament manté un procés local, espera el dia següent en intervals curts i, per cada lot rebut, alinea, comprova i publica. No és un servei remot: necessita l’ordinador encès, connexió i el procés viu. Si s’atura l’equip, es pot reprendre la mateixa cua: les preses ja rebudes no es tornen a sintetitzar. Un error ambigu requereix revisió abans de reprendre.

`tools/publish-phrase-batch.cjs --batch=ID --publish` integra només una presa aprovada. Comprova la branca `main`, rebutja canvis de treball aliens o un índex Git preexistent, limita els fitxers que prepara al lot i als manifests/HTML generats, i canvia la clau de memòria cau segons l’empremta del registre. Comprova empremtes, PDF i les metadades reals dels quatre MP3 al navegador abans del commit i push. Les publicacions completes es reconeixen sense tornar a executar proves ni fer peticions de síntesi. Una fallada de publicació atura la cua i conserva els àudios.

Primera integració: CA007–CA012, 24 MP3, amb les 65 comprovacions de la suite anterior superades i una comprovació nova de 24 càrregues MP3 reals i accés al reproductor. La suite passa a 66 comprovacions. Les quatre variants de cada text continuen pendents d’audició docent.
