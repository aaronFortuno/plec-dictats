# Verificació local · v1.6 · 23 d’octubre de 2026

## Vista prèvia i configuració v1.6

- Configuració inicial de 220 px: aproximadament el 30 % del lateral a 1440 × 900 i el 36 % a 1366 × 768. Els focus i el recompte es veuen sense scroll en aquestes mides i a 1024 × 768; no s’ha reduït la mida del text.
- Zoom comprovat amb botó, roda, arrossegament, doble clic, ajust i teclat. Proves de geometria del punt d’ancoratge, límits 50–400 % i limitació del desplaçament.
- Durades calculades de 0,22 s en diàlegs, botons i transformació del full. Obertura i tancament dels diàlegs, desplegable de plecs i guia docent dins l’ajuda comprovats al navegador.
- Catàleg: «atapeït» disponible a cicle superior, etiquetat com a verb i dièresi. 533 paraules i 96 pseudoparaules; controls compactes i visor revisats també a 390 × 844.
- PDF sense codi aleatori: 80 variants continuen produint una pàgina A4; terços i quart renderitzats i revisats visualment. La guia docent es descarrega des de «Com funciona».
- La tria es pot guardar i recuperar sense codi; els fitxers anteriors continuen admesos. La tria original es conserva al final de les comprovacions.

## Popups v1.5

- Referència consultada: popup V4V i historial de Pentagrama. Mateixa foto, QR, adreça Lightning, presentació de l’autor i enllaç al portfoli; repositori i crèdits adaptats a Plec.
- QR SVG idèntic al del document d’origen, fotografia carregada correctament i enllaços revisats sense activar cap cartera ni fer cap aportació.
- Botó de copiar provat al navegador local: confirmació «Adreça Lightning copiada». Títol enfocat en obrir, regió de contingut accessible i capçalera fora del desplaçament.
- Vista d’escriptori amb autor i recursos en dues columnes. A 390 × 844, una columna, cap desbordament horitzontal i desplaçament intern. Historial amb data i resum per versió, més nou al principi, i enllaç al changelog complet.
- No s’ha incorporat Umami ni s’ha modificat el portfoli; són passos posteriors. La tria del dictat s’ha conservat durant les proves.

## Ajustos v1.4

- 532 paraules i 96 pseudoparaules, sense duplicats de mots, IDs ni etiquetes. 12 focus de paraules i 4 de pseudoparaules. Verificats els exemples de verbs i els solapaments d’etiquetes.
- Canvi immediat de tipus, quantitat, nivell i focus al navegador. Amb cap focus, es retiren els mots antics; només es conserven els fixats. Amb verbs i cicle mitjà, la proposta només inclou els tres candidats compatibles i el PDF queda desactivat. En recuperar cicle superior es completa; la quantitat 16 s’aplica immediatament.
- Un mot fixat fora del focus sobreviu al canvi i el lateral ho indica. Les proves de lògica cobreixen també propostes parcials i prioritat dels fixats en reduir la llargada.
- Diàlegs d’historial i projecte oberts i revisats. Crèdits Lucide i pdf-lib i V4V sense destí inventat. Icones locals i barres sense botons als extrems.
- Fulls sense Grup: 80 combinacions de PDF continuen produint una sola pàgina A4; exemples de terços i quart renderitzats i revisats visualment. Descàrrega des de la interfície de la disposició invertida amb dièresis.
- Tria original guardada abans de les proves i recuperada després.

## Espai de treball v1.3

- Navegador local a 1440 × 900 i 1366 × 768: capçalera de 64 px; configuració, vista prèvia i tria alineades amb la mateixa alçada; botó de preparar dins de la finestra. El full ocupa l’alçada disponible del visor i conserva la proporció 210/297.
- A 1024 × 768 es mantenen les tres columnes sense desbordament horitzontal. En la prova de 390 × 844 la disposició s’apila, el document conserva la proporció i no hi ha desbordament horitzontal.
- Canvi real del contingut SVG: terços, guies a 70/140 mm i escriptura al centre; quart esquerre, guies a 51/104 mm i escriptura al tram exterior; quart dret, guies a 106/159 mm. Comprovació de les dues posicions del model.
- Gràfic explicatiu visible dins del diàleg d’ajuda i absent de l’àrea principal. El catàleg continua obrint-se des del lateral dret.
- Fixació d’un mot i bloqueig del canvi, desfixació i canvi individual des del lateral dret; recuperació posterior de la tria original amb el mateix primer mot i format de plec.
- Descàrrega real d’un PDF de quart des de la interfície nova. Sense errors JavaScript a la sessió de prova.
- Scripts i fulls d’estil locals amb la mateixa revisió v1.3.0; fitxers i identificadors HTML comprovats. Les comprovacions del catàleg, els perfils i la geometria continuen passant.

## Plecs i PDF (v1.2)

