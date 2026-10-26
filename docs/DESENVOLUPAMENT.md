# Entorn i porta de qualitat

El web continua essent estàtic. Les dependències següents són només eines de desenvolupament i comprovació; no introdueixen cap procés Node al web publicat.

## Clon net

L’entorn comprovat és **Node 24.22.1**, fixat a `.nvmrc` i `package.json`, amb **pdf-lib 1.17.1** i **Playwright 1.62.1**. El Node disponible en aquest equip el 26/10/2026 retorna 24.22.1; les notes històriques de 24.19 descriuen l’entorn anterior. `package-lock.json` fixa també dependències transitives i integritats.

```text
nvm use
npm ci --ignore-scripts
node tools/check-all.cjs
```

`nvm use` és opcional si Node ja coincideix; amb altres gestors, selecciona la mateixa versió. El lock s’ha generat amb **npm 11.6.2**, indicat a `packageManager`; no cal instal·lar res globalment per desenvolupar el web. `npm ci` utilitza el lock, falla si és incompatible amb el manifest i no l’actualitza. `--ignore-scripts` evita scripts d’instal·lació de paquets. [Documentació oficial de npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/).

L’ordre directa funciona igual que `npm run check`. Comprova versions i falla si falta una dependència o no coincideix. En l’entorn integrat es pot indicar explícitament `PLEC_NODE_MODULES` amb el directori de biblioteques externes; no és una dependència d’aquest camí personal al repositori. Les versions s’hi comproven igualment.

## Grups i abast

| Grup | Per defecte | Contingut |
| --- | --- | --- |
| `pure` | Sí | Nucli, codis V1/V2, estat del dictat, filtres, URL, recursos, privacitat i substitució local de fitxers. |
| `data` | Sí | Generació reproduïble, fallades del generador, edicions congelades, vocabulari, propostes IPA i integritat/cobertura dels MP3 publicats. |
| `audio-mock` | Sí | SSML, pressupost, bloqueigs, represa i errors amb transport simulat. Cap veu real. |
| `pdf` | Sí | Genera PDF temporals a `tmp/` i `output/`; comprova pàgina A4, variants de plec i codis. No certifica accessibilitat de PDF. |
| `browser` | `--browser` | Preparador, catàleg real, ús tàctil, recuperació, errors injectats, focus, ampliació i moviment reduït en Chrome local. |
| `compatibility` | `--compatibility` | Controlador d’àudio retirat i dades/eines de revisió antigues. No prova la interfície actual. |

Els grups no demanats s’anuncien explícitament; no es presenta una execució sense navegador com una prova de tota la interfície. Una prova que falla retorna un estat d’error, encara que es continuïn les altres per recopilar-ne el resultat. `--list` mostra el pla sense executar-lo. Qualsevol fitxer nou `check-*.cjs` s’ha de classificar al corredor: un fitxer desconegut fa fallar la porta, en lloc de quedar ignorat.

Les proves no necessiten credencials. El corredor retira les variables Speech/Azure/ARM dels processos de prova i bloqueja peticions HTTP/HTTPS/fetch de Node que no siguin a loopback. Els generadors es comproven amb transports injectats. Les proves del navegador treballen amb el servidor local, analítica desactivada en local o un receptor simulat; no comproven el desplegament remot ni envien incidències reals. Aquest bloqueig és una protecció per als tests de Node, no una política general de xarxa del navegador.

## Navegador

Cal Chrome instal·lat. Les proves actuals fan servir `channel: 'chrome'`, també per comprovar MP3 amb el navegador oficial. [Canals i còdecs a Playwright](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge).

La versió de Chrome és la del canal estable disponible a l’equip, no una dependència fixada pel lock de npm; el corredor n’imprimeix la versió per deixar traça de la comprovació. Les versions fixades de Node i de biblioteques no són una garantia de captures idèntiques entre sistemes operatius, tipus de lletra o versions del navegador.

Amb el servidor propi ja engegat a `http://127.0.0.1:4176/`:

```text
node tools/check-all.cjs --browser
```

Per fer-ho en una sola ordre des d’un clon sense servidor:

```text
node tools/check-all.cjs --browser --start-server
```

El corredor reutilitza un servidor local de Plec existent. Si l’ha d’arrencar, el llança ocult, espera que respongui i atura **només el procés que ha creat** en acabar, també si una prova falla. No tanca servidors d’altres sessions. No descarrega ni instal·la Chrome automàticament al teu ordinador; si falta, ho indica.

En CI, l’agent és efímer i pot instal·lar Chrome amb `npx playwright install --with-deps chrome`, tal com permet la [CLI de Playwright](https://playwright.dev/docs/browsers#installing-google-chrome--microsoft-edge). El flux `.github/workflows/check.yml` instal·la les versions fixades, inicia el servidor local i inclou navegador i compatibilitat. Només té permís de lectura del repositori; no desplega, no publica fitxers ni comprova el web remot. El resultat remot del flux no es consulta des d’aquesta sessió: el revisa l’usuari.

## Quan cal regenerar

Les comprovacions **no regeneren els HTML ni els catàlegs per ocultar diferències**. Si s’han editat plantilles, fonts o propostes, prepara’n les sortides explícitament i revisa el diff abans de tornar a passar la porta:

```text
node tools/build-catalogs.cjs
node tools/build-pronunciation-index.cjs
node tools/check-all.cjs --browser --start-server
```

La validació del generador ha d’acabar abans que comenci la publicació; cada fitxer es reemplaça amb un temporal. Això no converteix tota la col·lecció en una transacció indivisible. Els TXT de revisió editats a mà no se sobreescriuen i les instantànies de codis ja publicats no es modifiquen. Editar el TSV d’IPA requereix també l’exportació del perfil corresponent, segons la guia de pronunciació.

Cap ordre d’aquesta guia porta `--execute` de síntesi. La creació d’àudios reals continua essent un flux separat amb pla, pressupost i paquet identificats.
