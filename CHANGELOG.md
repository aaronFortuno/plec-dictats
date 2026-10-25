# Historial

## 1.19.1 · 25 d’octubre de 2026

- Lot complet d’Enric publicat: 3.299 MP3 i IPA de síntesi congelada, amb identitat i SHA-256 per a la revisió individual. Cap validació lingüística automàtica.
- Selector de varietat del catàleg actiu per a central i valencià; la locució s’atura en canviar i no es barregen varietats quan falta un àudio.
- Verificada la descodificació dels 3.299 fitxers: mono, 24 kHz, zero errors. Registre final de 410.316 caràcters, sense reintents al lot.
- Comprovacions i documentació actualitzades. Síntesi i ajudant de suspensió finalitzats; seguiment desactivat després de publicar.


## 1.19 · 25 d’octubre de 2026

- Peu sempre visible, scroll intern i laterals plegables exclusius per sota de 1.200 px, amb transicions de 220 ms. Implementació inicial de Kimi K3 Low revisada i corregida localment.
- Catàleg i pronunciacions com a dues vistes del mateix popup, amb cerca, notes i exportacions conservades. Ruta directa compatible. Retirats els avisos de codis antics de la interfície.
- Publicats 3.080 mots centrals disponibles i cinc locucions d’instruccions, amb manifests i empremtes de cada MP3. Revisió auditiva encara oberta.
- IPA valenciana proposada per als 3.299 mots, amb procedència i pistes explícites. Conservades les 22 propostes inicials; correccions de subjuntius amb dièresi i -essin. Acceptació tècnica de /v/ comprovada amb dos mots.
- Lot complet d’Enric iniciat: 3.299 MP3, 288.630 caràcters previstos. Topall preventiu de 450.000 sota F0; reintents comptabilitzats, IPA congelada, procés desat i seguiment periòdic.


## 1.18 · 25 d’octubre de 2026

- Nova taula web de pronunciacions central/valencià, amb cerca, inicials, càrrega de 50 mots, escolta per enregistrament i enllaços directes des del catàleg.
- Revisió local amb polzes i notes d’àudio i IPA separades; exportació/importació JSON, merge per data i CSV conjunt de pronunciacions. Les versions noves no hereten aprovacions antigues.
- Esborrany d’incidència de GitHub preparat a petició de l’usuari, sense enviament automàtic ni formulari anònim propi.
- Represa cada minut d’errors transitoris de síntesi, amb reserves per intent, pressupost, STOP i cues posteriors. Els errors locals de desament reutilitzen el buffer rebut.
- Aprovació auditiva docent dels 20 mots del pilot d’Enric. El lot gran queda ajornat fins a completar i revisar la IPA valenciana.
- Guies de revisió i represa i README actualitzats. Cap lot nou iniciat ni credencial publicada.

## 1.17 · 24 d’octubre de 2026

- Accentuació inclou només mots amb accent gràfic, i Dièresi només mots amb ï o ü. Seleccionar tots dos combina els candidats amb OR. Corregides etiquetes mancants i sobrants.
- Segona instantània del banc per als dictats nous. Els codis antics conserven els seus mots, ordre i criteris; canviar focus o crear un dictat nou utilitza l’edició actual.
- Reassignats als seus altres trets els mots que treballaven «accent sí/no». Sis mots sense focus actual identificat es mantenen a la consulta, sense forçar-los dins d’un filtre.
- Perfil valencià independent amb 3.299 files i 22 propostes IPA. Pilot separat de 20 mots amb Enric; v labiodental conservada en les dades i exclosa de la prova Azure compatible. Sense activació pública automàtica.
- README, criteris dels focus, compatibilitat de llavors i procediment de pronunciació actualitzats. Ampliació futura de pseudoparaules documentada sense alterar l’edició existent.

## 1.16 · 24 d’octubre de 2026

