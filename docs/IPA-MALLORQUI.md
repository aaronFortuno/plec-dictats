# Preparació de la pronunciació mallorquina

Estat del 26/10/2026: **propostes incompletes i pendents de contrast lingüístic**, amb **Palma com a referència editorial formal/didàctica**. Després de la preparació inicial fora de línia s’ha autoritzat i generat una mostra de 18 mots amb Joana, Alba i Enric. No s’ha seleccionat encara cap veu definitiva ni activat àudio mallorquí públic. El catàleg publica les propostes IPA disponibles, deixa els buits en blanc i indica «En procés» a la reproducció. Vegeu la [guia pública de criteris](https://plec.ortogra.fi/ca/pronunciacio/) i el [registre de decisions dels tres perfils](DECISIONS-FONETIQUES.md).

## Dades preparades i consulta

El perfil `ca-mallorcan-didactic-v1` té les mateixes **3.299 grafies i identitats** que els altres perfils. La font editable és [mallorcan-didactic.tsv](../audio/pronunciation/ca/mallorcan-didactic.tsv); [el JSON](../audio/pronunciation/ca/mallorcan-didactic.json) i [el text de les propostes](../audio/pronunciation/ca/mallorcan-didactic-ipa.txt) són exportacions.

| Cobertura | Amb proposta IPA | Sense decisió lèxica |
| --- | ---: | ---: |
| Banc complet | 2.889 | 410 |
| Vocabulari bàsic | 291 | 59 |

**Cap IPA no està marcada com a validada.** Els buits són intencionats: falta decidir el timbre d’una vocal mitjana i no s’ha importat ni transformat la IPA central o valenciana per omplir-los. També cal revisar els resultats que el conversor sí que pot proposar; que una regla produeixi una resposta no en demostra la correcció lèxica.

La [cua de revisió](../audio/pronunciation/ca/mallorcan-review-queue.json) reuneix les 350 formes bàsiques amb la seva proposta o absència i tots els casos pendents. El [text pla dels pendents](../audio/pronunciation/ca/mallorcan-pending.txt) permet revisar els buits alfabèticament. La validació docent de la **selecció de vocabulari** bàsic no aprova aquestes transcripcions, els seus focus ni cap enregistrament.

## Referència lingüística i decisions

El model de partida conserva la **vocal neutra tònica** en els casos que la requereixen. Aquesta opció no engloba totes les localitats mallorquines: Alaró, Binissalem i Lloseta tenen altres realitzacions. Les pistes de [mallorcan-vowel-hints.json](../audio/pronunciation/ca/mallorcan-vowel-hints.json) es limiten a exemples explícits i dues flexions assenyalades com a propostes editorials. [UIB · vocal neutra tònica](https://galmic.uib.cat/fitxa/vocal-neutra-en-posicio-tonica/), [EBAP · fonètica B2, pàgines 2–3](https://ebapenobert.caib.es/pluginfile.php/4111/mod_resource/content/6/2%20Fon%C3%A8tica%20%282025%29.pdf).

La referència de Palma exclou el sistema vocàlic general de Sóller i fixa un compromís coherent; no descriu tots els parlants, generacions o registres de Palma. Les 410 decisions lèxiques no es resolen només escollint ciutat: cal una pista justificable per mot. L’autor no és parlant nadiu balear; la seva escolta és una primera comprovació, no una validació dialectal completa. L’IPA permet més detall que el que representem: la nostra transcripció ampla i el subconjunt del motor són limitacions diferents.

La branca mallorquina conserva generalment la **o àtona** i aplica harmonització davant una i o u tònica. Sóller segueix una altra distribució. La documentació UIB descriu variació i excepcions lèxiques: no es pot convertir tota o en u ni aplicar el procés invers. L’adaptació explicita `cobert` i `obert` amb u inicial; la resta d’excepcions i l’harmonització de mots llargs encara necessiten revisió. [UIB · neutralització o/u](https://blocs.uib.cat/galmic/fitxa/neutralitzacio-o-u-atones/).

Es conserva la distinció **b/v** amb el fonema /v/. El perfil no la substitueix per /b/ perquè un motor de síntesi no la documenti. [UIB · distinció entre b i v](https://galmic.uib.cat/fitxa/pronuncia-de-la-fricativa-labiodental-sonora-v-distincio-entre-b-i-v/).

S’ha incorporat la **geminació intervocàlica de bl/gl** al resultat del conversor. És una característica descrita per a aquests parlars formals, independent de la decisió didàctica de remarcar una l·l. La notació `b.bl` o `g.gl` conserva la frontera sil·làbica sense afegir una vocal. [UIB · grups bl i gl](https://blocs.uib.cat/galmic/fitxa/els-grups-bl-i-gl/).

L’inventari és ampli i orientat a síntesi, no una transcripció fonètica estreta: no descriu tots els al·lòfons dentals, velars o les assimilacions entre mots. S’eviten canvis col·loquials sistemàtics com la iodització general de ll. Es mantenen els hiats formals i l’accent de formes de subjuntiu amb dièresi es tracta explícitament. **Les decisions de dicció didàctica s’han de revisar separadament de la varietat**: conservar nt, nc o mp en un mot aïllat no autoritza a fer sonar qualsevol lletra muda ni a presentar tota consonant final com a normativa. La h muda i les u mudes continuen mudes.

## Procedència del generador i límits coneguts

`tools/mallorcan-g2p.cjs` utilitza la branca independent `ca-XB` de [catalan2ipa](https://github.com/Connum/catalan2ipa), ja inclosa amb la seva llicència LGPL. No reutilitza les transcripcions centrals o valencianes ni les seves 415 pistes de vocal mitjana. Comparteix únicament la normalització tècnica de símbols i el validador estructural.

Queden especialment pendents:

- **Vocals mitjanes i neutra tònica lèxiques**: 410 absències i els timbres deduïts per les regles generals. Per exemple, `escola` continua sense proposta; no se n’ha triat una a l’atzar.
- **Harmonització més enllà de la síl·laba immediata i compostos**: la branca només modifica la o immediata davant la síl·laba tònica amb i/u. Per exemple, proposa `ko.lu.ˈmi` per a `colomí`, però EBAP documenta l’opció harmònica `ku.lu.ˈmi`. Cal decidir-ne l’abast lèxic coherent abans d’un lot.
- **Excepcions a/e àtones**: el model de regles no resol totes les es radicals o els finals en -ec que poden conservar un timbre. No s’han aplicat excepcions massives sense contrast.
- **Formes verbals i homògrafs**: compartir la grafia no implica compartir paradigma ni pronúncia local. Les grafies del banc no s’han convertit en una edició morfològica mallorquina, i les propostes verbals requereixen contrast específic.
- **Realització auditiva**: acceptar una cadena IPA no garanteix accent, durada de la geminada, consonants finals ni una locució mallorquina natural. Una veu `ca-ES` tampoc no esdevé mallorquina simplement canviant-ne l’etiqueta.

## Compatibilitat amb la síntesi i ordre de continuació

**386 propostes contenen /v/**, absent de l’[inventari ca-ES publicat per Microsoft](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets). Es conserven als documents lingüístics. Les 2.503 propostes restants passen l’inventari tècnic estricte del projecte, cosa que no les valida lingüísticament ni auditivament. Les **138 propostes amb neutra tònica** són una prioritat especial d’una futura prova de veu.

1. Resoldre els **59 buits dels mots bàsics** i contrastar les 291 propostes bàsiques, amb fonts lèxiques mallorquines i revisió de timbres, accent verbal i excepcions.
2. Revisar els altres buits i les limitacions sistemàtiques abans de considerar complet el corpus.
3. Preparar una mostra curta i separada amb neutra tònica, o àtona/harmonització, b/v, bl/gl, l·l, hiats i finals. Escollir la veu escoltant-la; la compatibilitat de símbols és només un filtre tècnic.
4. Estimar el text facturable i configurar un pressupost abans d’autoritzar un lot. Congelar la IPA i assignar un ID de paquet propi quan hi hagi una proposta aprovada per sintetitzar.

No cal consumir crèdit ni canviar de pla d’Azure per revisar o completar aquestes dades.

### Estimació fora de línia de caràcters

Amb `prosody rate="-10%"` i un `phoneme` per mot, el contingut SSML de les propostes disponibles representa **252.743 caràcters per a 2.889 mots**. El subconjunt de **291 bàsics amb IPA** representa **24.697 caràcters**. El recompte inclou `prosody`, `phoneme`, atributs i contingut amb l’escapament XML aplicat, comptant punts de codi Unicode; exclou `speak` i `voice`, com el planificador del projecte.

És una estimació de dades, **no un pla executable, una reserva de quota ni una previsió del corpus complet**: no inclou els 410 buits, reintents o proves de veu. Els mots amb /v/ s’hi compten sense fer-los passar per una política valenciana ni alterar l’inventari. `mallorcan-review-queue.json` conserva les estimacions reproduïbles. Qualsevol canvi d’IPA o de SSML requereix recalcular-les; la compatibilitat i la validació de la veu són passos independents.

### Candidats per a una primera mostra

La [selecció de 18 mots](../audio/pronunciation/ca/mallorcan-pilot-candidates.json) és una proposta de revisió, **sense veu, paquet executable ni peticions**. Prioritza mots bàsics quan n’hi ha: 10 dels 18 ho són, marcats en negreta a la taula. Les transcripcions són les propostes de la taula, encara pendents de contrast.

| Què es vol escoltar | Mots candidats |
| --- | --- |
| Neutra tònica | **abella**, **ceba**, **pera** |
| O àtona conservada / harmonització | **xocolata**, **conill**, **formiga** |
| Distinció b/v | **barca**, **vaca** |
| Geminació bl/gl | amable, arreglar |
| Hiats i accent amb dièresi | atapeït, canviïn |
| Finals mp/nc/nt | camp, **banc**, guant |
| L·l explícita | **col·legi** |
| Accent verbal i nasal velar | passàvem, brànquia |

El contingut SSML estimat d’aquesta mostra és de **1.536 caràcters per una única veu i una sola versió de cada mot** amb els mateixos criteris anteriors. Comparar dues veus duplicaria les peticions previstes, i els reintents s’hi afegirien. Que una mostra càpiga en el marge local no la converteix en una síntesi autoritzada ni resol /v/, neutra tònica o validació auditiva: cal preparar després la prova concreta amb la seva veu i pressupost.

## Comprovacions i edició

### Mostra generada · 26/10/2026

S’han generat **54 MP3: 18 mots × Joana, Alba i Enric**, amb les mateixes IPA i ritme −10 %. S’han reservat 4.608 caràcters; la generació ha acabat sense reintents. Els fitxers es conserven localment a `output/audio/ca-mallorcan-palma-<veu>-pilot-v1/` i es poden comparar a [la pàgina local](http://127.0.0.1:4176/output/audio/comparacio-mallorqui.html).

La [instantània de propostes](../audio/pronunciation/recordings/ca-mallorcan-palma-pilot-v1.json) i el [resultat tècnic](../audio/pronunciation/recordings/ca-mallorcan-palma-pilot-v1-result.json) conserven identitat i SHA-256. Els 54 MP3 s’han descodificat sense errors: mono, 24 kHz i durades d’1,536–2,232 s. **Cap està aprovat auditivament ni seleccionat com a veu mallorquina definitiva.** L’acceptació de /v/ i de neutra tònica en una petició no n’acredita la realització sonora.

`node tools/run-mallorcan-pilot.cjs` simula; la generació requereix `--execute --confirm-f0`, pressupost compartit, cap STOP ni lot anterior actiu, i no canvia el topall de 450.000. No forma part de la porta de qualitat. `tools/verify-mallorcan-pilot.cjs` verifica només els fitxers locals de la mostra, sense síntesi; no és una comprovació exigible en un clon sense aquests MP3.

### Dades i regressions

```text
node tools/pronunciation-table.cjs --profile ca-mallorcan-didactic-v1
node tools/pronunciation-table.cjs --profile ca-mallorcan-didactic-v1 --export
node tools/pronunciation-table.cjs --profile ca-mallorcan-didactic-v1 --check
node tools/mallorcan-g2p.cjs --export-review
node tools/mallorcan-g2p.cjs --fill-missing
node tools/check-mallorcan-g2p.cjs
```

El generador només completa buits quan en pot preparar una proposta i **conserva qualsevol IPA ja present**. La taula TSV és la font d’edició; el JSON i el TXT s’actualitzen amb l’exportador general i la cua amb `--export-review`. Cap error de programari es converteix silenciosament en una absència lingüística: només el dubte explícit de vocal mitjana deixa un buit.

Les proves comproven cobertura i ID, estats no validats, exportacions reproduïbles, separació dels perfils i exemples independents de les fonts: neutra de cera/pera/ple/fred, v de vi/passàvem, o àtona de paràbola, geminació de bl, hiats i accent de dièresi. Ni les proves ni l’exportació fan peticions de síntesi.
