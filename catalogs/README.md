# Catàlegs de Plec

La font de dades de l'aplicació és `ca/catalog.json`. El banc actual és una **proposta pendent de revisió docent**, no un corpus tancat ni una escala curricular validada. Conté 3.299 paraules i 96 pseudoparaules. La selecció inicial la va proposar l'assistent d'IA; no es va extreure automàticament del DIEC ni d'un banc escolar validat. Després es va contrastar amb el corrector de Softcatalà. Aquest primer contrast era insuficient per certificar cada grafia: un corrector també pot acceptar compostos generats, i no identifica la interpretació didàctica prevista. Cal el contrast exacte i la revisió dels casos pendents descrits més avall.

Per revisar-lo:

- `ca/paraules.txt`: totes les paraules, alfabèticament, una per línia, sense capçalera. El docent pot editar aquest TXT com a proposta: substituir o eliminar mots i desar-lo. Els comentaris han d'anar en una línia pròpia començada amb `#`.
- `ca/pseudoparaules.txt`: banc separat de formes inventades, amb el mateix format.
- `ca/revisio.tsv`: mots, tipus, familiaritat, dificultat, focus i identificador. S'obre amb un full de càlcul. Les etiquetes són identificadors; les equivalències són al JSON.

Les descàrregues són del catàleg complet de Plec, sense caràcter oficial normatiu; els filtres del preparador i les paraules pròpies no les modifiquen. Els mots propis continuen disponibles en l'exportació JSON del navegador.

Els canvis del TXT **encara no modifiquen el web**. `node tools/review-diff.cjs` mostra les altes i baixes proposades sense escriure cap dada. En incorporar-los al JSON cal revisar també IDs, nivells, focus i el contrast lèxic; no s'han de conservar automàticament els de la paraula substituïda. El generador detecta un TXT editat i s'atura abans de sobreescriure'l. Cal conservar-lo o fer-ne una còpia abans de consolidar una revisió.

Després de modificar el JSON, executa `node tools/build-catalogs.cjs`. Genera els fitxers de revisió, els paquets del navegador i l'entrada `/ca/`. `node tools/build-catalogs.cjs --check` detecta fitxers desactualitzats sense escriure-hi.

## Identitat i ordre

Cada entrada conserva un ID estable. Es mantenen els 629 identificadors del banc anterior. La identitat de la revisió combina llengua, edició i els primers 16 caràcters d'un SHA-256. El SHA-256 complet també forma part del paquet. Es calcula sobre tot el JSON font i el perfil de llengua: ordre, grafies, IDs, etiquetes, nivells, regles i estat editorial. Canviar qualsevol d'aquests elements canvia la revisió. L'ordre alfabètic és només per a la revisió humana; no defineix l'ordre del futur generador.

Quan s'aprovi el banc, caldrà crear la primera edició estable i conservar-la com a instantània immutable. Els futurs codis hauran de fixar també la versió de l'algorisme. No s'han d'emetre codis persistents sobre aquesta edició provisional, ni resoldre un codi antic contra l'últim banc disponible.

El generador rebutja l'estat `stable` si no consta la revisió docent i un contrast exacte complet sense incidències que correspongui a l'empremta del JSON actual. Una validació antiga no serveix per aprovar una llista modificada. Això protegeix el pas a estable; la versió provisional continua en estat `draft`.

## Llengües i enllaços

`locales/manifest.json` registra les llengües disponibles; actualment només el català. `locales/ca/config.json` separa les regles de nivell, l'alfabet admès, el catàleg i la plantilla de la interfície. Per afegir una llengua cal un paquet propi i la seva plantilla traduïda; afegir només una ruta no tradueix el banc.

La ruta relativa `ca/` funciona tant en un domini propi com sota `/plec-dictats/` de GitHub Pages. La portada redirigeix preservant els paràmetres i el fragment. La identitat prevista és `(llengua, revisió del catàleg, versió del generador, codi)`: el mateix codi pot correspondre a paraules diferents en llengües diferents.

