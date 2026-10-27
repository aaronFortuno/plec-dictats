# Mostra local de Matxa-TTS v2

26/10/2026. L’usuari autoritza comparar els mateixos 18 mots del pilot d’Azure amb Matxa. Aquesta autorització cobreix una mostra local; **no reprèn el lot balear d’Azure ni publica una varietat mallorquina al dictat de l’alumnat**. L’escolta i la validació dialectal queden pendents.

## Model i diferències que cal tenir presents

- Proveïdor: equip de llengua/veu del BSC, model [Matxa-TTS v2 multiaccent amb grafemes](https://huggingface.co/BSC-LT/matxa-tts-v2-ca-multiaccent-graphemes).
- Veus: **Olga = ID 0; Quim = ID 1** en v2. No s’han d’utilitzar els IDs invertits de la versió antiga. La documentació les etiqueta «balear»; no s’ha verificat que el parlant sigui de Palma. Els noms són identificadors públics, no noms reals dels locutors.
- Entrada: la grafia exacta de cada mot, neteja bàsica a minúscules/espais, sense fonemització, IPA explícita ni frases afegides. La IPA d’Azure es conserva només per comparar-la visualment.
- Síntesi: model ONNX amb vocoder WaveNext integrat, 20 passos, temperatura 0,667 i escala de llargada **1,0**. Aquest valor natiu no equival al ritme −10 % d’Azure; la velocitat dels dos motors no està igualada artificialment.
- Format: **WAV PCM16 mono a 22.050 Hz**, sense retallar silencis ni canviar el pitch. Els àudios d’Azure comparats són MP3 mono a 24 kHz; la comparació inclou aquesta diferència de format. L’amplitud només es redueix si el model excedeix el rang PCM, i es registra el guany exacte per fitxer.
- Execució: CPU local amb quatre fils, cap servei facturat ni quota Azure. La síntesi neuronal pot ser estocàstica; conservar fitxers i hashes és el compromís de reproducció, no regenerar un WAV idèntic bit a bit a partir del text.

## Procedència congelada

Model: `BSC-LT/matxa-tts-v2-ca-multiaccent-graphemes`, revisió **00f32fa221aef52e0146422935bf87fc7d71db6f**.

Fitxer: `matxa_v2_multiaccent_graphemes_20_steps_wavenext.onnx`, 272.805.633 bytes, SHA-256 `4c19bfd51665e39f75d6fe69c61127bf06cfb53a501f14ccd348084d0dfa46ae`, comprovat contra l’objecte LFS oficial de Hugging Face. No es descarrega PyTorch ni cap paquet GPU.

Tokenizer: [branca v2-graphemes del repositori oficial](https://github.com/langtech-bsc/Matcha-TTS/tree/v2-graphemes), commit **2e15c908f0acce72d4a8f0c0f8627c54fbe62fb2**. S’han inspeccionat `matcha/text/symbols.py`, `cleaners.py`, `__init__.py` i els exemples d’inferència/exportació. L’adaptador de Plec llegeix només constants literals de símbols amb AST; **no executa ni importa codi Python remot**. El SHA-256 del fitxer de símbols és `70ea183ad85240ffb5fbe6ee25f84dcb52979ef7055c675d386fc00f679a9c97` i també es valida abans de sintetitzar.

L’exemple genèric d’ONNX espera sortides `wav/wav_lengths`, però el fitxer v2 publicat retorna `mel_lengths/hfwaveform`. L’adaptador comprova aquests noms i associa els frames a mostres amb salt de 256, segons l’arquitectura documentada. No s’ha canviat a la versió v1 per resoldre aquesta diferència.

El codi de Matxa té les seves atribucions i llicències pròpies; la còpia de consulta i la llicència del model es conserven a `tmp/matxa-model/`, fora dels fitxers publicats. Fonts dels models i inferència:

- [Model i instruccions v2](https://huggingface.co/BSC-LT/matxa-tts-v2-ca-multiaccent-graphemes).
- [Fitxers del model](https://huggingface.co/BSC-LT/matxa-tts-v2-ca-multiaccent-graphemes/tree/main).
- [Codi oficial](https://github.com/langtech-bsc/Matcha-TTS/tree/v2-graphemes).
- [Llicència completa del model](https://huggingface.co/BSC-LT/matxa-tts-v2-ca-multiaccent-graphemes/blob/main/LICENSE.md).

## Entorn i ús local

S’ha creat `tmp/matxa-venv/` amb Python 3.12.14 i `--system-site-packages`, aprofitant NumPy 2.3.5 existent sense modificar-lo. Només s’instal·la ONNX Runtime CPU 1.24.4 i les seves dependències dins del virtualenv. No es canvia cap configuració global ni s’instal·la cap servidor persistent.

```text
node tools/prepare-matxa-pilot.cjs --write
tmp/matxa-venv/Scripts/python.exe tools/run-matxa-pilot.py
tmp/matxa-venv/Scripts/python.exe tools/run-matxa-pilot.py --execute --limit 2
tmp/matxa-venv/Scripts/python.exe tools/run-matxa-pilot.py --execute
node tools/check-matxa-pilot.cjs
node tools/check-matxa-pilot.cjs --local-audio
```

La primera ordre només prepara dades; Python sense `--execute` només mostra el pla. Per executar cal que el model i els fitxers inspeccionats ja siguin a `tmp/matxa-model/`; no hi ha descàrrega implícita durant la inferència. Una instal·lació nova pot obtenir el model des de l’URL de la revisió congelada i ha de comprovar el SHA-256 abans d’executar-lo. El programa es nega a barrejar paràmetres amb els fitxers d’una identitat anterior.

Sortides: `output/audio/matxa-v2-balear-pilot/olga/<mot>.wav` i `quim/<mot>.wav`; `plan.json`, `identity.json`, `results.json` i `status.json` conserven paraules, ajustos, progrés, temps i hashes. Aquestes sortides locals no formen part del paquet públic d’àudio.

## Resultat tècnic del pilot

S’han generat els **36 WAV dels 18 mots amb dues veus**. Les quatre primeres locucions es van generar com a submostra de control; després es van conservar i completar les altres 32, sense regenerar-les silenciosament. Els 32 àudios restants van necessitar 18,1 segons d’inferència, excloent inicialització del model. No és una mesura general de rendiment ni un temps garantit per a altres equips.

Durades: **0,522–1,277 s**. Pics de la sortida del model: 0,271–0,709; **zero mostres fora de rang i cap escalat d’amplitud aplicat**. S’han comprovat els 36 SHA-256, les identitats de mots/veus i capçaleres WAV PCM16 mono a 22.050 Hz. La [metadada del resultat](../audio/pronunciation/recordings/ca-mallorcan-palma-matxa-pilot-v1-result.json) conserva la procedència i els fitxers. Aquest resultat només confirma generació i integritat; la pronunciació continua pendent d’escolta.

## Llicència i revisió

La fitxa i l’[acord de llicència](https://huggingface.co/BSC-LT/matxa-tts-v2-ca-multiaccent-graphemes/blob/main/LICENSE.md) limiten el model a usos no comercials/de recerca i estableixen condicions sobre l’ús posterior de les sortides. Aquesta prova és local i educativa; **no s’aprova aquí la redistribució pública dels MP3 ni s’assigna als àudios la llicència general del codi de Plec**. Abans d’una publicació cal comprovar les condicions aplicables a model, veus i sortides; l’ús comercial requereix acord amb els titulars de les veus segons la fitxa del proveïdor.

La integritat tècnica, els valors d’amplitud o el fet de generar un WAV no certifiquen la neutra tònica, la geminació o la naturalitat dialectal. Cal comparar els 18 mots amb l’escolta de l’usuari i, si es continua, contrast nadiu/especialitzat. L’autor de Plec no és parlant nadiu balear.

## Escolta del 27/10/2026

L’usuari percep un resultat millor que els intents d’Azure, però inconsistent: alguns mots són més clars en una veu, d’altres en l’altra, i alguns en cap de les dues. A «xocolata» descriu aproximadament «tocoata» per a l’ID 0 i «ocolata» per a l’ID 1. Són impressions d’escolta, no transcripcions fonètiques certificades. La mostra no s’aprova per publicar ni habilita un lot extens. El [registre de feedback](../audio/pronunciation/ca/matxa-pilot-feedback.json) queda separat dels resultats tècnics i les identitats congelades.

La fitxa oficial assigna Olga a 0 i Quim a 1; l’usuari identifica les veus a l’inrevés. No disposem d’un contrast independent de la identitat vocal de l’exportació ONNX. La comparativa mostra **veu 0 / veu 1**, que són els IDs efectivament enviats al model. Es preserven noms originals, rutes i hashes: no es reetiqueta silenciosament una síntesi ja feta.

El programa pren la sortida del model des de la mostra inicial i no hi aplica retall d’inici, eliminació de silencis o fade-in. Això descarta aquest retall dins del nostre adaptador; no determina encara si la poca claredat inicial prové de la síntesi o de l’arrencada del reproductor. Afegir silenci només podria ajudar en el segon cas, sense recuperar un fonema que el model no hagi generat.

El [DCVB, entrada xocolata](https://dcvb.iec.cat/results.asp?word=xocolata), recull variació vocàlica i local, amb consonant inicial en les lectures indicades, incloses Sóller i Menorca. No és una justificació per acceptar l’absència de consonants com a característica general balear ni una validació específica del model de Palma. La pròpia [fitxa de Matxa](https://huggingface.co/BSC-LT/matxa-tts-v2-ca-multiaccent-graphemes) adverteix que la qualitat varia segons el parlant; la seva avaluació publicada utilitza frases, no demostra fiabilitat per a tots els mots aïllats de Plec.

Proposta de continuació, encara sense executar: una diagnosi curta amb els mots problemàtics, originals preservats, contrast d’arrencada de reproducció i unes poques regeneracions controlades. Abans d’ampliar, cal revisió nadiua o especialitzada d’una mostra que cobreixi els contrastos. Si no és consistent, es prioritza enregistrament humà d’un banc reduït. No s’aprova una barreja automàtica de veus ni l’ús d’un reconeixedor de veu com a únic criteri de correcció.