- Filtres del contingut a l’esquerra i gestió del dictat a la dreta, amb adaptació específica per a tauleta i mòbil.
- Catàleg amb inicials com a enllaços de text, filtres fixos, scroll intern i continuació de lletra al final del llistat. Descàrregues obertes al peu, sense botó redundant de tornar al full.
- Altaveu per escoltar cada mot amb àudio disponible; un sol àudio actiu, amb aturada en canviar filtres o tancar. Selector que anticipa altres varietats, encara no disponibles.
- Entrada al mode dictat més visible, canvi clar/fosc amb icona al header i marca i botó de sortida del dictat coherents amb l’aplicació.
- Numeració incremental dins de la versió 1: les antigues 2.0–2.5 passen a 1.10–1.15. Els protocols de llavors i les edicions del banc conserven els seus identificadors.
- Nova mostra IPA local de vuit mots amb dièresi. Anotada la millora docent de brànquia, isòtop i monosíl·lab; pentàgon queda pendent. Taula i exports fonètics actualitzats, amb aprovació auditiva separada de la validació lingüística.
- Revisió de dièresis: sis millores, atapeït pendent i original de canviïn preferit. La consulta local conserva els originals quan la prova no millora o es prefereix la versió anterior; les mostres es mantenen per comparar.

## 1.15 · 24 d’octubre de 2026

- Aparença Sistema, Clar i Fosc, compartida entre el preparador i el dictat. El selector queda ocult durant l’activitat; el full i el PDF mantenen el paper clar.
- Instruccions amb MP3 estàtics en lloc de veu del navegador, amb un text compartit i una locució per llargada. Generació local encuada després del lot principal, amb les mateixes proteccions de pressupost, represa i bloqueig; publicació pendent de revisió.
- Registre editable per anotar pronunciacions dubtoses i procediment per comparar accent IPA i entonació de paraula aïllada abans de substituir àudios.

## 1.14 · 24 d’octubre de 2026

- Entrada d’alumnat a `/ca/dictat/`, amb codi manual, enllaç per a l’alumnat i compatibilitat amb enllaços antics. La ruta inclou llengua i preserva el subdirectori del projecte.
- Primer mode paper: instruccions amb lectura catalana segons disponibilitat del navegador, ritme normal o més lent, tres escoltes per mot i pas següent explícit. Sense mostrar mots ni solucions durant l’activitat.
- Pantalla completa a petició, pausa quan se’n surt o es canvia de pestanya, i continuació explícita. Compatibilitat en mode concentració si el navegador rebutja pantalla completa.
- Cobertura d’àudio comprovada abans de començar. Els MP3 encara estan en generació/revisió local; no s’han activat públicament. Prova local amb una selecció real de 16 mots.
- Reintents breus i limitats del desament local davant bloqueigs de fitxers Windows, sense repetir peticions Azure. Es conserva el pressupost i la represa omet els MP3 existents.

## 1.13 · 24 d’octubre de 2026

- Codi, còpies, recuperació, nou dictat i PDF agrupats al sidebar esquerre; més alçada disponible per al full.
- Ajuda ampliada sobre el nombre finit de variants, la cerca de coincidències i la recuperació futura del mateix dictat.
- Catàleg per inicials, amb cerca global dins dels filtres, recompte i accés a la lletra següent amb botó o una nova empenta de roda. Les descàrregues del banc queden dins d’un desplegable.
- Eines locals per preparar MP3 amb Azure F0: simulació per defecte, mostra de dotze mots, pressupost mensual conservador, peticions seqüencials i represa sense regenerar fitxers existents. Guia de configuració des de zero. Encara sense àudios publicats ni reproductor.

## 1.12 · 23 d’octubre de 2026

- Format de codi de quatre caràcters de configuració i cinc de variant: 24,3 milions de variants per configuració, mantenint els codis antics de sis caràcters.
- Cerca optimitzada de mots obligatoris sense construir el dictat complet a cada intent. Tandes cancel·lables i continuació sense repetir variants; els resultats parcials no es declaren impossibles.
- Ajuda explícita dels focus: qualsevol dels seleccionats, sense quota mínima de cada focus.
- Comprovats perquè i orquestra amb tots els focus, recuperació antiga i nova, quatre vectors nous, PDF amb el codi llarg i mesures documentades.

## 1.11 · 23 d’octubre de 2026

- Lateral més ample i focus reorganitzats per ocupar quatre files en escriptori, sense reduir la lletra.
- Tipografia dels mots obligatoris coherent amb els focus i ajuda contextual amb interrogant, disponible amb ratolí, teclat i clic.
- Entrada de mots obligatoris amb Enter o coma; també admet enganxar una llista separada per comes.
- Zoom amb Ctrl i roda i avís flotant breu en desplaçar sense Ctrl. La roda i els gestos tàctils conserven el desplaçament natural.

