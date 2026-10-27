# Auditoria tècnica de Plec — octubre de 2026

Data: 26/10/2026. Base inspeccionada: `6bc8092`, interfície 1.26.

## Resum

**Seguiment 1.30:** consolidació del layout de T07 a `workspace-layout.css`, retirada de les disposicions apilades anul·lades i de `responsive-workspace.css`, peu i recuperació unificats. Referència de 110 casos: pantalla preservada i impressió directa corregida perquè les regles de pantalla en retallaven el contenidor. L’[informe de CSS](CSS-CONSOLIDACIO.md) concreta abast i evidència. La càrrega diferida d’edicions de T04 i una revisió més àmplia de components/estat continuen separades.

**Seguiment 1.29:** segona frontera de T06 extreta a `composer-search.js`: cancel·lació, continuació i protecció davant progrés/resultats antics, amb proves pures i d’interfície. T07 avança retirant formularis/bindings/CSS de revisió local inaccessibles; les dades i els mòduls de compatibilitat es conserven sense carregar-los al catàleg. L’[inventari vigent](ARQUITECTURA.md) concreta propietats i consumidors. La resta de T06, la consolidació general del CSS i la càrrega diferida d’edicions continuen pendents; no s’afirma que tota la neteja estigui tancada.

**Seguiment 1.27:** T01, T02, T03, la primera part de T04 i T05 implementats i comprovats localment. T08 resolt com a decisió de producte: es conserva el canal de banderes/Umami i es fa visible l’alternativa de correcció/PR. Les barreres A01–A03 de la revisió complementària també es corregeixen. Les troballes següents descriuen la base original `6bc8092`; no s’ha fet una reescriptura general.

La base actual és aprofitable per continuar: el mostreig reproduïble, les edicions congelades, la geometria del full, la sessió del dictat i la validació dels àudios ja tenen separació i proves útils. No hi ha motiu per reescriure l’aplicació ni per introduir un framework abans del pilot digital. La [revisió d’accessibilitat complementària](AUDITORIA-ACCESSIBILITAT-2026-10.md) cobreix la navegació per teclat, el reflow i les comprovacions del navegador que no s’avaluen aquí.

Hi ha dos punts que convé corregir abans d’ampliar funcionalitats: una fallada d’una taula IPA deixa sense reproducció les dues veus del catàleg; el generador de catàlegs pot haver sobreescrit recursos quan descobreix una entrada invàlida. S’han reproduït de manera controlada, sense alterar dades ni fer peticions externes. No s’ha identificat cap defecte P0/P1 en l’abast revisat.

La feina de consolidació posterior ha de concentrar-se en càrregues independents i recuperables, una ordre única de comprovació, dependències de desenvolupament reproduïbles, reducció del volum de dades del navegador i extraccions petites dels controladors DOM. La llargada dels fitxers i l’estil compacte no es consideren defectes per si mateixos.

## Abast i mètode

- Lectura del codi d’execució, plantilles, generador, registre d’edicions, estructura dels recursos i comprovacions locals.
- Execució de 13 programes de comprovació: `check.cjs`, `check-catalogs.cjs`, `check-seeds.cjs`, `check-seeds-v2.cjs`, `check-focus-edition.cjs`, `check-basic-vocabulary.cjs`, `check-site-links.cjs`, `check-dictation-session.cjs`, `check-dictation.cjs`, `check-audio-varieties.cjs`, `check-analytics.cjs`, `check-catalog-browser.cjs` i `check-published-audio.cjs`.
- Tots han passat. Els dos codecs sumen 655.800 recorreguts de codificació/descodificació; també s’han verificat vectors antics, identitat dels snapshots, cerca cancel·lable, continuació sense salts i cobertura dels dos lots de 3.299 àudios amb empremtes SHA-256.
- Prova de navegador local en un context aïllat, bloquejant deliberadament una taula IPA. Prova del generador en una màquina virtual JavaScript amb escriptures simulades. No s’han escrit recursos ni executat síntesi.
- Cap lectura de credencials, cap petició a Azure/Umami i cap comprovació del desplegament remot. L’auditoria d’accessibilitat de navegador és una tasca separada.

Que una comprovació tècnica passi no certifica la pronunciació ni les etiquetes pedagògiques. La validació de l’usuari dels 350 mots bàsics correspon a la selecció de mots, no a totes les seves etiquetes o pistes fonètiques.

## Mapa de components

