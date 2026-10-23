# Plec · Dictats per desplegar

Un generador obert de dictats autocorrectius en català, pensat per a cinquè de primària i adaptable al cicle superior. **358 paraules** amb focus ortogràfics i **96 pseudoparaules** proposades per practicar les correspondències entre so i grafia.

## Utilització

Obre `index.html` amb un navegador actual, o entra al web de GitHub Pages. No cal instal·lar res, crear comptes ni disposar de connexió després de descarregar els fitxers. No hi ha analítica ni serveis externs durant l’ús.

1. Tria **Paraules** (24 per defecte) o **Pseudoparaules** (20 per defecte).
2. Escull 8, 12, 16, 20 o 24 elements i els focus de pràctica. **Prepara un dictat nou** reparteix els focus i prioritza els elements que encara no s’han utilitzat. Si s’esgoten les alternatives, ho indica i reutilitza mots del banc. Mai repeteix un element dins del mateix full.
3. Revisa la llista. La xinxeta conserva un mot en generar una altra proposta; les fletxes circulars canvien només aquell mot. Les paraules fixades es conserven encara que canviïs els focus. Si redueixes la llargada, es conserven els primers elements fins al nou límit. Si l’amplies, completa la tria o prepara un dictat nou.
4. **Tria des del catàleg** permet una selecció manual. Amb el full ple, desmarca un element per deixar lloc a un altre. El catàleg té cercador i filtre propi: aquests no canvien els focus de la proposta aleatòria.
5. Personalitza el títol i el grup. **Descarrega el PDF** crea directament una pàgina A4 amb el model. **Guia docent** descarrega una pàgina separada, amb la mateixa numeració i ordre i les etiquetes dels mots.

La casella **Veure el model** només amaga el text a la vista prèvia. El PDF sempre l’inclou. Els caràcters catalans estan admesos; els símbols fora de la font estàndard, com els emojis, es representen amb `?` a la capçalera impresa.

## Com es plega el full

El paper A4 vertical queda dividit en tres franges físiques de **70 mm** amb dues línies discontínues, a 70 i 140 mm de la vora esquerra. Les línies horitzontals travessen les tres franges, dins dels marges imprimibles de 12 mm.

| Franja esquerra | Franja central | Franja dreta |
| --- | --- | --- |
| MODEL: paraula de referència | ESCRIC: resposta al dictat | REVISO: correcció després de desplegar |

Imprimeix a una sola cara, en A4, a escala **100 %**. Amb el full escrit cap amunt, plega primer MODEL cap enrere i després REVISO cap enrere. Les dues franges queden darrere d’ESCRIC. Al final del dictat, desplega-les i utilitza REVISO per escriure les correccions. Es pot anotar el nom abans de plegar.

## Criteri pedagògic

El banc de paraules conté deu focus: accentuació; s/ss/c/ç/z; h; g/j/tg/tj; b/v; r/rr; c/qu/g/gu/qü/gü; vocals àtones; ll/ny/x/ix/tx/ig; i dièresi/ela geminada. Una paraula pot tenir diverses etiquetes i només apareix una vegada. Les etiquetes indiquen focus de pràctica, no una anàlisi exhaustiva del mot. Hi ha contrastos amb i sense marca gràfica, com país/països.

El banc de pseudoparaules agrupa formes de síl·labes simples, grups consonàntics, dígrafs i mots llargs. Inclou els exemples inicials aportats: sclaf, platoll, blis, drall, cunyi, frisquell, sergaminya i pirotet. Les agrupacions són orientatives i poden solapar-se. Les formes són propostes d’aula, no ítems d’una prova estandarditzada ni una llista lexicalment validada en tots els parlars.

**Una pseudoparaula no té una ortografia normativa única.** Cal acordar la pronunciació i l’accent oral abans de dictar i acceptar altres grafies compatibles amb el so que ha rebut l’alumnat. No es pot deduir, per exemple, una h muda o sempre una b/v només a partir del so. El model és una proposta per comparar i comentar; una diferència amb el model no equival automàticament a un error. La mateixa precaució afecta les vocals segons el parlar del docent.

Referències normatives de consulta: [Ortografia catalana de l’IEC](https://oiec.iec.cat/), [DIEC](https://dlc.iec.cat/) i [grafies sibilants a la gramàtica de l’IEC](https://gbu.iec.cat/text/2.3). El catàleg és una selecció editorial pròpia; no es presenta com una extracció validada d’aquests recursos.

## Guardar i ampliar

La tria, l’historial de mots utilitzats i els elements propis es guarden al navegador quan l’emmagatzematge local està disponible. Les sessions de paraules i pseudoparaules es conserven per separat. No hi ha sincronització entre dispositius.

- **Guarda el dictat** descarrega un JSON amb tots els elements, el seu ordre, el títol, el grup i els fixats. **Recupera un dictat** el restaura, inclosos els mots propis en un altre navegador.
- Al catàleg, **Afegeix paraules pròpies al banc** accepta una forma per línia o separada per comes (màxim 26 caràcters, sense espais, fins a 3.000 formes pròpies). S’afegeixen al tipus de dictat actiu, amb l’etiqueta «Les meves paraules».
- **Exporta tot el catàleg** descarrega una còpia del banc, inclosos els elements propis. Aquest format és per consultar i editar dades; no s’importa des de «Recupera un dictat».
- Per ampliar el banc comunitari, edita els grups de `catalog.js`. Mantén les formes en minúscula i evita duplicats; les etiquetes compartides es fusionen automàticament.

## Desenvolupament i comprovació

Web estàtic sense compilació, rutes absolutes ni dependències externes durant l’ús. La biblioteca PDF està inclosa amb la seva llicència a `assets/vendor/`. `core.js` comparteix la geometria del document entre la vista prèvia SVG i `pdf.js`, que genera PDF vectorial amb Helvetica i Helvetica Bold.

```text
node tools/serve.cjs
node tools/check.cjs
```

La previsualització local s’obre a l’adreça que mostra el servidor (per defecte, `http://127.0.0.1:4176`). El segon comandament comprova integritat del catàleg, absència de duplicats, focus, mostreig, fixats, repeticions i límits de l’A4.

`tools/check-pdf.cjs` comprova les vint combinacions de tipus, llargada i document, valida la pàgina A4, els caràcters i les guies de plec, i crea dos exemples a `output/`. Necessita `pdf-lib` com a dependència de desenvolupament o la variable `PLEC_NODE_MODULES` apuntant a una carpeta que contingui aquest paquet. No és una dependència per fer servir el web.

## GitHub Pages

El repositori serveix directament la branca **main**, carpeta **/ (root)**, amb **Settings → Pages → Deploy from a branch**. El fitxer `.nojekyll` permet servir els fitxers estàtics sense transformació. No hi ha cap secret, servidor, base de dades ni pas de compilació.

Les comprovacions es fan en local. La revisió de la publicació remota correspon al docent.

## Llicència

Codi i contingut original sota llicència MIT; es poden reutilitzar, modificar i compartir conservant l’avís de llicència. `pdf-lib` manté la seva llicència MIT i els seus avisos originals a `assets/vendor/pdf-lib.LICENSE.md`.
