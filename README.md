# Plec · Dictats per desplegar

Un generador obert de dictats autocorrectius en català: **3.299 paraules**, **96 pseudoparaules**, dos formats de plec i codis curts per recuperar cada dictat. Funciona al navegador, sense comptes ni servidor de dades.

**[Obre Plec · Català](https://aaronfortuno.github.io/plec-dictats/ca/)** · [Prova el codi A7W-STC](https://aaronfortuno.github.io/plec-dictats/ca/?seed=A7WSTC)

## Preparar un dictat

1. Tria **Paraules** o **Pseudoparaules**, 8, 12, 16, 20 o 24 elements, el nivell orientatiu i els focus de pràctica. Els focus es combinen amb el criteri «qualsevol dels triats»; no hi ha una quota mínima de cada focus. Els filtres preparen automàticament un codi nou.
2. Si cal, afegeix fins a **cinc mots obligatoris** del banc que passin els filtres. Es busca un codi que ja els contingui. Si no n'hi ha cap, treu algun mot o ajusta els focus. No s'insereixen paraules a mà ni es relaxen els filtres silenciosament.
3. Conserva el codi, per exemple **A7W-STC**, o copia l'enllaç. **Recupera un dictat** reconstrueix els mateixos mots, en el mateix ordre, amb la mateixa llargada, nivell i focus. S'accepten minúscules, guions i espais.
4. **Nou dictat** prepara una altra variant amb la mateixa configuració. El format del plec i el costat del model són independents del codi i es poden canviar sense alterar la tria.
5. Descarrega el **PDF A4**, que inclou el codi i els camps Nom i Data. A **Com funciona** hi ha les instruccions de plegat i la **guia docent**, amb el mateix codi, numeració i ordre.

La versió 2.0 substitueix les tries individuals, les xinxetes, els canvis de mots i el lateral dret pel sistema de codis. El catàleg és de consulta i es pot descarregar en TXT i TSV; no permet seleccionar mots individualment. Les formes femenines i plurals comparteixen els mateixos focus ortogràfics que la resta.

## Com funciona l'algoritme

El codi empaqueta una edició del banc, la configuració dels filtres i un número de variant. Primer es construeix el conjunt de candidats. Després, una successió reproduïble d'enters tria posicions sense reposició mitjançant una barreja parcial de Fisher–Yates. L'ordre d'extracció és l'ordre del dictat: no es fa una ordenació alfabètica posterior.

La mateixa entrada sempre produeix la mateixa successió. Per això no cal guardar un fitxer per a cada dictat: es conserva una instantània del catàleg i es repeteix el càlcul. La llengua queda identificada per la ruta `/ca/` i s'imprimeix amb el codi al full.

Els sis caràcters provenen d'un alfabet de 30 símbols, sense I, L, O, U, 0 ni 1. El protocol reserva quatre edicions i representa 81.975 configuracions amb **2.223 variants per configuració**. Les configuracions sense prou mots i les edicions encara no disponibles es rebutgen. La cerca de mots obligatoris recorre aquest conjunt finit, és cancel·lable i no bloqueja el navegador amb una cerca sense límit.

El detall de la fórmula, les operacions inverses, els enters de 32 bits, el mòdul, el mostreig, els límits, les mesures i la compatibilitat futura és a **[docs/LLAVORS.md](docs/LLAVORS.md)**.

## Fins a quants mots obligatoris?

El màxim de càlcul és sempre 2.223 variants; demanar més mots fa més difícil trobar una coincidència, però no amplia la cerca indefinidament. En una prova local de 30 conjunts independents per cas, amb fulls de 24 mots:

| Candidats | 1 obligatori | 2 obligatoris | 3 obligatoris | 4 obligatoris | 5 obligatoris |
| --- | ---: | ---: | ---: | ---: | ---: |
| Tot el banc · 3.299 | 30/30 | 5/30 | 0/30 | 0/30 | 0/30 |
| Dièresi · 231 | 30/30 | 30/30 | 27/30 | 6/30 | 0/30 |
| Ela geminada · 160 | 30/30 | 30/30 | 30/30 | 15/30 | 1/30 |

La mediana de càlcul en aquests casos va quedar entre 0,006 i 4,316 ms en un Intel Core Ultra 5 225U amb Node 24.19.0. No són mesures de mòbil ni del temps total de la interfície. La cerca del navegador cedeix el control entre blocs de 64 intents i hi afegeix una mica de temps.

Un mot és fàcil d'incloure en aquesta mostra. Dos o tres són més útils quan els focus acoten el banc. Quatre o cinc poden funcionar amb conjunts petits; la interfície els permet provar, sense garantir que existeixi cap codi compatible. Més temps de cerca no crea variants que no caben al format del codi.

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

Tots dos formats es poden invertir. Els trams de protecció són buits. Les línies d'escriptura i correcció són a la mateixa columna. Imprimeix a mida real, A4, per una sola cara. La vista prèvia admet zoom amb roda i botons, arrossegament i doble clic per ajustar.

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
node tools/benchmark-seeds.cjs
node tools/serve.cjs
```

El servidor mostra l'adreça local (per defecte, `http://127.0.0.1:4176`). `build-catalogs.cjs --check` comprova que els fitxers generats siguin reproduïbles. El generador verifica també les empremtes de les instantànies i no les modifica. Per repetir el contrast complet cal el lèxic extern de Softcatalà; les instruccions són a `catalogs/README.md`.

`seeds.js` conté el protocol, el mostreig i la cerca. `app.js` en gestiona la interfície i les cancel·lacions. `seeds.css` adapta l'espai de treball a dues columnes. `core.js` comparteix la geometria SVG/PDF amb `pdf.js`. La plantilla catalana és `templates/composer.html`; els recursos comparteixen el sufix `?v=2.0.0`. Els paquets i HTML generats estan versionats per servir-los directament amb GitHub Pages.

## GitHub Pages i llicències

El repositori serveix la branca **main**, carpeta **/ (root)**, amb `.nojekyll`. La portada redirigeix a `/ca/` mantenint els paràmetres. Les comprovacions es fan en local; la revisió del web desplegat la fa l'usuari.

Codi i contingut original sota MIT. `pdf-lib` conserva la llicència MIT i els avisos d'`assets/vendor/`; Lucide conserva ISC i l'avís MIT de les icones derivades de Feather a `assets/lucide/LICENSE`. El lèxic de Softcatalà, utilitzat externament per al contrast, manté la seva llicència LGPL 2.1 / GPL 2.0 i les seves atribucions; no es distribueix amb el web.