- Catàleg i filtres: les comprovacions de 433 paraules i 96 pseudoparaules, etiquetes, perfils de nivell, mostreig, fixats i repeticions continuen passant.
- Terços: escriptura entre 70 i 140 mm, amb el model a qualsevol costat; primer es plega la banda buida i després el model, cap al darrere.
- Quart: model exterior de 51 mm, solapa buida de 53 mm, tram de 54 mm sota el paquet i escriptura de 52 mm. Dos plecs cap endins. Guies a 51/104 mm o 106/159 mm segons la posició del model.
- Geometria del quart: el model cap dins de la primera solapa amb 2 mm de marge i el paquet deixa 1 mm abans de l’escriptura. El paper buit cobreix tota l’amplada del model. Cap ratlla, text ni rectangle envaeix les zones buides; les dues guies poden travessar-les.
- PDF: 80 combinacions de tipus, llargada, full/guia, format del plec i posició del model. Cadascuna té una pàgina A4. Dos exemples amb les mateixes 24 paraules, renderitzats i revisats visualment.
- Navegador local: canvi entre els dos formats i les dues orientacions, guies a les coordenades previstes, esquema del full obert, vista lateral de dictat/correcció i instruccions adaptades. Sense errors JavaScript a la sessió de prova.
- Descàrrega real del PDF de quart des del navegador i exportació d’un JSON de format 3. La importació recupera el format de quart, el model a l’esquerra i les mateixes 24 paraules. La importació d’un JSON antic de format 2 conserva els mots i utilitza terços; posteriorment s’ha restaurat la tria de format 3.

**Pendent:** prova física dels dos plegats amb paper real. La geometria i les representacions no mesuren la rigidesa, l’opacitat ni la tolerància de la impressora.

D’acord amb les instruccions del projecte, no es comprova el web remot després de les comprovacions locals. La revisió de GitHub Pages la farà l’usuari manualment.

## Versió 1.7 · 23 d’octubre de 2026

- 3.166 paraules i 96 pseudoparaules, sense duplicats ni col·lisions d'ID. Es conserven els identificadors anteriors. Tots els focus i perfils mantenen les comprovacions de generació i geometria.
- Grafies reconegudes pel diccionari de Softcatalà, amb empremtes dels fitxers de contrast a `catalogs/ca/validation.json`. Nivells, etiquetes i adequació didàctica pendents de revisió docent.
- Generació reproduïble comprovada amb `tools/build-catalogs.cjs --check`. L'empremta canvia amb les etiquetes i també amb les regles de nivell. TXT sense capçalera, ordenat i amb una entrada per línia.
- Rutes de futurs enllaços provades amb domini propi, subdirectori de GitHub Pages i fitxer local. Es rebutgen llengües no disponibles i catàlegs d'una altra llengua.
- Navegador local: portada redirigida a `/ca/` preservant consulta i fragment; cerca «atapeït»; catàleg complet de 3.166 paraules; descàrrega TXT idèntica al fitxer generat. Vista revisada en pantalla estreta i a 1440 × 900.
- Importació real d'un dictat de format 3 i recuperació correcta. Dictat de llengua espanyola rebutjat sense canviar la selecció. Generació de 20 pseudoparaules i 24 paraules amb el banc ampliat; tria inicial restaurada després de la prova.
- Tots els 3.262 elements són codificables amb la font Helvetica del PDF. No s'ha canviat el disseny dels fulls.
- Sense errors JavaScript en les accions comprovades. Captura local a `output/cataleg-v1.7.jpg`.
- No s'han fet comprovacions del web desplegat. Encara no hi ha llavors recuperables, QR de dictat ni reproductor.

## Versió 1.8 · 23 d’octubre de 2026

- Banc actual de 3.299 paraules i 96 pseudoparaules, amb 17 focus. Eliminades les quatre formes indicades; vídua i àrbitre es conserven. El canvi de revisió arbitre → arbitrar queda consolidat.
- 137 variants noves, amb focus de flexió, gènere, nombre i etiquetes ortogràfiques. Les 137 variants i arbitrar tenen coincidència exacta al lèxic flexionat de Softcatalà (revisió b00fcd9503cf290d5b4ef44c873b65667873593a). El cas preexistent rebel·lar-se continua separat com a pendent; no s’ha declarat estable el conjunt del banc.
- Comprovacions de catàleg, paquets, geometria, etiquetes, contrast estricte i protecció de revisió superades. La generació del focus nou retorna 24 elements diferents del conjunt de 150 formes disponibles.
- Navegador local: migració de tots els focus activats, disponibilitat del focus nou, generació amb només Femenins i plurals, cerca d’organitzades, exportació del TXT complet de 3.299 mots idèntic al fitxer generat i sense errors JavaScript. La selecció anterior s’ha restaurat després de les proves.
- Llistes TXT i TSV regenerades. Còpia de la revisió anterior a output/revisio-abans-v1.8.txt. Captura local a output/femenins-plurals-v1.8.jpg. Comprovacions del web remot a càrrec de l’usuari.
