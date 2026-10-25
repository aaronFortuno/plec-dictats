# Taules obertes de pronunciació de Plec

**[Consulta les dues varietats i revisa els àudios al web](../../ca/pronunciacions/)**. Pots anotar-hi incidències, marcar escoltes correctes i exportar la revisió. Els TSV següents continuen sent fonts d’edició, però no són necessaris per consultar ni revisar les pronunciacions.

La font editable actual és [ca/central-didactic.tsv](ca/central-didactic.tsv): **3.299 mots alfabètics**, amb una fila per mot. Conté **240 propostes IPA** i **3.059 camps IPA pendents**. Cap transcripció no està encara marcada com a validada. No és un diccionari fonètic normatiu ni un corpus complet ja revisat.

Per llegir només les propostes, obre [central-didactic-ipa.txt](ca/central-didactic-ipa.txt). Per reutilitzar les dades amb programari, descarrega [central-didactic.json](ca/central-didactic.json). Les dues són exportacions: **edita el TSV**, no els fitxers derivats. El JSON conserva els camps IPA inexistents com a `null`, les fonts i els estats de revisió. La distribució segueix la [llicència del projecte](../../LICENSE); cada referència externa manté la seva autoria i condicions. No s’ha importat ni redistribuït cap diccionari complet.

## Què representa cada fila

| Camp | Contingut |
| --- | --- |
| `mot` i `id` | Grafia i identitat exactes del banc; conserva-les. |
| `ipa` | Proposta, sense barres ni claudàtors; buida si encara no està transcrita. |
| `llengua`, `varietat`, `diccio` | Actualment `ca`, `central`, `didactic-explicit`. |
| `estat_ipa` | Estat de la transcripció, independent de l’aprovació dels àudios. |
| `base` | Mot exacte de diccionari, lema i flexió, regla o proposta editorial. |
| `fonts` | Enllaços que donen suport a la proposta, separats per ` | `. No sempre són una transcripció exacta del mot. |
| `notes` | Dubtes, ajustos didàctics i observacions. |
| `revisor`, `data_revisio` | Qui ha validat la transcripció i quan, amb data `AAAA-MM-DD`. |

Estats:

- `pendent`: IPA encara buida.
- `proposta`: preparada per comparar, sense validació final.
- `pendent-contrast`: té un dubte lingüístic explícit.
- `revisar-diccio`: proposta importada del model central formal de dièresis, pendent d’adaptació al model didàctic.
- `validada`: revisada lingüísticament, amb revisor i data. **No implica que una veu la sintetitzi correctament.**

La síntesi i l’escolta s’aproven per paquet, veu i ajustos. Una mateixa IPA es pot reutilitzar amb dues veus i produir resultats diferents. La taula no incorpora una aprovació genèrica d’àudio.

## Com editar-la

Obre el TSV en un editor de text o importa’l en LibreOffice/Excel amb **UTF-8** i **tabulació** com a separador. Conserva les columnes, els accents, el punt volat, els ID i totes les files. No introdueixis tabulacions ni salts de línia dins d’una cel·la. Si falta una proposta, deixa l’IPA buida i l’estat `pendent`; no la completis automàticament a partir de l’àudio defectuós.

`ˈ` va davant la síl·laba tònica i `.` separa totes les síl·labes. Les transcripcions fan servir l’inventari compatible amb Azure `ca-ES`, amb `l` i `g` segons aquella convenció. Són dades preparades per a síntesi; no pretenen detallar tots els al·lòfons d’una transcripció fonètica estreta. El model didàctic busca l·l contínua i llarga i oclusives finals nt/nc audibles, sense vocals afegides. La h muda i la u muda de gu/qu continuen mudes.

Després de desar:

```text
node tools/pronunciation-table.cjs
node tools/pronunciation-table.cjs --export
node tools/pronunciation-table.cjs --check
```

La primera ordre valida ID, grafies, cobertura, perfil, símbols, síl·labes i estats, sense escriure. La segona actualitza només JSON i TXT. La tercera comprova que coincideixin amb el TSV. Cap d’aquestes ordres fa síntesi ni llegeix credencials. `--init` és només per crear una taula absent i es nega a sobreescriure una revisió existent.

Per preparar una selecció de la taula:

```text
node tools/pronunciation-table.cjs --plan "brànquia,isòtop,monosíl·lab,pentàgon"
```

Desa un pla de dades a `output/audio/table-pronunciation-plan.json`; encara no envia peticions. La mostra de nou mots existent llegeix ara la IPA del TSV quan es torna a preparar. Un procés ja en marxa conserva la seva selecció en memòria. Si es modifica una transcripció després d’haver sintetitzat un paquet, cal un ID de paquet nou: el generador detecta que ha canviat l’empremta i impedeix barrejar versions silenciosament.

Les antigues taules de dièresis i el JSON de la mostra conserven la procedència inicial i els ID seleccionats. **Les noves revisions es fan aquí**, al TSV general. El pla antic de 227 dièresis es conserva com a referència fora de línia; per preparar dades noves des de la revisió vigent s’utilitza `pronunciation-table.cjs --plan`.

## Altres varietats i llengües

Ja hi ha un segon perfil, **ca-valencian-didactic-v1**, amb [TSV editable](ca/valencian-didactic.tsv), [JSON](ca/valencian-didactic.json) i [TXT de propostes](ca/valencian-didactic-ipa.txt). Cobreix els mateixos 3.299 mots amb 22 propostes independents i 3.277 IPA buides. Cap està validada. La [guia del pilot valencià](../../docs/VALENCIA.md) documenta fonts, dicció, la prova curta amb Enric i les limitacions del motor.

Aquest perfil té inventari d’edició `ipa-valencian-draft`, que permet conservar /v/. El pla informa per mot si és compatible amb l’inventari Azure ca-ES; les dades lingüístiques no es modifiquen per fer-les passar pel motor. Es valida i exporta amb `--profile ca-valencian-didactic-v1` en les ordres anteriors. La síntesi continua separada de l’edició.

[registry.json](registry.json) identifica cada perfil per llengua, varietat, dicció, edició del banc i fitxer. Cada varietat té un perfil i una taula propis: no s’hi copia automàticament la transcripció central ni se’n canvia només l’etiqueta. Cal revisar vocals, accent, consonants i decisions de dicció allà on variïn. Hi ha propostes inicials centrals i valencianes; altres llengües requeriran també el seu inventari fonètic i validador.

Per reutilitzar o contribuir dades, conserva perfil, ID, fonts i estat. Una correcció pot arribar com un canvi de TSV a GitHub, amb el motiu i la font; la comprovació tècnica no substitueix el contrast lingüístic ni l’escolta. Vegeu el [procediment complet](../../docs/PRONUNCIACIO.md).

## Valencià complet com a proposta

La [taula valenciana](ca/valencian-didactic.tsv) conté 3.299 propostes i cap validació lingüística. S’han conservat les 22 inicials i completat les altres amb catalan2ipa i pistes editorials explícites; les limitacions i la síntesi d’Enric estan documentades a [VALENCIA.md](../../docs/VALENCIA.md). Les anotacions d’àudio continuen separades de l’estat de la transcripció.
