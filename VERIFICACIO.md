# Verificació local · v1.4 · 23 d’octubre de 2026

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
