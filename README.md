# Plec · Dictats per desplegar

Un generador obert de dictats autocorrectius en català, pensat per a cinquè de primària i adaptable al cicle superior. **3.299 paraules** amb focus ortogràfics i **96 pseudoparaules** proposades per practicar les correspondències entre so i grafia.

## Catàlegs i llengües

L'entrada catalana és [Plec · Català](https://aaronfortuno.github.io/plec-dictats/ca/). La portada hi redirigeix mantenint els paràmetres de l'enllaç. La configuració de llengua, les regles de nivell i les dades estan separades; encara només s'ofereix català.

El banc ampliat és una proposta pendent de revisió docent. Pots baixar les llistes alfabètiques des del catàleg: **Paraules · TXT**, **Pseudoparaules · TXT** i **Taula de revisió · TSV**. Els fitxers també són a `catalogs/ca/`. La font editable és `catalogs/ca/catalog.json`; després de modificar-la, executa `node tools/build-catalogs.cjs`. Vegeu [el funcionament dels catàlegs](catalogs/README.md).

Cada revisió té una empremta que també incorpora la configuració de llengua. Les tries guardades inclouen la llengua i la revisió; es mantenen els fitxers antics de català i les dades locals. Es rebutja la importació d'un dictat d'una altra llengua abans de modificar la tria.

El focus **Femenins i plurals** permet practicar 150 formes, amb 137 variants incorporades en la versió 1.8. Els participis també apareixen a **Formes verbals** i als focus ortogràfics corresponents. Les noves grafies tenen coincidència exacta al lèxic flexionat de Softcatalà.

La generació amb llavors, la cerca de mots obligatoris, els QR i el reproductor s'abordaran després de revisar i fixar la primera edició estable. Aquesta versió prepara les identitats i les rutes, sense emetre encara codis recuperables.

## Espai de treball

En ordinador, el preparador ocupa l’alçada de la finestra i es distribueix en tres columnes: configuració a l’esquerra, vista prèvia al centre i paraules triades a la dreta. Els laterals es desplacen de manera independent, amb barres discretes. La configuració inicial concentra tipus, format, model, nombre de mots i nivell en quatre files, deixant els focus visibles sense scroll a les mides d’escriptori comprovades.

La capçalera compacta inclou el lema i el recompte del banc. El gràfic explicatiu i les instruccions són a **Com funciona**. El full A4 s’ajusta a l’amplada i l’alçada disponibles mantenint la proporció, i canvia immediatament quan es trien el format del plec o la posició del model.

En pantalles estretes les columnes es reorganitzen. La tria de la dreta conserva les funcions de fixar, canviar, guardar, recuperar i seleccionar des del catàleg.

## Utilització

Obre `index.html` amb un navegador actual, o entra al web de GitHub Pages. No cal instal·lar res, crear comptes ni disposar de connexió després de descarregar els fitxers. No hi ha analítica ni serveis externs durant l’ús.

1. Tria **Paraules** (24 per defecte) o **Pseudoparaules** (20 per defecte).
2. Escull 8, 12, 16, 20 o 24 elements, el nivell orientatiu i els focus de pràctica. La tria es renova automàticament en canviar aquests filtres: reparteix els focus i prioritza els elements que encara no s’han utilitzat. Els focus es combinen amb el criteri «qualsevol dels triats». Si s’esgoten les alternatives, ho indica i reutilitza mots del banc. Mai repeteix un element dins del mateix full.
3. Revisa la llista. La xinxeta conserva un mot en generar una altra proposta; les fletxes circulars canvien només aquell mot. Les paraules fixades es conserven encara que canviïs els focus. En canviar la llargada es prepara una proposta completa, prioritzant els fixats fins al nou límit. La icona **Renova la tria** del lateral dret permet preparar un altre dictat amb els mateixos filtres. Si falten candidats, es mostra una proposta parcial i es desactiva el PDF fins que ampliïs els filtres o redueixis la llargada.
4. **Tria des del catàleg** permet una selecció manual. Amb el full ple, desmarca un element per deixar lloc a un altre. El catàleg té cercador i filtre propi: aquests no canvien els focus de la proposta aleatòria.
5. **Descarrega el PDF** crea directament una pàgina A4 amb el model i els camps Nom i Data. A **Com funciona**, **Descarrega la guia docent** ofereix una pàgina separada amb la mateixa numeració, ordre i etiquetes dels mots.

