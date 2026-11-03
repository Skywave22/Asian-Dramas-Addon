'use strict';

const { tmdb, toMetaPreviews, GENRES } = require('./tmdb');
const { REGIONS, ROWS, buildCatalogs, resolveCatalog, discoverPath, searchPath, matchesRegion } = require('./catalogs');
const { configureHtml } = require('./configure');

const ADDON_ID = 'com.asiandramacrush.addon';
const ADDON_NAME = '🌸 AsianDrama Crush';
const ADDON_VERSION = '1.0.0';
const DESCRIPTION = 'Daily-updated catalogs of the latest & trending Korean, Japanese, Chinese and Thai dramas. Catalog only - playback comes from your other addons.';

// ── config in the install URL: /<base64url-json>/manifest.json ─────────────
function encodeConfig(cfg) {
  return Buffer.from(JSON.stringify(cfg), 'utf8').toString('base64url');
}
function decodeConfig(segment) {
  if (!segment || !/^[A-Za-z0-9_-]{8,}$/.test(segment)) return null;
  try {
    const cfg = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
    if (cfg && (Array.isArray(cfg.regions) || Array.isArray(cfg.rows))) return cfg;
  } catch (_) { /* not a config segment */ }
  return null;
}

function manifest(config) {
  return {
    id: ADDON_ID,
    version: ADDON_VERSION,
    name: ADDON_NAME,
    description: DESCRIPTION,
    logo: 'https://i.ibb.co/vxC9rTBZ/242-EB494-F0-D4-400-A-9931-C303251-F0-DAC.png',
    resources: ['catalog', 'meta'],
    types: ['series'],
    idPrefixes: ['tt', 'tmdb:'],
    catalogs: buildCatalogs(config),
    behaviorHints: { configurable: true, configurationRequired: false }
  };
}

// ── helpers ────────────────────────────────────────────────────────────────
function send(res, code, body, cacheSeconds) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': typeof body === 'string' ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': cacheSeconds ? `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}` : 'no-cache'
  });
  res.end(payload);
}

function parseExtra(segment) {
  const extra = {};
  if (!segment) return extra;
  const clean = decodeURIComponent(segment).replace(/\.json$/, '');
  for (const pair of clean.split('&')) {
    const idx = pair.indexOf('=');
    if (idx > 0) extra[pair.slice(0, idx)] = decodeURIComponent(pair.slice(idx + 1));
  }
  return extra;
}

async function handleCatalog(catalogId, extra, res) {
  const found = resolveCatalog(catalogId);
  if (!found) return send(res, 200, { metas: [] });
  const { region, row } = found;

  const skip = Math.max(0, parseInt(extra.skip, 10) || 0);
  const page = Math.floor(skip / 20) + 1;

  let results;
  if (extra.search) {
    const data = await tmdb(searchPath(region, extra.search, page));
    results = (data.results || []).filter(item => matchesRegion(item, region));
  } else {
    const data = await tmdb(discoverPath(region, row, page));
    results = data.results || [];
  }
  const metas = await toMetaPreviews(results);
  return send(res, 200, { metas }, 6 * 60 * 60); // Stremio/CDN cache: 6h
}

async function handleMeta(type, rawId, res) {
  if (type !== 'series') return send(res, 200, { meta: {} });
  const id = decodeURIComponent(rawId).replace(/\.json$/, '');

  let tmdbId = null;
  if (id.startsWith('tmdb:')) {
    tmdbId = id.split(':')[1];
  } else if (/^tt\d+$/.test(id)) {
    const found = await tmdb(`/find/${id}?external_source=imdb_id`);
    const hit = (found.tv_results || [])[0];
    if (hit) tmdbId = hit.id;
  }
  if (!tmdbId) return send(res, 200, { meta: {} });

  const d = await tmdb(`/tv/${tmdbId}?append_to_response=external_ids,credits,videos`);
  const imdbId = d.external_ids && d.external_ids.imdb_id;
  const trailer = ((d.videos && d.videos.results) || []).find(v => v.site === 'YouTube' && v.type === 'Trailer');

  // Episodes (videos) - one cached call per season that has episodes.
  const videos = [];
  const seasons = (d.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0);
  for (const s of seasons.slice(0, 20)) {
    try {
      const sd = await tmdb(`/tv/${tmdbId}/season/${s.season_number}`, 24 * 60 * 60 * 1000);
      for (const ep of sd.episodes || []) {
        videos.push({
          id: `${imdbId || `tmdb:${tmdbId}`}:${ep.season_number}:${ep.episode_number}`,
          title: ep.name || `Episode ${ep.episode_number}`,
          season: ep.season_number,
          episode: ep.episode_number,
          released: ep.air_date ? new Date(ep.air_date).toISOString() : undefined,
          overview: ep.overview || undefined,
          thumbnail: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : undefined
        });
      }
    } catch (_) { /* skip broken season */ }
  }

  const meta = {
    id: imdbId || `tmdb:${tmdbId}`,
    type: 'series',
    name: d.name || d.original_name,
    poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : undefined,
    background: d.backdrop_path ? `https://image.tmdb.org/t/p/w1280${d.backdrop_path}` : undefined,
    logo: undefined,
    description: d.overview || undefined,
    releaseInfo: d.first_air_date ? String(d.first_air_date).slice(0, 4) : undefined,
    imdbRating: d.vote_average ? Number(d.vote_average).toFixed(1) : undefined,
    genres: (d.genres || []).map(g => g.name),
    cast: ((d.credits && d.credits.cast) || []).slice(0, 10).map(c => c.name),
    director: ((d.created_by || [])).map(c => c.name),
    runtime: d.episode_run_time && d.episode_run_time[0] ? `${d.episode_run_time[0]} min` : undefined,
    language: d.original_language,
    country: (d.origin_country || []).join(', '),
    trailer: trailer ? `yt_id:${trailer.key}` : undefined,
    videos
  };
  return send(res, 200, { meta }, 24 * 60 * 60);
}

// ── main router (works as a plain (req,res) handler everywhere) ────────────
async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return send(res, 200, {});
    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean); // e.g. [config?, 'catalog', 'series', id, extra?]

    // Optional leading config segment
    let config = null;
    if (parts.length && !['manifest.json', 'catalog', 'meta', 'configure', 'configure.html'].includes(parts[0])) {
      config = decodeConfig(parts[0]);
      if (config) parts.shift();
    }

    const route = parts[0] || '';

    if (route === '' || route === 'configure' || route === 'configure.html') {
      return send(res, 200, configureHtml(REGIONS, ROWS));
    }
    if (route === 'manifest.json') {
      return send(res, 200, manifest(config), 60 * 60);
    }
    if (route === 'catalog') {
      // /catalog/series/<catalogId>.json  or  /catalog/series/<catalogId>/<extra>.json
      const catalogId = (parts[2] || '').replace(/\.json$/, '');
      const extra = parseExtra(parts[3] || '');
      return await handleCatalog(catalogId, extra, res);
    }
    if (route === 'meta') {
      // /meta/series/<id>.json   (id may be tt123... or tmdb:123)
      return await handleMeta(parts[1], parts.slice(2).join('/'), res);
    }
    return send(res, 404, { error: 'not found' });
  } catch (err) {
    console.error(err);
    return send(res, 200, { metas: [], meta: {}, error: String(err && err.message || err) });
  }
}

module.exports = { handler, manifest, encodeConfig };
