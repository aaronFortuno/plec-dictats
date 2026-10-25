# Perfil de pronunciació valenciana

La font editable és `audio/pronunciation/ca/valencian-didactic.tsv`: **3.299 files amb IPA proposada**, sobre les mateixes grafies i ID del banc. Les 22 propostes inicials es conserven; les altres 3.277 provenen del conversor obert [catalan2ipa](https://github.com/Connum/catalan2ipa), amb adaptacions editorials. Cap fila no està marcada com a validada lingüísticament.

## Procedència i límits

El conversor té una branca valenciana pròpia; no s’ha copiat la IPA central ni s’han substituït les seves vocals àtones. Les propostes inicials s’orienten per la [GNV de l’AVL, capítol 1](https://www.upv.es/entidades/spnl/wp-content/uploads/2023/11/gramatica_normativa_valenciana.pdf). La resta són resultats de regles, no transcripcions extretes del DNV. Es conserven fonts, mètode i estat de cada fila.

El conversor ha demanat pista per a 415 vocals mitjanes. `valencian-vowel-hints.json` n’explicita la decisió: 95 pistes es basen en excepcions lèxiques obertes d’[eSpeak NG](https://github.com/espeak-ng/espeak-ng/blob/master/dictsource/ca_list), i 320 són propostes editorials pendents de contrast. No es presenten com a comprovacions de diccionari. Cal revisar especialment els timbres, les polisèmies i les variants locals.

El conversor original confon l’accent d’alguns subjuntius amb dièresi. L’adaptació local tracta explícitament actuï, canviïn, continuïn, enviïn, esglaï, estudiïn i triïn i les seves formes incloses al banc; també tanca /e/ en -essin. Es conserven les consonants finals i la geminació l·l del model didàctic. Les equivalències tècniques ɡ→g i d͡z/t͡s→dz/ts no eliminen consonants.

La taula encara no és una adaptació lèxica del banc al valencià: grafies i formes verbals compartides poden necessitar una edició específica més endavant. No es canvien les paraules dels codis existents.

## Enric i la prova de /v/

Microsoft registra [Enric com a veu ca-ES](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts), sense certificar una varietat valenciana. El docent ha aprovat auditivament els 20 mots del pilot; això no valida els altres àudios ni tota la taula.

L’inventari ca-ES publicat no enumera /v/. Una prova real de vi i vaca el 25/10/2026 ha retornat dos MP3 vàlids acceptant aquest fonema, sense transformar-lo en /b/. L’excepció necessita el perfil explícit `ca-valencian-v-experimental`, només en paquets IPA valencians; la resta de paquets continua amb l’inventari estricte. Acceptació tècnica no equival a validació auditiva del so.

## Lot complet iniciat el 25/10/2026

- Paquet: `ca-valencian-enric-ipa-v1`, Enric, velocitat −10%, MP3 mono.
- 3.299 peticions; **288.630 caràcters estimats** incloent el SSML.
- IPA congelada a `audio/pronunciation/recordings/ca-valencian-enric-ipa-v1.json`. Editar després la taula no altera un lot en curs ni la identitat dels MP3 ja generats.
- Estat: `output/audio/valencian-batch-status.json`; registre: `valencian-batch.log`; procés inicial desat a `valencian-launch.json`.
- Reintents transitoris cada minut, mínim quatre segons entre peticions i senyal STOP compartit. Els MP3 complets es reutilitzen en reprendre.
- El llançador manté el sistema despert mentre el seu procés és actiu. No modifica el pla d’energia ni manté la pantalla encesa. No impedeix una suspensió manual ni substitueix un servei d’inici després d’un reinici.
- Seguiment autoritzat cada vint minuts: silenci mentre progressa, revisió de PID i bloqueigs abans de reprendre un procés mort, avís si cal actuar o quan acaba.

Abans del lot hi havia 121.686 caràcters reservats. El total previst és **410.316** abans de reintents. El topall preventiu s’ha ajustat a **450.000**, sota els **500.000 F0** de Microsoft, deixant marge per a reintents. El registre és local i no consulta facturació ni ús extern.

`node tools/run-valencian-batch.cjs` simula sense xarxa. `node tools/start-valencian-batch.cjs` inicia o reprèn el lot en segon pla. No s’ha de duplicar mentre algun generador conservi el lock actiu. Vegeu [represa i proteccions](REPRESA-AUDIO.md).
