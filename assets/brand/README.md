# Marca de Plec

El web i els fulls comparteixen les mateixes corbes vectorials de la marca i del lema. Això evita canvis de font o deformacions entre pantalla i PDF, i manté l’aspecte també en dispositius sense Georgia instal·lada.

La referència és el header original: Georgia negreta de 38 px amb espaiat de −2 px per a «plec.» i Georgia cursiva de 17 px amb espaiat de −0,2 px per al lema. `source-layout.json` conserva les posicions de cada caràcter i les dimensions del símbol. Els colors segueixen les variables de la interfície; el paper conserva els colors del tema clar.

`geometry.json`, `mark.svg`, `tagline.svg` i `brand.js` són dibuixos de text fix; no inclouen fitxers TTF/WOFF ni una font completa. `tools/build-brand.cjs` els regenera a Windows amb Georgia instal·lada, emprant els contorns natius de `System.Drawing`. La reconstrucció ordinària del lloc només necessita els artefactes ja versionats.

`PlecBrand.shapes(x,y,width)` ajusta les dues bandes a la mateixa amplada real, sense canviar-ne la relació d’aspecte, i deixa 2 mm entre marca i lema. `core.js`, `pdf.js` i el previsualitzador utilitzen aquesta mateixa geometria. El generador HTML incorpora `PlecBrand.svg()` als headers.