El model es mostra sempre. El títol del full és «Dictat de paraules» o «Dictat de pseudoparaules». No es generen ni es mostren codis aleatoris.

## Vista prèvia i moviment

La roda del ratolí amplia o redueix el full al voltant del punter; arrossega’l per desplaçar-lo. El doble clic el torna a ajustar. Els botons de la cantonada inferior dreta permeten reduir, ampliar i ajustar. Amb el visor enfocat, també funcionen +, −, 0 i les fletxes.

El 100 % del visor correspon al full sencer ajustat a l’espai disponible; el zoom va del 50 al 400 %. El zoom i el desplaçament només afecten la pantalla. Els PDF i la impressió mantenen la mida A4.

Diàlegs, desplegables, canvis de contingut i controls comparteixen una durada de **220 ms**. El peu és més alt i llegible. Les barres de desplaçament disposen de separació respecte del contingut.

## Catàleg i informació del projecte

Els focus **Formes verbals**, **Dièresi** i **Ela geminada** es poden triar separadament i se solapen amb altres qüestions ortogràfiques. Per exemple: «haguessin» (verbs, h, ss), «plantejarien» (verbs, g/j), «intuïa» i «canviïn» (verbs i dièresi). El banc inclou 91 formes verbals, 56 mots amb dièresi i 25 amb ela geminada. Les etiquetes indiquen focus de pràctica, no una anàlisi exhaustiva.

