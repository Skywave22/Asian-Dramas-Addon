'use strict';

// ── Regions ────────────────────────────────────────────────────────────────
// lang   = TMDB with_original_language
// origin = TMDB with_origin_country ( "|" = OR in the TMDB API )
const REGIONS = [
  { id: 'kdrama',   label: 'K-Drama',   full: 'Korean',   flag: '🇰🇷', lang: 'ko', origin: 'KR' },
  { id: 'jdrama',   label: 'J-Drama',   full: 'Japanese', flag: '🇯🇵', lang: 'ja', origin: 'JP' },
  { id: 'cdrama',   label: 'C-Drama',   full: 'Chinese',  flag: '🇨🇳', lang: 'zh', origin: 'CN|TW|HK' },
  { id: 'thaidrama', label: 'Thai Drama', full: 'Thai',   flag: '🇹🇭', lang: 'th', origin: 'TH' }
];

// ── Rows (catalog types) per region ───────────────────────────────────────
const ROWS = [
  { id: 'latest',   suffix: 'Latest' },
  { id: 'trending', suffix: 'Trending This Week' },
  { id: 'top',      suffix: 'Top Rated All Time' }
];

function buildCatalogs(config) {
  const regions = config && config.regions && config.regions.length
    ? REGIONS.filter(r => config.regions.includes(r.id))
    : REGIONS;
  const rows = config && config.rows && config.rows.length
    ? ROWS.filter(r => config.rows.includes(r.id))
    : ROWS;

  const catalogs = [];
  for (const region of regions) {
    for (const row of rows) {
      catalogs.push({
        id: `ad_${region.id}_${row.id}`,
        type: 'series',
        name: `${region.flag} ${region.label} - ${row.suffix}`,
        extra: [
          { name: 'search', isRequired: false },
          { name: 'skip', isRequired: false }
        ]
      });
    }
  }
  return catalogs;
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

module.exports = { REGIONS, ROWS, buildCatalogs, resolveCatalog, discoverPath, searchPath, matchesRegion };
