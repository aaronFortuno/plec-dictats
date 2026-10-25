# Domini de Plec

El web de Plec utilitza `plec.ortogra.fi`. El domini principal `ortogra.fi` queda disponible per al paraigua de projectes educatius.

## GitHub Pages

- Repositori: `aaronFortuno/plec-dictats`.
- Publicació: branca `main`, carpeta `/ (root)`.
- Domini personalitzat: `plec.ortogra.fi`, declarat al fitxer `CNAME` de l'arrel.
- La portada envia a `ca/` i conserva els paràmetres de l'enllaç.
- Configura el domini a GitHub abans d'afegir el registre DNS.

## Nordweb

Al compte de Nordweb, obre **Domains → ortogra.fi → DNS settings** i afegeix:

| Camp | Valor |
| --- | --- |
| Tipus | `CNAME` |
| Nom / host | `plec` |
| Destinació | `aaronfortuno.github.io.` |
| TTL | `3600` segons, o el valor predeterminat |

Si el formulari demana el nom complet en lloc del prefix, escriu `plec.ortogra.fi` al camp de nom. La destinació és un nom de servidor: no inclou `https://`, el nom del repositori ni cap ruta. El punt final indica que és un nom DNS complet.

No hi pot haver un registre A, AAAA o un altre CNAME amb el mateix nom `plec`. Els registres del domini principal, el correu i els servidors de noms no necessiten canviar per connectar aquest subdomini.

## HTTPS i comprovació

GitHub Pages emet el certificat automàticament quan el DNS apunta correctament al servei. Quan estigui disponible, activa **Settings → Pages → Enforce HTTPS**. La propagació DNS i l'emissió del certificat poden trigar.

La revisió del web publicat la fa l'usuari: `https://plec.ortogra.fi/` ha d'obrir el preparador en català i els enllaços a dictats han de conservar el codi. Les comprovacions de codi i rutes es fan en local.

Fonts: [GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [DNS de Nordweb](https://nordweb.fi/en/ohjeet/dns-asetukset).
