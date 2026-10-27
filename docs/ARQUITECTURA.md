# Arquitectura i límits dels mòduls

Estat 1.30 · 27/10/2026. Continua essent una aplicació estàtica, sense framework ni servei de dades. Aquest inventari distingeix el codi que s’executa avui de les peces conservades per compatibilitat.

## Preparador i cerques

- `app.js` coordina DOM, preferències, edició seleccionada, full, PDF i enllaços. Encara conserva l’estat general del preparador; no s’ha convertit en un model de correcció digital.
- `composer-search.js` és el propietari del cicle de cerca: inici, cancel·lació, continuació, intents acumulats i finalització. Rep edició, filtres, mots obligatoris i variant anterior; copia els filtres i mots abans de començar. No accedeix al DOM, emmagatzematge, URL ni xarxa.
- Cada cerca té una generació i un senyal de cancel·lació. Tant el progrés com el resultat es descarten si pertanyen a una generació antiga. El controlador comprova també la vigència després d’esperar el resultat. Una cerca antiga no pot donar per acabada una cerca nova.
- La continuació conserva el conjunt preparat, el següent nonce i els intents restants. Canviar filtres, mode, cancel·lar o recuperar un codi invalida aquella continuació; reprendre-la continua sense saltar ni repetir el tram ja comprovat.
- `seeds.js` i `seeds-v2.js` continuen essent els motors immutables de selecció. Aquesta extracció no canvia fórmules, codificació, catàlegs, edicions ni ordre dels mots.

Les proves pures de `check-composer-search.cjs` injecten cerques ajornades, errors i resultats antics, i contrasten una selecció amb el motor real. `check-composer-lifecycle-ui.cjs` comprova filtres durant una cerca, cancel·lació, represa, recuperació, canvi de mode i conservació de la varietat des de la interfície.

## Catàleg actiu

- `catalog-browser.js`: cerca, inicials i filtratge, sense reproducció.
- `catalog-resources.js`: càrrega independent de manifests i índexs IPA, timeout i reintent selectiu.
- `pronunciations.js`: presentació, reproducció d’una única pista i banderes del catàleg actual.
- `audio-manifest.js` i `audio-varieties.js`: identitat, cobertura, tipus de dictat i varietat. No hi ha substitució automàtica entre varietats.
- `analytics.js`, `analytics-ui.js` i `privacy-help.js`: canal actual de notificació, consentiment i instruccions. La decisió T08 es conserva.

El formulari antic de revisió local, els botons ocults d’importació/exportació i el seu CSS exclusiu s’han retirat de les plantilles. `pronunciations.js` ja no carrega ni crea el magatzem antic. Les anotacions existents no es llegeixen, s’esborren ni migren silenciosament.

## Compatibilitat conservada

| Peça | Consumidors actuals | Política |
| --- | --- | --- |
| `pronunciation-review.js` | Eines/proves de compatibilitat de JSON i emmagatzematge antic | Es conserva per recuperar dades; no es carrega al web actual. |
| `catalog-audio.js` | Proves del controlador de reproducció anterior | No es carrega al catàleg actual. Les seves proves no validen el controlador vigent. |
| `catalog.js` arrel | Eines anteriors de Node | Adaptador al paquet català; el navegador carrega el paquet de llengua. |
| `catalogs/ca/editions/` | Lectors de codis antics i actuals | Fonts congelades amb empremtes; no es modifiquen per IPA, àudios o interfície. |

El grup `compatibility` de la porta de qualitat segueix comprovant aquestes dades i contractes. La validació del producte actual correspon als grups `pure`, `data`, `audio-mock`, `pdf` i `browser`, incloses les proves del catàleg i dictat vigents.

## Estils i feina pendent

El preparador carrega `styles.css`, `workspace.css`, `seeds.css`, `catalog-browser.css`, `pronunciations.css`, `analytics.css`, `theme.css` i finalment `workspace-layout.css`. Aquest últim és el propietari del marc, columnes, calaixos, peu i impressió del preparador. Les disposicions antigues que apilaven panells s’han retirat; la capçalera i els controls conserven els seus estils als fitxers de components. El dictat reutilitza estils globals amb la seva capa pròpia.

La [consolidació 1.30](CSS-CONSOLIDACIO.md) contrasta 110 escenaris amb una referència prèvia i corregeix una anul·lació de les regles d’impressió. Encara es pot revisar el CSS de components històrics amb inventari de consumidors; no s’ha eliminat globalment el full compartit. Continuen pendents la càrrega diferida dels snapshots antics i la separació més àmplia d’estat/persistència d’`app.js`. El futur model de respostes/puntuació digital no s’ha d’incorporar dins del controlador de reproducció ni modificar la selecció reproduïble.
