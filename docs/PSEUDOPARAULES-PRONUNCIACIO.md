# Lectures proposades de les 96 pseudoparaules

26/10/2026. Les grafies, ID i ordre del banc congelat es conserven. S’hi afegeixen **96 propostes IPA per perfil**, central, valencià i mallorquí de referència editorial Palma: cap transcripció es presenta com a validada. La síntesi balear amb Azure continua en pausa; preparar dades no l’activa.

## Una lectura de referència no és una ortografia normativa

Una pseudoparaula no té una entrada de diccionari ni necessàriament una única escriptura correcta. La IPA fixa **una lectura editorial del model escrit** per fer l’activitat reproduïble. En corregir, s’han d’acceptar o analitzar les grafies compatibles amb el so segons l’objectiu de pràctica: neutralització a/e o o/u, b/v o grafies d’essa no es poden resoldre sempre només escoltant. El model imprès continua essent una proposta, no una prova estandarditzada.

La norma d’accentuació orienta l’accent de la lectura: les grafies amb accent explícit el conserven; les formes sense accent segueixen el patró regular que correspon a la terminació. Exemples: `nupi` té accent inicial, `tapú` final i `dofípol` a la segona síl·laba. Això no significa que s’hagi identificat l’accent històric d’un mot existent. [IEC · Ortografia catalana](https://oiec.iec.cat/), [CPNL · accentuació](https://www.cpnl.cat/gramatica/35/17-l-accentuacio-grafica/nivell/intermedi-2).

## Timbres i varietats

S’utilitzen les branques **ca**, **ca-valencia** i **ca-XB** de [catalan2ipa](https://github.com/Connum/catalan2ipa), sense copiar la transcripció d’un dialecte i reetiquetar-la. Es mantenen les reduccions vocàliques i les diferències de x/j que proposen les branques. Els resultats són aproximacions automàtiques i requereixen contrast i escolta.

Les vocals mitjanes no tenen una font lèxica en una forma inventada. Quan el conversor no pot decidir una e/o tònica, es tria editorialment la **vocal tancada**: pista é per e i ó per o, **només dins del conversor, sense alterar la grafia del banc**. La tria queda registrada a `pseudo-decisions.json` i a les notes de la fila. En altres casos el conversor proposa un timbre per analogia/regles; també es marca com a proposta, no com a decisió normativa. No s’importen pistes de paraules reals.

El perfil mallorquí conserva la neutra tònica en les analogies de sufix que la branca proposa (per exemple, `pirotet`) i la o àtona segons el model. No es promet cobrir totes les localitats ni que l’accentuació d’una paraula inventada determini una única realització dialectal. La referència de Palma i les limitacions del model compartit són a [Decisions fonètiques](DECISIONS-FONETIQUES.md).

No s’afegeix una vocal inicial a **sclaf**: el model proposat és /ˈsklaf/. El grup inicial /skl/ és extraordinari per a una lectura catalana ordinària i s’explicita com a estímul de grup consonàntic, no com una grafia de mot habitual. La [GEIEC, vocal de suport](https://geiec.iec.cat/text/1.3.3) documenta que els grups inicials s + consonant solen rebre una e de suport, fins i tot sense reflex gràfic en alguns manlleus. Per tant, mantenir /skl/ en aquest estímul és una decisió particular de l’activitat, no la regla general catalana. Si el sintetitzador introdueix una vocal o perd una consonant, cal revisar-ne l’adequació a l’objectiu; no s’ha de canviar silenciosament la transcripció per fer-lo passar. La resta de grups (`blis`, `drall`, `grisp`…) conserva les consonants indicades pel model.

## Fitxers i edició

- `audio/pronunciation/ca/pseudo-central-didactic.tsv`
- `audio/pronunciation/ca/pseudo-valencian-didactic.tsv`
- `audio/pronunciation/ca/pseudo-mallorcan-didactic.tsv`

Cada TSV té la mateixa capçalera que les taules de paraules reals: `mot, ipa, llengua, varietat, diccio, estat_ipa, base, fonts, notes, revisor, data_revisio, id`. El camp **mode: pseudo** és al perfil i al JSON derivat. Els fitxers de paraules reals sense mode explícit continuen essent `words`; les seves exportacions no canvien.

Els TSV i TXT de lectura es mostren alfabèticament. La font congelada conserva l’ordre original de les 96 identitats i `pseudo-decisions.json` inclou tant `sourceOrder` com les decisions en aquest ordre. No es modifica cap snapshot ni es consumeix cap nova edició de llavors.

```text
node tools/pseudo-g2p.cjs --fill-missing
node tools/pseudo-g2p.cjs --check
node tools/pronunciation-table.cjs --profile ca-central-pseudo-didactic-v1 --check
node tools/check-pseudo-g2p.cjs
```

`--fill-missing` conserva qualsevol IPA ja present. Després d’una revisió manual del TSV, exporta el perfil amb `pronunciation-table.cjs --profile ID --export` i actualitza les decisions amb el generador. Si una IPA manual difereix de la proposta automàtica, el resum ho indica i calcula l’accent sobre la cadena editada.

## Mostra de control i estimació

La selecció suggerida és **sclaf, fepo, platoll, cunyi, jufell, xanufi, feixum i dofípol**. Cobreix grup inicial extraordinari, timbre mig triat, ll/ny, j/x i diferències dialectals, ei i accent gràfic. No ha estat sintetitzada durant la preparació de dades.

Amb prosody −10 % i un phoneme per pseudoparaula, l’estimació és **8.253 caràcters centrals + 8.260 valencians = 16.513**; el perfil mallorquí representa 8.253 més, però no forma part del lot Azure actiu. El recompte inclou el cos SSML opcional i l’escapament XML, en punts de codi Unicode, sense `speak/voice`, reintents o comparacions. És una estimació fora de línia, no una reserva de quota. Els enregistraments i l’escolta són una fase separada de l’aprovació de la IPA.

## Integritat i publicació dels enregistraments

Els paquets `ca-central-alba-pseudo-ipa-v1` i `ca-valencian-enric-pseudo-ipa-v1` són independents dels de paraules reals: no s’hi barregen ID `s-` i `p-`, ni es canvia el paquet per defecte de paraules. Les seves instantànies de 96 models contenen grafia, IPA i perfil congelats. Un canvi posterior de pronunciació requereix una nova identitat d’enregistrament.

El publicador exigeix el lot complet de 192 enregistraments i una auditoria local prèvia: tots els MP3 s’han de descodificar amb Chromium, tenir capçalera nativa de 24 kHz / 48 kbit/s / mono i conservar el SHA-256 comprovat. També contrasta la veu, la velocitat i les empremtes del contingut i de les IPA amb les instantànies. Cap d’aquestes eines fa peticions de síntesi.

```text
node tools/verify-pseudo-audio.cjs --write
node tools/publish-pseudo-audio.cjs
node tools/check-pseudo-publication.cjs
node tools/check-published-audio.cjs
```

La publicació fa possible reproduir-los i comunicar incidències, amb **revisió auditiva pendent**. Superar els controls tècnics no valida ni el timbre triat editorialment ni la realització del sintetitzador; les transcripcions continuen essent propostes. El resum públic és `audio/pseudo-publication.json`; els mapes de revisió conserven les IPA exactes utilitzades per cada àudio. La proposta mallorquina es manté en pausa, sense paquet de reproducció.
