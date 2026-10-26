# Revisar les pronunciacions al web

Obre **El catàleg**. Una única vista mostra els mots, focus, IPA i àudios de les dues varietats, amb cerca, nivell i inicial compartits. La ruta `/ca/pronunciacions/` també hi porta. Un enllaç individual ressalta el mot al llistat sense omplir la cerca.

Cada fila mostra **mot i focus | central · Alba | valencià · Enric**. Prem la IPA o l’altaveu per sentir l’enregistrament disponible; el mot es ressalta durant la reproducció. No es reprodueixen dos àudios alhora. En mòbil les dues varietats queden juntes sota cada mot. Els filtres són fixos i només es desplaça el llistat; s’afegeixen fins a 50 files per tanda per mantenir-lo àgil.

## Notificar un àudio

Prem la **bandera** al costat de la varietat corresponent. S’envia a Umami `audio-reported` amb el mot públic, la varietat i la versió exacta de l’enregistrament. No cal formulari, comentari, compte ni exportació.

Durant l’enviament el botó queda inactiu. Només després d’una resposta vàlida del receptor mostra una marca i «Avís enviat». El mateix mot, varietat i versió no es poden tornar a notificar durant aquella pestanya, també si es recarrega. Una nova versió de l’àudio té una identitat diferent.

Si Umami no es pot carregar o no accepta dades, o si el tracking està desactivat, totes les banderes queden inactives. Passa-hi el ratolí o enfoca-les amb el teclat per llegir-ne el motiu. **Privacitat i avisos** permet desactivar l’analítica o permetre-la temporalment durant la pestanya. El permís temporal no anul·la DNT/GPC: aquests senyals s’han de revisar al navegador. No s’esquiven bloquejadors. En local no es carrega Umami ni s’envien avisos.

A Umami, filtra `audio-reported` i consulta `word`, `variety` i `audio_version`. Els recomptes ajuden a prioritzar una revisió manual; no acrediten que la pronunciació sigui incorrecta ni representen persones úniques. La retenció del pla Free és de sis mesos. Umami no manté un estat editorial de pendent/resolt. Aquest canal no garanteix la recepció de totes les incidències.

Cada avís d’àudio identifica el mot, varietat, paquet immutable i empremta dels ajustos exactes. La bandera pública notifica l’enregistrament. Per proposar una correcció editorial detallada o d’IPA es pot utilitzar el repositori. La IPA mostrada és la proposta actual: els originals d’Alba no s’han sintetitzat necessàriament amb aquesta transcripció. Les dues taules estan completes com a propostes, pendents de contrast lingüístic; l’existència d’un MP3 no implica validació auditiva.

## Anotacions anteriors i descàrregues

Les notes de revisió anteriors, amb la clau local `plec-pronunciation-reviews-v1`, es conserven sense enviar-les a Umami. Els mòduls d’importació/exportació continuen al codi per compatibilitat, però els controls antics no formen part del canal públic actual.

**Descarrega les IPA** reuneix central i valencià en un únic CSV amb els estats de proposta. Els TSV originals continuen sent fonts d’edició del projecte, però no cal obrir-los per consultar ni notificar errors.

## Identitat dels enregistraments

`node tools/prepare-review-audio.cjs` indexa els MP3 locals i els ajustos exactes, sense síntesi ni publicació. Associa la IPA usada a la síntesi només si coincideix amb l’empremta de les transcripcions congelades.

La vista local utilitza `output/audio/review-manifest.json`; el web publicat utilitza `audio/review-manifest.json`. Les preferències de publicació trien els originals o les substitucions millorades segons el feedback docent. Un enllaç individual pot identificar una prova concreta. Cap incidència modifica directament el banc, les IPA ni els MP3.
