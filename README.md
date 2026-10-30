# Haustmann

Site de Haustmann, conciergerie Airbnb à Paris. Site statique fait avec [Astro](https://docs.astro.build), servi par Cloudflare Workers (fichiers statiques).

## Démarrer

Node 22.23.4 ou plus récent (voir `.node-version`).

```sh
npm install
npm run dev       # http://localhost:4321, rechargement à chaud
npm run build     # génère dist/
npm run preview   # build + serveur Cloudflare local (wrangler), avec les en-têtes de sécurité
npm run check     # vérification des types
```

## Organisation

```
src/
  pages/                  une page par fichier : /, /journal, /journal/[slug], mentions, confidentialité, 404, sitemap.xml
  layouts/Base.astro      <head>, menu flottant, pied de page, parcours d'estimation
  components/             héros, menu, sections de l'accueil, cartes du journal
  content/journal/*.md    les articles
  content.config.ts       le format des articles (frontmatter)
  lib/markdown.mjs        appels de source {1} et espaces insécables dans les articles
  scripts/site.js         animations et interactions, toutes pages
  styles/global.css       styles
public/
  img/                    photos (webp)
  js/intro.js             état d'attente de l'intro de l'accueil, chargé avant le premier rendu
  _headers                en-têtes de sécurité et de cache, appliqués par Cloudflare
wrangler.jsonc            configuration Cloudflare
```

## Écrire un article

Créer `src/content/journal/mon-article.md`. Le nom du fichier devient l'adresse : `/journal/mon-article`.

```md
---
title: "Titre de l'article"
dek: "Chapeau, deux ou trois phrases."
cat: reglementation        # reglementation, fiscalite, strategie ou marche
img: facades-or            # une photo de public/img, sans .webp
pos: "50% 40%"             # cadrage de la photo
alt: "Description de la photo"
date: 2026-10-30
order: 7                   # ordre dans la liste ; le plus petit est à la une
sources:
  - title: "ANIL, analyse de la loi du 19 novembre 2024"
    url: "https://www.anil.org/..."
    detail: "(mise à jour du 2 mai 2026)"   # facultatif
note: "Article d'information, mis à jour le 30 octobre 2026."
---

## Un intertitre

Le texte, en Markdown. Un appel de source s'écrit {1}, plusieurs {1,3}.
```

- Les intertitres `##` forment le sommaire. La section « Sources » est ajoutée à la fin.
- `{1}` renvoie à la première source de la liste. Un numéro sans source fait échouer le build, exprès.
- Les espaces insécables avant `: ; ? ! % €` et dans les milliers sont ajoutées automatiquement.
- Les encadrés (`j-ess`, `j-callout`, `j-calc`, tableaux) restent en HTML dans le Markdown, voir les articles existants.

Si vous modifiez `src/lib/markdown.mjs`, videz le cache avant de relancer : `rm -rf node_modules/.astro`. Astro garde les articles déjà rendus et ne voit pas le changement.

## Sécurité

- Aucun script ni style externe. Polices hébergées sur le site (`@fontsource`).
- Aucun script en ligne : la CSP de `public/_headers` n'autorise que les fichiers du site (`script-src 'self'`).
- En-têtes : CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.
- Pas de cookie déposé par le site, pas de base de données, pas de serveur : la surface d'attaque est celle d'un dossier de fichiers.

Plus tard, ajouter à la CSP de `public/_headers` :

- Mesure d'audience Cloudflare Web Analytics : `script-src https://static.cloudflareinsights.com` et `connect-src https://cloudflareinsights.com`.
- Turnstile pour le formulaire : `script-src https://challenges.cloudflare.com` et `frame-src https://challenges.cloudflare.com`.

## Mise en ligne sur Cloudflare

### 1. Compte

1. Créer le compte sur dash.cloudflare.com et activer la double authentification (Manage Account → Authentication).

### 2. Domaine

1. Add a domain → `haustmann.com`, offre Free.
2. Chez le registrar, remplacer les serveurs DNS par les deux serveurs donnés par Cloudflare. Attendre que le domaine passe en « Active ».
3. DNS → Settings : activer DNSSEC, puis copier l'enregistrement DS chez le registrar.

### 3. Projet

1. Workers & Pages → Create → Import a repository → GitHub.
2. Installer l'application GitHub de Cloudflare sur ce dépôt seulement (« Only select repositories »).
3. Choisir `KASPER94/Haustmann`, branche de production `main`.
4. Build command : `npm run build`. Deploy command : `npx wrangler deploy`. Le reste vient de `wrangler.jsonc`.
5. Chaque push sur `main` déploie le site. Les autres branches peuvent avoir une adresse d'aperçu (Settings → Builds → Branch control).

### 4. Adresse

1. Dans le Worker `haustmann` → Settings → Domains & Routes → Add → Custom domain : `haustmann.com`, puis `www.haustmann.com`.
2. Rediriger `www` vers le domaine nu : Rules → Redirect Rules → modèle « Redirect from WWW to root ».
3. SSL/TLS → Overview : mode Full (strict). Edge Certificates : Always Use HTTPS, version TLS minimale 1.2.
4. L'adresse du site est `haustmann.com` : elle est écrite dans `astro.config.mjs` (`site`, pour les adresses canoniques et le sitemap) et dans `public/robots.txt`. Si un autre domaine est ajouté (`haustmann.fr` par exemple), le rediriger vers `haustmann.com` avec une Redirect Rule, sans y servir le site une seconde fois.

### 5. Plus tard

- Formulaire d'estimation : un Worker qui reçoit la demande, vérifie Turnstile, limite le débit (Rate Limiting) et envoie l'e-mail. En attendant, le formulaire n'envoie rien et le dit.
- Email Routing pour recevoir `contact@haustmann.com` sur une boîte existante.
- Web Analytics, sans cookie.

## Avant la mise en ligne

- Compléter `src/pages/mentions-legales.astro` et `src/pages/confidentialite.astro` (passages surlignés « à compléter »).
- Brancher le formulaire, ou changer le texte de fin du parcours : il annonce un rappel sous 24 h alors que rien n'est envoyé.
