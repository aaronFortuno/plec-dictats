# Revisió de la pronunciació

24 d’octubre de 2026. L’usuari accepta el ritme de la mostra amb Alba a −10%, però detecta accent tònic incorrecte a «atapeït» i problemes a «conduïdes». Confirma que «canviïn» sona bé. Això no valida automàticament cap altra forma amb dièresi.

## Política provisional

S’ajornen els 227 mots que contenen ï o ü (també es detecten en Unicode descompost). Es generen les 3.072 paraules restants. El criteri és la grafia real, no l’etiqueta de focus: les etiquetes poden solapar-se. No es modifiquen ni el catàleg ni la selecció que representa un codi. Les pseudoparaules no formen part d’aquest lot.

`audio/manifest.json` fixa `generationPolicy.excludeDiaeresis: true`. El pla i el manifest local de resultats indiquen les formes ajornades. Els MP3 de la primera mostra es conserven per comparar, però cap mot amb dièresi s’incorpora a aquest lot, encara que ja tingui un fitxer de prova. El registre docent és a `audio/review-ca-central-alba-v1.json`.

Un àudio sintetitzat i descodificable no equival a pronunciació revisada. Els resultats continuen a `output/`, pendents de revisió, sense activar el manifest públic ni publicar milers de fitxers.

## Excepcions de pronunciació: següent prova