La versió del peu obre un historial amb data, del més nou al més antic, i un enllaç al changelog complet. **Sobre el projecte · V4V** obre la informació del projecte, la presentació i fotografia de l’autor, el portfoli, el repositori i els crèdits. La secció V4V comparteix el QR, l’adreça Lightning i el botó de còpia amb [Pentagrama](https://pentagrama.page/); la descripció és pròpia de Plec. La foto i el QR es distribueixen localment. Les icones de [Lucide](https://lucide.dev/) es distribueixen també localment amb la llicència original.

## Dos formats de plec

El selector **Format del plec** ofereix terços i quart de full. En tots dos es pot posar el model a l’esquerra o a la dreta; **Model amagat** inverteix tota la distribució, incloses les guies i els esquemes.

### Terços: escriptura al centre

| Model | Escriptura i revisió | Banda buida |
| --- | --- | --- |
| 70 mm | 70 mm | 70 mm |

Les guies són a 70 i 140 mm. Primer es plega la banda buida cap al darrere de l’escriptura i després el model, també cap al darrere. Per corregir, s’obre només el model i es manté la banda buida al darrere: el model queda al costat de l’escriptura.

### Quart: dos plecs cap endins

| Model exterior | Primera solapa buida | Tram sota el paquet | Escriptura i revisió |
| --- | --- | --- | --- |
| 51 mm | 53 mm | 54 mm | 52 mm |

Amb el model a l’esquerra, les guies són a **51 i 104 mm** de la vora esquerra; amb el model a la dreta són a **106 i 159 mm** de la vora esquerra. Només hi ha dues guies: el límit del tram d’escriptura no és un altre plec.

1. Plega el model exterior cap endins per la guia més pròxima. Els seus 51 mm caben dins de la solapa de 53 mm, amb 2 mm de marge abans del següent plec.
2. Fes el segon plec també cap endins. El paquet ocupa 53 mm del tercer tram, de 54 mm, i deixa 1 mm abans de l’escriptura. Queden aproximadament 52 mm de paper visibles per escriure.
3. Per corregir, aixeca una mica el paquet i obre el plec exterior en sentit contrari, com un petit acordió. El model queda cap amunt al costat de l’escriptura; no cal estendre els trams buits.

Les amplades anteriors són físiques, inclosos els marges. La zona impresa té marges de seguretat. Les solapes buides no contenen text, ratlles ni capçalera. La columna d’escriptura inclou nom i data. La correcció es fa **a la mateixa columna on s’ha escrit**.

Dins de **Com funciona**, **Com plego aquest full?** mostra la distribució proporcional del full obert, els passos del format actual i un esquema lateral de dictat i correcció. L’esquema lateral és orientatiu i no està a escala.

Imprimeix a una sola cara, en **A4 al 100 %**. Els marges d’encaix estan comprovats geomètricament; queda pendent la prova amb paper real, ja que el gruix, l’opacitat i la precisió del plec depenen del paper i de la impressora.

## Nivell orientatiu: vocabulari i dificultat ortogràfica

Cada paraula té dos camps independents al catàleg:

- **vocabulary:** basic (bàsic), common (habitual), expanded (ampliació) o specialized (especialitzat).
- **orthography:** low (baixa), medium (mitjana) o high (alta).

És una classificació editorial explícita i revisable, no una escala validada ni una assignació curricular oficial. No es calcula a partir de la llargada del mot. El nivell aplica aquestes regles:

| Perfil | Candidats |
| --- | --- |
| Cicle mitjà | Bàsic i habitual amb ortografia baixa o mitjana. |
| Cicle superior | Bàsic, habitual i ampliació; qualsevol dificultat ortogràfica. |
| Institut | Ampliació i especialitzat, més mots bàsics o habituals amb ortografia alta. |
| Tot el banc | Totes les paraules, incloses les pròpies sense classificar. |

Així, **llit** entra a mitjà i superior; **avesar**, a superior i institut; **hipotenusa**, a institut. **Col·legi** continua disponible a institut per la seva exigència ortogràfica. La familiaritat i la dificultat es mostren a cada entrada del catàleg.

Els perfils s’intersequen amb els focus ortogràfics. El filtre del catàleg és independent del preparador. Canviar de nivell o de focus conserva la tria actual i avisa dels mots que en queden fora; cal preparar una nova proposta per renovar-la. Els mots fixats es conserven fins i tot quan queden fora dels filtres. No s’apliquen nivells de vocabulari a les pseudoparaules.

## Criteri pedagògic

El banc de paraules conté deu focus: accentuació; s/ss/c/ç/z; h; g/j/tg/tj; b/v; r/rr; c/qu/g/gu/qü/gü; vocals àtones; ll/ny/x/ix/tx/ig; i dièresi/ela geminada. Una paraula pot tenir diverses etiquetes i només apareix una vegada. Les etiquetes indiquen focus de pràctica, no una anàlisi exhaustiva del mot. Hi ha contrastos amb i sense marca gràfica, com país/països.

El banc de pseudoparaules agrupa formes de síl·labes simples, grups consonàntics, dígrafs i mots llargs. Inclou els exemples inicials aportats: sclaf, platoll, blis, drall, cunyi, frisquell, sergaminya i pirotet. Les agrupacions són orientatives i poden solapar-se. Les formes són propostes d’aula, no ítems d’una prova estandarditzada ni una llista lexicalment validada en tots els parlars.

**Una pseudoparaula no té una ortografia normativa única.** Cal acordar la pronunciació i l’accent oral abans de dictar i acceptar altres grafies compatibles amb el so que ha rebut l’alumnat. No es pot deduir, per exemple, una h muda o sempre una b/v només a partir del so. El model és una proposta per comparar i comentar; una diferència amb el model no equival automàticament a un error. La mateixa precaució afecta les vocals segons el parlar del docent.

Referències normatives de consulta: [Ortografia catalana de l’IEC](https://oiec.iec.cat/), [DIEC](https://dlc.iec.cat/) i [grafies sibilants a la gramàtica de l’IEC](https://gbu.iec.cat/text/2.3). El catàleg és una selecció editorial pròpia; no es presenta com una extracció validada d’aquests recursos.

## Guardar i ampliar

La tria, l’historial de mots utilitzats i els elements propis es guarden al navegador quan l’emmagatzematge local està disponible. Les sessions de paraules i pseudoparaules es conserven per separat. No hi ha sincronització entre dispositius.

- **Guarda el dictat** descarrega un JSON amb tots els elements, el seu ordre, els fixats, el nivell, el format del plec, la posició del model, la llengua i la revisió del catàleg. El format actual és 4; s’importen també els formats 1, 2 i 3 de català. Els dictats antics sense format de plec es recuperen amb la disposició de terços, mantenint els mots i el seu ordre. **Recupera un dictat** el restaura, inclosos els mots propis en un altre navegador. Els camps antics de Grup, codi i títol personalitzat s’ignoren.
- Al catàleg, **Afegeix paraules pròpies al banc** accepta una forma per línia o separada per comes (màxim 26 caràcters, sense espais, fins a 3.000 formes pròpies). S’afegeixen al tipus de dictat actiu, amb l’etiqueta «Les meves paraules». Pots indicar-ne vocabulari i dificultat; sense classificació apareixen a «Tot el banc» i es poden seleccionar manualment.
- **Exporta tot el catàleg** descarrega una còpia del banc, inclosos els elements propis. Aquest format és per consultar i editar dades; no s’importa des de «Recupera un dictat».
- Per ampliar el banc comunitari, edita `catalogs/ca/catalog.json` i regenera els paquets. Mantén les formes en minúscula, els IDs existents i una sola entrada per mot; una entrada pot tenir diversos focus.

## Desenvolupament i comprovació

Web estàtic sense rutes absolutes ni dependències externes durant l’ús. Les fonts són els JSON de `catalogs/` i `locales/`, i la plantilla catalana `templates/composer.html`; `tools/build-catalogs.cjs` genera els paquets i les entrades HTML abans de publicar. Els fitxers generats també estan versionats, de manera que GitHub Pages no necessita compilar res. No s'han d'editar manualment. La distribució és a `workspace.css`; `styles.css` manté els estils compartits i els diàlegs. Els recursos de la plantilla comparteixen `?v=1.8.0`: cal actualitzar-lo conjuntament en una nova versió. La biblioteca PDF està inclosa amb la seva llicència a `assets/vendor/`. `core.js` comparteix la geometria entre la vista prèvia SVG i `pdf.js`, que genera PDF vectorial amb Helvetica i Helvetica Bold.

```text
node tools/serve.cjs
node tools/check.cjs
node tools/check-catalogs.cjs
```

La previsualització local s’obre a l’adreça que mostra el servidor (per defecte, `http://127.0.0.1:4176`). El segon comandament comprova integritat del catàleg, absència de duplicats, focus, perfils de nivell, mostreig, fixats, repeticions, trams buits, marges d’encaix i límits de l’A4.

El tercer comprova també la generació reproduïble, les empremtes, els fitxers de revisió, les rutes i la migració de dades per llengua.

`tools/check-pdf.cjs` comprova les vuitanta combinacions de tipus, llargada, document, format de plec i posició del model, valida la pàgina A4, els caràcters i les guies de plec, i crea dos exemples a `output/`. Necessita `pdf-lib` com a dependència de desenvolupament o la variable `PLEC_NODE_MODULES` apuntant a una carpeta que contingui aquest paquet. No és una dependència per fer servir el web.

## GitHub Pages

El repositori serveix directament la branca **main**, carpeta **/ (root)**, amb **Settings → Pages → Deploy from a branch**. El fitxer `.nojekyll` permet servir els fitxers estàtics sense transformació. No hi ha cap secret, servidor, base de dades ni pas de compilació.

Les comprovacions es fan en local. La revisió de la publicació remota correspon al docent.

## Llicència

Codi i contingut original sota llicència MIT; es poden reutilitzar, modificar i compartir conservant l’avís de llicència. `pdf-lib` manté la seva llicència MIT i els seus avisos originals a `assets/vendor/pdf-lib.LICENSE.md`. Les icones Lucide conserven la llicència ISC i l’avís MIT de les icones derivades de Feather a `assets/lucide/LICENSE`.
