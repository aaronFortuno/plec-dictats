# Quota, crèdit i futura prova mallorquina

26/10/2026. L’usuari confirma que el crèdit promocional de 200 USD correspon a la mateixa subscripció que el recurs Speech actual. No s’ha consultat la facturació del compte ni se n’ha verificat el saldo o la data de caducitat. No s’han llegit claus, canviat tarifes ni fet peticions de síntesi en aquesta preparació.

## Dos comptadors diferents

**F0:** Microsoft publica 500.000 caràcters neuronals gratuïts al mes. El nostre executor conserva un topall preventiu de **450.000**. El registre local d’octubre reserva **429.782**, de manera que queden **20.218** abans d’aquest topall. És comptabilitat preventiva dels nostres intents, no el saldo oficial d’Azure; no coneix consum d’altres eines o càrrecs encara no reflectits. [Tarifes oficials de Speech](https://azure.microsoft.com/en-us/pricing/details/speech/).

**Crèdit:** el saldo promocional de la subscripció es pot aplicar als serveis elegibles de pagament. La quota F0 del recurs no es converteix en quota il·limitada perquè la subscripció tingui crèdit. Per consumir més cal valorar un recurs/tarifa S0, amb el seu cost i controls. Preparar IPA, consultar les taules locals i reproduir MP3 ja publicats no fan síntesi nova. [Serveis i crèdit del compte gratuït](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/create-free-services), [quotes per tarifa](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits).

Si és el crèdit inicial del compte gratuït, la validesa és de **30 dies des de l’alta**, no un mes des de cada generació. Cal mirar-ne la data exacta al portal. Un canvi anticipat a pagament per ús conserva el saldo només fins a la caducitat original; també canvia el comportament de facturació. No s’ha fet aquest canvi. [Condicions de l’actualització de subscripció](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/upgrade-azure-subscription).

## On mirar-ho directament

1. A [Azure Portal](https://portal.azure.com/), obre **Subscriptions / Subscripcions** i la subscripció correcta. La vista de serveis gratuïts mostra el consum disponible per als serveis admesos; pot arribar amb **1–2 dies de retard**. [Guia oficial de consum gratuït](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/check-free-service-usage).
2. Per al saldo monetari, obre **Cost Management + Billing** i selecciona l’àmbit de facturació correcte. Si el contracte és **Microsoft Customer Agreement**, la ruta documentada és **Billing → Payment methods → Azure credits**: saldo, import inicial i venciment. Aquesta ruta depèn del tipus de contracte; no es presenta com una pantalla universal de tots els comptes. [Guia oficial de crèdits MCA](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/mca-check-azure-credits-balance?tabs=portal).
3. Al recurs Speech, comprova **Pricing tier / Pla de tarifa** i la regió. El pla del recurs, el saldo monetari i el nostre topall de fitxer són controls diferents. Cap dada d’aquesta consulta requereix compartir les claus de síntesi.

## Quantitat preparada, encara sense generar

Les estimacions del [perfil mallorquí](IPA-MALLORQUI.md) compten punts de codi Unicode del cos SSML, amb XML escapat, `prosody rate="-10%"` i `phoneme`, excloent `speak/voice`. No equivalen només a comptar les lletres dels mots: els elements opcionals de control també poden ser facturables. [Criteri de caràcters facturables de Microsoft](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech#pricing-note).

| Conjunt amb proposta actual | Mots | Caràcters estimats |
| --- | ---: | ---: |
| Propostes mallorquines disponibles | 2.889 | 252.743 |
| D’aquestes, vocabulari bàsic | 291 | 24.697 |

Falten **410 decisions lèxiques**, 59 dins els bàsics. Aquests mots no s’inclouen en les xifres de síntesi. Canviar IPA o velocitat i repetir peticions modifica l’estimació. El cost d’un lot S0, abans de crèdits, seria `caràcters / 1.000.000 × tarifa efectiva per milió` de la regió i l’oferta del compte. La web pública retorna preus dinàmics; no s’ha verificat una tarifa numèrica aplicable a aquest compte.

Les 291 bàsiques amb proposta ja excedeixen el marge preventiu d’octubre; el conjunt complet també. Esperar al restabliment mensual de F0 permetria plantejar un lot de la mida preparada dins del topall de 450.000, **si el compte/recurs continua actiu i no hi ha altre consum**. Això no requereix canviar de tarifa. No es reinicia la comptabilitat d’octubre per forçar-hi més peticions.

## Decisió de treball

Primer, resoldre i contrastar els mots bàsics pendents i preparar una **mostra curta**, no un lot de milers de fitxers. La llista oficial ofereix Joana, Enric i Alba com a veus `ca-ES`, sense identificar-ne una com a mallorquina. La proposta de referència fa servir neutra tònica i /v/: 386 files contenen /v/, absent de l’inventari ca-ES publicat, malgrat que una prova valenciana anterior l’acceptés. Cal escoltar la mostra abans d’atribuir a cap veu una variant. [Veus documentades](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts), [inventari fonètic](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets).

Ja hi ha una [mostra candidata de 18 mots](../audio/pronunciation/ca/mallorcan-pilot-candidates.json), amb 10 bàsics i **1.536 caràcters estimats per veu/versió**, sense triar veu ni paquet. Cobreix neutra tònica, o àtona/harmonització, b/v, bl/gl, dièresi i finals. Comparar tres veus implicaria almenys 4.608 caràcters, abans de reintents o canvis. El fitxer és explícitament no executable.

Una mostra petita pot ser compatible amb el marge local actual, però cal calcular el pla exacte i confirmar la quota abans d’executar-la. Si després es vol aprofitar el crèdit per un lot més gran, s’ha de concretar saldo/caducitat, tarifa efectiva, límit de caràcters, paquet i política d’aturada. Els reintents, la identitat del paquet i l’STOP es conserven. La preparació actual no ha activat cap recurs de pagament ni ha posat cap lot en marxa.

## Actualització després de la mostra autoritzada

El 26/10/2026 s’han generat les 54 locucions de prova (18 mots × 3 veus) amb **4.608 caràcters reservats**, sense reintents. El registre local d’octubre passa de 429.782 a **434.390**; queden **15.610** abans del topall preventiu de 450.000. No és una consulta del consum facturat del compte.

La mostra no s’ha convertit en un lot complet ni en una veu pública. No s’ha augmentat el topall, canviat F0 per S0 ni forçat la quota per comprovar si es descompta crèdit. Primer cal l’escolta del pilot. Arribar a 500.000 caràcters no és una prova necessària per esbrinar com factura la tarifa: es comproven recurs i subscripció al portal. Si F0 esgota la quota, no s’ha de donar per fet que continuï contra el saldo promocional. L’ús d’S0, si es decideix després, tindrà un pla i pressupost explícits.

## Autorització posterior · pseudoparaules

El 27/10/2026 es documenta l’autorització de pujar el topall local a **452.000** per completar central i valencià: 192 peticions, 16.513 caràcters, sense reintents. El registre queda en **450.903**. Això substitueix el topall preventiu anterior, sense modificar el nivell F0 ni comprovar la facturació esgotant la quota. La mostra balear de Matxa és local i no utilitza la subscripció Azure.