| Àrea | Peces principals | Valoració |
| --- | --- | --- |
| Fonts i edicions | `catalogs/ca/catalog.json`, `locales/ca/config.json`, `catalogs/ca/editions/` | Fonts identificables, sortides generades i snapshots amb hash. Cal conservar la distinció entre font actual i contracte antic. |
| Llavors | `seeds.js`, `seeds-v2.js` | Nucli determinista independent del DOM; V2 reutilitza el mostreig de V1. Vectors i regressions bons. |
| Preparador | `app.js` | Coordina preferències, filtres, cerca, full, PDF, compartició, ajuda i historial. Funciona, però concentra responsabilitats. |
| Full i exportació | `core.js`, `pdf.js`, `brand.js`, `worksheet-qr.js`, `site-links.js` | Geometria SVG/PDF i URL pública compartides; no convé duplicar-les en noves pantalles. |
| Dictat oral | `dictation-session.js`, `dictation.js` | Màquina de sessió pura separada del DOM, amb protecció contra resultats d’àudio obsolets i pauses. És el punt d’extensió adequat per al pilot digital. |
| Catàleg i àudios | `catalog-browser.js`, `pronunciations.js`, `audio-manifest.js`, `audio-varieties.js` | Filtratge i cobertura reutilitzables; càrrega, presentació i notificació encara massa acoblades al controlador. |
| Privacitat i avisos | `analytics.js`, `analytics-ui.js`, `privacy-help.js` | Camps permesos explícits, URL sense codi ni cerca, DNT/GPC respectats i confirmació de recepció. Dependència funcional d’Umami deliberada. |
| Interacció i estil | `preview.js`, `workspace-panels.js`, `motion.js`, `theme.js`, capes CSS | Responsabilitats bàsiques separades; el layout conserva regles històriques anul·lades per capes posteriors. |
| Generació d’àudio | `tools/generate-audio.cjs`, plans i executors de lots | Fora del navegador, pressupost/identitat/bloqueig/reintents explícits. No s’ha llançat cap lot durant aquesta auditoria. |

## Troballes prioritzades

### T01 · P2 · Confirmat: una IPA fallida bloqueja els àudios del catàleg

**Evidència:** `pronunciations.js:89–100`. `load()` espera un `Promise.all` de les taules central i valenciana abans de llegir els manifests d’àudio. La llista `byId` utilitzada pels clics i els botons depèn també d’aquesta càrrega. No hi ha un límit temporal propi en `json()` (`:88`).

**Reproducció:** obrir el preparador local en una sessió nova, interrompre la petició de `audio/pronunciation/ca/valencian-didactic.json` i obrir «El catàleg». La prova automatitzada ha obtingut:

```text
Avís: No s’han pogut carregar les pronunciacions. Reintenta
Botons de reproducció presents: 200
Botons de reproducció habilitats: 0
Peticions al manifest d’àudio o de revisió: cap
Primera IPA visible: Carregant…
```

**Impacte:** una incidència d’una varietat o d’un recurs informatiu inutilitza també l’altra veu, malgrat disposar dels MP3 i manifests correctes. Una petició que no resolgui pot deixar la vista esperant sense oferir reintent.

**Proposta:** carregar àudios i taules IPA com a recursos independents, amb estat per recurs (`loading/ready/error`), reintent selectiu i temps màxim. La identitat bàsica del mot ha de venir del catàleg; reproduir no ha de requerir disposar d’IPA. Fer servir les taules disponibles encara que en falli una.

**Validació:** tallar cadascuna de les dues taules per separat, tallar un manifest, simular una resposta pendent i comprovar reintent. L’altra informació ha de continuar operativa; no s’ha de reproduir una varietat diferent com a substitució.

### T02 · P2 · Confirmat: la generació pot deixar sortides parcials

**Evidència:** `tools/build-catalogs.cjs:12–15` escriu immediatament. A `:45` i `:54` ja s’emeten el manifest i el catàleg, mentre que les comprovacions dels snapshots i del vocabulari bàsic són posteriors (`:56–85`).

**Reproducció segura:** executar el codi en un context JavaScript amb lectures reals i escriptures simulades, fent que la lectura del primer snapshot retorni un espai addicional. El generador rebutja correctament el hash, però ja hauria escrit:

```text
locales/manifest.js
catalogs/ca/catalog.js
```

**Impacte:** si s’ha modificat una font sense crear-ne correctament l’edició, una ordre fallida pot deixar el directori amb dades noves i registre antic. El control `--check` ho detecta després, però no evita aquest estat intermedi. No s’ha observat corrupció al repositori inspeccionat.

