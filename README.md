# 🌸 AsianDrama Crush — Stremio Addon

A **catalog-only** Stremio addon like *K-Drama Crush / K-Dramas Binged*: it adds
Asian-drama rows to your Stremio home/board, updated automatically from TMDB.
It provides **no streams** — when you press play, your normal stream addons
(e.g. Torrentio) handle playback, exactly like the original.

## Catalogs (5, in this order)

| Order | Catalog |
|---|---|
| 1 | 🇰🇷 K-Drama - Latest |
| 2 | 🇰🇷 K-Drama - Trending This Week |
| 3 | 🇨🇳 C-Drama - Latest (incl. TW/HK) |
| 4 | 🇨🇳 C-Drama - Trending This Week |
| 5 | 🇯🇵 J-Drama - Latest |

- Items use **IMDb IDs** (`tt...`) so Cinemeta and your other addons recognise
  them instantly (posters, ratings, streams).
- Includes a **configure page**: pick only the regions/rows you want and get a
  personal install link.
- Search inside every catalog, pagination (scroll for more), and full episode
  lists on the detail page.
- **Zero dependencies** — plain Node.js, runs free on Vercel.

---

## 🚀 Deploy free: GitHub → Vercel (10 minutes, no card)

You do **not** need a Vercel account in advance — you create one by logging in
with GitHub in step 2 (free "Hobby" plan).

### Step 1 — Put this code on GitHub
**Easy way (browser):**
1. Go to https://github.com/new — name it `asian-drama-addon`, click *Create repository* (don't tick any boxes).
2. Click **uploading an existing file**, drag in **all files/folders from this
   project** (keep the folder structure: `api/`, `lib/`, `test/`), commit.

**Or with git:**
```bash
cd asian-drama-addon
git init && git add . && git commit -m "AsianDrama Crush v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/asian-drama-addon.git
git push -u origin main
```

### Step 2 — Deploy on Vercel (free)
1. Go to https://vercel.com/new and **Continue with GitHub** (this creates your free account).
2. **Import** your `asian-drama-addon` repository.
3. Change nothing (no framework, no build command) → **Deploy**.
4. Wait ~30 seconds. You get a URL like `https://asian-drama-addon-xxxx.vercel.app`

### Step 3 (recommended) — Your own free TMDB key
The addon ships with the public TMDB key used by
[Skywave22/TJ-Plugins](https://github.com/Skywave22/TJ-Plugins), so it works with
zero setup. It's shared though, so for reliability get your own free key:
1. Create a free account at https://www.themoviedb.org/signup
2. Go to https://www.themoviedb.org/settings/api → copy the **API Key (v3 auth)**.
3. In Vercel: your project → **Settings → Environment Variables** →
   add `TMDB_API_KEY` = your key → **Save**, then **Deployments → ⋯ → Redeploy**.

### Step 4 — Install in Stremio
Open `https://YOUR-APP.vercel.app/configure`, tick your catalogs, then:
- **Desktop/mobile app:** click **▶ Install in Stremio**, or
- Copy the manifest URL and paste it in Stremio → **Addons → Add addon**, or
- In **Stremio Web**, paste the manifest URL into the addons search box.

Your rows now appear on the Board/Discover. Pick a drama → your stream addons
provide the playable links.

---

## 🖥️ Run/test locally
```bash
npm test     # smoke test: manifest, catalogs, search, meta
npm start    # http://localhost:7000/configure  and  /manifest.json
```

## ✏️ Customise
- Add/remove regions or rows: edit `lib/catalogs.js` (`REGIONS`, `ROWS`) and push
  to GitHub — Vercel redeploys automatically.
- Change name/logo/description: `ADDON_NAME`, `logo` in `lib/handler.js`.
- Catalogs refresh automatically (6-hour cache); nothing to maintain.

## ❓ FAQ
- **"No streams found"?** This is a catalog addon by design (like the original).
  Install a stream addon such as Torrentio for playback.
- **Free forever?** Yes — Vercel Hobby + TMDB are free for this usage. Note
  Vercel Hobby is for personal/non-commercial projects.
- **Update the drama lists manually?** No need — they're generated live from
  TMDB on every request cycle.

Data & posters: [TMDB](https://www.themoviedb.org). This product uses the TMDB
API but is not endorsed or certified by TMDB.
