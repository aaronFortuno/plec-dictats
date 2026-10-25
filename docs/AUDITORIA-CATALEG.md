# Revisió d’usabilitat del catàleg · 25/10/2026

La revisió parteix del feedback docent i de la inspecció de la interfície; no és un estudi amb una mostra d’usuaris.

| Problema observat | Decisió aplicada |
| --- | --- |
| Paraules i pronunciacions duplicaven el mateix banc amb presentacions i càrregues diferents. | Una sola vista i un únic controlador del llistat. Cada mot mostra els focus i les dues varietats amb IPA, escolta i bandera. |
| Consultar una pronunciació omplia la cerca, amagava la resta del banc i obligava a esborrar-la. | Escolta i consulta directes a la fila. Un enllaç a un mot el ressalta i desplaça fins a ell sense escriure al cercador. |
| La cerca global mostrava inicialment només una inicial amb coincidències. | En escriure es mostren coincidències de totes les inicials; triar una lletra les restringeix explícitament. |
| Mides, context i navegació variaven segons la vista. | Capçalera, filtres, llistat i peu únics. Es conserven cerca, filtres i posició en tancar i reobrir el quadre. |
| Tot el banc o una inicial sencera podien carregar massa nodes. | Mateix límit inicial de 50 files, ampliable al final. Es conserva la posició i el focus de teclat passa a la primera fila afegida. |
| L’alfabet quedava descompensat i podia separar la barra de la lletra. | Centrat: 26 lletres en una fila en escriptori i dues files de 13 en pantalles petites. Separadors decoratius units a cada lletra. |
| Les funcions d’exportació i revisió ocupaven massa altura o apareixien en llocs diferents. | Peu fix compacte, amb descàrregues i importació/exportació d’incidències agrupades. |
| Dependència potencial del hover per consultar una dada essencial. | La IPA i l’àudio són visibles i accessibles amb teclat i pantalles tàctils. |

## Criteris de comprovació

- Cercar, escoltar les dues varietats i notificar sense modificar el text cercat.
- Filtrar per focus i nivell; navegar per inicial i ampliar resultats amb el mateix comportament.
- Entrada directa a un mot sense filtrar-lo automàticament al cercador.
- Carregar les IPA amb retard o error mantenint el llistat utilitzable, els filtres i una opció de reintentar.
- Un sol àudio actiu; aturada en filtrar, tancar o ocultar la pàgina. Incidències vinculades a la versió exacta de l’àudio o IPA.
- Cap desbordament horitzontal ni peu fora del quadre a 320, 390, 600, 820 i 1440 píxels. Aparença clara i fosca.

## Full imprimible

El bloc informatiu és al panell protegit, amb el títol alineat a la mateixa línia base que «Escric i reviso», tipografia Helvetica de 9 punts i la mateixa franja de fons. El QR, centrat a sobre, incorpora `https://plec.ortogra.fi/<llengua>/dictat/?seed=<codi>&variety=<varietat>`. El codi identifica l’edició i els filtres dels mots; la varietat de pronunciació s’indica separadament a l’URL.

La generació del QR és local i vectorial, amb correcció M i marge de quatre mòduls. Les línies, l’escriptura i el model no canvien. S’han renderitzat i llegit els quatre QR dels PDF, per als dos plecs i costats. La URL completa s’imprimeix en dues línies sota el QR. L’autor gestiona l’activació i connexió del subdomini; aquesta revisió comprova el contingut del QR sense consultar-ne el desplegament.
