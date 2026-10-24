# Plec · Dictats per desplegar

Un generador obert de dictats autocorrectius en català: **3.299 paraules**, **96 pseudoparaules**, dos formats de plec i codis curts per recuperar cada dictat. Funciona al navegador, sense comptes ni servidor de dades.

**[Obre Plec · Català](https://aaronfortuno.github.io/plec-dictats/ca/)** · [Prova perquè i orquestra · M6QM-AAVN4](https://aaronfortuno.github.io/plec-dictats/ca/?seed=M6QMAAVN4)

## Preparar un dictat

1. Tria **Paraules** o **Pseudoparaules**, 8, 12, 16, 20 o 24 elements, el nivell orientatiu i els focus de pràctica. Els focus es combinen amb el criteri «qualsevol dels triats»; no hi ha una quota mínima de cada focus. Els filtres preparen automàticament un codi nou.
2. Si cal, afegeix fins a **cinc mots obligatoris** del banc que passin els filtres, amb **Enter**, **coma** o el botó Afegeix. També pots enganxar una llista separada per comes. Els interrogants expliquen els focus i la cerca. Es busca un codi que ja contingui els mots. Si una tanda no troba coincidència, **Continua la cerca** reprèn els intents pendents; també es pot cancel·lar o ajustar la petició. No s'insereixen paraules a mà ni es relaxen els filtres silenciosament.
3. Conserva el codi, per exemple **M6QM-AAVN4**, o copia l'enllaç. **Recupera un dictat** reconstrueix els mateixos mots, en el mateix ordre, amb la mateixa llargada, nivell i focus. S'accepten minúscules, guions i espais. Els codis antics de sis caràcters continuen funcionant.
4. **Nou dictat** prepara una altra variant amb la mateixa configuració. El format del plec i el costat del model són independents del codi i es poden canviar sense alterar la tria.
5. Descarrega el **PDF A4**, que inclou el codi i els camps Nom i Data. A **Com funciona** hi ha les instruccions de plegat i la **guia docent**, amb el mateix codi, numeració i ordre.

El sistema de codis substitueix les tries individuals, les xinxetes i els canvis de mots. El catàleg és de consulta i es pot descarregar en TXT i TSV; no permet seleccionar mots individualment. Les formes femenines i plurals comparteixen els mateixos focus ortogràfics que la resta.

El lateral esquerre conté els filtres i la configuració del full; el dret agrupa codi, recuperació, còpies, dictat nou, **Comença el dictat** i PDF. El preview ocupa el centre. En tauleta i mòbil els blocs es reorganitzen sense comprimir el full.

El catàleg carrega una inicial cada vegada, amb A per defecte, cerca sobre tot el banc filtrat i navegació per enllaços **A | B | C…**. Només es desplaça el llistat: filtres i descàrregues es mantenen fixos, i la continuació de lletra és al final del llistat. Cada mot té un altaveu si existeix un MP3 disponible. El selector de varietat mostra català central; les altres opcions encara no estan disponibles.

## Preparar els àudios

El mode oral ja disposa de reproductor local; la resposta digital és treball pendent. S’han generat les 3.072 paraules sense dièresi, cinc locucions d’instruccions i mostres IPA separades. **Els MP3 continuen en revisió local i encara no estan publicats.** El web públic comprova la cobertura i no permet començar un dictat sense els àudios necessaris. Cap credencial ni petició Azure arriba al navegador.

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

La primera instantània és `catalogs/ca/editions/seed-1.json`, amb empremta immutable al registre d'edicions. Una ampliació futura del banc haurà d'afegir una edició nova; no es pot canviar el significat dels codis antics. Cada llengua tindrà la seva entrada i el seu registre.

Les dades locals de la versió anterior es conserven amb la seva clau original. El sistema nou només en recupera preferències compatibles. A **Com funciona** es pot descarregar una còpia de les dades antigues encara presents al navegador. Les tries manuals i els mots propis no es converteixen automàticament en codis. Els codis fan servir exclusivament el banc compartit, perquè qualsevol dispositiu els pugui reproduir.

Hi ha una primera pantalla d’alumnat a **`/ca/dictat/`**, accessible des de **Mode dictat** al header, **Comença el dictat** al lateral dret i **Enllaç per a l’alumnat**. Recupera els mateixos mots i ordre amb codis antics i nous. El mode paper ofereix tres escoltes per mot, pantalla completa i pausa en sortir-ne o canviar de pestanya. Els àudios encara estan en generació i revisió local: la versió pública indica que estan pendents i impedeix començar fins que hi hagi cobertura. La ruta ja admet l’enllaç que podrà incorporar un QR; el QR imprès i les respostes digitals són fases posteriors. Vegeu [mode dictat](docs/DICTAT.md).

La preparació d’àudios és local i encara no està activada al web. Els **227 mots amb dièresi** tenen una [taula IPA editable](audio/pronunciation/ca-central-diaeresis.tsv), amb fonts i dubtes explícits, per a una prova posterior al lot sense dièresi. Vegeu el [procediment de pronunciació i revisió](docs/PRONUNCIACIO.md). Preparar el pla SSML no envia peticions a Azure ni altera el catàleg o els codis.

La revisió inclou també geminació, consonants finals i accents verbals. Hi ha una mostra de nou mots amb **dicció didàctica explícita**, incloent «paguessin» i «passàvem», ja generada amb IPA en un paquet separat. El generador comparteix quota i represa, conserva originals i exigeix un paquet nou si canvien els fonemes. `node tools/run-pronunciation-sample.cjs` només simula; la generació real requereix `--execute --after-current-batches` i manté els resultats pendents d’escolta.

La [taula general de pronunciacions](audio/pronunciation/ca/central-didactic.tsv) és editable i cobreix els 3.299 mots: 240 propostes IPA i 3.059 transcripcions encara buides, totes pendents de validació final. Hi ha també [text de lectura](audio/pronunciation/ca/central-didactic-ipa.txt), [JSON obert](audio/pronunciation/ca/central-didactic.json) i una [guia d’edició i reutilització](audio/pronunciation/README.md). Les varietats i els criteris de dicció tenen perfils separats. La validació d’una transcripció no equival a validar la locució d’una veu concreta.

El botó de sol/lluna al header canvia entre **clar i fosc** i desa la preferència entre preparador i dictat. A la primera visita segueix el sistema; el full i el PDF sempre són clars. Les instruccions del dictat es preparen com a cinc MP3 Azure estàtics, un per llargada, amb text compartit amb la pantalla. `node tools/run-instructions-batch.cjs` fa només una simulació; `--execute --after-words` encua la generació després del lot principal, compartint pressupost, bloqueig i represa. Cap àudio no s’activa públicament sense revisió.

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
node tools/check-local-files.cjs
node tools/check-instructions.cjs
node tools/benchmark-seeds.cjs
node tools/benchmark-seeds-v2.cjs
node tools/serve.cjs
```

El servidor mostra l'adreça local (per defecte, `http://127.0.0.1:4176`). `build-catalogs.cjs --check` comprova que els fitxers generats siguin reproduïbles. El generador verifica també les empremtes de les instantànies i no les modifica. Per repetir el contrast complet cal el lèxic extern de Softcatalà; les instruccions són a `catalogs/README.md`.

`seeds.js` conserva el protocol 1 i el mostreig immutable. `seeds-v2.js` afegeix el format actual i la cerca optimitzada. `catalog-audio.js` gestiona una única reproducció del catàleg i `audio-manifest.js` comparteix la validació de rutes i cobertura amb el reproductor d’alumnat. `app.js` gestiona el preparador i `dictation.js` connecta l’entrada d’alumnat amb els MP3; `dictation-session.js` controla els comptadors i les pauses sense dependre del navegador. `core.js` comparteix la geometria SVG/PDF amb `pdf.js`. Les plantilles són `templates/composer.html` i `templates/dictation.html`; els recursos comparteixen el sufix `?v=1.16.0`. Els paquets i HTML generats estan versionats per servir-los directament amb GitHub Pages.

## Versions

La interfície actual és **1.16**. Els increments funcionals dins de V1 segueixen 1.9, 1.10, 1.11…; una correcció puntual pot usar 1.16.1. S’han renumerat les etiquetes visuals 2.0–2.5 com a 1.10–1.15 al changelog i al footer. Els protocols de llavors V1/V2 i els identificadors immutables del banc són independents de la versió de la interfície.

## GitHub Pages i llicències

El repositori serveix la branca **main**, carpeta **/ (root)**, amb `.nojekyll`. La portada redirigeix a `/ca/` mantenint els paràmetres. Les comprovacions es fan en local; la revisió del web desplegat la fa l'usuari.

Codi i contingut original sota MIT. `pdf-lib` conserva la llicència MIT i els avisos d'`assets/vendor/`; Lucide conserva ISC i l'avís MIT de les icones derivades de Feather a `assets/lucide/LICENSE`. El lèxic de Softcatalà, utilitzat externament per al contrast, manté la seva llicència LGPL 2.1 / GPL 2.0 i les seves atribucions; no es distribueix amb el web.
