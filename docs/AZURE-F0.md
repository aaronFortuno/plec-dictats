# Crear els àudios amb Azure F0

Preparació: 24 d’octubre de 2026. Encara no s’ha creat cap recurs ni generat cap àudio real.

**Actualització:** el recurs F0 ja s’ha configurat i la mostra inicial de dotze mots s’ha generat. La revisió docent accepta el ritme i identifica problemes de pronunciació en mots amb dièresi. La política actual els ajorna en la generació; per això repetir el pla de la mostra de dotze mots ara en retorna vuit i quatre ajornats. Vegeu [PRONUNCIACIO.md](PRONUNCIACIO.md). Les estimacions de la mostra completa que segueixen documenten la primera prova, anterior al filtre.

## Compte i recurs

1. Entra a [Azure](https://azure.microsoft.com/free/) amb el teu compte Microsoft i completa personalment el registre. La verificació del compte i qualsevol dada de pagament es fan al portal, mai al xat ni al repositori. Revisa les condicions que et presenti Azure per a la teva subscripció; no contractis serveis addicionals per seguir aquesta guia.
2. Al [portal](https://portal.azure.com/), cerca **Speech** i crea un recurs de veu. El nom de la categoria pot aparèixer sota Azure AI o Foundry. Crea un grup de recursos dedicat, per exemple `plec-audio`, per distingir-lo d’altres serveis.
3. Selecciona una regió europea que ofereixi les veus desitjades. Anota el codi de regió que apareixerà al recurs; no el dedueixis del nom comercial.
4. A **Pricing tier / Nivell de preus**, selecciona **Free F0**. Si F0 no està disponible, atura aquesta preparació i revisa el motiu: no el substitueixis per S0, un recurs general de pagament o una veu HD. Abans de crear-lo, comprova F0 al resum. [Exemple oficial de creació de Speech](https://microsoftlearning.github.io/mslearn-ai-language/Instructions/Exercises/07-speech.html?azure-portal=true).
5. Un cop creat, confirma que el recurs continua essent F0 i consulta **Keys and Endpoint**. La regió i la clau s’utilitzaran només al teu terminal per generar fitxers. No es posen al web, al JSON del catàleg, a un issue ni a GitHub.

F0 ofereix actualment **500.000 caràcters de síntesi neural per mes**. És la quota del recurs de síntesi; el funcionament posterior del web reprodueix MP3 estàtics i no consumeix aquesta quota. Un pressupost de facturació amb alertes no és un límit dur: la nostra mesura principal és mantenir el recurs F0 i no activar altres serveis. [Preus oficials](https://azure.microsoft.com/en-us/pricing/details/speech/).

## Veu i primera mostra

Microsoft enumera tres veus catalanes: `ca-ES-AlbaNeural`, `ca-ES-JoanaNeural` i `ca-ES-EnricNeural`. Començarem amb una mostra d’Alba i compararem si cal. El proveïdor les etiqueta com a català; la seva adequació al català central i a aquesta activitat necessita escolta docent. [Veus oficials](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support#text-to-speech).

La mostra ha de contenir vocals obertes/tancades, vocal neutra, essa sonora/sorda, dièresi, grups consonàntics i formes verbals: avió, cinema, passadís, metge, perquè, orquestra, atapeït, conduïdes, haguessin, plantejarien, intuïa i canviïn són candidats que cal confirmar al banc. Les pseudoparaules es revisaran a part: un sintetitzador pot interpretar-les d’una manera diferent de la que volem practicar.

Triem una velocitat lleugerament més lenta com a punt de partida, sense separar artificialment síl·labes ni exagerar sons. S’ha de validar abans de convertir els milers de mots. La versió del paquet fixa veu, velocitat i fitxers perquè no canviïn les pràctiques ja compartides.

## Quota i durada de la generació

El catàleg actual conté **3.299 paraules, 22.943 caràcters de text**, i **96 pseudoparaules, 610 caràcters**. Això no és el còmput facturable complet: també es compten les etiquetes SSML opcionals, com `prosody`, i les repeticions de proves. Microsoft exclou les etiquetes exteriors `speak` i `voice` del còmput, però inclou altres marques. L’eina calcula una estimació conservadora a partir de la petició exacta. [Còmput oficial](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech#pricing-note).

F0 permet **20 peticions cada 60 segons** i no inclou l’API de síntesi massiva. Els nostres lots faran peticions ordinàries seqüencials, amb quatre segons com a mínim entre inicis. A aquest ritme, 3.395 fitxers poden requerir prop de quatre hores, a més de latència i possibles aturades. El nombre de caràcters és modest, però el nombre de fitxers determina el temps. Es pot reprendre la feina saltant els MP3 ja generats. [Límits oficials](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits#text-to-speech-quotas-and-limits-per-resource).

El generador s’ha de limitar a **400.000 caràcters estimats al mes**, comptant reserves abans de cada petició i ús extern declarat. Aquest registre és local: no consulta la quota d’Azure ni sap què has fet amb Speech Studio o altres eines. Si treballes en un altre ordinador o esborres el registre, no pots interpretar-ne el valor com el consum total. Conserva’l i contrasta’l amb les mètriques del recurs. Un error 429 atura el lot; no augmenta quota ni canvia automàticament de servei.

## Publicació i varietats futures

La sortida inicial queda a `output/audio/`, fora dels fitxers publicats. Escoltarem la mostra i revisarem els fitxers abans de copiar els aprovats a `assets/audio/ca/<paquet>/words/mot.mp3` o `pseudo/mot.mp3`. El manifest públic només enumera els MP3 disponibles. No calen credencials al navegador i no es sintetitza res quan un alumne prem Reprodueix.

Una altra veu o varietat es publica com a paquet diferent, amb la seva pròpia carpeta i metadades. Les gravacions manuals poden utilitzar el mateix contracte. Una varietat lingüística no es dedueix només del codi `ca-ES` o `es-ES`: es revisa el contingut de cada paquet.

## Primera prova en aquest ordinador

**Alternativa preparada per a aquest ordinador:** pots desar la configuració a `C:/Users/afortun8/Desktop/Projects/Escola/.private/plec/azure-speech.json`, fora del repositori i de l’arrel del web. Completa `region` (codi de regió) i `key` (Key 1 o Key 2: només una). `endpoint` és opcional, com a referència; el generador usa l’adreça regional d’Azure i no envia la clau a l’adreça que s’hagi enganxat al fitxer. Mantén `pricingTier: "F0"` només si has comprovat F0 al portal. La carpeta privada conté un `.gitignore` que n’exclou el contingut. El fitxer es llegeix només quan es demana una generació real; la simulació no necessita credencials. Si ja hi ha variables de Speech al terminal, tenen prioritat i s’han d’indicar les dues. Amb aquest fitxer pots ometre el pas 2 d’introducció de credencials al terminal; la confirmació de F0 continua essent necessària.

Les eines locals ja estan comprovades amb respostes simulades, sense xarxa. Falta validar una crida real amb el recurs F0 que crearàs. Cal tenir Node.js disponible al terminal; en aquest projecte s’han comprovat amb Node 24.19.

1. Obre PowerShell a la carpeta del projecte i prepara el pla **sense clau i sense enviar peticions**:

   ```powershell
   Set-Location "C:\Users\afortun8\Desktop\Projects\Escola\plec-dictats"
   $mostraPlec = (Get-Content -Encoding utf8 audio/prova-inicial.txt) -join ','
   node tools/audio-plan.cjs --words "$mostraPlec"
   node tools/generate-audio.cjs --words "$mostraPlec"
   ```

   Són els dotze mots de [prova-inicial.txt](../audio/prova-inicial.txt). El pla actual mostra **12 peticions i 460 caràcters estimats**; la segona ordre indica que és una simulació. El catàleg complet, amb aquests ajustos, estima 125.212 caràcters per a paraules i 3.586 per a pseudoparaules: **128.798 en total per una veu**, abans de proves repetides i altres usos.

2. Confirma **F0 al portal**. Introdueix regió i clau només en aquell terminal. L’entrada de la clau queda amagada i no es desa a l’historial com una ordre amb el secret:

   ```powershell
   $env:SPEECH_REGION = Read-Host 'Codi de regió del recurs'
   $clauPlec = Read-Host 'Clau de Speech, només en aquest terminal' -AsSecureString
   $env:SPEECH_KEY = [System.Net.NetworkCredential]::new('', $clauPlec).Password
   ```

   No ens passis la clau pel xat. Aquestes variables són temporals del terminal; no es graven al projecte ni es publiquen. Si el recurs s’ha utilitzat amb altres eines aquest mes, cal declarar aquell consum amb `--used-elsewhere N`; N és el total extern estimat, no un increment per cada lot.

3. Genera **només la mostra**, després de revisar l’estimació. Aquesta és l’única ordre d’aquesta guia que envia peticions:

   ```powershell
   node tools/generate-audio.cjs --words "$mostraPlec" --execute --confirm-f0
   ```

   Faran falta aproximadament un minut o més, segons la latència. `--confirm-f0` declara que ho has comprovat; no consulta el nivell del recurs. Si hi ha un error, el lot s’atura. No canviïs a un nivell de pagament per evitar-lo.

4. Escolta els MP3 a `output/audio/ca-central-alba-v1/words/`. El manifest dels resultats és a `output/results/ca-central-alba-v1-words.json`; continua pendent de revisió. Comprova vocals, consonants, ritme i si les formes verbals s’entenen sense context. Encara no es publiquen els fitxers ni es dona per acabat el reproductor.

5. En acabar, elimina les credencials d’aquest terminal o tanca’l:

   ```powershell
   Remove-Item Env:SPEECH_KEY, Env:SPEECH_REGION -ErrorAction SilentlyContinue
   Remove-Variable clauPlec -ErrorAction SilentlyContinue
   ```

No esborrem `output/audio/usage.json`: conserva les reserves mensuals i el moment de l’última petició. Un fitxer `usage.lock` indica un lot en curs; després d’un tall inesperat, comprova que no queda cap generador actiu abans de retirar manualment aquell bloqueig. Si un lot travessa el canvi de mes UTC, s’atura per tornar a validar el pressupost en una nova execució.

Quan aprovem la mostra, decidirem si mantenim Alba, el ritme de −10% i aquesta varietat. Per canviar veu o velocitat es crea un paquet amb ID diferent: l’eina impedeix barrejar ajustos amb els MP3 ja generats. Repetir una ordre amb els mateixos ajustos salta els fitxers existents amb capçalera MP3 compatible; aquesta comprovació tècnica no substitueix escoltar-los.

## Situació registrada el 24/10/2026

Després del lot de 3.072 mots, les instruccions i les mostres IPA (nou mots, quatre incidències i vuit dièresis), el registre local reserva **119.827 caràcters** a l’octubre. Queden **280.173** fins al límit preventiu de 400.000. Equival aproximadament al **24% dels 500.000 caràcters mensuals F0**; no és una lectura de facturació Azure i pressuposa que no hi ha ús extern sense declarar. Contrasta el total al recurs abans d’ampliar la generació. [Preus oficials de Speech](https://azure.microsoft.com/en-gb/pricing/details/speech/?cdn=disable).

El pla històric de 227 dièresis estima 20.173 caràcters amb SSML; cal reconstruir-lo des de les transcripcions que finalment s’aprovin. Una altra passada ordinària de totes les paraules estima 125.212 caràcters amb els ajustos documentats, però una passada IPA tindrà un pressupost diferent segons les transcripcions i el SSML. No s’ha iniciat cap altre lot complet ni una altra veu.

Azure publica `ca-ES-AlbaNeural`, `ca-ES-JoanaNeural` i `ca-ES-EnricNeural`; aquesta llista no les identifica com a central, valenciana o balear. Una veu diferent no constitueix automàticament una varietat dialectal. Per preparar-ne una altra cal un perfil IPA propi, una mostra curta amb la veu candidata i revisió per parlants de la varietat abans de generar el banc. També es pot fer enregistrament manual mantenint el mateix contracte de paquets. [Veus oficials](https://learn.microsoft.com/azure/cognitive-services/speech-service/language-support?tabs=tts).
