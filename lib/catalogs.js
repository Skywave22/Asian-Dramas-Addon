'use strict';

// ───────────────────────────────────────────────────────────────────────────
// Catalog definitions. Every catalog is data — add/remove entries here and
// Stremio (and the configure page) pick them up automatically.
//
// group   : heading on the configure page
// type    : 'series' | 'movie'
// name    : label shown in Stremio
// genre   : TMDB genre id filter (16 = Animation)
// lang    : TMDB with_original_language (single language)
// origins : TMDB with_origin_country, "|" = OR
// sort    : 'latest' | 'trending' | 'top' | 'best_year'
// target  : extra TMDB discover params
// ───────────────────────────────────────────────────────────────────────────

const YEAR = new Date().getFullYear();

function today() {
  return new Date().toISOString().slice(0, 10);
}
function yearsAgo(n) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
}
function yearStart(y) {
  return `${y}-01-01`;
}

const ANIME_ORIGINS = 'JP|CN|KR|TW|HK'; // Japanese anime + Chinese donghua + Korean animation

const CATALOGS = [
  // ── Dramas (Asian live action) ───────────────────────────────────────────
  { id: 'ad_kdrama_latest',   group: 'Dramas', type: 'series', name: '🇰🇷 K-Drama - Latest',
    lang: 'ko', origins: 'KR', sort: 'latest', target: { voteMin: 5, minRating: 6.0 } },
  { id: 'ad_kdrama_trending', group: 'Dramas', type: 'series', name: '🇰🇷 K-Drama - Trending This Week',
    lang: 'ko', origins: 'KR', sort: 'trending', target: { voteMin: 5, minRating: 6.0 } },
  { id: 'ad_cdrama_latest',   group: 'Dramas', type: 'series', name: '🇨🇳 C-Drama - Latest',
    lang: 'zh', origins: 'CN|TW|HK', sort: 'latest', target: { voteMin: 5, minRating: 6.0 } },
  { id: 'ad_cdrama_trending', group: 'Dramas', type: 'series', name: '🇨🇳 C-Drama - Trending This Week',
    lang: 'zh', origins: 'CN|TW|HK', sort: 'trending', target: { voteMin: 5, minRating: 6.0 } },
  { id: 'ad_jdrama_latest',   group: 'Dramas', type: 'series', name: '🇯🇵 J-Drama - Latest',
    lang: 'ja', origins: 'JP', sort: 'latest', target: { voteMin: 5, minRating: 6.0 } },

  // ── Anime (all Asian animation) ──────────────────────────────────────────
  { id: 'an_anime_latest',   group: 'Anime', type: 'series', name: '🎌 Anime - Latest',
    genre: 16, origins: ANIME_ORIGINS, sort: 'latest', target: { voteMin: 5, minRating: 6.5 } },
  { id: 'an_anime_trending', group: 'Anime', type: 'series', name: '🔥 Anime - Trending This Week',
    genre: 16, origins: ANIME_ORIGINS, sort: 'trending', target: { voteMin: 10, minRating: 6.5 } },
  { id: 'an_anime_top',      group: 'Anime', type: 'series', name: '🏆 Anime - Top Rated All Time',
    genre: 16, origins: ANIME_ORIGINS, sort: 'top', target: { voteMin: 150 }, weight: { m: 1200, C: 7.8 } },
  { id: 'an_anime_best',     group: 'Anime', type: 'series', name: `⭐ Anime - Best of ${YEAR}`,
    genre: 16, origins: ANIME_ORIGINS, sort: 'best_year', target: { voteMin: 60 }, weight: { m: 300, C: 7.6 } },

  // ── Movies (worldwide) ───────────────────────────────────────────────────
  { id: 'mv_latest',   group: 'Movies', type: 'movie', name: '🎬 Movies - Latest',
    sort: 'latest', target: { voteMin: 15, minRating: 6.0 } },
  { id: 'mv_trending', group: 'Movies', type: 'movie', name: '🔥 Movies - Trending This Week',
    sort: 'trending', target: { voteMin: 20, minRating: 6.0 } },
  { id: 'mv_top',      group: 'Movies', type: 'movie', name: '🏆 Movies - Top Rated All Time',
    sort: 'top', target: { voteMin: 500 }, weight: { m: 2500, C: 7.0 } },
  { id: 'mv_best',     group: 'Movies', type: 'movie', name: `⭐ Movies - Best of ${YEAR}`,
    sort: 'best_year', target: { voteMin: 1000 }, weight: { m: 1500, C: 6.9 } },

  // ── Series (worldwide) ───────────────────────────────────────────────────
  { id: 'sr_latest',   group: 'Series', type: 'series', name: '📺 Series - Latest',
    sort: 'latest', target: { voteMin: 8, minRating: 6.5 } },
  { id: 'sr_trending', group: 'Series', type: 'series', name: '🔥 Series - Trending This Week',
    sort: 'trending', target: { voteMin: 15, minRating: 6.5 } },
  { id: 'sr_top',      group: 'Series', type: 'series', name: '🏆 Series - Top Rated All Time',
    sort: 'top', target: { voteMin: 400 }, weight: { m: 1500, C: 7.5 } },
  { id: 'sr_best',     group: 'Series', type: 'series', name: `⭐ Series - Best of ${YEAR}`,
    sort: 'best_year', target: { voteMin: 300 }, weight: { m: 700, C: 7.2 } }
];