## 1.10 · 23 d’octubre de 2026

- Tries reproduïbles amb codis de sis caràcters, que recuperen tipus, llargada, nivell, focus, mots i ordre.
- Cerca finita i cancel·lable de fins a cinc mots obligatoris; cap mot s’insereix a mà.
- Retirats el lateral dret, la selecció individual, les xinxetes, els canvis per mot i els mots propis del generador. Catàleg de consulta i dades antigues conservades.
- Codi i llengua impresos al full i a la guia docent, còpia de codi i enllaç compartible.
- Instantània immutable i registre d’edicions per preservar el significat dels codis.
- Algoritme, capacitat, límits i mesures documentats al README i a docs/LLAVORS.md.

## 1.9 · 23 d’octubre de 2026

- Retirat el filtre «Femenins i plurals». Es mantenen les 3.299 paraules i totes les variants, integrades als focus ortogràfics habituals amb els mateixos criteris de selecció.
- Retirada l'etiqueta específica de cada entrada i de la taula de revisió. Les dades gramaticals internes es conserven sense influir en el mostreig.
- Compatibilitat amb les preferències antigues del filtre retirat, mantenint les paraules seleccionades i els focus vàlids.

## 1.8 · 23 d’octubre de 2026

- 137 variants noves de femení i plural, amb focus «Femenins i plurals», gènere, nombre i focus ortogràfics compartits. Inclou «despistats», «acompanyades», «organitzades», «pintats», «obertes», «escrites» i «conduïdes».
- Eliminats «ahir-vespre», «ahir-nit», «blat-de-moro» i «viuda»; es conserva «vídua». Incorporat «arbitrar» segons la revisió del docent, mantenint «àrbitre».
- Banc de 3.299 paraules i 96 pseudoparaules. Totes les incorporacions tenen coincidència exacta al lèxic flexionat de Softcatalà.
- Eines de contrast exacte amb lema i categoria, informe de procedència i protecció del TXT davant de sobreescriptures accidentals. Control previ per marcar el banc com a estable.
- Les configuracions antigues que tenien tots els focus seleccionats incorporen el nou focus automàticament.

## 1.7 · 23 d’octubre de 2026

- Entrada catalana a `/ca/`, amb rutes relatives compatibles amb GitHub Pages i domini propi.
- Banc ampliat a 3.166 paraules i 96 pseudoparaules; contrast de grafies amb Softcatalà. Proposta pendent de revisió docent.
- Catàleg editable en JSON, paquets de llengua, regles de nivell separades i generació reproduïble de fitxers.
- Descàrregues alfabètiques en TXT i taula TSV amb nivells i focus.
- Revisió del catàleg identificada amb empremta; dictats guardats amb llengua i revisió. Compatibilitat amb tries antigues i migració de dades locals.
- Contracte de rutes per als futurs QR amb llengua, revisió i codi. Les llavors i els àudios encara no s'activen.

## 1.6 · 23 d’octubre de 2026

- Vista prèvia sense subcapçalera, casella del model, instruccions redundants ni codi aleatori. El model és sempre visible. Títol fix segons el tipus i codis retirats també dels PDF i fitxers nous; les tries antigues continuen recuperant els mots i l’ordre.
- Zoom del 50 al 400 %, roda ancorada al punter, arrossegament, doble clic per ajustar, botons a la cantonada inferior dreta i controls de teclat. La impressió conserva les mides.
- Opcions inicials en quatre files, amb icones adaptades de Lucide per al costat del model i nombre de mots al costat. «Tots» al títol dels focus, sense notes ni personalització de capçalera.
- Laterals i diàlegs amb més separació de la barra de desplaçament. Peu més alt i text més gran. Guia docent traslladada a «Com funciona».
- Animacions i transicions de 220 ms, inclosos entrada i sortida dels diàlegs i desplegables.
- Afegit «atapeït»: 533 paraules i 96 pseudoparaules.

## 1.5 · 23 d’octubre de 2026

