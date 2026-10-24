# Primera versió del dictat oral

## Entrada i identitat

Ruta estàtica per llengua: `/ca/dictat/?seed=TCD7AAAAA&catalogue=ca-2026-01-draft.ee94edbd3b2d4fb4`. Es preserva el subdirectori de GitHub Pages, sense fixar domini. El preparador ofereix entrada general, obertura del dictat vigent i còpia de l’enllaç d’alumnat. El codi es pot introduir manualment; un enllaç o futur QR el precarrega, sense iniciar cap reproducció. Els enllaços antics `/ca/?mode=dictat&...` es redirigeixen abans de modificar el preparador.

La recuperació utilitza els motors i les instantànies publicades, sense canviar mots ni ordre. Es comproven llengua i catàleg. Un codi erroni mostra un error visible; no es genera un substitut aleatori.

## Activitat

La primera fase és **escriure al full**. Les instruccions indiquen el nombre de mots i com acabar autocorregint amb el paper. Es pot ajustar el ritme a 1 o 0,85 abans de començar, preservant el to. Durant l’activitat només es mostren el botó d’escolta, el número de mot i el comptador d’escoltes, amb una sortida discreta.

Cada mot requereix tres escoltes completades. Després apareix «Paraula següent» o «Acaba el dictat». No hi ha avanç automàtic, retorn a mots anteriors ni quarta escolta. Un error de reproducció o una escolta interrompuda no compta. El final convida a desplegar el full; no mostra models ni nota. El mode digital, el retorn a Classroom i el QR imprès queden pendents.

Les instruccions i les paraules utilitzen **MP3 estàtics**, sense TTS del navegador ni peticions a Azure des del web. Les cinc locucions d’instruccions comparteixen el text exacte amb la pantalla, per a 8, 12, 16, 20 i 24 mots. Si la locució encara no està disponible, el text es manté visible i es pot començar el dictat igualment. La lectura es pot aturar i no compta com a escolta d’un mot; s’atura en començar l’activitat, sortir o ocultar la pestanya.

El botó de sol/lluna del header canvia l’aparença **clar/fosc**, la desa al dispositiu i la comparteix entre preparador i dictat. A la primera visita se segueix el sistema. El botó desapareix durant el dictat i les pauses per mantenir la pantalla neta. El full imprimible i el PDF conserven el paper clar.

## Pantalla completa i pauses

«Comença a pantalla completa» fa la petició dins del clic de l’usuari. El navegador permet sortir-ne: una pàgina web no és un mode quiosc. Sortir de pantalla completa o ocultar la pestanya atura l’àudio, invalida la reproducció pendent i mostra una pausa. Tornar a la pestanya no reprèn automàticament. El botó de continuació torna a demanar pantalla completa. [Comportament de l’API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide).

Si el dispositiu no admet pantalla completa o la rebutja, hi ha una continuació explícita en mode concentració. També pausa si es canvia de pestanya. Els esdeveniments o promeses d’una sessió antiga no poden modificar una sessió nova.

## Àudios i prova local

El reproductor carrega un manifest i comprova paquet, llengua, rutes MP3 segures i cobertura completa abans d’habilitar l’inici. El manifest públic continua `pending` i buit: els àudios generats encara no s’han publicat ni donat per validats lingüísticament.

Per provar la interfície amb els MP3 ja disponibles hi ha un manifest **només local**, `output/audio/player-preview-manifest.json`, amb les mateixes identitats i rutes. L’excepció `preview=local` només s’admet a localhost, 127.0.0.1 o [::1]. No es publica el manifest de prova ni es modifica el públic. La pantalla inicial avisa que és una prova amb àudios pendents de revisió.

`node tools/prepare-player-preview.cjs` crea o actualitza aquest manifest sense xarxa. Comprova els ajustos del paquet i els fitxers disponibles; no carrega credencials ni activa àudios al web públic. Un MP3 amb capçalera correcta encara necessita revisió de pronunciació.

