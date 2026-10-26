# Codis i cerca reproduïble · protocol 2

El format actual és **M6QM-AAVN4**: quatre caràcters per a la configuració i cinc per a la variant. Aquest exemple recupera 24 mots de cicle superior amb tots els focus, entre els quals hi ha **perquè** i **orquestra**. Es troba al cap de 15.655 intents si es comença per la variant zero.

## Focus: unir candidats, sense quotes

Els filtres s'apliquen així:

```text
tipus triat AND nivell triat AND qualsevol dels focus triats
```

No s'exigeix una paraula de cada focus. Amb tots els focus marcats, el conjunt de candidats és més ampli; el nombre de condicions no augmenta. Retirar focus pot facilitar una coincidència perquè redueix el conjunt de candidats, sempre que els mots obligatoris encara hi pertanyin. S'ha afegit una ajuda específica a la capçalera dels focus.

Des de la interfície 1.17, l’edició actual és `seed-2.json` (slot 1): `accent` correspon exactament als mots amb à/è/é/í/ò/ó/ú i `dieresi` als que tenen ï/ü. Un mot pot tenir les dues etiquetes. Els mots amb altres focus continuen entrant si algun d’aquests altres està seleccionat. Els codis de l’edició inicial (`seed-1.json`, slot 0) es recuperen sense reclassificar ni canviar cap mot. Els dos arxius són immutables. Un canvi de focus o Nou dictat utilitza l’edició actual; canviar només el plec conserva el codi.

La interfície 1.25 afegeix `seed-3.json` (slot 2, banc complet revisat) i `seed-4-basic.json` (slot 3, selecció editorial de 350 mots). El checkbox de vocabulari bàsic tria aquesta segona instantània; el nivell i els focus conserven la mateixa codificació. No es canvia ni el protocol ni el mostreig. Les instantànies anteriors continuen intactes. Vegeu [vocabulari bàsic](VOCABULARI-BASIC.md).

## Per què s'ha canviat el format

El format inicial havia de repartir `30⁶` codis entre 81.975 configuracions i quatre edicions. Això deixava només **2.223 variants per configuració**, insuficients per a moltes parelles de mots en un banc de més de tres mil candidats. No era una limitació de velocitat de l'ordinador: aquella parella podia no aparèixer en cap de les variants representables.

El protocol 2 dedica un bloc a cada funció:

| Bloc | Capacitat | Funció |
| --- | ---: | --- |
| Prefix de quatre caràcters | `30⁴ = 810.000` | 81.975 configuracions × nou posicions d'edició |
| Variant de cinc caràcters | `30⁵ = 24.300.000` | Inici reproduïble del mostreig |

Són aproximadament **10.900 vegades més variants per configuració**. No totes les edicions estan publicades ni totes les configuracions tenen prou candidats. Els codis de variants diferents tampoc no garanteixen conjunts diferents: en bancs petits hi pot haver coincidències o només canviar l'ordre.

S'utilitza el mateix alfabet de 30 símbols: `ABCDEFGHJKMNPQRSTVWXYZ23456789`, sense I, L, O, U, 0 ni 1. S'accepten minúscules, espais i guions. Nou símbols normalitzats identifiquen el protocol 2; sis identifiquen el protocol 1.

## Fórmula i recuperació

L'ordre fix dels focus, nivells i quantitats i la conversió de configuració a enter són els del protocol 1. En el protocol 2:

```text
bloc   = edició × 81.975 + configuració
prefix = (104.729 × bloc + 420.719) mod 810.000
codi   = prefix en base 30, quatre posicions
         + guionet
         + variant en base 30, cinc posicions
```

104.729 és coprimer amb 810.000; té invers modular i el prefix es pot descodificar sense col·lisions entre blocs. Els blocs reservats no assignats i les edicions no disponibles es rebutgen. Els productes són enters exactes dins del rang segur de JavaScript. La variant va de zero a 24.299.999.

El prefix identifica l'edició, el tipus, la llargada, el nivell i els focus. La llengua continua sent externa al codi: ruta `/ca/`, registre de catàlegs d'aquella llengua i `CA` al full. L'enllaç compartit inclou també la revisió del catàleg. El format del plec i el costat del model són independents del codi.

## Mostreig i comprovació eficient

Es conserva el mostreig determinista del protocol 1: barreja inicial de 32 bits, Mulberry32 i Fisher–Yates parcial sense repeticions, amb rebuig del residu sobrant abans del mòdul. La variant més gran continua cabent sobradament en l'aritmètica de 32 bits utilitzada. L'ordre d'extracció és el del dictat; no hi ha ordenació alfabètica posterior.

Per buscar un codi no cal construir 24 objectes de resultat per cada intent. El comprovador:

