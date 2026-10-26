# Analítica agregada de Plec amb Umami

Implementació 1.23 de 26/10/2026, a partir de la proposta de 25/10/2026. Domini únic de producció: `https://plec.ortogra.fi`. ID públic: `3e7e3221-7e36-4b78-8a48-4893401163b1`; script oficial: `https://cloud.umami.is/script.js`. Cap clau API al navegador.

## Què volem saber

- Si les visites es converteixen en fulls generats i dictats orals començats/acabats.
- Quines llargades, nivells, formats de plec i varietats es fan servir en les activitats efectives.
- Si la recuperació de codis i els enllaços compartits són útils.
- Si el catàleg s'utilitza i si hi ha obstacles tècnics recurrents.

Les dades serveixen per millorar el producte. No són registres d'avaluació, assistència ni rendiment individual de l'alumnat.

## Compte i quota

El compte existent de l'autor mostra Free: 100.000 esdeveniments mensuals, 1 web i 6 mesos de retenció. Ús comunicat per l'autor: 922/100.000 després d'aproximadament una setmana; estimació inicial d'uns 4.000 al mes si el ritme es manté. No és una previsió de creixement.

La quota correspon al compte/subscripció. L’autor ha creat un compte separat per a Plec perquè el pla existent només admet un web. Totes les llengües de Plec es mesuraran dins del mateix web, amb la ruta que les identifica.

En el còmput d'Umami Cloud, les propietats també consumeixen quota. Per exemple, un esdeveniment amb quatre propietats representa cinc unitats. Evitem enviar dades repetides o un esdeveniment per cada interacció menor.

## Primera fase

Els noms d'esdeveniment són estables i independents de la llengua de la interfície. Les propietats admeten només valors predefinits o números acotats.

| Esdeveniment | Moment de registre | Propietats |
| --- | --- | --- |
| Visita de pàgina | Una entrada a cada pantalla real, amb la ruta neta | Les pròpies del tracker; sense dades personalitzades |
| `worksheet-exported` | PDF generat i lliurat a l'acció de descàrrega | `mode`, `count`, `fold`, `stage` |
| `dictation-started` | Sessió oral creada, després de superar la preparació | `mode`, `count`, `variety` |
| `dictation-completed` | S'arriba a la pantalla final | `mode`, `count`, `variety`, `duration_bucket` |
| `code-recovered` | Intent manual de recuperar un dictat resolt | `result`: `ok` o `invalid` |
| `share-copied` | Escriptura al porta-retalls completada | `target`: `worksheet`, `student` o `code` |
| `catalog-opened` | Primera obertura del catàleg en aquella pàgina | Cap |
| `audio-reported` | L'usuari prem expressament la bandera d'un enregistrament | `word`, `variety`, `audio_version` |
| `technical-error` | Error funcional conegut, amb deduplicació | `kind`: `pdf`, `audio`, `catalog` o `code-load` |

Valors: `mode` és `words`/`pseudo`; `count`, 8/12/16/20/24; `fold`, `thirds`/`quarter`; `stage`, `cm`/`cs`/`eso`/`all`/`none`; `variety`, `central`/`valencia` inicialment. `duration_bucket` només indica franges d'activitat efectiva: menys de 5, 5–10, 10–20 o més de 20 minuts, excloent les pauses conegudes de la sessió.

Una descàrrega iniciada no acredita que el fitxer s'hagi desat ni que s'hagi imprès. Completar el dictat acredita l'arribada al final del flux; no que s'hagi fet correctament. El mode oral actual exigeix tres escoltes per mot: comptar repeticions no aportaria informació sobre ús voluntari.

Els canvis de seed als paràmetres de l'URL no generaran noves visites. La portada que només redirigeix a `/ca/` tampoc comptarà com una visita addicional. Els esdeveniments d'ús es disparen en el resultat de l'acció, no en el clic inicial.

## Ampliacions que podem valorar després

- Descàrregues del catàleg, amb el format i tipus de contingut.
- Cerca amb mots obligatoris: resultat i nombre de mots; mai el text. Una cerca continuada en diverses tandes conserva una sola operació lògica.
- Focus ortogràfics associats a un PDF efectivament generat; cal acordar com resumir les combinacions abans d'afegir propietats.
- Entrades per QR: requereixen un indicador explícit als QR nous. Una URL amb seed no demostra per si sola que s'hagi escanejat un QR; també pot arribar de Classroom o d'un enllaç copiat.

## Avisos de pronunciació amb un clic