Les instruccions tenen un manifest públic separat, `audio/instructions/manifest.json`, també pendent de revisió. `node tools/run-instructions-batch.cjs` calcula cinc peticions sense xarxa. Amb `--execute --after-words`, espera que el lot principal consti com a completat i que s’hagi alliberat el bloqueig de pressupost. Si el lot s’atura o deixa de tenir un procés actiu, la cua s’atura sense començar ni reintentar. Comparteix `usage.json`, el senyal STOP, la separació entre peticions i la represa dels MP3 existents. No hi ha dos generadors fent peticions simultàniament.

Els resultats queden a `output/audio/ca-central-alba-instructions-v1/instructions/` i el manifest de prova a `output/audio/instructions-preview-manifest.json`. Només el mode local els carrega; el públic no s’activa automàticament. La identitat del paquet inclou una empremta del text: canviar-lo exigeix un paquet nou per evitar reaprofitar una locució antiga. Cal versionar també `textVersion` i el contracte del reproductor quan canviïn les instruccions.

Quan acaba la generació, `output/audio/instruccions.html` permet escoltar les cinc locucions juntes, amb el text corresponent, abans d’aprovar-les. L’estat de la cua és a `output/audio/instruction-status.json`.

Mostra local: `http://127.0.0.1:4176/ca/dictat/?seed=TCD7-AAAAA&preview=local`. Són 16 mots del focus h, cicle mitjà, recuperables amb el protocol ordinari; no s’han injectat mots ni alterat la llavor. El codi antic equivalent és `52E-4S3`.

## Comprovacions

`check-dictation-session.cjs` comprova el motor pur: tres escoltes, errors, pauses, tokens antics, reset i finalització. `check-dictation.cjs` comprova recuperació antiga/nova, ordre, llengua, catàleg, cobertura, veu, rutes i recursos generats. Les instantànies i els motors no s’han modificat.

En la integració s’ha executat una prova local amb Chrome: recorregut complet de 16 × 3 escoltes amb àudio simulat, errors síncrons i promeses rebutjades, pausa, respostes antigues, canvi de codi, absència de cobertura i enllaç antic. Una passada separada, sense mocks, ha reproduït un MP3 real fins a `ended` i ha entrat a pantalla completa. Comprovat també que la vista mòbil no desborda horitzontalment. Això verifica funcionament; l’escolta docent continua sent necessària per validar la pronunciació.

L’aparença s’ha comprovat en Chrome amb preferència del sistema, canvi en directe, persistència entre pantalles, mòbil i impressió. Per a les instruccions s’han simulat els MP3 i els errors: aturada, callbacks antics, pestanya oculta i inici del dictat sense consumir escoltes. `check-instructions.cjs` comprova sense xarxa l’espera del lot, les cinc llargades, les rutes, el registre compartit, la represa i la invalidació quan canvia el text. Les cinc locucions Azure reals ja s’han generat localment; l’aprovació auditiva continua pendent.

## Consulta oral del catàleg

El catàleg docent utilitza `catalog-audio.js`, amb la mateixa validació de manifest de `audio-manifest.js` que el reproductor d’alumnat. Només reprodueix a petició, un mot cada vegada; tornar a prémer atura el mot. Canviar filtres, lletra, tancar el diàleg o ocultar la pàgina atura l’àudio. Els mots sense cobertura mantenen l’altaveu desactivat.

`node tools/prepare-catalog-preview.cjs` construeix un índex de revisió **sense síntesi ni xarxa**, combinant els MP3 locals existents i les mostres IPA. Només s’utilitza des de loopback, a `output/audio/catalog-preview-manifest.json`; no altera el manifest públic ni el manifest de prova de l’alumnat. Les mostres més recents tenen prioritat per a l’audició docent, sense considerar-les aprovades.

Si hi ha revisió auditiva del paquet, els resultats `unresolved` i `original-preferred` no substitueixen l’original del catàleg local. Això conserva, entre d’altres, l’original de «canviïn», preferit pel docent. Els sis mots amb dièresi millorats mantenen la prova IPA per a la consulta local; aquesta preferència no publica cap MP3 ni valida lingüísticament les transcripcions.
