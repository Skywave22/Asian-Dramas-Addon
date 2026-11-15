# 🌸 AsianDrama Crush — Stremio Addon

A **catalog-only** all-in-one Stremio addon: Asian dramas, **anime**, plus
**movies** and **series** worldwide — Latest, Trending, Top Rated and Best of the
Year. It adds rows to your Stremio board, updated automatically from TMDB.
It provides **no streams** — when you press play, your normal stream addons
(e.g. Torrentio) handle playback.

## 🔗 Access this addon (live)

**👉 https://asian-dramas-addon.vercel.app**

- **Configure & Install:** https://asian-dramas-addon.vercel.app/configure
  — pick your catalogs and click *Install in Stremio*
- **Manifest URL (paste into Stremio → Addons):**
  `https://asian-dramas-addon.vercel.app/manifest.json`

## Catalogs (17, grouped)

**🇰🇷🇨🇳🇯🇵 Dramas**
| Catalog |
|---|
| 🇰🇷 K-Drama - Latest |
| 🇰🇷 K-Drama - Trending This Week |
| 🇨🇳 C-Drama - Latest (incl. TW/HK) |
| 🇨🇳 C-Drama - Trending This Week |
| 🇯🇵 J-Drama - Latest |

**🎌 Anime** (Japanese anime + Chinese donghua + Korean animation)
| Catalog |
|---|
| 🎌 Anime - Latest |
| 🔥 Anime - Trending This Week |
| 🏆 Anime - Top Rated All Time |
| ⭐ Anime - Best of 2026 |

**🎬 Movies — worldwide**
| Catalog |
|---|
| 🎬 Movies - Latest |
| 🔥 Movies - Trending This Week |
| 🏆 Movies - Top Rated All Time |
| ⭐ Movies - Best of 2026 |

**📺 Series — worldwide**
| Catalog |
|---|
| 📺 Series - Latest |
| 🔥 Series - Trending This Week |
| 🏆 Series - Top Rated All Time |
| ⭐ Series - Best of 2026 |

- **Configure page**: tick only the groups/catalogs you want → personal install
  link (fewer rows = a tidier Stremio board).
- Items use **IMDb IDs** (`tt...`) so Cinemeta and your other addons recognise
  them instantly (posters, ratings, streams).
- Search inside every catalog, pagination (scroll for more), full episode lists
  for series and full details for movies.
- **Smart ranking**: Top Rated / Best of the Year use an IMDb-style weighted
  score (a 9.4 from 60 voters can't outrank an 8.7 from 30,000), and Latest /
  Trending rows apply rating floors, so junk titles don't sneak in.
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
git init && git add . && git commit -m "AsianDrama Crush v1.1.0"
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
zero setup. It's shared though — and this addon now loads **17 catalogs**, so
your own key is strongly recommended:
1. Create a free account at https://www.themoviedb.org/signup
2. Go to https://www.themoviedb.org/settings/api → copy the **API Key (v3 auth)**.
3. In Vercel: your project → **Settings → Environment Variables** →
   add `TMDB_API_KEY` = your key → **Save**, then **Deployments → ⋯ → Redeploy**.

### Step 4 — Install in Stremio
Open `https://YOUR-APP.vercel.app/configure`, tick your catalogs, then:
- **Desktop/mobile app:** click **▶ Install in Stremio**, or
- Copy the manifest URL and paste it in Stremio → **Addons → Add addon**, or
- In **Stremio Web**, paste the manifest URL into the addons search box.

Your rows now appear on the Board/Discover. Pick a title → your stream addons
provide the playable links.

---

## 🖥️ Run/test locally
```bash
npm test     # smoke test: manifest, every catalog group, search, meta
npm start    # http://localhost:7000/configure  and  /manifest.json
```

## ✏️ Customise
- Add/remove/turn off catalogs: edit the `CATALOGS` list in `lib/catalogs.js`
  (`group`, `type`, `sort`, `target`, `weight`) and push — Vercel redeploys
  automatically. The configure page updates itself.
- Change name/logo/description: `ADDON_NAME` / `logo` in `lib/handler.js`.
- Catalogs refresh automatically (6-hour cache); nothing to maintain.

## ❓ FAQ
- **"No streams found"?** This is a catalog addon by design. Install a stream
  addon such as Torrentio for playback.
- **Why do the Top Rated lists differ from TMDB's own?** TMDB sorts by raw
  average rating, so brand-new titles with a handful of 10/10 votes top the
  chart. We re-rank with a weighted score, like IMDb's.
- **Too many rows in Stremio?** Use the configure page and tick only the
  groups you care about.
- **Free forever?** Yes — Vercel Hobby + TMDB are free for this usage. Note
  Vercel Hobby is for personal/non-commercial projects.
- **Update the lists manually?** No need — everything is generated live from
  TMDB on every request cycle.

Data & posters: [TMDB](https://www.themoviedb.org). This product uses the TMDB
API but is not endorsed or certified by TMDB.
