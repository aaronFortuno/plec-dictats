# Coordinació del projecte

## Síntesi de veu · instrucció explícita del docent, 25/11/2026

- No enviar cap petició de síntesi, tampoc un pilot curt, sense confirmació explícita del docent per al text complet, la veu i el lot concret. Dissenyar una funcionalitat o parlar de sintetitzar una prova més endavant no és autorització per enviar-la.
- Gemini comparteix una quota molt limitada de 10 peticions diàries amb Sentit. Preparar les peticions sense enviar-les i acordar lots que aprofitin la quota. Ni una quota restablerta ni un fitxer de configuració disponible autoritzen una petició.
- El 25/11 s'ha enviat per error una petició de Plec LL01 (63 paraules, Aoede). La resposta està conservada a `output/audio/text-ll01/`, pendent d'audició i decisió docent; no repetir-la ni publicar-ne l'àudio automàticament.

## Pilot oral autoritzat · 25/11/2026

- El docent ha validat l’escaleta i autoritzat explícitament les quatre variants en una única petició amb Aoede i integració al reproductor, sota uns 6–7 minuts. Autorització exacta: `audio/texts/batches/ll01-four-rhythms-v1.json`.
- Lot completat: una petició, 219,66 s totals, quatre MP3 publicats com a pilot pendent d’audició. No repetir ni regenerar per iniciativa pròpia. La presa anterior de `text-ll01` segueix sense autorització de publicació.
- La puntuació locutada ha de formar part de la mateixa presa i utilitzar sempre la mateixa veu que narra, també en futurs lots. No enganxar un banc de locucions d’una altra veu.

## LL02 autoritzat i rebut · 26/11/2026

- El docent ha validat «Llavors al jardí» (57 mots) i autoritzat una única petició amb Aoede, quatre ritmes i puntuació amb la mateixa veu. Autorització congelada: `audio/texts/batches/ll02-four-rhythms-v1.json`.
- Resposta conservada: 211,83 s en total, quatre versions publicades com a pilot pendent d’audició. No repetir la petició ni regenerar correccions sense un nou encàrrec explícit. Els bloqueigs previs de lock/interval no han enviat cap petició.
- Els textos són a `content/texts/` i les escaletes a `content/prosody/`. Conserva els identificadors tècnics ca-ll-001-v1 / ca-ll-002-v1 i les empremtes de producció. El docent ha aprovat el 26/11 la nova codificació visible CA0001 / CA0002 (escurçada a CA001 / CA002 el 27/11), independent del focus i sense necessitat de compatibilitat amb els codis impresos LL01 / LL02.

**Estat 25/10/2026:** l’usuari ha reautoritzat encàrrecs acotats a K3 amb esforç baix, després de les proves costoses amb K3.1. T008 i T009 estan completats; no hi ha cap encàrrec actiu. Conserva pressupostos, límits de passos i temps, eines acotades i revisió de Codex abans d’integrar. El registre vigent és `../protocol-codex-kimi/ESTAT-WORKER.json`. No canviïs configuració global.

- L’usuari explica les necessitats i confirma visualment el resultat. Codex especifica, coordina, revisa i integra; **Kimi K3 Low** pot implementar encàrrecs acotats mitjançant Kimi Code CLI. Separa els fitxers dels encàrrecs i evita escriptors simultanis sobre els mateixos fitxers.
- Protocol local: `../protocol-codex-kimi/LLEGEIX-ME.md`; context: `../protocol-codex-kimi/PERFIL-PLEC.md`; connexió: `../protocol-codex-kimi/CONNEXIO.md`. Llegeix-los abans de preparar un encàrrec. Si no estan disponibles en un altre equip, conserva aquest repartiment i reconstrueix el context necessari a partir del repositori.
- Pilot de lectura T000 completat amb Kimi Code 2.3.1 i l’àlies explícit `kimi-code/k3.1-pro`. No utilitzis el model per defecte sense verificar-lo ni substitueixis K3.1 silenciosament.
- Cada implementació necessita un encàrrec acotat, base Git coneguda, perfil d’eines apropiat i termini extern. El llançador T000 és exclusivament de lectura. No reprenguis aquella sessió per implementar.
- Kimi no fa commits, push, merge, desplegaments ni canvis globals. Codex revisa també els fitxers nous, conserva els canvis preexistents de l’usuari i integra només el lliurament revisat dins de l’autorització vigent.
- En els projectes remots, si s’han comprovat els canvis en local, **no facis la comprovació remota**: la farà l’usuari manualment i comunicarà qualsevol incidència.

