# Catàlegs de Plec

La font editable del banc és `ca/catalog.json`; el sistema de codis utilitza les instantànies arxivades a `ca/editions/`. El banc actual és una **proposta pendent de revisió docent**, no un corpus tancat ni una escala curricular validada. Conté 3.299 paraules i 96 pseudoparaules. La selecció inicial la va proposar l'assistent d'IA; no es va extreure automàticament del DIEC ni d'un banc escolar validat. Després es va contrastar amb el corrector de Softcatalà. Aquest primer contrast era insuficient per certificar cada grafia: un corrector també pot acceptar compostos generats, i no identifica la interpretació didàctica prevista. Cal el contrast exacte i la revisió dels casos pendents descrits més avall.

Per revisar-lo:

- `ca/paraules.txt`: totes les paraules, alfabèticament, una per línia, sense capçalera. El docent pot editar aquest TXT com a proposta: substituir o eliminar mots i desar-lo. Els comentaris han d'anar en una línia pròpia començada amb `#`.
- `ca/pseudoparaules.txt`: banc separat de formes inventades, amb el mateix format.
- `ca/revisio.tsv`: mots, tipus, familiaritat, dificultat, focus i identificador. S'obre amb un full de càlcul. Les etiquetes són identificadors; les equivalències són al JSON.

Les descàrregues del web són del catàleg complet de l'edició activa, sense caràcter oficial normatiu; els filtres no les modifiquen. Des de la versió 2.0 no s'afegeixen mots propis al generador de codis. A l'ajuda es pot descarregar una còpia de les dades antigues que conservi el navegador.

Els canvis del TXT **encara no modifiquen el web**. `node tools/review-diff.cjs` mostra les altes i baixes proposades sense escriure cap dada. En incorporar-los al JSON cal revisar també IDs, nivells, focus i el contrast lèxic; no s'han de conservar automàticament els de la paraula substituïda. El generador detecta un TXT editat i s'atura abans de sobreescriure'l. Cal conservar-lo o fer-ne una còpia abans de consolidar una revisió.

Després de modificar el JSON, executa `node tools/build-catalogs.cjs`. Genera els fitxers de revisió, els paquets del navegador i l'entrada `/ca/`. `node tools/build-catalogs.cjs --check` detecta fitxers desactualitzats sense escriure-hi.

## Identitat i ordre

Cada entrada conserva un ID estable. Es mantenen els 629 identificadors del banc anterior. La identitat de la revisió combina llengua, edició i els primers 16 caràcters d'un SHA-256. El SHA-256 complet també forma part del paquet. Es calcula sobre tot el JSON font i el perfil de llengua: ordre, grafies, IDs, etiquetes, nivells, regles i estat editorial. Canviar qualsevol d'aquests elements canvia la revisió. L'ordre alfabètic és només per a la revisió humana; no defineix l'ordre del futur generador.

El sistema de codis conserva una instantània immutable del banc i del perfil de llengua a `ca/editions/seed-1.json`, amb empremta al registre `manifest.json`. La fixació per reproduir codis és independent de l'aprovació lingüística: es conserva també l'estat editorial de la instantània, encara en revisió. Els codis identifiquen l'edició i el protocol. Mai no es resol un codi antic contra l'últim banc disponible. Per incorporar canvis a nous dictats cal afegir una edició nova, conservar l'anterior i actualitzar el registre. Vegeu [el protocol de llavors](../docs/LLAVORS.md).

El generador rebutja l'estat `stable` si no consta la revisió docent i un contrast exacte complet sense incidències que correspongui a l'empremta del JSON actual. Una validació antiga no serveix per aprovar una llista modificada. Això protegeix el pas a estable; la versió provisional continua en estat `draft`.

## Llengües i enllaços

`locales/manifest.json` registra les llengües disponibles; actualment només el català. `locales/ca/config.json` separa les regles de nivell, l'alfabet admès, el catàleg i la plantilla de la interfície. Per afegir una llengua cal un paquet propi i la seva plantilla traduïda; afegir només una ruta no tradueix el banc.

