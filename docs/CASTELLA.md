# Plec en castellà

La primera edició castellana és a `/es/`. El selector segueix el patró de [Pentagrama](https://pentagrama.page/), amb un botó rodó al costat del tema i un desplegable amb els noms de les llengües. Canviar de llengua obre el preparador de destinació amb les seves preferències.

## Banc i pilot d’interfície

La primera llista és [vocabulario-basico.txt](../catalogs/es/vocabulario-basico.txt). El docent ha validat la selecció de 350 formes de vocabulari quotidià i escolar. Les etiquetes inicials i els nivells són orientatius. La llista inclou noms femenins i masculins, plurals i formes verbals.

Les 350 formes han superat la consulta ortogràfica de l’edició `es_ES` de RLA-ES, amb els fitxers [es_ES.dic i es_ES.aff](https://github.com/LibreOffice/dictionaries/tree/762abe74008b94b2ff06db6f4024b59a8254c467/es) de LibreOffice, processats amb Spylls 0.1.7. Els SHA-256 són `6975dddec3d5d2c676069537bc67b4b5f786c65c5d4cf6703a82acf779ac9ec1` per al diccionari i `e73a9bf8e1383f4986a5dc9e2fbed49371c0c61f511c626d15586bd433c1cad9` per als afixos. El contrast comprova la grafia i les formes admeses pels afixos. La selecció, la familiaritat i les etiquetes didàctiques requereixen revisió editorial. El diccionari s’utilitza com a recurs extern de contrast.

El preparador i el catàleg comparteixen plantilles i comportament. Els textos estàtics es generen a partir de `locales/es/html.json` i els missatges dinàmics es resolen amb `locales/es/messages.json`. El catàleg tracta la ñ com una lletra diferenciada. En aquesta edició tot el banc és bàsic, de manera que no cal activar-hi el filtre «Vocabulario básico».

Els codis castellans tenen el format `ES-ABCD-23456`. El prefix indica la llengua i el bloc de quatre caràcters codifica l’edició, el nivell, el nombre i els focus. La configuració congelada de l’edició associa els dotze bits del filtre als focus castellans en un ordre fix. Els cinc caràcters finals trien la variant. Els codis catalans conserven la seva formatació i els seus snapshots. Una edició posterior haurà de conservar el primer snapshot per recuperar els fulls del pilot. Els QR castellans obren `/es/dictat/`, que valida el codi i mostra l’estat dels àudios sense revelar les respostes.

El pas següent és ampliar fins a una escala comparable als 3.299 mots i 96 pseudoparaules en català. El [CORPES XXI](https://www.rae.es/banco-de-datos/corpes-xxi) ofereix una referència de freqüència i RLA-ES serveix per al contrast ortogràfic. En preparar l’edició següent cal revisar la cobertura per nivell i focus, els homòfons i la pronunciació prevista de les pseudoparaules.

## Primera veu

La primera mostra pot comparar Elvira i Álvaro (`es-ES`), dues veus neurals estàndard del [catàleg d’Azure](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support#text-to-speech). Provar paraules amb tilde, dièresi, grups consonàntics i finals, més pseudoparaules i la locució d’instruccions. En dictat de mots aïllats, parelles com «tubo» i «tuvo» necessiten context per exigir una sola grafia. Cal resoldre aquests casos en la selecció abans de generar el lot.

La generació seguirà el model dels MP3 pregenerats, amb cobertura comprovada per llengua i veu, límits de consum i represa. [Azure Speech F0](https://azure.microsoft.com/en-us/pricing/details/speech/) indica 500.000 caràcters de síntesi neural al mes. El registre local de Plec compta per mes UTC i el 13 de novembre no tenia reserves anotades al mes nou. Abans de la primera crida cal contrastar el consum i el nivell F0 al portal. La mostra auditiva servirà per tancar veu, ritme i excepcions abans de generar el paquet complet.