El canal públic d’avisos d’àudio utilitza Umami sense formulari, compte de GitHub, comentari obligatori ni exportació de fitxers.

Flux: **bandera al costat de l'enregistrament → enviament de `audio-reported` → confirmació breu quan el receptor accepta l'avís**. El mateix botó queda marcat com a notificat en aquella pestanya. La deduplicació local evita repetir el mateix mot, varietat i versió durant la sessió de pestanya; no crea un identificador de persona.

Les propietats són el mot públic del catàleg, la varietat i la versió de l’enregistrament. La llengua ja consta a la ruta neta. La versió combina el paquet immutable i l’empremta dels ajustos i canvia quan es corregeix l’enregistrament; no depèn de la versió general del web.

La interfície ho explica sense demanar més passos: «Notifica un problema d'aquest àudio. S'enviarà el mot i la varietat perquè els puguem revisar». L'avís no afirma que s'hagi detectat un error lingüístic: desencadena una revisió humana.

A Umami es filtra `audio-reported`, es consulta la propietat `word` i es concreta per varietat/versió. Els recomptes ajuden a prioritzar. No representen persones úniques ni acrediten que l'àudio sigui incorrecte. Un únic avís també pot identificar un problema real.

Cal separar els avisos expressos dels errors tècnics detectats automàticament. Una fallada de xarxa, permisos de reproducció o descodificació no equival a una mala pronunciació. Si incorporem detecció automàtica vinculada al mot, serà un esdeveniment diferent (`audio-playback-error`), limitat i amb una categoria d'error predefinida; no s'enviarà per aturades voluntàries ni amb missatges o URL en brut.

Umami proporciona una llista estadística d'avisos, sense estat editorial de «pendent» o «resolt» per incidència. La revisió i correcció es fan fora del panell. Identificar les versions permet distingir avisos d'enregistraments antics. La retenció de sis mesos del pla Free també s'aplica a aquests esdeveniments.

Els bloquejadors, les preferències de privacitat, una fallada d'Umami o la quota poden impedir la recepció. No es mostrarà «Avís enviat» si no hi ha confirmació d'acceptació del receptor, i no s'esquivaran les preferències de l'usuari per garantir el report. Aquest canal serveix per recollir senyals de qualitat; no és un registre garantit d'incidències.

La primera versió d'aquest canal serà per als enregistraments. Una possible notificació de transcripció IPA ha de quedar diferenciada per no atribuir un problema de taula al fitxer d'àudio.

## Privacitat i qualitat de les dades

- No enviar noms, correus, centre, grup, respostes, mots cercats o obligatoris, notes de revisió ni la seed.
- Excepció explícita per als avisos: s'envia el mot públic del catàleg que l'usuari ha decidit notificar, amb la varietat i la versió de l'enregistrament. No es registra el text introduït per l'alumnat.
- Eliminar els paràmetres i fragments de les URL de tots els enviaments. Reduir la referència externa al domini d'origen, sense rutes ni paràmetres.
- No assignar identificadors persistents d'alumne ni cridar `umami.identify()`.
- No activar enregistraments de sessions, mapes de calor ni mesures per cada paraula escoltada o tecla premuda.
- Respectar els senyals de privacitat que es decideixin admetre, incloent DNT/GPC, i la desactivació local d'analítica. No esquivar bloquejadors.
- Excloure localhost i entorns de desenvolupament abans de carregar el script extern.
- Mantenir una llista tancada de noms i propietats. Els errors només transmeten categories; mai missatges o traces en brut.
- Descriure l'analítica a la informació de privacitat. Que el tracker no utilitzi cookies no converteix automàticament qualsevol configuració en anònima o exempta d'obligacions.

En una aula amb ordinadors i navegadors semblants darrere de la mateixa IP, Umami pot agrupar visites. Els visitants i les sessions són estimacions; no els equiparem a persones o alumnes. Els bloquejadors també fan que els comptadors siguin incomplets. Prioritzem tendències i volums d'accions.

## Implementació i comprovació

`analytics.js` és l’únic emissor. Abans de carregar res comprova el domini HTTPS exacte, DNT, GPC i `umami.disabled`. El permís temporal es desa a la sessió de pestanya i no anul·la DNT/GPC ni esborra una negativa persistent. «Privacitat» és accessible al peu del preparador, al catàleg i a la capçalera del dictat.

