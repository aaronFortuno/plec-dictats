# Codis i selecció reproduïble · protocol 1

Un codi com **A7W-STC**, introduït a l'entrada catalana, recupera 24 paraules de cicle superior amb tots els focus. Comença per «diumenge», «reduïda», «empollar» i «lletges». Aquest és un vector de regressió permanent: no s'ha de canviar per fer passar una prova.

El codi representa la **tria de mots i el seu ordre**, el tipus, la llargada, el nivell, els focus i l'edició. El format del plec i el costat del model són opcions de presentació i es poden canviar sense canviar els mots ni el codi. El mateix codi pot tenir un resultat diferent en una altra llengua: la llengua forma part de la ruta, per exemple `/ca/`.

## Què fa el generador

1. Agafa una instantània immutable del catàleg i de les regles de nivell.
2. Filtra pel tipus i el nivell i conserva els mots que tinguin **qualsevol dels focus triats**. No hi ha prioritat per gènere o nombre. Un focus seleccionat delimita candidats, però no implica una quota mínima d'aquell focus al full.
3. A partir de la configuració i d'un número de variant, calcula una successió d'enters de 32 bits. La successió sempre és la mateixa amb els mateixos valors inicials.
4. Tria, sense reposició, les primeres 8, 12, 16, 20 o 24 posicions d'una barreja de Fisher–Yates. L'ordre d'extracció ja és l'ordre del dictat; no s'ordena alfabèticament després.
5. Converteix edició, configuració i variant en un codi de sis caràcters. Per recuperar-lo fa les operacions inverses i repeteix els passos anteriors.

No es guarden milers de dictats: es guarda **una instantània del banc** i la fórmula. Tampoc no hi intervenen l'hora, les paraules que s'han utilitzat abans o les dades d'un navegador. El botó «Nou dictat» tria un número inicial nou, però recuperar un codi sempre dona el mateix resultat.

## El mòdul de la proposta inicial

`x % N` és el residu de dividir `x` per `N`: permet tornar al principi després d'arribar al final d'una llista. La intuïció és correcta. Un salt constant, però, pot visitar només part de la llista: saltar de dos en dos sobre deu posicions només visita cinc posicions. Encara que el salt sigui coprimer amb la mida i les recorri totes, queda un patró regular.

Aquí el mòdul s'utilitza per obtenir una posició dins del tram disponible, però cada pas parteix d'un enter nou del generador i d'una barreja sense reposició. No es recorre el banc amb un salt constant.

## Format del codi i capacitat finita

Alfabet: `ABCDEFGHJKMNPQRSTVWXYZ23456789` (30 caràcters). Se n'exclouen I, L, O, U, 0 i 1. S'accepten minúscules, guions i espais en escriure'l. La separació `ABC-234` és visual.

Hi ha `30⁶ = 729.000.000` codis possibles. El protocol reserva quatre posicions d'edició. Cada edició admet:

- Paraules: 4.095 combinacions no buides de 12 focus × 4 nivells × 5 llargades = 81.900 configuracions.
- Pseudoparaules: 15 combinacions no buides de 4 focus × 5 llargades = 75 configuracions. No hi ha nivell.
- Total: **81.975 configuracions**, amb **2.223 variants per configuració**.

Una configuració amb menys candidats que espais al full és invàlida. Algunes posicions d'edició encara no estan disponibles i es rebutgen. També es rebutja el petit marge de codis no assignats. No tots els 729 milions de codis són dictats vàlids publicats.

Empaquetament enter:

```text
payload = ((edició × 81.975) + configuració) × 2.223 + variant
valor   = (104.729 × payload + 42.070.919) mod 729.000.000
codi    = valor escrit en base 30 amb sis posicions
```

104.729 és coprimer amb el mòdul; per tant, aquesta transformació és bijectiva i té inversa. S'utilitza `BigInt` en aquesta conversió per evitar pèrdua de precisió en la inversió. L'aritmètica de selecció és de 32 bits amb `Math.imul`, desplaçaments i XOR, definida a `seeds.js`. La barreja del valor inicial i el generador Mulberry32 són fixos al protocol. No és un generador per a secrets ni credencials.

## Mostreig sense repeticions

No cal copiar ni barrejar tot el banc per cada variant. Una taula de substitucions representa les posicions intercanviades d'una barreja parcial de Fisher–Yates:

```text
queden N posicions
tria j dins [0, N)
extreu el valor que ara ocupa j
posa a j el valor de l'última posició disponible
redueix N en una unitat
repeteix fins a completar el full
```

El generador d'enters usa rebuig de l'extrem sobrant abans de calcular el residu, per no introduir el biaix del mòdul en l'elecció d'índexs. Els IDs i l'ordre de l'instantània són estables; la selecció no depèn de `Intl.Collator` ni d'una ordenació alfabètica del navegador. El cost d'una tria és proporcional al nombre de mots del full, un cop preparat el conjunt filtrat.

## Mots obligatoris: cercar, no inserir

Es poden demanar d'un a cinc mots. Han de pertànyer al banc compartit i passar els filtres actuals. El sistema recorre, sense repetir-les, les 2.223 variants de la configuració, començant en una posició nova. Només accepta una variant si el resultat normal del generador ja conté tots els mots demanats.

