# Catàlegs de Plec

La font editable és `ca/catalog.json`. El banc actual és una **proposta pendent de revisió docent**, no un corpus tancat ni una escala curricular validada. Conté 3.166 paraules i 96 pseudoparaules. Les grafies de les paraules s'han contrastat amb el corrector de Softcatalà; això no valida la freqüència d'ús, el nivell, els focus ni l'adequació didàctica de cada mot. Algunes formes admeten lectures o categories gramaticals diferents.

Per revisar-lo:

- `ca/paraules.txt`: totes les paraules, alfabèticament, una per línia, sense capçalera.
- `ca/pseudoparaules.txt`: banc separat de formes inventades, amb el mateix format.
- `ca/revisio.tsv`: mots, tipus, familiaritat, dificultat, focus i identificador. S'obre amb un full de càlcul. Les etiquetes són identificadors; les equivalències són al JSON.

Les descàrregues són del catàleg oficial complet; els filtres del preparador i les paraules pròpies no les modifiquen. Els mots propis continuen disponibles en l'exportació JSON del navegador.

Després de modificar el JSON, executa `node tools/build-catalogs.cjs`. Genera els fitxers de revisió, els paquets del navegador i l'entrada `/ca/`. `node tools/build-catalogs.cjs --check` detecta fitxers desactualitzats sense escriure-hi.

## Identitat i ordre

Cada entrada conserva un ID estable. Es mantenen els 629 identificadors del banc anterior. La identitat de la revisió combina llengua, edició i els primers 16 caràcters d'un SHA-256. El SHA-256 complet també forma part del paquet. Es calcula sobre tot el JSON font i el perfil de llengua: ordre, grafies, IDs, etiquetes, nivells, regles i estat editorial. Canviar qualsevol d'aquests elements canvia la revisió. L'ordre alfabètic és només per a la revisió humana; no defineix l'ordre del futur generador.

Quan s'aprovi el banc, caldrà crear la primera edició estable i conservar-la com a instantània immutable. Els futurs codis hauran de fixar també la versió de l'algorisme. No s'han d'emetre codis persistents sobre aquesta edició provisional, ni resoldre un codi antic contra l'últim banc disponible.

## Llengües i enllaços

`locales/manifest.json` registra les llengües disponibles; actualment només el català. `locales/ca/config.json` separa les regles de nivell, l'alfabet admès, el catàleg i la plantilla de la interfície. Per afegir una llengua cal un paquet propi i la seva plantilla traduïda; afegir només una ruta no tradueix el banc.

La ruta relativa `ca/` funciona tant en un domini propi com sota `/plec-dictats/` de GitHub Pages. La portada redirigeix preservant els paràmetres i el fragment. La identitat prevista és `(llengua, revisió del catàleg, versió del generador, codi)`: el mateix codi pot correspondre a paraules diferents en llengües diferents.

`language.js` prepara el contracte dels futurs enllaços: `/ca/?mode=dictat&seed=X5D8TY&catalogue=ca-…`. Encara no hi ha lector de llavors, mode de reproducció ni QR. El futur lector haurà de validar la revisió i rebutjar-ne una de desconeguda. Els fitxers de dictat actuals guarden les paraules explícites i es poden recuperar tot i que canviï el banc.

## Contrast de grafies

Selecció editorial pròpia contrastada amb [catalan-dict-tools, de Softcatalà](https://github.com/Softcatala/catalan-dict-tools), fitxers `resultats/hunspell/catalan.aff` i `catalan.dic`, utilitzant Spylls 0.1.7. Informe i empremtes a `ca/validation.json`. Es pot repetir amb `tools/validate-spelling.py`, Spylls instal·lat i el diccionari extern. El diccionari i la llibreria validadora s'han utilitzat com a eines de comprovació i no s'inclouen al producte. Consulta el [projecte de Softcatalà](https://www.softcatala.org/projectes/catalan-dict-tools/) per a les fonts i llicències pròpies.