const GROUPS = ['Dramas', 'Anime', 'Movies', 'Series'];

// ── Discover (browsing) paths ─────────────────────────────────────────────
function discoverPath(def, page) {
  const base = `/discover/${def.type === 'movie' ? 'movie' : 'tv'}?include_adult=false&page=${page}`;
  const params = [];
  const dateField = def.type === 'movie' ? 'primary_release_date' : 'first_air_date';
  const t = def.target || {};
  const voteMin = t.voteMin != null ? t.voteMin : 5;

  if (def.genre) params.push(`with_genres=${def.genre}`);
  if (def.lang) params.push(`with_original_language=${def.lang}`);
  if (def.origins) params.push(`with_origin_country=${encodeURIComponent(def.origins)}`);

  if (def.sort === 'latest') {
    params.push(`sort_by=${dateField}.desc`);
    params.push(`${dateField}.lte=${today()}`);
    params.push(`vote_count.gte=${voteMin}`);
    if (t.minRating) params.push(`vote_average.gte=${t.minRating}`);
  } else if (def.sort === 'trending') {
    params.push('sort_by=popularity.desc');
    params.push(`${dateField}.gte=${yearsAgo(3)}`);
    params.push(`vote_count.gte=${voteMin}`);
    if (t.minRating) params.push(`vote_average.gte=${t.minRating}`);
  } else if (def.sort === 'top') {
    params.push('sort_by=vote_average.desc');
    params.push(`vote_count.gte=${voteMin}`);
    params.push(`${dateField}.lte=${today()}`);
  } else if (def.sort === 'best_year') {
    params.push('sort_by=vote_average.desc');
    params.push(`vote_count.gte=${voteMin}`);
    params.push(`${dateField}.gte=${yearStart(YEAR)}`);
    params.push(`${dateField}.lte=${today()}`);
  }
  return `${base}&${params.join('&')}`;
}

// ── Search paths ──────────────────────────────────────────────────────────
function searchPath(def, query, page) {
  return `/search/${def.type === 'movie' ? 'movie' : 'tv'}?query=${encodeURIComponent(query)}&include_adult=false&page=${page}`;
}

// ── Result filtering (search results aren't region-filtered by TMDB) ──────
function matchesDef(item, def) {
  if (!item) return false;
  if (def.genre && !(item.genre_ids || []).includes(def.genre)) return false;
  if (def.lang && item.original_language !== def.lang) return false;
  if (def.origins) {
    const allowed = def.origins.split('|');
    const origins = (item.origin_country || []).map(c => String(c).toUpperCase());
    if (origins.length && !origins.some(c => allowed.includes(c))) return false;
  }
  // World-wide catalogs still hide adult + zero-vote junk
  if (def.type === 'movie' && item.adult) return false;
  return true;
}

// ── Manifest catalogs ─────────────────────────────────────────────────────
function toManifestCatalog(def) {
  return {
    id: def.id,
    type: def.type,
    name: def.name,
    extra: [
      { name: 'search', isRequired: false },
      { name: 'skip', isRequired: false }
    ]
  };
}

function buildCatalogs(config) {
  let list = CATALOGS;
  if (config && Array.isArray(config.catalogs) && config.catalogs.length) {
    list = list.filter(d => config.catalogs.includes(d.id));
  }
  return list.map(toManifestCatalog);
}

function allCatalogChoices() {
  return CATALOGS.map(d => ({ id: d.id, name: d.name, group: d.group, type: d.type }));
}

function resolveCatalog(id) {
  return CATALOGS.find(d => d.id === id) || null;
}

// IMDb-style Bayesian weighted rating: a 9.4 from 60 voters can't beat an
// 8.7 from 30,000 voters. This is what makes "Top Rated" / "Best of Year"
// rows feel hand-curated instead of "newest hype wins".
function weightedScore(item, weight) {
  const v = Number(item.vote_count) || 0;
  const R = Number(item.vote_average) || 0;
  const m = weight.m;
  const C = weight.C;
  return (v / (v + m)) * R + (m / (v + m)) * C;
}

module.exports = {
  CATALOGS, GROUPS, YEAR, buildCatalogs, allCatalogChoices, resolveCatalog,
  discoverPath, searchPath, matchesDef, weightedScore
};