1. Prepara una sola vegada el conjunt filtrat i les posicions dels mots obligatoris.
2. Representa les substitucions de Fisher–Yates en dues taules tipades reutilitzables, de valors i marques de generació.
3. Acumula una màscara de fins a cinc bits per saber si ha trobat tots els mots.
4. Només construeix la tria completa quan hi ha coincidència.

La versió optimitzada ha de retornar exactament la mateixa decisió que obtenir el dictat complet i comprovar-hi els mots. Les proves comparen ambdós camins amb diversos tipus, llargades, nivells i variants, incloses les de més de 2.223 i els extrems del domini.

No s'insereixen mots obligatoris a mà. El codi es recupera sense conèixer la petició que va originar la cerca.

## Tandes, continuació i cancel·lació

La cerca comença en una variant aleatòria i avança circularment, sense repetir variants fins a completar tot el domini. El navegador comprova el temps cada 256 intents, cedeix el control aproximadament cada 8 ms de treball i acaba la tanda en arribar aproximadament a **1,8 segons**. No és un límit de temps real estricte; pot variar amb el dispositiu i la planificació del navegador.

Si la tanda s'acaba sense coincidència, guarda en memòria la variant següent, el recompte i els intents pendents. **Continua la cerca** reprèn exactament aquest tram. El missatge diu «Encara no hem trobat cap codi», sense declarar impossible tota la petició. Només després dels 24.300.000 intents es pot afirmar que cap variant representada inclou els mots en aquella configuració.

Es pot cancel·lar durant una tanda. Canviar els filtres o els mots inicia una cerca nova; canviar el plegat no altera la configuració lingüística. La continuació no es conserva després de recarregar la pàgina: es reprèn una cerca nova. La vista prèvia, el codi i el PDF anterior es retiren mentre no hi ha un resultat vàlid.

## Límits que continuen existint

Amb `N` candidats, `k` mots al full i `m` obligatoris, la probabilitat d'incloure'ls en una mostra uniforme és:

```text
P = (k/N) × ((k−1)/(N−1)) × ... × ((k−m+1)/(N−m+1))
```

Amb 3.299 candidats i 24 espais, una parella necessita de l'ordre de vint mil intents de mitjana sota aquest model; tres mots, de l'ordre de tres milions. Quatre necessiten de l'ordre de centenars de milions, i cinc encara molt més. Això explica per què ampliar el domini resol moltes peticions de dos o tres, però quatre o cinc són molt més favorables amb un focus acotat. El model orienta; no garanteix el resultat d'una cerca determinista concreta.

## Mesures locals del protocol 2

Deu conjunts independents de mots per cas, sense escollir-los a partir de dictats coneguts. Fulls de 24, nivell «Tot el banc». Node 24.19.0, Windows, Intel Core Ultra 5 225U. Per a 1–3 obligatoris es permet tot el domini; per a 4–5, com a màxim un milió d'intents. Les medianes són de càlcul local, no temps de mòbil ni temps totals del navegador.

| Candidats | Obligatoris | Trobats / 10 | Mediana |
| --- | ---: | ---: | ---: |
| Tot el banc · 3.299 | 2 | 10 | 6,263 ms |
| Tot el banc · 3.299 | 3 | 10 | 1.164,973 ms |
| Tot el banc · 3.299 | 4 | 0 | 359,891 ms |
| Tot el banc · 3.299 | 5 | 0 | 361,107 ms |
| Dièresi · 231 | 4 | 10 | 1,901 ms |
| Dièresi · 231 | 5 | 10 | 22,823 ms |
| Ela geminada · 160 | 4 | 10 | 0,976 ms |
| Ela geminada · 160 | 5 | 10 | 10,108 ms |

Els zeros de quatre i cinc amb tot el banc només descriuen el milió d'intents comprovat, no l'esgotament de tot el domini. El navegador pot necessitar diverses tandes per a una cerca de tres mots. Els resultats complets i la metodologia són a `benchmark-seeds-v2-2026-10-23.json`; es reprodueixen amb `node tools/benchmark-seeds-v2.cjs`.

## Conservació i proves

`seeds.js` i els set vectors antics es conserven sense canvis. `seeds-v2.js` afegeix el format nou i decideix el lector segons la llargada normalitzada. L'edició de catàleg actual és la mateixa instantània immutable `catalogs/ca/editions/seed-1.json`: ampliar el format del codi no modifica el banc ni en certifica la revisió editorial.

`node tools/check-seeds-v2.cjs` comprova 327.900 conversions als límits dels rangs, quatre vectors nous amb tota la seqüència, els set antics, la parella perquè/orquestra, l'equivalència del comprovador ràpid, els errors, la pausa per pressupost, la continuació amb volta al final del domini i la cancel·lació. `tools/check-catalogs.cjs` comprova també els enllaços de nou caràcters amb llengua i revisió.

No s'han implementat encara els àudios, el reproductor de l'alumnat ni el QR. El motor de recuperació i els enllaços actuals es podran compartir amb aquesta fase posterior.