## Textos CA003–CA006 · 27/11/2026

El docent ha validat els quatre textos i les escaletes i ha autoritzat explícitament quatre lots, un per CA003–CA006, amb Aoede, català central i els quatre ritmes en cada petició, i integrar els àudios. Autoritzacions exactes a `audio/texts/batches/ca003-four-rhythms-v1.json` fins a `ca006-four-rhythms-v1.json`. Màxim una petició nova per lot, compartint la quota amb Sentit. Conservar les interaccions abans de recuperar-les; no repetir cap enviament ambigu ni regenerar correccions sense nou encàrrec. Publicació pendent d’audició, mai com a pronunciació validada.

Lots completats amb quatre POST en total. CA006 recuperat amb el mateix ID després d’un tall de connexió, sense reenviar. Setze MP3 integrats com a pilots pendents d’audició; rebuts i propostes de frontera temporal a `audio/texts/batches/`. CA005 r23 F12–F13 té una unió sense pausa i una frontera estimada que requereix escolta; vegeu `docs/DICTATS-TEXT.md`. No regenerar cap d’aquests lots sense nou encàrrec.

## Propostes CA007–CA012 i ES001–ES012 · 28/11/2026

El docent demana textos per cobrir els focus pendents en català i castellà i validar-los abans de preparar la síntesi. Divuit textos provisionals amb revisió editorial independent superada, `status:draft` i `teacherReview:pending`. Cap escaleta preparada, cap autorització ni petició de síntesi. El recull llegible és `content/review/frases-ca-es-2026-11-28.txt`. Esperar la validació dels textos abans de preparar els lots exactes; la síntesi requereix l’autorització explícita corresponent.

Actualització del 28/11: el docent ha validat els divuit textos i encarregat les escaletes i propostes de lots per revisar abans de síntesi. `teacherReview:approved`, `prosodyReview:pending`, `synthesis:not-requested`. Les 72 variants han superat revisió independent i els textos es conserven exactament. Propostes de 6 lots catalans i 12 castellans a `audio/texts/batches/ca007-ca012-prosody-proposal-v1.json` i `es001-es012-prosody-proposal-v1.json`, totes dues sense cos executable ni autorització de síntesi. Aoede és una veu proposada, encara no confirmada per a aquests lots. Cap petició nova; esperar validació d’escaletes, veu i lots abans d’enviar res.

## Divuit lots autoritzats · 28/11/2026

El docent ha aprovat les escaletes i ha autoritzat explícitament CA007–CA012 i ES001–ES012, Aoede i quatre ritmes per petició. Les aprovacions exactes són els divuit fitxers `*-four-rhythms-v1.json`; la cua acotada és `audio/texts/batches/ca007-es012-production-v1.json`. Una única petició nova per lot; almenys **120.000 ms entre POST**, i **10 peticions totals per dia de quota America/Los_Angeles**, compartides amb Sentit. Avui es fa la part que permeti la quota; la resta, a partir del proper restabliment. La publicació progressiva dels quatre MP3 de cada text està autoritzada, sempre com a pendent d’audició.

`tools/run-phrase-production.cjs` consulta el registre compartit abans de cada enviament, conserva un lock propi i s’atura davant un intent previ ambigu. `--today` s’atura en arribar al topall diari; sense aquest indicador espera el dia següent. No repetir cap POST rebut o ambigu; una resposta desada es recupera localment, i una interacció coneguda es recupera amb el mateix ID. Davant errors de quota, autenticació o format desconegut, revisar la causa. Les marques de temps s’obtenen localment amb Vosk en la llengua correcta; no certifiquen pronunciació. No iniciar altres lots ni regeneracions sense nou encàrrec. Comprovar localment abans de pujar; la comprovació del desplegament remot la fa el docent.

Resultat del 28/11: deu lots rebuts i publicats (CA007–CA012, ES001–ES004), 40 MP3 nous. ES005–ES012 pendents de la quota següent. S’ha deixat la cua local amb `--run-authorized-queue --publish` en espera; comprovar sempre el PID propi i `output/audio/phrase-production-v1/status.json` abans de reprendre. Els rebuts públics també impedeixen reenviaments si una còpia del repositori no té els WAV locals. No retirar cap lock d’un procés viu ni iniciar un segon executor.
