# Revisar les pronunciacions al web

La vista **Pronunciacions i revisió**, dins del mateix popup d’**El catàleg**, mostra cada mot amb **català central i valencià costat per costat**. La icona de parla canvia de vista sense sortir del catàleg. Els filtres i les exportacions queden fixos; només es desplaça el llistat. La ruta `/ca/pronunciacions/` redirigeix a aquesta vista. L’enllaç individual selecciona també l’enregistrament que s’acabava d’escoltar, quan està disponible. No s’inicia cap reproducció automàtica.

La cerca treballa sobre els 3.299 mots i les inicials permeten navegar sense carregar totes les files al DOM. Es mostren fins a 50 mots d’una inicial cada vegada, amb un botó per ampliar. Els filtres permeten trobar àudios pendents, àudios correctes, incidències o mots amb IPA. En mòbil, cada mot manté les dues varietats juntes.

## Què es revisa

- **Àudio:** altaveu, polze amunt, polze avall i anotació. El selector distingeix originals i proves IPA; l’original d’Alba no s’ha sintetitzat necessàriament amb la transcripció que mostra la taula.
- **IPA:** el botó de bandera anota una incidència de transcripció, independent de la locució. Una casella buida continua sent pendent.

Cada anotació d’àudio conserva mot, ID, perfil, paquet i empremta dels ajustos exactes. Una substitució amb un altre paquet o empremta no hereta una aprovació anterior. Les anotacions IPA corresponen al perfil i a la transcripció literal. Es pot marcar un àudio correcte sense validar lingüísticament la IPA.

Els comptadors i el filtre d’incidències corresponen als enregistraments seleccionats i a la IPA actual. Les notes d’altres versions es conserven a l’exportació. Tornar a prémer un polze en desfà la selecció. Les anotacions es desen en escriure; no cal un botó de guardar.

## Desar i compartir

Les dades es desen **en aquest navegador**, amb la clau `plec-pronunciation-reviews-v1`. No hi ha comptes, sincronització ni enviament a un servidor. Si el navegador bloqueja el desament o s’esgota l’espai, apareix un avís i les notes de la sessió continuen exportables.

**Exporta la revisió** desa un JSON que es pot passar al mantenidor pel xat o adjuntar a una incidència. Inclou tant anotacions com aprovacions i les identitats de versió. **Importa una revisió** permet reprendre-la en un altre navegador: comprova el fitxer complet abans d’aplicar-lo i conserva la revisió més recent de cada versió, incloses les seleccions desfetes. Una importació invàlida no esborra dades.

**Descarrega les dues taules** genera un únic CSV amb mot, IPA central, IPA valenciana i estats de proposta. Aquest fitxer és una alternativa a la consulta web; no és necessari per utilitzar la pantalla. Els TSV originals continuen sent fonts d’edició per al projecte.

## Notificacions de la comunitat

**Envia errors a GitHub** obre un esborrany amb un resum acotat de les incidències actuals. L’usuari inicia sessió i confirma l’enviament a GitHub; pot adjuntar-hi el JSON exportat per conservar totes les versions i notes. No es publica ni s’envia res des de Plec automàticament. No hi ha formulari anònim ni infraestructura pròpia de recepció. El fitxer exportat serveix també per als usuaris que prefereixen comunicar-se per un altre canal. [Funcionament de les incidències a GitHub](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue).

## Àudios locals i públics

`node tools/prepare-review-audio.cjs` prepara un índex local dels MP3 existents, inclosos els originals d’Alba i les diferents proves IPA. No sintetitza ni publica res. L’índex conserva les empremtes i només associa una IPA actual a una prova si coincideix l’empremta de les transcripcions de síntesi.

Des de loopback es llegeix `output/audio/review-manifest.json`; el web públic utilitza `audio/review-manifest.json`, encara buit. La taula i les incidències IPA funcionen sense àudios publicats. Els altaveus i els controls de revisió d’àudio s’activen quan hi ha un enregistrament identificat disponible. Cap anotació canvia els MP3 originals ni les transcripcions del banc.
