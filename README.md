# Plec · Dictats per desplegar

Un generador obert de dictats autocorrectius en català: **3.299 paraules**, **96 pseudoparaules**, dos formats de plec i codis curts per recuperar cada dictat. Funciona al navegador, sense comptes ni servidor de dades.

**[Obre Plec · Català](https://aaronfortuno.github.io/plec-dictats/ca/)** · [Prova perquè i orquestra · M6QM-AAVN4](https://aaronfortuno.github.io/plec-dictats/ca/?seed=M6QMAAVN4)

## Preparar un dictat

1. Tria **Paraules** o **Pseudoparaules**, 8, 12, 16, 20 o 24 elements, el nivell orientatiu i els focus de pràctica. Els focus es combinen amb el criteri «qualsevol dels triats»; no hi ha una quota mínima de cada focus. **Accentuació** demana accent gràfic; **Dièresi**, ï o ü; marcar tots dos admet qualsevol d’aquestes dues característiques. Els filtres preparen automàticament un codi nou.
2. Si cal, afegeix fins a **cinc mots obligatoris** del banc que passin els filtres, amb **Enter**, **coma** o el botó Afegeix. També pots enganxar una llista separada per comes. Els interrogants expliquen els focus i la cerca. Es busca un codi que ja contingui els mots. Si una tanda no troba coincidència, **Continua la cerca** reprèn els intents pendents; també es pot cancel·lar o ajustar la petició. No s'insereixen paraules a mà ni es relaxen els filtres silenciosament.
3. Conserva el codi, per exemple **M6QM-AAVN4**, o copia l'enllaç. **Recupera un dictat** reconstrueix els mateixos mots, en el mateix ordre, amb la mateixa llargada, nivell i focus. S'accepten minúscules, guions i espais. Els codis antics de sis caràcters continuen funcionant.
4. **Nou dictat** prepara una altra variant amb la mateixa configuració. El format del plec i el costat del model són independents del codi i es poden canviar sense alterar la tria.
5. Descarrega el **PDF A4**, que inclou el codi i els camps Nom i Data. A **Com funciona** hi ha les instruccions de plegat i la **guia docent**, amb el mateix codi, numeració i ordre.

El sistema de codis substitueix les tries individuals, les xinxetes i els canvis de mots. El catàleg és de consulta i es pot descarregar en TXT i TSV; no permet seleccionar mots individualment. Les formes femenines i plurals comparteixen els mateixos focus ortogràfics que la resta.

El lateral esquerre conté els filtres i la configuració del full; el dret agrupa codi, recuperació, còpies, dictat nou, **Comença el dictat** i PDF. El preview ocupa el centre. En amplades inferiors a 1.200 px els laterals es despleguen des dels costats; obrir-ne un tanca l’altre. El peu queda visible i el desplaçament és intern.

El selector de varietat del catàleg permet escoltar català central amb Alba o valencià amb Enric. Canviar de varietat atura la locució actual i no recorre a una altra veu si falta un àudio. El catàleg carrega una inicial cada vegada, amb A per defecte, cerca sobre tot el banc filtrat i navegació per enllaços **A | B | C…**. Només es desplaça el llistat: filtres i descàrregues es mantenen fixos, i la continuació de lletra és al final del llistat. Cada mot té un altaveu si existeix un MP3 disponible. El selector de varietat mostra català central; les altres opcions encara no estan disponibles.

## Preparar els àudios

El mode oral ja disposa de reproductor local; la resposta digital és treball pendent. Estan publicats els 3.299 mots centrals amb Alba, els 3.299 valencians amb Enric i cinc locucions d’instruccions. **La revisió auditiva individual continua oberta.** El web públic comprova la cobertura i no permet començar un dictat sense els àudios necessaris. Cap credencial ni petició Azure arriba al navegador.

La [guia d’Azure F0](docs/AZURE-F0.md) explica el compte, el recurs gratuït, la mostra i els controls de consum. `node tools/audio-plan.cjs` i `node tools/generate-audio.cjs` només simulen per defecte; la generació real requereix indicadors explícits i credencials al terminal. Les comprovacions sense xarxa s’executen amb `node tools/check-audio-tools.cjs`.

Després de l’escolta de la mostra es van ajornar els 227 mots amb dièresi i es van generar les altres 3.072 paraules. Ara hi ha una primera mostra IPA de vuit dièresis pendent d’escolta, abans d’ampliar-la. La [política de pronunciació](docs/PRONUNCIACIO.md) documenta els casos detectats i la futura prova amb fonemes. `node tools/run-audio-batch.cjs` calcula el lot complet i `--execute` l’inicia amb seguiment local i aturada entre peticions; les credencials també es poden llegir d’un fitxer privat fora del repositori i de l’arrel del web.

## Com funciona l'algoritme

El codi empaqueta una edició del banc, la configuració dels filtres i un número de variant. Primer es construeix el conjunt de candidats. Després, una successió reproduïble d'enters tria posicions sense reposició mitjançant una barreja parcial de Fisher–Yates. L'ordre d'extracció és l'ordre del dictat: no es fa una ordenació alfabètica posterior.

La mateixa entrada sempre produeix la mateixa successió. Per això no cal guardar un fitxer per a cada dictat: es conserva una instantània del catàleg i es repeteix el càlcul. La llengua queda identificada per la ruta `/ca/` i s'imprimeix amb el codi al full.

El protocol actual separa el codi en **quatre caràcters de configuració + cinc de variant**. Fa servir 30 símbols, sense I, L, O, U, 0 ni 1; representa 81.975 configuracions, reserva nou edicions i disposa de **24.300.000 variants per configuració**. Això amplia unes 10.900 vegades les 2.223 variants del format inicial. Les edicions encara no disponibles i les configuracions sense prou candidats es rebutgen.

Els focus delimiten candidats amb **qualsevol dels triats (OR)**: marcar-los tots amplia el banc i no imposa una paraula de cadascun. Cada tanda de cerca dura aproximadament fins a 1,8 segons; el motor cedeix el control periòdicament i permet continuar sense repetir intents. Una tanda sense resultat no prova que no existeixi cap codi: només l'esgotament de totes les variants permet afirmar-ho dins d'aquesta configuració.

El detall de la fórmula, el mostreig, els límits i les mesures actuals és a **[docs/LLAVORS-V2.md](docs/LLAVORS-V2.md)**. Es conserva també la [documentació del protocol inicial](docs/LLAVORS.md).

## Fins a quants mots obligatoris?

En una prova del protocol 2 amb deu conjunts independents per cas i fulls de 24 mots, s'han trobat aquests resultats. Per a 1–3 mots es permet recórrer tot el domini; per a 4–5 es proven com a màxim un milió de variants per cas:

| Candidats | 1 obligatori | 2 obligatoris | 3 obligatoris | 4 obligatoris | 5 obligatoris |
| --- | ---: | ---: | ---: | ---: | ---: |
| Tot el banc · 3.299 | 10/10 | 10/10 | 10/10 | 0/10 | 0/10 |
| Dièresi · 231 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |
| Ela geminada · 160 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |

Amb tot el banc, les medianes han estat 6,263 ms per a dos obligatoris i 1.164,973 ms per a tres, en un Intel Core Ultra 5 225U amb Node 24.19.0. No són temps de mòbil ni de la interfície: el navegador pot necessitar diverses tandes. Els 0/10 de quatre i cinc mots només descriuen el milió de variants comprovat, no tot el domini.

«Perquè» i «orquestra», amb tots els focus i cicle superior, apareixen al codi **M6QM-AAVN4**, trobat al cap de 15.655 intents des del començament. Dos i tres obligatoris ara són pràctics amb un banc ampli en la mostra provada; quatre o cinc continuen sent molt més favorables amb focus acotats. Cap quantitat té una garantia universal de coincidència.

## Nivells i banc de paraules

Cada mot combina familiaritat del vocabulari i dificultat ortogràfica. Són orientacions editorials revisables, no una escala curricular validada:

- **Cicle mitjà:** vocabulari bàsic i habitual, amb dificultat baixa o mitjana.
- **Cicle superior:** bàsic, habitual i ampliació; qualsevol dificultat ortogràfica.
- **Institut:** ampliació i especialitzat, més mots coneguts amb ortografia alta.
- **Tot el banc:** sense límit de nivell. Les pseudoparaules no tenen nivell.

«Llit» pot entrar a cicle mitjà o superior; «avesar», a superior o institut; «hipotenusa», a institut. Els mots poden tenir diversos focus. Si no hi ha prou candidats, cal ampliar els filtres o reduir la llargada.

El catàleg editable és `catalogs/ca/catalog.json`. Les llistes alfabètiques, amb una forma per línia, són `paraules.txt` i `pseudoparaules.txt`; `revisio.tsv` incorpora nivells i etiquetes. El docent pot editar el TXT com a proposta de revisió. Les eines detecten aquests canvis i eviten sobreescriure'ls accidentalment.

El banc és una selecció editorial proposada inicialment per l'assistent i contrastada amb recursos de Softcatalà. Es manté l'estat de revisió docent pendent. El contrast exacte té documentat el cas enclític preexistent `rebel·lar-se` com a pendent. Conservar una instantània per recuperar codis no implica certificar el banc lingüísticament. Vegeu [catàlegs i contrast lèxic](catalogs/README.md) i les referències normatives [DIEC](https://dlc.iec.cat/) i [Ortografia de l'IEC](https://oiec.iec.cat/).

## Plegar i corregir

- **Terços:** model, escriptura al centre i banda buida. Es plega primer la banda buida i després el model, cap al darrere. La banda intermèdia amaga el model i, per corregir, es desplega al costat de l'escriptura.
- **Quart de full:** model exterior de 51 mm, solapa de 53 mm, tram de 54 mm i escriptura de 52 mm. Dos plecs cap endins, amb marge perquè el model càpiga sota la primera solapa. El model es pot mostrar al costat de l'escriptura obrint el plec exterior.

Tots dos formats es poden invertir. Els trams de protecció són buits. Les línies d'escriptura i correcció són a la mateixa columna. Imprimeix a mida real, A4, per una sola cara. La vista prèvia admet zoom amb Ctrl i roda o amb els botons, arrossegament i doble clic per ajustar. La roda sense Ctrl conserva el desplaçament normal i mostra una indicació breu; en pantalles tàctils es pot desplaçar la pàgina amb el dit.

**Les pseudoparaules no tenen una ortografia normativa única.** Acorda la pronunciació i l'accent oral i accepta les grafies compatibles amb el so dictat. La h muda, les grafies homòfones i les variants dialectals no es poden resoldre sempre a partir d'un mot oral aïllat. El model proposat no converteix automàticament una alternativa fonèticament compatible en un error.

## Compatibilitat i fase següent

La primera instantània és `catalogs/ca/editions/seed-1.json`, amb empremta immutable al registre d'edicions. Els dictats nous utilitzen `seed-2.json`, que corregeix les etiquetes d’accent i dièresi; els codis antics continuen amb `seed-1.json`. Recuperar un codi antic no n’altera cap mot. Canviar filtres o prémer **Nou dictat** fa servir l’edició actual. Una ampliació futura del banc haurà d'afegir una edició nova; no es pot canviar el significat dels codis antics. Cada llengua tindrà la seva entrada i el seu registre.

Les dades locals de la versió anterior es conserven amb la seva clau original. El sistema nou només en recupera preferències compatibles. Les tries manuals i els mots propis no es converteixen automàticament en codis. Els codis fan servir exclusivament el banc compartit, perquè qualsevol dispositiu els pugui reproduir.

Hi ha una primera pantalla d’alumnat a **`/ca/dictat/`**, accessible des de **Mode dictat** al header, **Comença el dictat** al lateral dret i **Enllaç per a l’alumnat**. Recupera els mateixos mots i ordre amb codis antics i nous. El mode paper ofereix tres escoltes per mot, pantalla completa i pausa en sortir-ne o canviar de pestanya. Hi ha 3.299 mots publicats per varietat i cinc locucions d’instruccions. Abans de començar es pot triar central o valencià. Es pot començar quan totes les paraules del codi tenen àudio; si en falta alguna, la pantalla ho indica. La revisió auditiva continua oberta. La ruta ja admet l’enllaç que podrà incorporar un QR; el QR imprès ja incorpora la ruta de llengua i el codi per a ortogra.fi; les respostes digitals són una fase posterior. Vegeu [mode dictat](docs/DICTAT.md).

La síntesi es fa localment amb Azure i els MP3 publicats es reprodueixen estàticament des del repositori. Els **227 mots amb dièresi** tenen una [taula IPA editable](audio/pronunciation/ca-central-diaeresis.tsv), amb fonts i dubtes explícits, per a una prova posterior al lot sense dièresi. Vegeu el [procediment de pronunciació i revisió](docs/PRONUNCIACIO.md). Preparar el pla SSML no envia peticions a Azure ni altera el catàleg o els codis.

La revisió inclou també geminació, consonants finals i accents verbals. Hi ha una mostra de nou mots amb **dicció didàctica explícita**, incloent «paguessin» i «passàvem», ja generada amb IPA en un paquet separat. El generador comparteix quota i represa, conserva originals i exigeix un paquet nou si canvien els fonemes. `node tools/run-pronunciation-sample.cjs` només simula; la generació real requereix `--execute --after-current-batches` i manté els resultats pendents d’escolta.

La [taula general de pronunciacions](audio/pronunciation/ca/central-didactic.tsv) és editable i cobreix els 3.299 mots: 3.299 propostes IPA i cap camp buit, totes pendents de validació final. Hi ha també [text de lectura](audio/pronunciation/ca/central-didactic-ipa.txt), [JSON obert](audio/pronunciation/ca/central-didactic.json) i una [guia d’edició i reutilització](audio/pronunciation/README.md). Les varietats i els criteris de dicció tenen perfils separats. La validació d’una transcripció no equival a validar la locució d’una veu concreta.

El botó de sol/lluna al header canvia entre **clar i fosc** i desa la preferència entre preparador i dictat. A la primera visita segueix el sistema; el full i el PDF sempre són clars. Les instruccions del dictat es preparen com a cinc MP3 Azure estàtics, un per llargada, amb text compartit amb la pantalla. `node tools/run-instructions-batch.cjs` fa només una simulació; `--execute --after-words` encua la generació després del lot principal, compartint pressupost, bloqueig i represa. L’autor ha autoritzat publicar els àudios centrals disponibles mentre continua la revisió individual.

## Valencià i ampliació de pseudoparaules

La [taula valenciana editable](audio/pronunciation/ca/valencian-didactic.tsv) té IPA per als 3.299 mots: es conserven les 22 propostes inicials i s’hi afegeixen propostes del conversor obert catalan2ipa, pistes vocàliques explícites i correccions d’accent. Tot continua pendent de contrast lingüístic. El pilot de 20 mots amb Enric està aprovat auditivament; una prova posterior ha confirmat que Azure accepta /v/. El lot complet ha acabat el 25/10/2026 i s’ha publicat: 3.299 MP3 en un paquet separat, amb IPA congelada i revisió auditiva individual oberta. Vegeu [perfil valencià](docs/VALENCIA.md).

Les 96 pseudoparaules actuals es mantenen. L’ampliació prevista necessita revisar estructura sil·làbica, llargada i focus, comprovar coincidències lèxiques i definir accent i IPA per varietat. Després s’afegirà una edició nova del banc, sense canviar codis ja impresos, i es generaran mostres curtes abans de cada lot de veus. El model escrit continua sent una proposta: poden existir diverses grafies compatibles amb el mateix so.

## Escoltar i revisar al web

Dins d’**El catàleg** pots consultar les dues varietats costat per costat, escoltar els enregistraments prement la IPA o l’altaveu, i obrir una incidència amb la bandera. Hi ha una sola vista amb mot, focus i les dues varietats. La cerca és global i no canvia quan escoltes un mot; els enllaços directes el ressalten sense omplir-la. Només es desplaça el llistat, amb 50 files inicials ampliables. La ruta `/ca/pronunciacions/` obre directament aquesta vista. Les incidències de la IPA es registren separadament dels àudios. No cal descarregar ni editar un TSV per revisar.

Les notes es desen al navegador i **Exporta** les reuneix en un JSON que es pot compartir o importar per reprendre el treball. **Descarrega les IPA** genera un únic CSV. La bandera permet desar la incidència d’aquell mot i varietat o obrir un esborrany a GitHub que l’usuari revisa i envia amb el seu compte; no hi ha enviament automàtic ni formulari anònim. Vegeu [guia de revisió](docs/REVISIO-PRONUNCIACIONS.md).

Els lots reprenen cada minut els errors transitoris de connexió o servidor, mantenint pressupost, STOP i MP3 completats. Les peticions repetides es compten al registre; un error de desament local reutilitza el mateix àudio. La represa funciona mentre el procés continuï obert; no s’ha instal·lat cap servei d’inici després d’un reinici. Vegeu [represa dels lots](docs/REPRESA-AUDIO.md).

El lot d’Enric ha completat les 3.299 peticions i ha reservat 288.630 caràcters, incloent el SSML, sense reintents. Després s’han completat els 219 àudios centrals pendents amb IPA congelada, 19.466 caràcters addicionals: el registre local suma 429.782 aquest mes. Tots els MP3 s’han descodificat correctament, en mono a 24 kHz, i cada fitxer publicat té SHA-256. La verificació tècnica no substitueix l’escolta lingüística. El topall preventiu local s’ha ajustat a 450.000, sota els 500.000 mensuals F0. Cada intent es reserva abans d’enviar-lo. L’ajudant que mantenia el sistema despert i el procés de síntesi han acabat. El seguiment periòdic es desactiva després de publicar. El selector de pronunciació permet triar les dues vies. Per accedir directament al dictat amb Enric es pot afegir `&voice=ca-valencian-enric-ipa-v1` a l’enllaç de l’alumnat; el paquet central continua sent el predeterminat.

## Desenvolupament i comprovació

Web estàtic, amb biblioteques i icones locals. Obre `index.html` directament o serveix el projecte. No hi ha serveis externs, comptes ni analítica durant l'ús.

```text
node tools/build-catalogs.cjs
node tools/check.cjs
node tools/check-catalogs.cjs
node tools/check-lexicon.cjs
node tools/check-seeds.cjs
node tools/check-seeds-v2.cjs
node tools/check-pronunciations.cjs
node tools/check-pronunciation-sample.cjs
node tools/check-pronunciation-table.cjs
node tools/check-dictation-session.cjs
node tools/check-dictation.cjs
node tools/check-catalog-browser.cjs
node tools/check-catalog-audio.cjs
node tools/check-audio-retry.cjs
node tools/check-pronunciation-review.cjs
node tools/check-focus-edition.cjs
node tools/check-valencian-pilot.cjs
node tools/check-valencian-batch.cjs
node tools/check-published-audio.cjs
node tools/check-local-files.cjs
node tools/check-instructions.cjs
node tools/benchmark-seeds.cjs
node tools/benchmark-seeds-v2.cjs
node tools/serve.cjs
```

El servidor mostra l'adreça local (per defecte, `http://127.0.0.1:4176`). `build-catalogs.cjs --check` comprova que els fitxers generats siguin reproduïbles. El generador verifica també les empremtes de les instantànies i no les modifica. Per repetir el contrast complet cal el lèxic extern de Softcatalà; les instruccions són a `catalogs/README.md`.

`seeds.js` conserva el protocol 1 i el mostreig immutable. `seeds-v2.js` afegeix el format actual i la cerca optimitzada. `catalog-audio.js` gestiona una única reproducció del catàleg i `audio-manifest.js` comparteix la validació de rutes i cobertura amb el reproductor d’alumnat. `app.js` gestiona el preparador i `dictation.js` connecta l’entrada d’alumnat amb els MP3; `dictation-session.js` controla els comptadors i les pauses sense dependre del navegador. `core.js` comparteix la geometria SVG/PDF amb `pdf.js`. Les plantilles són `templates/composer.html` i `templates/dictation.html`; els recursos comparteixen el sufix `?v=1.21.0`. Els paquets i HTML generats estan versionats per servir-los directament amb GitHub Pages.

## Versions

La interfície actual és **1.21**. Els increments funcionals dins de V1 segueixen 1.9, 1.10, 1.11…; una correcció puntual pot usar 1.16.1. S’han renumerat les etiquetes visuals 2.0–2.5 com a 1.10–1.15 al changelog i al footer. Els protocols de llavors V1/V2 i els identificadors immutables del banc són independents de la versió de la interfície.

## GitHub Pages i llicències

El repositori serveix la branca **main**, carpeta **/ (root)**, amb `.nojekyll`. La portada redirigeix a `/ca/` mantenint els paràmetres. Les comprovacions es fan en local; la revisió del web desplegat la fa l'usuari.

Codi i contingut original sota MIT. `pdf-lib` conserva la llicència MIT i els avisos d'`assets/vendor/`; Lucide conserva ISC i l'avís MIT de les icones derivades de Feather a `assets/lucide/LICENSE`. El lèxic de Softcatalà, utilitzat externament per al contrast, manté la seva llicència LGPL 2.1 / GPL 2.0 i les seves atribucions; no es distribueix amb el web.

El conversor local catalan2ipa conserva LGPL-3.0-or-later i les atribucions a `tools/vendor/catalan2ipa/`. Les pistes fonètiques indiquen separadament les excepcions factuals consultades d’eSpeak NG i les decisions editorials; no s’ha copiat un diccionari complet.

Els focus seleccionats apareixen a la banda tapada del full imprimible i del PDF, alineats amb «Escric i reviso» i amb el QR a sobre, tant en terços com en quart de full. No canvien ni la llavor ni l’espai d’escriptura.

La [revisió d’usabilitat del catàleg](docs/AUDITORIA-CATALEG.md) documenta els problemes observats, les decisions i les comprovacions. El domini ortogra.fi encara està pendent de registre i connexió; els QR ja en conserven la ruta definitiva. La biblioteca local QR Code Generator de Kazuhiko Arase es distribueix amb la seva llicència MIT.