**Proposta:** separar lectura/validació, renderització en memòria i publicació de sortides. Validar totes les llengües abans de començar a escriure. Escriure cada fitxer mitjançant temporal i substitució, seguint l’utilitari local existent; això evita fitxers truncats, encara que per si sol no fa atòmica tota la col·lecció.

**Validació:** amb snapshot invàlid, registre incoherent o llista bàsica inconsistent, l’ordre ha de sortir amb error i el hash de totes les sortides ha de continuar intacte. Amb dades correctes, una generació seguida de `--check` ha de passar sense diferències.

### T03 · P3 · Confirmat: estat de càrrega incoherent després d’un error

**Evidència:** `pronunciations.js:8`, `:50` i `:104`. `failed` s’inicialitza i es torna a posar a `false`, però mai passa a `true`. Després d’una fallada el missatge general informa de l’error mentre les cel·les continuen mostrant «Carregant…».

**Impacte:** el docent no sap si el reintent és necessari o encara s’està esperant. Forma part de la mateixa reproducció de T01.

**Proposta i validació:** resoldre-ho amb els estats per recurs de T01, en el mateix lot. Després d’un error no pot quedar cap indicador de càrrega actiu d’aquell intent; el reintent ha de restablir-lo només mentre treballa.

### T04 · P2 · Risc de rendiment: dades completes de revisió al navegador

**Evidència:** `pronunciations.js:90` descarrega les dues taules editorials íntegres. En disc ocupen 2.073.087 i 2.131.710 bytes, abans de compressió HTTP. Cada entrada repeteix llengua, varietat, dicció, fonts, notes i camps de revisió. Una projecció central limitada a perfil, ID, mot i IPA ocupa 187.711 bytes en JSON compacte, davant els 2.073.087 bytes actuals.

El preparador també carrega sempre el catàleg actual (414.136 bytes) i el registre amb totes les edicions (1.285.111 bytes), segons `templates/composer.html:22–23`; el reproductor carrega el registre complet (`templates/dictation.html:19`).

**Impacte:** volum i memòria creixents en mòbil/Chromebook i amb més varietats/edicions. No s’ha mesurat una regressió de temps en dispositiu real; no s’han de confondre aquests bytes amb la mida transferida, que pot estar comprimida.

**Proposta:** generar un índex lleuger per al navegador, conservar les taules editorials completes per a consulta/exportació i carregar els detalls quan es demanin. Després, separar els snapshots per edició i carregar el necessari després de descodificar el codi. Fer aquesta segona fase només mantenint vectors i compatibilitat, sense canviar cap snapshot.

**Validació:** mesurar mida comprimida, temps fins al primer full i temps fins a escoltar en un Chromebook/mòbil representatiu. Comparar abans/després i verificar totes les edicions antigues.

### T05 · P2 · Risc de manteniment: comprovacions i dependències poc reproduïbles

**Evidència:** no hi ha `package.json`, lockfile ni flux de comprovació automàtica a `.github/workflows` en aquesta base. El README enumera ordres individuals (`README.md:118–146`) i algunes necessiten biblioteques externes a `PLEC_NODE_MODULES` o Chrome instal·lat (`tools/check-layout-actions.cjs:3–4`, `tools/check-pdf.cjs:4`). Les dependències públiques estan distribuïdes localment amb llicència, fet positiu, però l’entorn de desenvolupament no té un contracte equivalent.

**Impacte:** una altra màquina o una contribució pot executar només part de les proves, utilitzar versions diferents o no saber quines ordres escriuen artefactes. No és una fallada de les comprovacions executades aquí.

**Proposta:** establir versions de Node i dependències de desenvolupament; mantenir un sol punt d’entrada amb grups explícits: pures, dades, navegador, PDF i àudios publicats. La generació/síntesi real ha de continuar fora d’aquestes ordres. Afegir comprovació automàtica local/CI sense verificar el desplegament remot.

**Validació:** clon net + instal·lació documentada + una ordre de proves, sense credencials, serveis externs ni síntesi. El resultat ha d’identificar els grups executats i els omesos amb motiu.

### T06 · P2 · Risc arquitectònic abans del pilot digital

**Evidència:** `app.js:16–107` combina estat del preparador, persistència, selecció d’edició, cerca i actualització directa del DOM. `pronunciations.js:8–116` concentra càrrega, cerca visual, reproducció, notificació, exportació i compatibilitat antiga. `dictation.js` ja separa la sessió pura, però encara coordina navegació, fullscreen, àudio, temporització i analítica.