Azure admet l’element SSML `phoneme`, i publica una taula de fonemes IPA per a `ca-ES`. Permet indicar sons i accent tònic. Cal marcar les fronteres de les síl·labes correctament: la documentació avisa que la interpretació del signe d’accent pot canviar si no s’indiquen totes les síl·labes. La primera prova pendent serà una comparació curta amb «atapeït», conservant la grafia original dins de l’element i canviant només la pronunciació enviada al servei. No s’ha executat encara. [Fonemes i accent](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-pronunciation#phoneme-element), [inventari català](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets#ca-es).

Com a alternativa existeix `sub alias`, que permet pronunciar un text alternatiu mantenint el text escrit original al SSML. Un alias amb accent gràfic artificial és una hipòtesi que requereix escolta; no s’aplicarà automàticament a tots els mots amb dièresi. Els mots amb ü de «qüestió» o «aigüera» tampoc no es resolen amb una regla general d’accentuació. [Element sub](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-pronunciation#sub-element).

Les excepcions aprovades necessitaran metadades separades per ID i paquet, amb la versió de la petició i revisió docent. Les proves es faran en fitxers separats per comparar-les amb l’original, sense sobreescriure un àudio anterior ni alterar la grafia que s’avalua.

## Taula IPA preparada: 227 mots

La font editable és [ca-central-diaeresis.tsv](../audio/pronunciation/ca-central-diaeresis.tsv), en UTF-8, ordenada alfabèticament i amb un mot per fila. Es pot obrir en un editor de text o importar-la en un full de càlcul amb separador de tabulació. Les columnes són `mot`, `ipa`, `estat`, `base`, `lema`, `fonts`, `notes` i `id`. Cal conservar les tabulacions i els ID. Les metadades i la mostra proposada són a [ca-central-diaeresis.json](../audio/pronunciation/ca-central-diaeresis.json).

Són **propostes editorials de català central formal, pendents de prova amb Azure**. `prepared` indica que la proposta està preparada per a la prova, no que l’àudio hagi estat validat. `needs-review` afegeix un dubte lingüístic pendent. Les sis formes amb dubtes són «aïrades», «aüixar», «argüeix», «argüint», «argüir» i «reïfica»; el motiu concret consta a cada fila. Cap forma té revisió auditiva IPA aprovada encara.

La columna `base` diferencia el contrast del mot exacte (`dictionary-word`), el contrast del lema amb una flexió o derivació editorial (`dictionary-lemma`), l’aplicació de regles (`normative-rule`) i una proposta que necessita més contrast (`editorial-proposal`). No es presenta una forma flexionada com si tingués una transcripció de diccionari pròpia quan només s’ha consultat el lema. El contrast s’ha fet amb les pronunciacions del diccionari català-anglès de diccionari.cat, el DCVB de l’IEC i les regles de l’OIEC; no s’ha importat cap diccionari complet. Les referències concretes són a cada fila.

S’han comprovat les grafies exactes: una adreça sense dièresi pot retornar un altre mot. Les entrades «reina», «roina» i «esglai» de diccionari.cat **no** s’utilitzen com a referència per a «reïna», «roïna» i «esglaï». Per a «intuïtiu», el [DCVB](https://dcvb.iec.cat/results.asp?word=intuitiu) confirma l’accent a «tiu», davant d’una discrepància amb una altra font. La família d’«argüir» conserva un dubte explícit sobre la realització de g entre fonts.

### Notació i preparació fora de línia

`ˈ` precedeix la síl·laba tònica; `.` separa **totes** les síl·labes, com demana Azure per interpretar l’accent. La dièresi no implica sempre accent tònic: «atapeït» és `ə.tə.pə.ˈit`, «conduïdes» és `kun.du.ˈi.ðəs` i «canviïn» és `ˈkam.bi.in`. Tampoc no es converteix qualsevol ü en w: «aigüera» i «argüir» tenen estructures diferents. S’utilitza l’inventari IPA de Microsoft per a `ca-ES`, amb les convencions consonàntiques compatibles de la [GIEC](https://giec.iec.cat/textgramatica/codi/1.4).

```text
node tools/check-pronunciations.cjs
node tools/prepare-ipa.cjs
node tools/prepare-ipa.cjs --write
```

El primer comprova cobertura dels 227 mots, correspondència amb la instantània immutable, ID, grafies, inventari, separació sil·làbica, accent, fonts i regressions. No certifica la correcció lingüística ni la resposta real d’Azure. El segon calcula el pla sense desar-lo; `--write` desa els 227 SSML a `output/audio/ipa/plan.json`, amb recompte conservador de caràcters incloent el marcatge intern. **Cap d’aquestes ordres carrega credencials ni fa peticions de síntesi.**

Cada petició candidata té aquesta estructura, conservant el mot original:

```xml
<prosody rate="-10%"><phoneme alphabet="ipa" ph="ə.tə.pə.ˈit">atapeït</phoneme></prosody>
```

El pla de 227 té `executable: false` i totes les revisions auditives pendents. No s’envia automàticament al servei: abans cal escoltar una mostra i resoldre els dubtes. El generador ja admet IPA amb les mateixes proteccions de quota i represa, provades en els lots petits descrits més avall. El paquet candidat `ca-central-alba-ipa-v1` té una ruta diferent del paquet original. No s’ha modificat `audio/manifest.json` ni els MP3 de comparació originals.

La primera mostra proposada és de vuit mots: **atapeït, conduïdes, agraïm, canviïn, aigüera, qüestió, raïm i increïble**. Cobreix accent final i intern, hiat tònic i àton, ü amb w i geminació. Cal comprovar-hi dicció natural i accent abans d’enviar la tanda completa. Després de generar-los, els MP3 continuaran pendents de revisió docent abans de publicar-los.

## Revisió de mots sense dièresi i entonació

L’usuari ha detectat també alguns mots sense dièresi amb accent o entonació dubtosos. No s’interpreta el lot de 3.072 com a validat. La taula [ca-central-review.tsv](../audio/pronunciation/ca-central-review.tsv) permet anotar cada mot i el problema concret a mesura que s’escolti; inclou «lil·liputenc», «paguessin» i «passàvem». No modifica el catàleg ni substitueix cap MP3.

Separarem **sons i accent tònic** de **l’entonació de paraula aïllada**. Per als primers, prepararem una proposta IPA amb totes les fronteres sil·làbiques. Si el problema és una entonació que sembla quedar a mitja frase, compararem també el text com a frase autònoma, per exemple `<s>mot.</s>`, i la mateixa prova amb IPA. Azure documenta els elements de frase i l’efecte de la puntuació; això no garanteix per si sol que la veu resolgui el cas. [Estructura SSML](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-structure).

Les variants es generaran en una mostra separada, conservant l’original per comparar i sense canviar la grafia del mot. Només una escolta docent que confirmi accent, sons i entonació permetrà aprovar la substitució. No es regenerarà tot el corpus preventivament. La mostra didàctica de nou mots s’encua després de mots i instruccions; els vuit casos de dièresi proposats continuen com a prova posterior pendent.

## Geminació i consonants finals: incidència del 24/10/2026

El docent demana una **l·l més perceptible, com una ela contínua més llarga**, i assenyala «lil·liputenc» perquè li sona aproximadament «liliputen». També detecta terminacions en t o c poc perceptibles en altres mots, encara sense llista concreta. Es registra la percepció; no s’atribueix automàticament el defecte a tots els mots d’aquests grups.

Per al model didàctic provarem una geminació explícita `l.l`, sense pausa entre síl·labes, sense convertir-la en `ʎ` (ll) i sense afegir vocals. L’IEC explica que la geminació allarga el so entre dues síl·labes, però també que la simplificació a l simple és habitual en molts parlars fora dels registres molt formals. Buscar una geminació més marcada és aquí una elecció didàctica; no converteix qualsevol pronúncia simple en un error. [Secció Filològica de l’IEC](https://sf.iec.cat/apunts_llengua/apollo-i-el-vol-del-punt/).

Les oclusives finals requereixen una distinció: en català central hi ha simplificació de grups com -nt i -nc. Per exemple, el diccionari transcriu «blanc» amb nasal velar final, sense k. Inicialment es va proposar conservar aquesta simplificació a la mostra. **El docent ha aclarit després que vol les oclusives audibles en aquest model didàctic**, també en -nt i -nc. La mostra actual adopta aquest criteri: «blanc» i «lil·liputenc» acaben amb ŋk, i «gent» amb nt. És una dicció didàctica explícita, identificada al paquet i a la pàgina de comparació; no es presenta com una correcció de la pronúncia central espontània. No s’afegeixen vocals finals ni s’aplica una regla de fer sonar totes les lletres: la h muda i la u muda de gu/qu es mantenen mudes. [GEIEC, fenòmens consonàntics](https://geiec.iec.cat/text/2.3), [blanc](https://www.diccionari.cat/catala-angles/blanc), [gent](https://www.diccionari.cat/catala-angles/gent).

La [mostra de nou mots](../audio/pronunciation/ca-central-gemination-finals.json) proposa **col·legi, metàl·lic, lil·liputenc, llit, poc, blanc, gent, paguessin i passàvem**, amb IPA, fonts, ID i observacions. «Lil·liputenc», «paguessin» i «passàvem» han estat assenyalats individualment pel docent; els altres són controls, no àudios declarats incorrectes. La transcripció de «lil·liputenc» conserva un dubte explícit de contrast lexicogràfic, especialment del timbre tònic. Les propostes dels verbs parteixen del lema i la flexió, sense presentar-les com si fossin transcripcions exactes publicades. «Blanc» i «gent» indiquen l’ajust didàctic respecte de la font. L’efecte real de `l.l`, nt i ŋk necessita escolta i no es dona per garantit.

El docent sent aproximadament «pagasín» i «passavém». Les grafies del banc ja són correctes. Fixem **pa-GUES-sin**, `pə.ˈɣe.sin`, i **pa-SSÀ-vem**, `pə.ˈsa.βəm`; totes dues són planes. La u de gu continua muda i la e àtona final de «passàvem» continua neutra en aquest model central. [Conjugació de pagar](https://www.softcatala.org/conjugador-de-verbs/verb/pagar/), [conjugació de passar al DIEC](https://dlc.iec.cat/Verbs?IdE=0006304).

```text
node tools/prepare-pronunciation-sample.cjs
node tools/prepare-pronunciation-sample.cjs --write
node tools/check-pronunciations.cjs
```

El pla es desa a `output/audio/pronunciation-sample/plan.json`, inclou les rutes dels originals i té `executable: false`: el fitxer JSON no s’executa directament. El preparador no carrega credencials ni envia peticions Azure. El paquet candidat té un ID separat i conserva veu, ritme i format per poder valorar la diferència de pronunciació.

### Generació protegida de la mostra

```text
node tools/run-pronunciation-sample.cjs
node tools/check-pronunciation-sample.cjs
node tools/run-pronunciation-sample.cjs --execute --after-current-batches
```

Només l’última ordre pot enviar peticions. El llançador reconstrueix i valida la mostra des de la font, espera que **mots i instruccions** hagin acabat i comprova que el pressupost estigui lliure. Si un lot anterior falla o desapareix el seu procés, s’atura. Comparteix `usage.json`, `usage.lock`, STOP, mínim de quatre segons entre inicis, límit mensual i absència de reintents Azure. La primera prova és de nou peticions i 776 caràcters estimats; no inicia tot el banc IPA.

`output/audio/comparacio-pronunciacio.html` mostra els originals i les variants, amb seguiment de la cua i reproducció manual. Els resultats van al paquet candidat, sense sobreescriure els originals ni activar el manifest públic. L’estat és a `output/audio/pronunciation-sample-status.json`. La validació tècnica de l’MP3 no és una aprovació de la pronunciació.

El generador admet ara IPA per qualsevol mot o pseudoparaula en un paquet explícit `generationPolicy.requireIpa: true`. No s’aplica accidentalment als paquets ordinaris. Comparteix exactament el constructor SSML i el validador fonètic amb els plans fora de línia. La identitat del paquet incorpora una empremta de tots els ID, grafies i IPA del banc de síntesi; una transcripció canviada exigeix un paquet nou i no reaprofita silenciosament un MP3 antic. Aquesta base permet ampliar l’IPA més enllà de les dièresis, començant pels errors anotats i les famílies amb risc, sense donar per correcte tot el lot original ni totes les propostes fonètiques.

## Taula general editable i reutilitzable

La font de noves revisions és ara [ca/central-didactic.tsv](../audio/pronunciation/ca/central-didactic.tsv), amb 3.299 files alfabètiques. Hi ha 240 propostes IPA i 3.059 camps encara buits. Les propostes de dièresis importades del perfil central formal tenen estat de revisió de dicció, llevat dels casos amb dubtes lingüístics, que es mantenen pendents de contrast. Cap fila no està encara validada. Les fonts i els estats es conserven als [exports JSON](../audio/pronunciation/ca/central-didactic.json) i [TXT de lectura](../audio/pronunciation/ca/central-didactic-ipa.txt).

El docent ha afegit «brànquia» (nasal poc perceptible), «isòtop» (vocal final i accent), «monosíl·lab» (geminació i consonant final) i «pentàgon» (tònica desplaçada). Les propostes centrals són `ˈbɾaŋ.ki.ə`, `i.ˈzɔ.tup`, `mu.nu.ˈsil.ləp` i `pən.ˈta.ɣun`. En «monosíl·lab» es proposa p final, corresponent a l’ensordiment de la b escrita; no es força una b sonora ni s’afegeix una vocal. Les dues primeres parteixen de transcripcions lexicogràfiques; les dues últimes són editorials amb dubtes de contrast explícits. Són propostes per a prova, no solucions auditives ja aprovades.

El 24/10/2026 han acabat el lot original de 3.072 mots, les cinc instruccions i la mostra IPA de nou mots. A continuació s’han sintetitzat aquests quatre casos des de la taula, amb el paquet separat `ca-central-alba-feedback-2-v1`, quatre peticions i 361 caràcters estimats, conservant quota, bloqueig i originals. La prova local és a `output/audio/comparacio-noves-incidencies.html`; l’estat és `output/audio/feedback-2-status.json`. Les dues mostres IPA continuen pendents d’escolta docent i no s’han publicat ni activat els MP3. Els 227 mots amb dièresi encara no s’han sintetitzat amb IPA.

Cada fila identifica llengua, varietat i dicció. El registre permet taules independents per a varietats futures; no es trasllada automàticament la IPA central. La revisió lingüística pot marcar-se amb revisor i data, però l’aprovació auditiva continua vinculada a cada paquet, veu i versió de síntesi. Es pot aprofitar la transcripció amb altres veus sense atribuir-los una validació que encara no tenen.

`pronunciation-table.cjs --export` actualitza només els derivats i no sobreescriu el TSV. `--check` els contrasta amb la font i `--plan "mot,mot"` prepara una selecció de dades sense síntesi. La mostra existent consulta aquesta taula quan es prepara una execució nova; els processos actius conserven la seva còpia en memòria i la identitat del paquet continua protegint canvis d’IPA. La [guia de la taula](../audio/pronunciation/README.md) explica camps, estats, procedència, format i contribucions.

## Velocitat del reproductor

Es manté la síntesi actual. El reproductor permet triar el ritme habitual o `playbackRate` 0,85 amb preservació de to abans de començar, de forma independent del codi i de l’MP3. No cal duplicar cada àudio per oferir una velocitat més lenta.

## Generació llarga i represa

`node tools/run-audio-batch.cjs` només calcula el lot; `--execute` inicia el treball amb les credencials locals i les proteccions F0 existents. L’estat es desa a `output/audio/batch-status.json`, amb el recompte de fitxers, el darrer mot generat i l’estat final. La represa omet fitxers ja generats. No s’afegeixen reintents automàtics.

Per sol·licitar una aturada entre peticions, crea `output/audio/STOP`; el lot atura les peticions, conserva els MP3 complets i allibera els bloqueigs. Abans de reprendre cal retirar aquell senyal de manera explícita. Si el procés termina inesperadament, comprova que el seu PID no continua actiu abans de retirar els fitxers de bloqueig. El pressupost `usage.json` no s’esborra.

Els desaments locals reintenten només errors transitoris de bloqueig (`EPERM`, `EACCES`, `EBUSY`) amb sis pauses breus, fins a 1,575 segons acumulats. Es repeteix el canvi de nom del fitxer ja escrit, **no** la petició Azure. Si persisteix, el lot s’atura i registra el codi local sense missatges remots ni secrets. El codi original de les dues aturades anteriors no s’havia conservat: la possible col·lisió amb lectors de Windows és una hipòtesi, no un diagnòstic confirmat. La protecció temporal contra la suspensió automàtica és un supervisor local, no un canvi dels ajustos globals del sistema.
