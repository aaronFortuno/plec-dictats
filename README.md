# Plec · Dictats per desplegar

Un generador obert de dictats autocorrectius en català: **3.299 paraules**, **96 pseudoparaules**, dos formats de plec i codis curts per recuperar cada dictat. Funciona al navegador, sense comptes ni servidor de dades.

**[Obre Plec · Català](https://aaronfortuno.github.io/plec-dictats/ca/)** · [Prova perquè i orquestra · M6QM-AAVN4](https://aaronfortuno.github.io/plec-dictats/ca/?seed=M6QMAAVN4)

## Preparar un dictat

1. Tria **Paraules** o **Pseudoparaules**, 8, 12, 16, 20 o 24 elements, el nivell orientatiu i els focus de pràctica. Els focus es combinen amb el criteri «qualsevol dels triats»; no hi ha una quota mínima de cada focus. Els filtres preparen automàticament un codi nou.
2. Si cal, afegeix fins a **cinc mots obligatoris** del banc que passin els filtres, amb **Enter**, **coma** o el botó Afegeix. També pots enganxar una llista separada per comes. Els interrogants expliquen els focus i la cerca. Es busca un codi que ja contingui els mots. Si una tanda no troba coincidència, **Continua la cerca** reprèn els intents pendents; també es pot cancel·lar o ajustar la petició. No s'insereixen paraules a mà ni es relaxen els filtres silenciosament.
3. Conserva el codi, per exemple **M6QM-AAVN4**, o copia l'enllaç. **Recupera un dictat** reconstrueix els mateixos mots, en el mateix ordre, amb la mateixa llargada, nivell i focus. S'accepten minúscules, guions i espais. Els codis antics de sis caràcters continuen funcionant.
4. **Nou dictat** prepara una altra variant amb la mateixa configuració. El format del plec i el costat del model són independents del codi i es poden canviar sense alterar la tria.
5. Descarrega el **PDF A4**, que inclou el codi i els camps Nom i Data. A **Com funciona** hi ha les instruccions de plegat i la **guia docent**, amb el mateix codi, numeració i ordre.

La versió 2.0 substitueix les tries individuals, les xinxetes, els canvis de mots i el lateral dret pel sistema de codis. El catàleg és de consulta i es pot descarregar en TXT i TSV; no permet seleccionar mots individualment. Les formes femenines i plurals comparteixen els mateixos focus ortogràfics que la resta.

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

Encara no s'han incorporat els àudios, el reproductor per a l'alumnat ni el QR. L'enllaç actual obre el preparador docent amb el codi recuperat. El motor de codis es podrà compartir amb el futur mode dictat.

## Desenvolupament i comprovació

Web estàtic, amb biblioteques i icones locals. Obre `index.html` directament o serveix el projecte. No hi ha serveis externs, comptes ni analítica durant l'ús.

```text
node tools/build-catalogs.cjs
node tools/check.cjs
node tools/check-catalogs.cjs
node tools/check-lexicon.cjs
node tools/check-seeds.cjs
node tools/check-seeds-v2.cjs
node tools/benchmark-seeds.cjs
node tools/benchmark-seeds-v2.cjs
node tools/serve.cjs
```

El servidor mostra l'adreça local (per defecte, `http://127.0.0.1:4176`). `build-catalogs.cjs --check` comprova que els fitxers generats siguin reproduïbles. El generador verifica també les empremtes de les instantànies i no les modifica. Per repetir el contrast complet cal el lèxic extern de Softcatalà; les instruccions són a `catalogs/README.md`.

`seeds.js` conserva el protocol 1 i el mostreig immutable. `seeds-v2.js` afegeix el format actual i la cerca optimitzada. `app.js` en gestiona la interfície, la continuació i les cancel·lacions. `seeds.css` adapta l'espai de treball a dues columnes. `core.js` comparteix la geometria SVG/PDF amb `pdf.js`. La plantilla catalana és `templates/composer.html`; els recursos comparteixen el sufix `?v=2.2.0`. Els paquets i HTML generats estan versionats per servir-los directament amb GitHub Pages.

## GitHub Pages i llicències

El repositori serveix la branca **main**, carpeta **/ (root)**, amb `.nojekyll`. La portada redirigeix a `/ca/` mantenint els paràmetres. Les comprovacions es fan en local; la revisió del web desplegat la fa l'usuari.

Codi i contingut original sota MIT. `pdf-lib` conserva la llicència MIT i els avisos d'`assets/vendor/`; Lucide conserva ISC i l'avís MIT de les icones derivades de Feather a `assets/lucide/LICENSE`. El lèxic de Softcatalà, utilitzat externament per al contrast, manté la seva llicència LGPL 2.1 / GPL 2.0 i les seves atribucions; no es distribueix amb el web.
