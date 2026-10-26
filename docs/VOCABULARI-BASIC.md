# Vocabulari bàsic · primera selecció

«Vocabulari bàsic» és un filtre complementari al nivell orientatiu i als focus. S’activa al configurador i al catàleg. La primera selecció té **350 mots** quotidians i escolars del banc actual, incloent formes femenines, masculines, singulars i plurals. La marca no substitueix les etiquetes ortogràfiques.

És una **proposta editorial pendent de revisió docent**, no una llista estadística de les 350 formes més freqüents, una escala validada o una prescripció curricular. Una freqüència alta en subtítols, per exemple, tampoc equival a familiaritat infantil. En aquesta primera iteració s’han revisat també «créixens», «cossiol» i «verro»: passen d’habitual a ampliació i s’exclouen dels dictats nous de cicle mitjà.

## Ús i consulta

El filtratge aplica **vocabulari bàsic AND nivell AND qualsevol dels focus triats**. Per exemple, bàsic + accentuació només selecciona mots de la llista amb accent gràfic que passin el nivell. Els filtres molt acotats poden deixar menys candidats que llocs al full: la plataforma informa de quants n’hi ha i no omple amb mots aliens als criteris. No s’aplica a les pseudoparaules.

El catàleg permet consultar la mateixa selecció amb el seu checkbox. **Bàsic · TXT** la descarrega alfabèticament, un mot per línia. També es pot llegir [el text del repositori](../catalogs/ca/vocabulari-basic.txt). La font editorial és [vocabulari-basic.json](../catalogs/ca/vocabulari-basic.json); `basicVocabulary: true` identifica els mateixos mots al JSON principal. El generador comprova la concordança exacta de tots tres.

## Codis i conservació

El protocol matemàtic i el format dels codis es mantenen. S’afegeixen dues instantànies immutables:

- `seed-3.json`, slot 2: banc complet amb les noves anotacions.
- `seed-4-basic.json`, slot 3: els 350 mots bàsics en el mateix ordre de la font i les pseudoparaules originals. La interfície utilitza aquesta edició per als dictats de paraules amb el filtre actiu.

L’edició queda dins del prefix del codi. Per tant, el codi tot sol recupera el mateix subconjunt, el nivell, els focus i l’ordre; no cal cap paràmetre addicional ni una llista desada al servidor. En recuperar-lo, el checkbox torna a l’estat correcte. Els noms i IDs dels mots no canvien: els àudios de les dues varietats continuen disponibles. La varietat dialectal es conserva al paràmetre independent `variety`.

`seed-1.json` i `seed-2.json` es conserven amb les seves empremtes originals. Una revisió futura de la selecció o de les classificacions necessita una edició nova; mai s’edita una instantània ja publicada. Els dictats impresos continuen recuperant els mots originals.

Comprovació local: `node tools/check-basic-vocabulary.cjs`.
