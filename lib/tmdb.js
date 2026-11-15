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
  12: 'Adventure', 14: 'Fantasy', 16: 'Animation', 18: 'Drama', 27: 'Horror',
  28: 'Action', 35: 'Comedy', 36: 'History', 37: 'Western', 53: 'Thriller',
  80: 'Crime', 99: 'Documentary', 878: 'Science Fiction', 9648: 'Mystery',
  10402: 'Music', 10749: 'Romance', 10751: 'Family', 10752: 'War',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
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
  if (cache.size > 800) cache.clear();
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
    headers: { 'User-Agent': 'AsianDrama-Stremio-Addon/1.1', 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`);
  const data = await res.json();
  cacheSet(path, data, ttlMs);
  return data;
}

async function getImdbId(tmdbId, type = 'tv') {
  try {
    const media = type === 'movie' ? 'movie' : 'tv';
    const d = await tmdb(`/${media}/${tmdbId}/external_ids`, 7 * 24 * 60 * 60 * 1000);
    return d && d.imdb_id ? d.imdb_id : null;
  } catch (_) {
    return null;
  }
}

function poster(path, size = 'w500') {
  return path ? `${IMG}/${size}${path}` : undefined;
}

// Turns one TMDB result into a Stremio catalog "meta preview".
// Prefers the IMDb id (tt...) so Cinemeta and your other addons recognise the
// title instantly; falls back to "tmdb:<id>", which our own meta handler serves.
async function toMetaPreview(item, type = 'series') {
  const isMovie = type === 'movie';
  const imdbId = await getImdbId(item.id, isMovie ? 'movie' : 'tv');
  const date = isMovie ? item.release_date : item.first_air_date;
  const year = date ? String(date).slice(0, 4) : undefined;
  return {
    id: imdbId || `tmdb:${item.id}`,
    type: isMovie ? 'movie' : 'series',
    name: item.name || item.title || item.original_name || item.original_title,
    poster: poster(item.poster_path, 'w500'),
    background: poster(item.backdrop_path, 'w1280'),
    description: item.overview || undefined,
    releaseInfo: year,
    imdbRating: item.vote_average ? Number(item.vote_average).toFixed(1) : undefined,
    genres: (item.genre_ids || []).map(id => GENRES[id]).filter(Boolean)
  };
}

async function toMetaPreviews(results, type = 'series') {
  const out = await Promise.all((results || []).map(r => toMetaPreview(r, type)));
  // De-duplicate (same title can appear twice) and drop nameless entries.
  const seen = new Set();
  return out.filter(m => {
    if (!m.name || seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

module.exports = { tmdb, getImdbId, toMetaPreviews, GENRES, IMG };
