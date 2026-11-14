# Pseudoparaules de Plec en castellà

El [banc editorial de 100 formes](../catalogs/es/pseudo/ampliacion-01.tsv) està preparat per a un futur lot de síntesi. Cada fila conté la grafia de referència, la lectura fonològica en AFI per a l’espanyol d’Espanya (`es-ES`) i els identificadors dels focus. L’ordre és alfabètic segons la col·lació castellana.

| Focus | Formes | Criteri |
| --- | ---: | --- |
| Síl·labes simples (`simples`) | 25 | Dues síl·labes obertes amb una consonant d’atac i una vocal. |
| Grups consonàntics (`grups`) | 25 | Atacs admesos com /bl/, /bɾ/, /kl/ o /tɾ/, amb formes que també practiquen codes com /l/, /ɾ/ o /s/. |
| Dígrafs (`pseudodigrafs`) | 25 | `ch`, `ll`, `rr`, `qu`, `gu` i `gü` davant `e` o `i`. |
| Més de dues síl·labes (`llargues`) | 62 | Des de trisíl·labes fins a formes de cinc síl·labes. Algunes se superposen amb els focus de grups consonàntics i dígrafs. |

Les transcripcions separen les síl·labes amb punts i indiquen l’accent primari amb `ˈ` al començament de la síl·laba tònica. La referència fa la distinció entre /s/ i /θ/, manté l’oposició /ɾ/–/r/ i adopta el ieisme amb /ʝ/. Inclou diftongs com `fuamepo` /fwa.ˈme.po/, hiats gràficament marcats com `cumaípo` /ku.ma.ˈi.po/ i la `ü` pronunciada de `güerapi` /gwe.ˈɾa.pi/. Les vocals són /a e i o u/. Les variants al·lofòniques queden a criteri de la veu sintetitzada. [Ortografia de la RAE](https://www.rae.es/diccionario-estudiante/docs/ortografia.pdf) · [Ieisme al DPD](https://www.rae.es/dpd/ye%C3%ADsmo) · [Seseig al DPD](https://www.rae.es/dpd/seseo).

En corregir un dictat, es poden acceptar grafies que donin la mateixa lectura. Per exemple, `blapi` i `vlapi` poden representar /ˈbla.pi/, i `mellafo` i `meyafo` poden representar /me.ˈʝa.fo/ en una lectura ieista. El focus permet comentar el patró de la grafia de referència i el context indica si s’avalua la correspondència so–grafia o una convenció concreta.

## Comprovacions i preparació de la síntesi

- Les formes del TSV es van contrastar com a formes aïllades amb RLA-ES `es_ES` i Spylls 0.1.7, amb les mateixes versions i sumes de verificació que el [banc castellà de paraules](CASTELLA.md#banc-i-pilot-dinterfície). El contrast editorial també va considerar variants gràfiques previsibles i veïns gràfics molt propers del catàleg inicial de 1.056 mots. Una comprovació d’un diccionari concret pot deixar fora noms, regionalismes i altres usos.
- Les 100 lectures s’han contrastat amb el transcriptor de Plec. S’ha comprovat que cada forma tingui un sol accent primari, un nucli per síl·laba i que les lectures siguin diferents entre si i respecte dels 1.056 mots de partida, amb la transcripció de referència aplicada.
- El pla reproduïble `node tools/plan-spanish-pseudo-audio.cjs` torna a comprovar les coincidències de grafia i pronunciació amb els 3.056 mots del catàleg ampliat i construeix les peticions en local.
- Per preparar peticions amb Elvira, transforma només `ʝ` en `j͡j` quan construeixis el valor del fonema per a Azure. El pla local de `tools/audio-plan.cjs` ha construït les 100 peticions `pseudo` amb AFI i ritme del −10 %, amb una estimació conservadora de 8.689 caràcters. Una mostra pot comprovar si Elvira conserva els contrastos i la tònica en `mellafo`, `farrume`, `güerapi`, `tralumo`, `cumaípo` i `zefamunipo`. [Inventari fonètic d’Azure es-ES](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets#es-es).