**Impacte:** afegir respostes digitals i correcció dins d’aquests controladors multiplicaria els estats que s’han de provar conjuntament. No cal moure codi només per reduir línies.

**Proposta:** extraccions petites motivades per funcionalitat: controlador de recursos del catàleg; model del preparador amb transicions explícites; resultat d’exercici separat de reproducció. Mantenir el DOM actual mentre es creen fronteres testables. El pilot digital ha de tenir un model pur de respostes i correcció, sense canviar el motor immutable de selecció.

**Validació:** proves de transicions que cobreixin canviar filtres mentre es cerca, cancel·lar/reprendre, recuperar codi, canviar mode, mantenir varietat i no publicar resultats d’intents antics. Després, les proves d’interacció existents han de continuar passant.

### T07 · P3 · Risc de regressions visuals i codi desconnectat

**Evidència:** `workspace.css:189–221` conserva el layout antic de laterals apilats. `responsive-workspace.css:1–2` declara que l’anul·la i es carrega l’últim (`templates/composer.html:11–18`). `catalog-audio.js` conserva un altre controlador de reproducció, provat per `tools/check-catalog-audio.cjs`, però no es carrega a les plantilles actuals. Hi ha formularis i bindings antics de revisió local ocults a `templates/pronunciation-panel.html:15` i `pronunciations.js:73–85`; la bandera actual envia directament l’avís.

**Impacte:** modificar l’ordre de CSS o prendre una prova d’un controlador antic com a prova del catàleg actual pot produir una confiança incorrecta. No es proposa eliminar compatibilitat de dades sense inventariar-la.

**Proposta:** classificar explícitament peces actives, compatibilitat de dades i codi retirat. Consolidar només les regles de layout del preparador amb matriu de captures; no eliminar `styles.css` globalment perquè també el fa servir el dictat. Retirar o arxivar codi no carregat si no té consumidors, i conservar una prova de migració quan correspongui.

**Validació:** cerca de consumidors, prova del catàleg real, pantalles estretes/amples, temes, diàlegs i impressió. Cap retirada ha de modificar la lectura de codis antics ni perdre anotacions locals.

### T08 · P3 · Decisió pendent: avisos vinculats a analítica

**Decisió de l’usuari, 26/10/2026:** mantenir el funcionament de banderes i les instruccions existents de privacitat. No es crea cap transport alternatiu ni formulari anònim. Es potencia l’enllaç al repositori per proposar una correcció/PR, ara visible al peu del catàleg i a la guia pública. GPC/DNT i la confirmació de recepció es mantenen. La proposta original que segueix queda tancada amb aquesta decisió.

**Evidència:** `pronunciations.js:31–44` desactiva les banderes si l’estat d’analítica no és `ready`; `analytics.js:47–52` respecta GPC/DNT encara que hi hagi permís temporal. Aquesta política està documentada i les proves la confirmen.

**Impacte:** en navegadors privats, bloquejadors o quan Umami falla no hi ha una via operativa per enviar una incidència d’àudio. És una decisió de producte actual, no un error nou ni una proposta de desactivar proteccions.

**Proposta:** abans d’obrir una revisió comunitària extensa, decidir si es manté aquesta limitació o s’ofereix una alternativa explícita (per exemple, copiar un informe mínim). Separar la interfície «notificar una incidència» del transport Umami perquè es pugui substituir sense reescriure el catàleg.

**Validació:** amb analítica bloquejada, no enviar res sense consentiment ni contradir GPC/DNT; si hi ha alternativa, ha d’indicar clarament que el text només s’ha preparat/copiat i no que ja s’ha rebut.

### T09 · P3 · Límit de disseny de les llavors, preservat i documentable

**Evidència:** `seeds-v2.js:6–7` reserva nou edicions i el registre ja n’utilitza quatre (`catalogs/ca/editions/manifest.json`). Una ampliació del catàleg i un subconjunt bàsic poden consumir slots diferents. Les llengües tenen registres separats.

**Impacte:** no és un límit imminent per al pilot, però el protocol actual no permet una successió il·limitada de revisions. Canviar les dades dels slots antics per evitar-lo trencaria el compromís principal dels codis impresos.

**Proposta:** mantenir el lector V1/V2 intacte, fer servir edicions només quan canviï la selecció i planificar un futur format abans d’esgotar els cinc slots restants. No consumir-ne un només per una revisió d’IPA, una veu, una explicació o un canvi visual que no altera la selecció.

**Validació:** tots els vectors antics han de passar amb cada nova edició. Qualsevol format successor ha de coexistir amb els lectors antics.

