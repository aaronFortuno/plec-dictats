# Consolidació del CSS · 1.30

27/10/2026. Segon lot de T07 de l’auditoria tècnica. Es conserva la interfície actual i s’eliminen les disposicions antigues de panells que s’anul·laven amb una capa posterior. No s’introdueixen eines de compilació de CSS ni dependències noves.

## Propietat dels estils

| Fitxer | Responsabilitat |
| --- | --- |
| `styles.css` | Variables, resets, tipografia i components compartits. També el fan servir el dictat i la guia; no es retira globalment. |
| `workspace.css` | Components del preparador: capçalera, controls, full, ajuda, diàlegs i moviment. La capçalera conserva aquí les seves adaptacions de mida. |
| `seeds.css` | Codi, recuperació, gestió oral i mots obligatoris. Sense disposicions alternatives de les columnes. |
| `workspace-layout.css` | Marc de pàgina, espai disponible, columnes, calaixos, peu i impressió específica del preparador. Substitueix `responsive-workspace.css`, que es retira. |
| `catalog-browser.css`, `pronunciations.css`, `analytics.css` | Components de consulta, pronunciacions i privacitat. |
| `theme.css` | Colors i aparença, preferència de moviment reduït i adaptació del tema a impressió. |

El preparador carrega primitives, components, tema i finalment el layout vigent. La separació entre base i adaptació de pantalla és deliberada; ja no necessita desplegar una disposició de panells apilats i desfer-la després. El dictat i la guia conserven els seus fulls d’estil i no carreguen el layout del preparador.

## Què es consolida

- Regles del cos, contenidor principal, tres columnes i visor, abans repartides entre quatre fulls.
- Eliminació dels layouts de 900–1199, 761–899 i fins a 760 px que col·locaven panells sota altres panells o sota el visor. El comportament vigent continua essent tres columnes a partir de 1200 px i calaixos per sota.
- Footer i espais adaptatius agrupats, sense tres generacions de regles contradictòries. Es conserven amplades, marges, text i aspecte.
- Un únic conjunt de regles per a cada element del formulari de recuperació; es conserven les propietats efectives dels blocs duplicats.
- Regles d’impressió del preparador agrupades, incloent ocultació de calaixos, reset del visor i mida del paper.

No es reordena arbitràriament la cascada dels components ni s’eliminen estils compartits basant-se només en cobertura d’una sessió. La resta de selectors històrics de components pot revisar-se separadament amb un inventari de consumidors.

## Incidència d’impressió trobada

Les regles de pantalla del full responsive es carregaven després d’un bloc d’impressió de `workspace.css`. Tornaven a posar `display:grid` i `overflow:hidden` al contenidor principal; en mides estretes arribava a tenir només 38 px d’alçada. La captura en mode impressió mostrava el full pràcticament en blanc.

El bloc d’impressió consolidat aplica el contenidor de bloc amb desbordament visible després de les regles de pantalla. Es verifica una pàgina A4 des de finestres de 1440, 1024 i 390 px. És una correcció de la impressió directa del navegador; no modifica el generador de PDF descarregable ni la geometria del document.

## Validació visual i funcional

Referència capturada abans dels canvis amb el codi ADZ52356A, la mateixa versió de Chrome i el mateix entorn de fonts:

- 110 casos: 102 de pantalla i 8 d’impressió. Amplades de 320 a 1920 px, incloent els límits 1199/1200, 999/1000, 760/761 i finestres de 256 px d’alçada.
- Temes clar/fosc, laterals oberts, catàleg, ajuda, projecte, privacitat, plec de quarts, entrada del dictat i guia de pronunciació.
- En els 102 casos de pantalla coincideixen les geometries i les propietats CSS calculades que es comparen. 101 captures PNG són idèntiques; una varia en un únic píxel, sense canvi de geometria o propietats.
- Els 8 casos d’impressió difereixen només al cos/contenidor principal per la correcció descrita. El document conserva la mateixa geometria.
- El format llegible del nou fitxer de layout s’ha contrastat amb el parser CSS del navegador: les regles són les mateixes abans i després de donar-hi format.

La nova prova `check-workspace-layout.cjs` cobreix el pas entre columnes i calaixos, exclusió mútua dels laterals, peu visible, amplades petites, finestra baixa, ajuda en tema fosc i impressió A4. Forma part de la porta habitual, juntament amb la resta de comprovacions de codis, PDF, àudios, accessibilitat i interaccions.

Els quatre fitxers afectats passen de 54.918 a 52.282 bytes, abans de compressió i incloent el format llegible del nou layout. La reducció és secundària: l’objectiu és eliminar disposicions contradictòries i clarificar on s’edita cada comportament.

## Comparar canvis futurs

Amb el servidor local actiu i les dependències del projecte instal·lades:

```text
node tools/compare-css-layout.cjs --record output/css-abans
# Edita els estils i regenera la plantilla si cal.
node tools/compare-css-layout.cjs --compare output/css-abans --output output/css-despres
```

La segona ordre informa de les diferències de propietats/geometria i desa captures, hashos i detalls. Surt amb error si hi ha diferències calculades: no assumeix que siguin acceptables. Les diferències intencionades, com la correcció d’impressió d’aquest lot, necessiten revisió explícita. Els hashos permeten contrastar les captures, però les petites diferències de rasterització s’han d’interpretar en el seu context.

Només s’escriu dins d’`output/`, en una carpeta nova, sense substituir la referència. Les captures són locals i no es versionen perquè depenen del navegador i les fonts. No hi ha síntesi, notificacions ni comprovacions del desplegament remot. Aquesta matriu és una referència de Chrome; no certifica tots els navegadors o dispositius físics.
