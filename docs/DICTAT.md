# Primera versió del dictat oral

## Entrada i identitat

Ruta estàtica per llengua: `/ca/dictat/?seed=TCD7AAAAA&catalogue=ca-2026-01-draft.ee94edbd3b2d4fb4`. Es preserva el subdirectori de GitHub Pages, sense fixar domini. El preparador ofereix entrada general, obertura del dictat vigent i còpia de l’enllaç d’alumnat. El codi es pot introduir manualment; un enllaç o futur QR el precarrega, sense iniciar cap reproducció. Els enllaços antics `/ca/?mode=dictat&...` es redirigeixen abans de modificar el preparador.

La recuperació utilitza els motors i les instantànies publicades, sense canviar mots ni ordre. Es comproven llengua i catàleg. Un codi erroni mostra un error visible; no es genera un substitut aleatori.

## Activitat

La primera fase és **escriure al full**. Les instruccions indiquen el nombre de mots i com acabar autocorregint amb el paper. Es pot ajustar el ritme a 1 o 0,85 abans de començar, preservant el to. Durant l’activitat només es mostren el botó d’escolta, el número de mot i el comptador d’escoltes, amb una sortida discreta.

Cada mot requereix tres escoltes completades. Després apareix «Paraula següent» o «Acaba el dictat». No hi ha avanç automàtic, retorn a mots anteriors ni quarta escolta. Un error de reproducció o una escolta interrompuda no compta. El final convida a desplegar el full; no mostra models ni nota. El mode digital, el retorn a Classroom i el QR imprès queden pendents.

La lectura d’instruccions utilitza provisionalment la veu catalana del navegador, només si n’hi ha una. Si no, ho indica i manté el text disponible. **Les paraules utilitzen sempre MP3 estàtics**, sense TTS del navegador ni peticions a Azure. Més endavant es podrà enregistrar també el text d’instruccions.

## Pantalla completa i pauses

«Comença a pantalla completa» fa la petició dins del clic de l’usuari. El navegador permet sortir-ne: una pàgina web no és un mode quiosc. Sortir de pantalla completa o ocultar la pestanya atura l’àudio, invalida la reproducció pendent i mostra una pausa. Tornar a la pestanya no reprèn automàticament. El botó de continuació torna a demanar pantalla completa. [Comportament de l’API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide).

Si el dispositiu no admet pantalla completa o la rebutja, hi ha una continuació explícita en mode concentració. També pausa si es canvia de pestanya. Els esdeveniments o promeses d’una sessió antiga no poden modificar una sessió nova.

## Àudios i prova local

El reproductor carrega un manifest i comprova paquet, llengua, rutes MP3 segures i cobertura completa abans d’habilitar l’inici. El manifest públic continua `pending` i buit: els àudios generats encara no s’han publicat ni donat per validats lingüísticament.

Per provar la interfície amb els MP3 ja disponibles hi ha un manifest **només local**, `output/audio/player-preview-manifest.json`, amb les mateixes identitats i rutes. L’excepció `preview=local` només s’admet a localhost, 127.0.0.1 o [::1]. No es publica el manifest de prova ni es modifica el públic. La pantalla inicial avisa que és una prova amb àudios pendents de revisió.

`node tools/prepare-player-preview.cjs` crea o actualitza aquest manifest sense xarxa. Comprova els ajustos del paquet i els fitxers disponibles; no carrega credencials ni activa àudios al web públic. Un MP3 amb capçalera correcta encara necessita revisió de pronunciació.

Mostra local: `http://127.0.0.1:4176/ca/dictat/?seed=TCD7-AAAAA&preview=local`. Són 16 mots del focus h, cicle mitjà, recuperables amb el protocol ordinari; no s’han injectat mots ni alterat la llavor. El codi antic equivalent és `52E-4S3`.

## Comprovacions

`check-dictation-session.cjs` comprova el motor pur: tres escoltes, errors, pauses, tokens antics, reset i finalització. `check-dictation.cjs` comprova recuperació antiga/nova, ordre, llengua, catàleg, cobertura, veu, rutes i recursos generats. Les instantànies i els motors no s’han modificat.

En la integració s’ha executat una prova local amb Chrome: recorregut complet de 16 × 3 escoltes amb àudio simulat, errors síncrons i promeses rebutjades, pausa, respostes antigues, canvi de codi, absència de cobertura i enllaç antic. Una passada separada, sense mocks, ha reproduït un MP3 real fins a `ended` i ha entrat a pantalla completa. Comprovat també que la vista mòbil no desborda horitzontalment. Això verifica funcionament; l’escolta docent continua sent necessària per validar la pronunciació.