- Popup «Sobre el projecte · V4V» adaptat de Pentagrama: descripció pròpia de Plec, mateix QR i adreça Lightning, mateixa fotografia, presentació de l’autor i enllaç al portfoli. Foto i QR distribuïts localment.
- Botó per copiar l’adreça Lightning amb confirmació accessible i alternativa de selecció manual si el navegador no permet accedir al porta-retalls.
- Distribució de dues columnes per a autor i recursos en ordinador, una columna en mòbil; capçalera fixa i contingut amb desplaçament independent.
- Historial compacte amb dates, resums per versió, capçalera fixa i accés al changelog complet del repositori.
- Crèdits ajustats a les llibreries de Plec. Umami i l’alta del projecte al portfoli queden per a una fase posterior.

## 1.4 · 23 d’octubre de 2026

- Els canvis de tipus, llargada, nivell i focus renoven immediatament les paraules. Els mots fixats tenen prioritat fins al límit nou. Les propostes incompletes mostren els mots disponibles i desactiven el PDF.
- Configuració més ampla, amb tipus, format i model agrupats. Retirats els tres subencapçalats, la nota redundant i el botó gran de preparar. Renovació amb els mateixos filtres disponible al lateral dret.
- Barres de desplaçament discretes, sense fletxes, i icones Lucide locals amb les llicències originals.
- 99 paraules noves: el banc arriba a 532 paraules i 96 pseudoparaules. Focus de formes verbals (90 formes conjugades o participis), dièresi (55 mots) i ela geminada (25 mots), amb etiquetes compartides.
- Eliminat el camp Grup de la configuració, les tries desades i els PDF. Es mantenen Nom i Data; les ratlles aprofiten l’espai recuperat. Els fitxers antics es continuen important.
- Historial resumit des de la versió del peu i finestra del projecte amb crèdits i espai V4V. Presentació de l’autor i destí de les aportacions pendents de les dades.

## 1.3 · 23 d’octubre de 2026

- Espai de treball de tres columnes: configuració, full central i paraules triades. Laterals amb desplaçament independent i botó de preparar sempre visible.
- Capçalera de 64 px en escriptori amb lema i recompte del banc. Introducció gran retirada de la pantalla principal; gràfic i instruccions traslladats a «Com funciona».
- Vista prèvia ajustada a l’alçada i l’amplada disponibles, amb proporció A4 constant. Indicació visible del format i de la posició del model.
- Canvi de format sincronitzat amb el dibuix del full; recursos JavaScript i CSS versionats conjuntament per evitar versions antigues en memòria cau.
- Comprovació local dels dos formats i orientacions, canvi i fixació de paraules al lateral dret, recuperació de la tria, descàrrega del PDF i adaptació a diferents amplades de pantalla.

## 1.2 · 23 d’octubre de 2026

- Dos formats: terços amb escriptura central i bandes plegades cap al darrere; quart de full amb dos plecs cap endins, segons el croquis docent.
- Quart amb trams de 51, 53, 54 i 52 mm: 2 mm de marge per al primer plec i 1 mm entre el paquet plegat i l’escriptura. Disposició invertible.
- Esquema del full obert i vistes laterals del dictat i la correcció. Instruccions adaptades al format i a la posició del model.
- El format del plec es conserva al navegador i a les tries exportades en format 3. Compatibilitat amb tries de format 1 i 2.
- Comprovacions de geometria, marges, persistència i 80 variants de PDF. Dos exemples amb les mateixes 24 paraules per comparar els formats.

## 1.1 · 23 d’octubre de 2026

- Plantilla amb model i escriptura en columnes laterals i centre completament buit. Model configurable a l’esquerra o a la dreta. Revisió a la mateixa columna d’escriptura i instruccions de doble plec actualitzades.
- Classificació editorial de vocabulari i dificultat ortogràfica. Perfils de cicle mitjà, superior i institut amb solapament, més l’opció de tot el banc.
- 75 paraules d’ampliació i especialitzades noves; 433 paraules en total. Les 96 pseudoparaules es mantenen.
- Nivells i classificacions visibles al catàleg; classificació opcional dels mots propis.
- Les tries desades conserven nivell i orientació del model. Compatibilitat amb els fitxers anteriors.

## 1.0 · 23 d’octubre de 2026

- Primera versió del catàleg, selecció de dictats, mots propis i exportació de PDF i tries.
