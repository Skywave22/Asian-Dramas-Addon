'use strict';

// TMDB helper - no dependencies, uses Node 18+ built-in fetch.
// Get your OWN free key at https://www.themoviedb.org/settings/api and set
// TMDB_API_KEY in Vercel (Settings -> Environment Variables). The fallback
// below is the repo-wide public key used by Skywave22/TJ-Plugins - it works,
// but it is shared, so it can hit rate limits. Your own key is recommended.
const FALLBACK_TMDB_KEY = '439c478a771f35c05022f9feabcca01c';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p';

const GENRES = {
  16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary',
  18: 'Drama', 10751: 'Family', 10762: 'Kids', 9648: 'Mystery',
  10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics', 37: 'Western',
  10759: 'Action & Adventure'
};

// Simple in-memory cache (per server instance). Keeps us well under
// TMDB rate limits and makes catalogs fast.
const cache = new Map();
function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) { cache.delete(key); return null; }
  return hit.data;
}
function cacheSet(key, data, ttlMs) {
  if (cache.size > 500) cache.clear();
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

function apiKey() {
  return process.env.TMDB_API_KEY || FALLBACK_TMDB_KEY;
}

async function tmdb(path, ttlMs = 6 * 60 * 60 * 1000) {
  const cached = cacheGet(path);
  if (cached) return cached;
  const sep = path.includes('?') ? '&' : '?';
  const url = `${TMDB_BASE}${path}${sep}api_key=${apiKey()}&language=en-US`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AsianDrama-Stremio-Addon/1.0', 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`);
  const data = await res.json();
  cacheSet(path, data, ttlMs);
  return data;
}

async function getImdbId(tmdbId) {
  try {
    const d = await tmdb(`/tv/${tmdbId}/external_ids`, 24 * 60 * 60 * 1000);
    return d && d.imdb_id ? d.imdb_id : null;
  } catch (_) {
    return null;
  }
}

function poster(path, size = 'w500') {
  return path ? `${IMG}/${size}${path}` : undefined;
}

// Turns one TMDB TV result into a Stremio catalog "meta preview".
// Prefers the IMDb id (tt...) so Cinemeta and your other addons recognise the
// title instantly; falls back to "tmdb:<id>", which our own meta handler serves.
async function toMetaPreview(item) {
  const imdbId = await getImdbId(item.id);
  const year = item.first_air_date ? String(item.first_air_date).slice(0, 4) : undefined;
  return {
    id: imdbId || `tmdb:${item.id}`,
    type: 'series',
    name: item.name || item.original_name,
    poster: poster(item.poster_path, 'w500'),
    background: poster(item.backdrop_path, 'w1280'),
    description: item.overview || undefined,
    releaseInfo: year,
    imdbRating: item.vote_average ? Number(item.vote_average).toFixed(1) : undefined,
    genres: (item.genre_ids || []).map(id => GENRES[id]).filter(Boolean)
  };
}

async function toMetaPreviews(results) {
  const out = await Promise.all((results || []).map(toMetaPreview));
  // De-duplicate (same show can appear once) and drop nameless entries.
  const seen = new Set();
  return out.filter(m => {
    if (!m.name || seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

module.exports = { tmdb, getImdbId, toMetaPreviews, GENRES, IMG };
