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

El pla té `executable: false` i totes les revisions auditives pendents. No està connectat al generador actual: abans cal escoltar una mostra, resoldre els dubtes i integrar la generació amb les mateixes proteccions de quota i represa. El paquet candidat `ca-central-alba-ipa-v1` té una ruta diferent del paquet en curs. No s’ha modificat `audio/manifest.json`, el lot de 3.072 mots ni els MP3 de comparació.

La primera mostra proposada és de vuit mots: **atapeït, conduïdes, agraïm, canviïn, aigüera, qüestió, raïm i increïble**. Cobreix accent final i intern, hiat tònic i àton, ü amb w i geminació. Cal comprovar-hi dicció natural i accent abans d’enviar la tanda completa. Després de generar-los, els MP3 continuaran pendents de revisió docent abans de publicar-los.

## Revisió de mots sense dièresi i entonació

L’usuari ha detectat també alguns mots sense dièresi amb accent o entonació dubtosos, però encara no en té anotats els noms. No s’interpreta el lot de 3.072 com a validat. La taula [ca-central-review.tsv](../audio/pronunciation/ca-central-review.tsv) és un registre buit per anotar cada mot i el problema concret a mesura que s’escolti; no modifica el catàleg ni substitueix cap MP3.

Separarem **sons i accent tònic** de **l’entonació de paraula aïllada**. Per als primers, prepararem una proposta IPA amb totes les fronteres sil·làbiques. Si el problema és una entonació que sembla quedar a mitja frase, compararem també el text com a frase autònoma, per exemple `<s>mot.</s>`, i la mateixa prova amb IPA. Azure documenta els elements de frase i l’efecte de la puntuació; això no garanteix per si sol que la veu resolgui el cas. [Estructura SSML](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-structure).

Les variants es generaran en una mostra separada, conservant l’original per comparar i sense canviar la grafia del mot. Només una escolta docent que confirmi accent, sons i entonació permetrà aprovar la substitució. No es regenerarà tot el corpus preventivament. Primer es provaran els vuit casos de dièresi ja proposats i els casos concrets que s’hagin anotat.

## Velocitat del reproductor

Es manté la síntesi actual. El reproductor permet triar el ritme habitual o `playbackRate` 0,85 amb preservació de to abans de començar, de forma independent del codi i de l’MP3. No cal duplicar cada àudio per oferir una velocitat més lenta.

## Generació llarga i represa

`node tools/run-audio-batch.cjs` només calcula el lot; `--execute` inicia el treball amb les credencials locals i les proteccions F0 existents. L’estat es desa a `output/audio/batch-status.json`, amb el recompte de fitxers, el darrer mot generat i l’estat final. La represa omet fitxers ja generats. No s’afegeixen reintents automàtics.

Per sol·licitar una aturada entre peticions, crea `output/audio/STOP`; el lot atura les peticions, conserva els MP3 complets i allibera els bloqueigs. Abans de reprendre cal retirar aquell senyal de manera explícita. Si el procés termina inesperadament, comprova que el seu PID no continua actiu abans de retirar els fitxers de bloqueig. El pressupost `usage.json` no s’esborra.

Els desaments locals reintenten només errors transitoris de bloqueig (`EPERM`, `EACCES`, `EBUSY`) amb sis pauses breus, fins a 1,575 segons acumulats. Es repeteix el canvi de nom del fitxer ja escrit, **no** la petició Azure. Si persisteix, el lot s’atura i registra el codi local sense missatges remots ni secrets. El codi original de les dues aturades anteriors no s’havia conservat: la possible col·lisió amb lectors de Windows és una hipòtesi, no un diagnòstic confirmat. La protecció temporal contra la suspensió automàtica és un supervisor local, no un canvi dels ajustos globals del sistema.