**No s'hi insereix cap mot a mà.** Per això el codi trobat es recupera igual sense saber quins mots havien estat obligatoris. Si totes les variants fallen, es pot afirmar que no hi ha cap codi compatible en aquesta edició i configuració. No es pot afirmar que no existeixi cap conjunt matemàtic de paraules que les inclogui: el protocol representa un subconjunt finit de totes les tries possibles.

El navegador comprova 64 variants per bloc i cedeix el control entre blocs. Canviar els filtres cancel·la la cerca anterior; també hi ha un botó de cancel·lació. Durant una cerca o un resultat sense coincidències no es pot exportar un full anterior com si complís les condicions noves. El codi i l'enllaç anterior es retiren fins que hi ha un resultat vàlid.

Amb `N` candidats, `k` espais i `m` mots fixats, la probabilitat d'incloure'ls en una mostra uniforme és:

```text
P = (k/N) × ((k−1)/(N−1)) × ... × ((k−m+1)/(N−m+1))
```

La cerca té un cost màxim fix. El que cau ràpidament quan augmenta `m` és la possibilitat que existeixi una variant compatible. Afegir més temps de cerca no resol l'absència de codis al conjunt finit. Per tenir moltes més variants sense perdre la recuperació de filtres i edicions, caldria ampliar el codi o reduir les configuracions representades.

## Mesures locals

30 conjunts independents per cas, triats sense partir de codis que ja sabéssim que funcionaven. 24 mots, nivell «Tot el banc». Windows, Node 24.19.0, Intel Core Ultra 5 225U. Són mesures de càlcul local, **no mesures d'un Pixel 7 ni dels temps totals de la interfície**. Els resultats són descriptius d'aquesta mostra.

| Candidats | Mots obligatoris | Codis trobats / 30 | Mediana de càlcul |
| --- | ---: | ---: | ---: |
| Tot el banc · 3.299 | 1 | 30 | 0,197 ms |
| Tot el banc · 3.299 | 2 | 5 | 3,332 ms |
| Tot el banc · 3.299 | 3 | 0 | 4,316 ms |
| Tot el banc · 3.299 | 4 | 0 | 3,323 ms |
| Tot el banc · 3.299 | 5 | 0 | 3,206 ms |
| Dièresi · 231 | 2 | 30 | 0,211 ms |
| Dièresi · 231 | 3 | 27 | 0,974 ms |
| Dièresi · 231 | 4 | 6 | 3,298 ms |
| Dièresi · 231 | 5 | 0 | 3,454 ms |
| Ela geminada · 160 | 3 | 30 | 0,340 ms |
| Ela geminada · 160 | 4 | 15 | 3,165 ms |
| Ela geminada · 160 | 5 | 1 | 3,253 ms |

Un mot funciona amb molta facilitat en aquesta mostra. Dos són útils sobretot quan el focus acota el banc. Tres o més poden funcionar en conjunts petits; cinc són una opció de prova, sense garantia. Es manté el límit de cinc perquè el màxim de càlcul continua sent el mateix.

Reproducció: `node tools/benchmark-seeds.cjs`. El JSON complet es desa a `output/benchmark-seeds.json`.

## Conservació de codis i catàlegs

La primera edició està a `catalogs/ca/editions/seed-1.json`, registrada amb SHA-256 a `manifest.json`. Conté el catàleg, el seu ordre, els focus, els nivells i el perfil de llengua utilitzats. La comprovació i la generació dels paquets rebutgen canvis a aquesta instantània. Conservar una instantània per a codis **no equival a donar per acabada la revisió lingüística o docent**: es conserva també el seu estat editorial.

Quan canviï el banc per a noves tries, cal afegir una edició nova en una altra posició i conservar l'anterior, les constants i l'algoritme. El mateix codi antic no s'ha d'interpretar mai contra el banc nou. Si s'esgoten les posicions reservades, una ampliació del format haurà de preservar el lector dels codis de sis caràcters.

Els enllaços compartits inclouen `/ca/`, `seed` i la revisió del catàleg. Una revisió contradictòria es rebutja. El PDF imprimeix `CA / ABC-234`. La interfície encara és el preparador docent: els àudios, el mode de reproducció per a l'alumnat i el QR queden per a la fase següent.

Les dades del sistema anterior no es sobreescriuen. S'utilitza una clau local nova i només es recuperen les preferències compatibles. Les tries manuals i els mots propis no es poden convertir de manera general en un codi curt: no es reintrodueixen al generador. A «Com funciona» es pot descarregar una còpia de les dades antigues que encara tingui el navegador.

## Comprovacions

`node tools/check-seeds.cjs` comprova 327.900 conversions d'anada i tornada als límits dels rangs, la instantània, set vectors fixos amb l'ordre complet de mots, les llargades, els tipus, els nivells, l'absència de duplicats, la cerca sense insercions i la cancel·lació. També comprova que canviar el banc viu no altera la recuperació d'una edició arxivada. Els vectors són a `docs/seeds-v1-vectors.json` i els resultats de les mesures publicades, a `docs/benchmark-seeds-2026-10-23.json`.