El script oficial es carrega amb `data-auto-track="false"`, exclusió de cerca/hash i domini explícit. Si un bloquejador impedeix carregar-lo, no s’intenta enviar pel receptor directament. L’emissor fa peticions controlades al mateix receptor utilitzat pel tracker Cloud actual, `https://gateway.umami.is/api/send`, sense cookies ni referència HTTP completa. Es comproven HTTP, JSON vàlid, `cache` i absència de `disabled`/`error`. Cal mantenir aquest contracte si Umami canvia el tracker; `umami.track()` per si sol no dona un justificant fiable d’acceptació.

Una única visita real inicial comprova la disponibilitat; no hi ha esdeveniments de prova, seguiment d’historial ni duplicació als redirects. Els esdeveniments tenen llistes tancades de noms, propietats i valors. Els errors tècnics es dedupliquen per categoria. No hi ha cues fora de línia, identificació persistent ni reintents silenciosos dels avisos.

`app.js` registra resultats d’exportació, recuperació i còpia; `dictation.js`, inici i final, amb temps actiu descomptant pauses conegudes. `pronunciations.js` connecta la bandera d’àudio i mostra la confirmació només després de l’acceptació. Si falla el receptor, els avisos queden inactius i es pot reintentar des de Privacitat. La deduplicació acceptada es desa només a `sessionStorage`, per mot, varietat i versió, amb alternativa en memòria si l’emmagatzematge no és accessible.

Les plantilles del preparador i del dictat inclouen el mateix mòdul i diàleg. La funcionalitat educativa continua disponible quan falla Umami. El formulari de revisió anterior i els mòduls locals es conserven per compatibilitat sense controls públics.

`node tools/check-analytics.cjs` utilitza un receptor simulat: comprova privacitat, sanejament d’URL, dades permeses, recepció, errors, timeout, desactivació durant enviaments i deduplicació. No fa peticions reals. El generador d’HTML i les comprovacions del dictat i del catàleg es passen en local; l’autor farà la comprovació del web desplegat.

`node tools/check-dictation-analytics.cjs` comprova el controlador i la sessió reals amb àudio i rellotge simulats: un únic inici/final, temps sense pauses, cap mot ni codi i funcionament sense tracker. La primera fase només afegeix analítica de producte i avisos voluntaris. No incorpora resposta digital ni seguiment individual.

## Ajuda de privacitat al web · 1.24

«Privacitat» diferencia un bloqueig de connexió dels senyals GPC i DNT. `privacy-help.js` prepara instruccions segons el navegador detectat, que l’usuari pot corregir amb un selector. Les banderes expliquen la causa i remeten a aquest panell; el text «Notifica un error» només és una llegenda amb ajuda que indica quina bandera cal prémer.

En Brave, abaixar els escuts només afecta el bloqueig del lloc: el GPC general pot continuar actiu. La ruta oficial de Brave per a escriptori i Android és `brave://flags/#brave-global-privacy-control-enabled`, amb reinici després del canvi; a iOS és a Brave Shields i privacitat. El panell explicita que canviar el senyal afecta el navegador en general i que es pot restablir després. Cap botó de Plec modifica aquests ajustos ni anul·la DNT/GPC. Les extensions de tercers es descriuen sense inventar una ruta comuna a totes.

## Fonts

### Navegadors

- [Privacitat i GPC a Brave](https://support.brave.app/hc/en-us/articles/360017989132-How-do-I-change-my-Privacy-Settings).
- [Escuts de Brave per lloc](https://support.brave.app/hc/en-us/articles/360023646212-How-do-I-configure-global-and-site-specific-Shields-settings).
- [DNT a Brave](https://support.brave.app/hc/en-us/articles/360017905612-How-do-I-turn-Do-Not-Track-on-or-off).
- [DNT a Chrome](https://support.google.com/chrome/answer/2790761).
- [GPC a Firefox](https://support.mozilla.org/en-US/kb/global-privacy-control).
- [Protecció contra seguiment a Edge](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/tracking-prevention).

### Umami

- [Tarifes i còmput d'ús](https://umami.is/pricing).
- [Ús del compte Cloud](https://docs.umami.is/docs/cloud/usage).
- [Configuració del tracker](https://docs.umami.is/docs/tracker-configuration).
- [Funcions del tracker](https://docs.umami.is/docs/tracker-functions).
- [Preguntes freqüents i privacitat](https://docs.umami.is/docs/faq).

La versió 1.26 retira la guia docent separada i deixa d’emetre `guide-exported`. Els esdeveniments històrics no es modifiquen. El PDF del full continua emetent `worksheet-exported`.