### T10 · P3 · Confirmat: README amb informació funcional contradictòria

**Evidència:** `README.md:19` encara descriu un selector del catàleg i variants no disponibles mentre que `:23` anuncia els dos lots complets. `:27` conserva una mostra de dièresis pendent que ja no descriu l’estat global. La descripció posterior de l’arquitectura i de la versió és més actual.

**Impacte:** dificulta orientar un col·laborador i distingir què falta revisar lingüísticament de què ja està publicat tècnicament.

**Proposta:** reescriure el resum de l’estat actual i moure l’evolució passada al changelog. Distingir «generat/publicat», «proposta IPA» i «validat auditivament». No cal reescriure les notes històriques de `VERIFICACIO.md`.

**Validació:** seguir el README des d’un clon net; les instruccions i capacitats descrites han de correspondre a la interfície actual.

**Actualització del mateix 26/10:** el lliurament de l’auditoria corregeix aquests paràgrafs del README i hi afegeix l’estat de la consolidació. La troballa descriu la base `6bc8092`; no implica que les altres correccions proposades ja s’hagin implementat. La reproduïbilitat des d’un clon net (T05) continua pendent.

## Lots petits proposats

| Ordre | Lot | Resultat verificable |
| --- | --- | --- |
| 1 | Robustesa del catàleg: T01 + T03 | Una taula IPA fallida no impedeix escoltar; estats i reintents coherents, amb prova d’errors injectats. |
| 2 | Generació segura: T02 | Cap sortida modificada si falla la validació; comprovació de no modificació i `--check` posterior. |
| 3 | Entorn i porta de qualitat: T05 + T10 | Una ordre documentada de verificació i resum funcional actualitzat, sense síntesi ni desplegament remot. |
| 4 | Dades de navegador: primera part de T04 | Índex IPA lleuger i exportació completa conservada; comparació de mida i temps. |
| 5 | Neteja dirigida: T06 + T07 | Una frontera funcional extreta cada vegada, sense canvi visual; classificació del codi antic i CSS de layout consolidat amb captures. |
| 6 | Pilot digital | Model pur de respostes/correcció sobre la selecció actual; provar-lo en català abans d’ampliar idiomes. |

T08 és una decisió de producte separada; T09 només requereix conservar i vigilar el contracte actual. La revisió de pronunciacions i la preparació balear poden avançar en paral·lel perquè són dades i política lingüística, sense haver de reescriure el preparador.

## Criteri de tancament de la consolidació

Es pot iniciar el pilot digital quan T01–T03 estan resolts, s’han atès les barreres de teclat/reflow de l’auditoria complementària, existeix una porta clara de verificació i s’han mantingut els vectors antics, el PDF d’una pàgina, les dues varietats sense substitució i les interaccions actuals. Les optimitzacions de càrrega i neteja CSS poden continuar en lots independents; no han de convertir-se en una reescriptura general que ajorni indefinidament el pilot.

## Lliurament 1.27 i treball diferit

- **T01/T03:** `catalog-resources.js` extreu càrrega/estats/reintents del controlador. Identitat del mot des del banc, manifests i IPA independents, timeout i reintent selectiu. Una fallada no bloqueja els recursos sans ni mostra «Carregant…» indefinidament.
- **T02:** preparació i validació de totes les llengües, renderització íntegra en memòria i publicació final amb temporal/substitució per fitxer. Entrades invàlides no produeixen cap escriptura. No s’afirma atomicitat del conjunt davant un error físic durant la publicació.
- **T04, primera part:** índexs del navegador de 279.760 / 278.680 / 272.377 bytes (central/valencià/mallorquí), separats de les fonts editorials completes. La càrrega diferida de snapshots antics queda pendent; cap edició es modifica.
- **T05:** Node i dependències fixats, lock npm real, porta de comprovació amb grups explícits i CI sense síntesi ni comprovació del desplegament. L’execució històrica del controlador retirat no es confon amb les proves del catàleg vigent.
- **T06:** primera frontera extreta (recursos del catàleg). Model del preparador i correcció digital diferits; no s’hi afegeix ara cap mecanisme de puntuació.
- **T07:** peces de compatibilitat identificades a la porta/guia de desenvolupament; es conserven dades i formularis antics. No es retira CSS global ni es fa una migració d’anotacions durant aquest lot. La consolidació més àmplia de capes queda pendent.
- **T09:** contracte i quatre snapshots preservats; no es consumeix una edició per IPA, àudio o UI. **T10:** resum funcional actualitzat.
