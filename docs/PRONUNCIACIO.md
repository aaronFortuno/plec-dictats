# Revisió de la pronunciació

24 d’octubre de 2026. L’usuari accepta el ritme de la mostra amb Alba a −10%, però detecta accent tònic incorrecte a «atapeït» i problemes a «conduïdes». Confirma que «canviïn» sona bé. Això no valida automàticament cap altra forma amb dièresi.

## Política provisional

S’ajornen els 227 mots que contenen ï o ü (també es detecten en Unicode descompost). Es generen les 3.072 paraules restants. El criteri és la grafia real, no l’etiqueta de focus: les etiquetes poden solapar-se. No es modifiquen ni el catàleg ni la selecció que representa un codi. Les pseudoparaules no formen part d’aquest lot.

`audio/manifest.json` fixa `generationPolicy.excludeDiaeresis: true`. El pla i el manifest local de resultats indiquen les formes ajornades. Els MP3 de la primera mostra es conserven per comparar, però cap mot amb dièresi s’incorpora a aquest lot, encara que ja tingui un fitxer de prova. El registre docent és a `audio/review-ca-central-alba-v1.json`.

Un àudio sintetitzat i descodificable no equival a pronunciació revisada. Els resultats continuen a `output/`, pendents de revisió, sense activar el manifest públic ni publicar milers de fitxers.

## Excepcions de pronunciació: següent prova

Azure admet l’element SSML `phoneme`, i publica una taula de fonemes IPA per a `ca-ES`. Permet indicar sons i accent tònic. Cal marcar les fronteres de les síl·labes correctament: la documentació avisa que la interpretació del signe d’accent pot canviar si no s’indiquen totes les síl·labes. La primera prova pendent serà una comparació curta amb «atapeït», conservant la grafia original dins de l’element i canviant només la pronunciació enviada al servei. No s’ha executat encara. [Fonemes i accent](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-pronunciation#phoneme-element), [inventari català](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets#ca-es).

Com a alternativa existeix `sub alias`, que permet pronunciar un text alternatiu mantenint el text escrit original al SSML. Un alias amb accent gràfic artificial és una hipòtesi que requereix escolta; no s’aplicarà automàticament a tots els mots amb dièresi. Els mots amb ü de «qüestió» o «aigüera» tampoc no es resolen amb una regla general d’accentuació. [Element sub](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-pronunciation#sub-element).

Les excepcions aprovades necessitaran metadades separades per ID i paquet, amb la versió de la petició i revisió docent. Les proves es faran en fitxers separats per comparar-les amb l’original, sense sobreescriure un àudio anterior ni alterar la grafia que s’avalua.

## Velocitat del futur reproductor

Es manté la síntesi actual. El reproductor podrà reduir `playbackRate` amb preservació de to, de forma independent del codi i de l’MP3. No cal duplicar cada àudio per oferir una velocitat més lenta. Aquesta opció encara no està implementada al producte.

## Generació llarga i represa

`node tools/run-audio-batch.cjs` només calcula el lot; `--execute` inicia el treball amb les credencials locals i les proteccions F0 existents. L’estat es desa a `output/audio/batch-status.json`, amb el recompte de fitxers, el darrer mot generat i l’estat final. La represa omet fitxers ja generats. No s’afegeixen reintents automàtics.

Per sol·licitar una aturada entre peticions, crea `output/audio/STOP`; el lot atura les peticions, conserva els MP3 complets i allibera els bloqueigs. Abans de reprendre cal retirar aquell senyal de manera explícita. Si el procés termina inesperadament, comprova que el seu PID no continua actiu abans de retirar els fitxers de bloqueig. El pressupost `usage.json` no s’esborra.
