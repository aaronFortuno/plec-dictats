# Represa automàtica dels lots

Els llançadors de mots, instruccions, mostres IPA i pilot valencià activen la represa d’errors transitoris. Si es perd la connexió, venç el timeout, es talla la resposta o Azure retorna un error de servidor 5xx/408, s’espera **un minut** i es torna a provar el mateix mot. La petició té un timeout de 30 segons. La resta del lot continua després de recuperar aquell mot.

Cada petició nova es reserva abans d’enviar-la, també un reintent: pot haver estat facturada encara que no n’hàgim rebut la resposta. El registre mensual i el límit preventiu de 400.000 no es reinicien. Es comprova de nou que hi hagi pressupost suficient per als mots pendents. S’atura davant credencials incorrectes, petició invàlida, 429, canvi de mes, pressupost insuficient, identitat incompatible o contingut que no sigui un MP3 vàlid. Aquests casos necessiten revisar la causa.

Si el problema és un bloqueig transitori de desament local (`EPERM`, `EACCES`, `EBUSY`, `EIO`), es torna a desar el mateix buffer d’àudio després d’un minut. **No es repeteix la síntesi** ni es consumeixen caràcters nous per aquell desament. Els reintents breus del canvi de nom continuen actius abans d’arribar a l’espera llarga.

L’estat inclou `phase: retrying`, el mot, el motiu i `retryAt`. Les cues posteriors esperen mentre aquell procés continua actiu. Les esperes comproven el senyal STOP cada segon. La represa omet els MP3 complets ja disponibles i no els sobreescriu. Els bloqueigs de pressupost continuen impedint dos generadors simultanis.

```text
node tools/run-audio-batch.cjs --execute
node tools/run-valencian-pilot.cjs --execute --confirm-f0
```

Sense `--execute`, les eines només simulen. El generador genèric ofereix `--retry-transient` per activar aquest comportament explícitament. Les claus continuen fora del repositori i no apareixen als missatges d’error.

La represa cobreix suspensió i reconnexió **mentre el procés segueixi obert**. Si es tanca el terminal, es mata el procés o es reinicia l’ordinador, cal tornar a llançar-lo: no s’ha instal·lat cap servei d’inici automàtic. Un bloqueig d’un procés mort requereix comprovar-ne el PID abans de retirar-lo; no esborrem bloqueigs automàticament sense aquesta comprovació.

Les proves simulen errors i el pas del temps sense peticions reals: espera d’un minut, recuperació, reserves per intent, pressupost, STOP, errors permanents, reutilització del buffer i espera de cues posteriors.
