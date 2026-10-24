# Primer perfil de pronunciació valenciana

La font editable és `audio/pronunciation/ca/valencian-didactic.tsv`: 3.299 files sobre les mateixes grafies i ID del banc, amb **22 propostes** i 3.277 transcripcions pendents. No s’ha copiat ni convertit automàticament la IPA central. Cap fila està lingüísticament validada. Els exports JSON i TXT són dades obertes derivades del TSV, no fonts per editar.

Les propostes són editorials, orientades per la [Gramàtica normativa valenciana de l’AVL, capítol 1](https://www.upv.es/entidades/spnl/wp-content/uploads/2023/11/gramatica_normativa_valenciana.pdf): vocals àtones generalment plenes, consonants palatals i erra final. La geminació explícita és una elecció didàctica; no es presenta com l’única pronunciació valenciana acceptable. Les fonts són de regles generals, no transcripcions exactes del DNV de cadascuna de les formes. Cal contrastar els timbres i les variants locals abans de validar.

## La taula no és encara una adaptació lèxica del banc

Pronunciar el banc compartit amb un altre perfil no substitueix revisar quines grafies, formes verbals i variants són adequades per a l’alumnat valencià. Aquesta adaptació pot requerir una edició pròpia. No es canvia, per exemple, la grafia d’un mot d’un codi existent per ajustar-la a una altra varietat.

## Mostra amb una altra veu

`audio/pronunciation/ca-valencian-pilot.json` identifica la primera selecció. S’utilitza **Enric** com a veu candidata, diferent d’Alba. Microsoft la registra com a veu catalana ca-ES, sense certificar-la com a valenciana. [Veus disponibles](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts).

La taula conserva **/v/** en «vi» i «vaca». El [conjunt de fonemes documentat d’Azure ca-ES](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets#ca-es) no inclou aquest fonema. L’edició de la taula l’admet, però la preparació del pilot l’exclou de les peticions. No es transforma v en b per fer-la compatible amb el motor. Aquesta és una limitació de la prova actual, no una regla lingüística. Cal estudiar una veu o motor que el resolgui, o enregistrament manual, abans d’oferir el perfil complet amb aquesta distinció.

La primera mostra té **20 peticions i 1.702 caràcters estimats**, amb MP3 mono, els mateixos ajustos de ritme i un paquet separat `ca-valencian-enric-pilot-v1`. No substitueix originals ni activa el selector públic. La pàgina local de comparació és `output/audio/comparacio-valencia.html`; l’estat, `output/audio/valencian-pilot-status.json`. L’original de comparació és el perfil central amb Alba, no una referència valenciana validada. Alguns timbres i la dicció necessiten revisió explícita.

El pilot s’ha generat el 24/10/2026: els 20 MP3 passen la reproducció tècnica fins al final. Encara falta escolta docent. El registre local queda en 121.529 caràcters aquest mes, amb 278.471 disponibles fins al límit preventiu de 400.000; és una estimació local, no una consulta del consum real d’Azure.

```text
node tools/pronunciation-table.cjs --profile ca-valencian-didactic-v1 --export
node tools/pronunciation-table.cjs --profile ca-valencian-didactic-v1 --check
node tools/prepare-valencian-pilot.cjs --write
node tools/run-valencian-pilot.cjs
```

Aquestes ordres no fan peticions ni llegeixen credencials. La síntesi real requereix `node tools/run-valencian-pilot.cjs --execute --confirm-f0`, després de revisar la mostra. Comparteix registre de consum, bloqueig de quota, senyal STOP, separació mínima de quatre segons, represa i absència de reintents Azure. Refusa començar mentre els lots de mots i instruccions no constin acabats o hi hagi un bloqueig. Una IPA o un ajust canviat exigeix un ID de paquet nou.

## Abans d’un lot complet

Cal revisar les 22 propostes inicials, escoltar el pilot, resoldre la limitació /v/, completar i contrastar les transcripcions necessàries, decidir les formes lèxiques i calcular el pressupost de la passada real. La validació lingüística i l’aprovació de cada enregistrament continuen separades.
