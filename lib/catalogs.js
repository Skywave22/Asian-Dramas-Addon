'use strict';

// ── Regions ────────────────────────────────────────────────────────────────
// lang   = TMDB with_original_language
// origin = TMDB with_origin_country ( "|" = OR in the TMDB API )
const REGIONS = [
  { id: 'kdrama',   label: 'K-Drama',   full: 'Korean',   flag: '🇰🇷', lang: 'ko', origin: 'KR' },
  { id: 'cdrama',   label: 'C-Drama',   full: 'Chinese',  flag: '🇨🇳', lang: 'zh', origin: 'CN|TW|HK' },
  { id: 'jdrama',   label: 'J-Drama',   full: 'Japanese', flag: '🇯🇵', lang: 'ja', origin: 'JP' }
];

// ── Rows (catalog types) ──────────────────────────────────────────────────
const ROWS = [
  { id: 'latest',   suffix: 'Latest' },
  { id: 'trending', suffix: 'Trending This Week' },
  { id: 'top',      suffix: 'Top Rated All Time' }
];

// ── Catalog plan (exact order shown in Stremio) ───────────────────────────
// K-Drama: Latest + Trending | C-Drama: Latest + Trending | J-Drama: Latest only (last)
const CATALOG_PLAN = [
  { regionId: 'kdrama', rowId: 'latest' },
  { regionId: 'kdrama', rowId: 'trending' },
  { regionId: 'cdrama', rowId: 'latest' },
  { regionId: 'cdrama', rowId: 'trending' },
  { regionId: 'jdrama', rowId: 'latest' }
];

function catalogDef(region, row) {
  return {
    id: `ad_${region.id}_${row.id}`,
    type: 'series',
    name: `${region.flag} ${region.label} - ${row.suffix}`,
    extra: [
      { name: 'search', isRequired: false },
      { name: 'skip', isRequired: false }
    ]
  };
}

function buildCatalogs(config) {
  let plan = CATALOG_PLAN;
  if (config && Array.isArray(config.catalogs) && config.catalogs.length) {
    plan = plan.filter(p => config.catalogs.includes(`ad_${p.regionId}_${p.rowId}`));
  } else if (config && (config.regions || config.rows)) {
    // Backwards-compatible region/row filtering
    plan = plan.filter(p =>
      (!config.regions || !config.regions.length || config.regions.includes(p.regionId)) &&
      (!config.rows || !config.rows.length || config.rows.includes(p.rowId))
    );
  }
  return plan.map(p => {
    const region = REGIONS.find(r => r.id === p.regionId);
    const row = ROWS.find(r => r.id === p.rowId);
    return catalogDef(region, row);
  });
}

function resolveCatalog(catalogId) {
  for (const region of REGIONS) {
    for (const row of ROWS) {
      if (catalogId === `ad_${region.id}_${row.id}`) return { region, row };
    }
  }
  return null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function yearsAgo(n) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
}

// Builds the TMDB discover path for one region + row + page.
function discoverPath(region, row, page) {
  const base =
    `/discover/tv?with_original_language=${region.lang}` +
    `&with_origin_country=${encodeURIComponent(region.origin)}` +
    `&with_genres=18&include_adult=false&page=${page}`;

  if (row.id === 'latest') {
    return `${base}&sort_by=first_air_date.desc&first_air_date.lte=${today()}&vote_count.gte=3`;
  }
  if (row.id === 'trending') {
    // Popularity on TMDB is a trending-style score; limit to recent shows.
    return `${base}&sort_by=popularity.desc&first_air_date.gte=${yearsAgo(3)}&vote_count.gte=5`;
  }
  // top
  return `${base}&sort_by=vote_average.desc&vote_count.gte=30`;
}

function searchPath(region, query, page) {
  return `/search/tv?query=${encodeURIComponent(query)}&include_adult=false&page=${page}`;
}

function matchesRegion(item, region) {
  if (!item) return false;
  if (item.original_language && item.original_language !== region.lang) return false;
  const origins = (item.origin_country || []).map(c => String(c).toUpperCase());
  const allowed = region.origin.split('|');
  if (origins.length && !origins.some(c => allowed.includes(c))) return false;
  return true;
}

module.exports = { REGIONS, ROWS, CATALOG_PLAN, buildCatalogs, resolveCatalog, discoverPath, searchPath, matchesRegion };
