# Coordinació del projecte

**Estat 25/10/2026:** l’usuari ha reautoritzat encàrrecs acotats a K3 amb esforç baix, després de les proves costoses amb K3.1. T008 i T009 estan completats; no hi ha cap encàrrec actiu. Conserva pressupostos, límits de passos i temps, eines acotades i revisió de Codex abans d’integrar. El registre vigent és `../protocol-codex-kimi/ESTAT-WORKER.json`. No canviïs configuració global.

- L’usuari explica les necessitats i confirma visualment el resultat. Codex especifica, coordina, revisa i integra; **Kimi K3 Low** pot implementar encàrrecs acotats mitjançant Kimi Code CLI. Separa els fitxers dels encàrrecs i evita escriptors simultanis sobre els mateixos fitxers.
- Protocol local: `../protocol-codex-kimi/LLEGEIX-ME.md`; context: `../protocol-codex-kimi/PERFIL-PLEC.md`; connexió: `../protocol-codex-kimi/CONNEXIO.md`. Llegeix-los abans de preparar un encàrrec. Si no estan disponibles en un altre equip, conserva aquest repartiment i reconstrueix el context necessari a partir del repositori.
- Pilot de lectura T000 completat amb Kimi Code 2.3.1 i l’àlies explícit `kimi-code/k3.1-pro`. No utilitzis el model per defecte sense verificar-lo ni substitueixis K3.1 silenciosament.
- Cada implementació necessita un encàrrec acotat, base Git coneguda, perfil d’eines apropiat i termini extern. El llançador T000 és exclusivament de lectura. No reprenguis aquella sessió per implementar.
- Kimi no fa commits, push, merge, desplegaments ni canvis globals. Codex revisa també els fitxers nous, conserva els canvis preexistents de l’usuari i integra només el lliurament revisat dins de l’autorització vigent.
- En els projectes remots, si s’han comprovat els canvis en local, **no facis la comprovació remota**: la farà l’usuari manualment i comunicarà qualsevol incidència.
