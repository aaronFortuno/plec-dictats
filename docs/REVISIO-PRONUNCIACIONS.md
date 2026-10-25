# Revisar les pronunciacions al web

Obre **El catàleg**. Una única vista mostra els mots, focus, IPA i àudios de les dues varietats, amb cerca, nivell i inicial compartits. La ruta `/ca/pronunciacions/` també hi porta. Un enllaç individual ressalta el mot al llistat sense omplir la cerca.

Cada fila mostra **mot i focus | central · Alba | valencià · Enric**. Prem la IPA o l’altaveu per sentir l’enregistrament disponible; el mot es ressalta durant la reproducció. No es reprodueixen dos àudios alhora. En mòbil les dues varietats queden juntes sota cada mot. Els filtres són fixos i només es desplaça el llistat; s’afegeixen fins a 50 files per tanda per mantenir-lo àgil.

## Notificar un error

1. Prem la **bandera** al costat de la varietat corresponent.
2. Indica si és un error de **l’àudio** o de **la transcripció IPA**, i què cal revisar.
3. **Desa** conserva la incidència en aquest navegador. **Obre a GitHub** també obre un esborrany amb mot, varietat, observació i versió; l’usuari inicia sessió i decideix enviar-lo. No hi ha enviament automàtic ni formulari anònim.

Torna a prémer la bandera per editar o retirar la incidència. No cal marcar abans cap polze ni nota. Les aprovacions i anotacions d’iteracions anteriors es conserven a l’exportació, tot i que ja no tenen controls propis a la interfície.

Cada incidència d’àudio identifica el mot, perfil, paquet i empremta dels ajustos exactes. Les incidències IPA identifiquen el perfil i la transcripció literal. Un enregistrament nou no hereta una revisió d’un altre. La IPA mostrada és la proposta actual: els originals d’Alba no s’han sintetitzat necessàriament amb aquesta transcripció. Les dues taules estan completes com a propostes, pendents de contrast lingüístic; l’existència d’un MP3 no implica validació auditiva.

## Exportar i reprendre

**Exporta incidències** desa un JSON amb totes les versions i anotacions. Es pot passar al mantenidor pel xat, adjuntar a GitHub o importar en un altre dispositiu. **Importa incidències** comprova el fitxer complet abans d’aplicar-lo i conserva la dada més recent de cada versió, incloses les incidències retirades. Una importació invàlida no esborra res.

Les dades es desen localment amb la clau `plec-pronunciation-reviews-v1`. No hi ha comptes ni sincronització. Si el navegador impedeix desar-les, apareix un avís; exporta-les abans de sortir.

**Descarrega les IPA** reuneix central i valencià en un únic CSV amb els estats de proposta. Els TSV originals continuen sent fonts d’edició del projecte, però no cal obrir-los per consultar ni notificar errors.

## Identitat dels enregistraments

`node tools/prepare-review-audio.cjs` indexa els MP3 locals i els ajustos exactes, sense síntesi ni publicació. Associa la IPA usada a la síntesi només si coincideix amb l’empremta de les transcripcions congelades.

La vista local utilitza `output/audio/review-manifest.json`; el web publicat utilitza `audio/review-manifest.json`. Les preferències de publicació trien els originals o les substitucions millorades segons el feedback docent. Un enllaç individual pot identificar una prova concreta. Cap incidència modifica directament el banc, les IPA ni els MP3.
