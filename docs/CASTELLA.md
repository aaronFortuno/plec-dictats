# Plec en castellà

La primera edició castellana és a `/es/`. El selector segueix el patró de [Pentagrama](https://pentagrama.page/), amb un botó rodó al costat del tema i un desplegable amb els noms de les llengües. Canviar de llengua obre el preparador de destinació amb les seves preferències.

## Banc i pilot d’interfície

La primera llista és [vocabulario-basico.txt](../catalogs/es/vocabulario-basico.txt). El docent ha validat la selecció de 350 formes de vocabulari quotidià i escolar. Les etiquetes inicials i els nivells són orientatius. La llista inclou noms femenins i masculins, plurals i formes verbals.

Les 350 formes han superat la consulta ortogràfica de l’edició `es_ES` de RLA-ES, amb els fitxers [es_ES.dic i es_ES.aff](https://github.com/LibreOffice/dictionaries/tree/762abe74008b94b2ff06db6f4024b59a8254c467/es) de LibreOffice, processats amb Spylls 0.1.7. Els SHA-256 són `6975dddec3d5d2c676069537bc67b4b5f786c65c5d4cf6703a82acf779ac9ec1` per al diccionari i `e73a9bf8e1383f4986a5dc9e2fbed49371c0c61f511c626d15586bd433c1cad9` per als afixos. El contrast comprova la grafia i les formes admeses pels afixos. La selecció, la familiaritat i les etiquetes didàctiques requereixen revisió editorial. El diccionari s’utilitza com a recurs extern de contrast.

El preparador i el catàleg comparteixen plantilles i comportament. Els textos estàtics es generen a partir de `locales/es/html.json` i els missatges dinàmics es resolen amb `locales/es/messages.json`. El catàleg tracta la ñ com una lletra diferenciada. El filtre «Vocabulario básico» recupera els 350 mots inicials.

Els codis castellans tenen el format `ES-ABCD-23456`. El prefix indica la llengua i el bloc de quatre caràcters codifica l’edició, el nivell, el nombre i els focus. La configuració congelada de l’edició associa els dotze bits del filtre als focus castellans en un ordre fix. Els cinc caràcters finals trien la variant del dictat. Els codis catalans conserven la seva formatació i els seus snapshots. Una edició posterior haurà de conservar el primer snapshot per recuperar els fulls del pilot. Els QR i enllaços nous obren `/es/dictat/` amb `variety=es-es`. Els enllaços previs sense aquest paràmetre utilitzen Elvira per defecte.

## Primera ampliació

La primera ampliació incorpora els 706 mots i focus aprovats per l’usuari el 14 de novembre de 2026. El banc actiu conté 1.056 mots. La [taula editorial](../catalogs/es/review/ampliacion-01.tsv) i la [vista filtrable](../catalogs/es/review/revision-ampliacion-01.html) recullen els focus, l’AFI i els nivells orientatius. També hi ha un [llistat alfabètic](../catalogs/es/review/ampliacion-01.txt), la [transcripció dels 350 mots bàsics](../catalogs/es/review/vocabulario-basico-afi.tsv) i les [exclusions per ambigüitat auditiva o gràfica](../catalogs/es/review/exclusiones-01.tsv).

La selecció és editorial, amb vocabulari quotidià i escolar, lèxic d’ampliació i formes verbals. La familiaritat és orientativa. El [CORPES XXI](https://www.rae.es/banco-de-datos/corpes-xxi) queda com a referència per a futures ampliacions. `python tools/check-spanish-draft.py ruta/es_ES` contrasta cada grafia amb el mateix diccionari RLA-ES fixat més amunt, amb Spylls 0.1.7, i comprova les etiquetes gràfiques, la cobertura AFI i les coincidències de so dins del conjunt. La marca de forma verbal és editorial. Les etiquetes en minúscules són de presentació i es resolen també als fulls i PDF.

Per generar l’edició i el seu índex de pronunciació, executa `python tools/check-spanish-draft.py ruta/es_ES --json | node tools/prepare-spanish-expansion.cjs` i després `node tools/build-catalogs.cjs`. L’edició inicial es conserva al registre de llavors i continua resolent els fulls existents.

## Transcripcions fonètiques

L’AFI és una proposta fonològica per a la veu `es-ES`, amb distinció entre /s/ i /θ/, ieisme amb /ʝ/, un punt per frontera sil·làbica i `ˈ` davant la síl·laba tònica. S’han aplicat regles a la grafia amb `tools/spanish-ipa.cjs` i s’han anotat algunes lectures que convé escoltar. Per exemple, «subrayaban» té /r/ múltiple i «xilófono» comença amb /s/. Les transcripcions representen una lectura de referència i poden diferir de l’àudio que produeixi Elvira. Si es fa una petició en AFI a Azure, el /ʝ/ de la taula es codifica com a `j͡j`. [RAE–ASALE sobre el ieisme](https://www.rae.es/dpd/ye%C3%ADsmo), [el seseo](https://www.rae.es/dpd/seseo), [l’accentuació](https://www.rae.es/dpd/tilde), [la x](https://www.rae.es/dpd/x) i [l’inventari d’Azure](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets#es-es).

El catàleg carrega un índex per varietat i permet descarregar les transcripcions en CSV. El perfil d’Elvira és `es-es-yeismo-v1`. L’índex es valida amb els identificadors i la grafia del catàleg, independentment de si l’àudio està disponible.

## Primera veu

La primera mostra va comparar Elvira i Álvaro (`es-ES`), dues veus neurals estàndard del [catàleg d’Azure](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support#text-to-speech). En dictat de mots aïllats, parelles com «tubo» i «tuvo» necessiten context per exigir una sola grafia. Cal revisar aquests casos abans de generar àudios per a les ampliacions del catàleg.

La generació segueix el model dels MP3 pregenerats, amb cobertura comprovada per llengua i veu, límits de consum i represa. [Azure Speech F0](https://azure.microsoft.com/en-us/pricing/details/speech/) indica 500.000 caràcters de síntesi neural al mes. El registre local de Plec compta per mes UTC.

La [guia d’Azure F0](AZURE-F0.md#consultar-el-consum-abans-dun-lot) explica com consultar el recurs. La comparació local es prepara amb `node tools/run-spanish-voice-pilot.cjs`. La simulació estima 1.060 caràcters per a 28 peticions, amb 14 mots per veu i ritme −10 %. Amb el recurs F0 verificat, `--execute --confirm-f0` genera els MP3 i la pàgina `output/audio/comparacio-castella.html` per escoltar-los. La mostra queda a `output/` per a revisió.

La segona prova afegeix `--ipa` i manté els 14 mots, les veus i el ritme. Envia una transcripció fonològica amb accent primari i límits de síl·laba, amb distinció /s/–/θ/ i ieisme. Per exemple, `a.kom.pa.ˈɲa.das` i `re.ˈlox` fixen la tònica a «ña» i «loj». La consonant /ʝ/ s’envia com a `j͡j`, segons la correspondència que Azure documenta per a «villa». Els 28 MP3 de la segona prova tenen identificadors propis i es comparen amb els originals a `output/audio/comparacio-castella-afi.html`. L’estimació és de 2.450 caràcters addicionals. [Inventari es-ES d’Azure](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets#es-es).

## Paquet d’Elvira

La mostra AFI no va aportar una millora clara a l’escolta docent. Es va triar **Español de España · Elvira** (`es-ES-ElviraNeural`) a partir de la grafia, a −10 %. L’etiqueta identifica la configuració regional de la veu. El paquet de 350 mots reutilitza els 14 MP3 de la primera mostra i genera els 336 restants, amb una previsió de 12.459 caràcters addicionals.

`node tools/run-spanish-audio.cjs` mostra el pla. Amb `--execute --confirm-f0` fa el lot o el reprèn, conserva les reserves del mes i reintenta els errors transitoris cada minut. Les respostes de quota i autenticació aturen el lot. Quan s’acaba, `node tools/publish-spanish-audio.cjs --publish` descodifica els 350 MP3 en local amb Playwright i Chrome abans d’incorporar-los al manifest públic. [Registre de publicació i SHA-256](../audio/spanish-publication.json).

El paquet està pendent de revisió auditiva individual. La pantalla en castellà ofereix les instruccions per escrit.

El lot de la primera ampliació es prepara amb `node tools/run-spanish-audio.cjs --expansion --execute --confirm-f0`. Es van generar 706 fitxers a partir de la grafia amb la mateixa veu i ritme. La reserva local del lot va ser de 27.388 caràcters amb el reintent inclòs. `node tools/publish-spanish-audio.cjs --expansion --publish` va descodificar els 706 fitxers i va crear el paquet conjunt `es-es-elvira-words-v2`, que manté les 350 rutes anteriors. El lot queda pendent de revisió auditiva. [Registre de publicació i SHA-256](../audio/spanish-expansion-publication.json).
