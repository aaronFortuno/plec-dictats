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

El docent ha validat explícitament els quatre textos, ha demanat codis amb tres xifres i les escaletes per validar abans de sintetitzar. Les escaletes i la proposta de lots segueixen pendents de validació docent. Preparar estimacions no autoritza enviar peticions. Cap nova síntesi en aquesta fase.