`language.js` prepara el contracte dels futurs enllaços: `/ca/?mode=dictat&seed=X5D8TY&catalogue=ca-…`. Encara no hi ha lector de llavors, mode de reproducció ni QR. El futur lector haurà de validar la revisió i rebutjar-ne una de desconeguda. Els fitxers de dictat actuals guarden les paraules explícites i es poden recuperar tot i que canviï el banc.

## Contrast de grafies

Selecció editorial pròpia contrastada amb [catalan-dict-tools, de Softcatalà](https://github.com/Softcatala/catalan-dict-tools), fitxers `resultats/hunspell/catalan.aff` i `catalan.dic`, utilitzant Spylls 0.1.7. Informe i empremtes a `ca/validation.json`. Es pot repetir amb `tools/validate-spelling.py`, Spylls instal·lat i el diccionari extern. El diccionari i la llibreria validadora s'han utilitzat com a eines de comprovació i no s'inclouen al producte. Consulta el [projecte de Softcatalà](https://www.softcatala.org/projectes/catalan-dict-tools/) per a les fonts i llicències pròpies.

### Contrast exacte amb el lèxic flexionat

`tools/audit-lexicon.cjs` consulta `resultats/lt/diccionari.txt` d'una revisió fixa de Softcatalà. Exigeix una coincidència literal després de normalitzar Unicode a NFC: preserva accents, majúscules, guionets i ela geminada. No genera afixos ni divideix compostos. Cada coincidència inclou lema i etiqueta morfològica, de manera que «arbitre» queda identificat com a forma del verb «arbitrar» i «àrbitre» com a nom.

```text
node tools/audit-lexicon.cjs --dictionary RUTA/diccionari.txt --catalog catalogs/ca/catalog.json --review catalogs/ca/paraules.txt --commit SHA_DE_LA_FONT --out output/contrast-lexic
node tools/check-lexicon.cjs
```

Genera JSON i TSV, amb empremtes del catàleg, del TXT i de la font, i un avís d'atribució i llicència de les anotacions. Retorna codi 2 mentre hi hagi formes sense coincidència. L'absència exigeix revisió, no implica que el mot sigui incorrecte: per exemple, una forma amb pronom enclític pot no aparèixer al fitxer bàsic. Les excepcions només s'han de donar per bones amb una justificació lingüística documentada. El recurs de Softcatalà és una font especialitzada; el [DIEC de l'IEC](https://dlc.iec.cat/) és la referència normativa per resoldre dubtes lèxics. El corrector i el lèxic flexionat de Softcatalà comparteixen dades i no constitueixen dues validacions independents.

El primer contrast del 23 d'octubre de 2026 va trobar 3.162 de les 3.166 formes. En la versió 1.8 s'han retirat «ahir-vespre», «ahir-nit», «blat-de-moro» i, a petició del docent, «viuda»; es conserva «vídua». S'ha incorporat la proposta de canvi «arbitre» → «arbitrar», mantenint «àrbitre». El banc actual té 3.299 mots: 3.298 tenen coincidència exacta i la forma enclítica preexistent «rebel·lar-se» queda pendent d'una excepció lingüística documentada. Cap d'aquestes comprovacions valida la freqüència, els nivells escolars o les etiquetes pedagògiques.

### Femenins i plurals

La versió 1.8 incorpora 137 variants noves i un focus «Femenins i plurals» (`flexio`), amb 150 formes en total comptant les que ja hi eren. Cada forma porta gènere i nombre a `morphology`; les formes invariables «feliç» i «capaç» indiquen gènere comú. Els participis també pertanyen a «Formes verbals», amb independència dels usos adjectivals o nominals que puguin tenir. Es comparteixen els focus ortogràfics pertinents: per exemple, «acompanyades» amb dígrafs, «organitzades» amb essa i «conduïdes» amb dièresi. Les 137 variants i «arbitrar» tenen coincidència exacta al lèxic de la revisió indicada a `validation.json`.

La revisió TXT anterior a la consolidació es conserva localment a `output/revisio-abans-v1.8.txt`. Les llistes TXT i TSV actuals ja inclouen els canvis integrats al generador.