La ruta relativa `ca/` funciona tant en un domini propi com sota `/plec-dictats/` de GitHub Pages. La portada redirigeix preservant els paràmetres i el fragment. La identitat prevista és `(llengua, revisió del catàleg, versió del generador, codi)`: el mateix codi pot correspondre a paraules diferents en llengües diferents.

Els enllaços actuals del preparador inclouen llengua, codi i revisió, per exemple `/ca/?seed=A7WSTC&catalogue=ca-…`. El lector valida la revisió i el codi, recupera els filtres i torna a generar el mateix ordre. `language.js` manté també el contracte de ruta per al futur mode `dictat`; el reproductor i el QR encara no estan implementats. Les dades manuals de versions anteriors es conserven separadament i no es converteixen automàticament en codis.

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

### Formes integrades als focus ortogràfics

Les 137 variants incorporades en la versió 1.8 es mantenen dins dels focus ortogràfics habituals, sense cap filtre ni quota diferenciada segons gènere o nombre. El focus `flexio` s'ha retirat en la versió 1.9 tant de les categories com de les etiquetes de cada entrada. Les dades gramaticals internes de `morphology` es conserven i no intervenen en la selecció. Els participis pertanyen també a «Formes verbals», amb independència dels usos adjectivals o nominals que puguin tenir. Per exemple, «acompanyades» és disponible amb dígrafs, «organitzades» amb essa i «conduïdes» amb dièresi. Les 137 variants i «arbitrar» tenen coincidència exacta al lèxic de la revisió indicada a `validation.json`.

En recuperar una preferència antiga amb el focus retirat, es mantenen els altres focus vàlids. Si només s'havia seleccionat el focus retirat, es recuperen els focus habituals perquè el preparador continuï funcionant. La tria de paraules guardada es conserva; una selecció de focus buida voluntàriament continua buida.

La revisió TXT anterior a la consolidació es conserva localment a `output/revisio-abans-v1.8.txt`. Les llistes TXT i TSV actuals ja inclouen els canvis integrats al generador.

### Revisió dels focus a la versió 1.17

La nova edició `ca-2026-02-draft` / `seed-2.json` redefineix accentuació com a **accent gràfic present**. S'han retirat 503 assignacions sense accent i s'han afegit 315 assignacions que faltaven en mots accentuats: 867 mots amb aquest focus. Dièresi coincideix amb ï/ü: 227 mots, retirant quatre etiquetes sobrants. No s'ha alterat cap grafia ni ID.

Dels mots que perdien l'únic focus, 170 s'han reassignat a grafies realment presents (essa, hac, ge/jota, be/ve, erra, qu/gu, dígrafs o vocals àtones). Són etiquetes editorials pendents de revisió, no una validació lingüística. Sis mots (talp, fil, pit, plom, tel i tiet) no tenen un dels focus actuals assignat: continuen al catàleg de consulta, amb `focusStatus: unassigned`, però no s'introdueixen artificialment en un exercici d'accentuació. Amb tots els focus, hi ha 3.293 candidats abans d'aplicar el nivell.

La instantània original `seed-1.json` i la seva empremta es conserven. Les taules de pronunciació continuen ancorades a aquella identitat de mots; canviar etiquetes en la nova edició no invalida els MP3 amb els mateixos ID.

### Vocabulari bàsic a la versió 1.25

La selecció editorial de 350 mots és a `ca/vocabulari-basic.json` i es publica en text pla a `ca/vocabulari-basic.txt`. Els mateixos mots tenen `basicVocabulary: true` al JSON principal. El generador comprova la concordança de les fonts i protegeix les revisions manuals del TXT abans de regenerar-lo.

Els mots «créixens», «cossiol» i «verro» passen a ampliació. Les altres grafies i identitats es conserven. `seed-3.json` (slot 2) congela el banc complet revisat i `seed-4-basic.json` (slot 3) el subconjunt bàsic. Els slots 0 i 1 es mantenen intactes. El filtre bàsic es combina amb el nivell i els focus; no es presenta com un rànquing estadístic ni com una escala validada. Vegeu [criteris i ús](../docs/VOCABULARI-BASIC.md).
