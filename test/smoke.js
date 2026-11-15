'use strict';
// Smoke test: boots the server on a random port and checks the Stremio routes.
// Run: npm test
const http = require('http');
const { handler } = require('../lib/handler');

async function get(base, path) {
  const res = await fetch(base + path);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { status: res.status, json, text };
}

(async () => {
  const server = http.createServer(handler);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let failed = false;
  const check = (name, ok, extra = '') => {
    console.log(`${ok ? '✅' : '❌'} ${name} ${extra}`);
    if (!ok) failed = true;
  };

  const m = await get(base, '/manifest.json');
  const ids = m.json.catalogs.map(c => c.id);
  check('manifest.json', m.status === 200 && Array.isArray(m.json.catalogs), `(${ids.length} catalogs)`);
  check('manifest types = series + movie', JSON.stringify(m.json.types) === JSON.stringify(['series', 'movie']));
  check('groups present: dramas / anime / movies / series',
    ['ad_kdrama_latest', 'ad_cdrama_trending', 'ad_jdrama_latest', 'an_anime_latest', 'an_anime_best', 'mv_latest', 'sr_latest', 'sr_best'].every(id => ids.includes(id)),
    `(${ids.join(', ')})`);
  check('catalog types correct', m.json.catalogs.every(c => (c.id.startsWith('mv_') ? c.type === 'movie' : c.type === 'series')));

  const drama = await get(base, '/catalog/series/ad_kdrama_latest.json');
  check('catalog drama', drama.status === 200 && drama.json.metas.length > 0, `(${drama.json.metas.length} items, first: ${drama.json.metas[0] && drama.json.metas[0].name})`);

  const anime = await get(base, '/catalog/series/an_anime_latest.json');
  check('catalog anime latest', anime.status === 200 && anime.json.metas.length > 0, `(${anime.json.metas.length} items, first: ${anime.json.metas[0] && anime.json.metas[0].name})`);

  const animeTop = await get(base, '/catalog/series/an_anime_top.json');
  check('catalog anime top rated', animeTop.status === 200 && animeTop.json.metas.length > 0, `(${animeTop.json.metas.length} items, first: ${animeTop.json.metas[0] && animeTop.json.metas[0].name})`);

  const animeBest = await get(base, '/catalog/series/an_anime_best.json');
  check('catalog anime best of year', animeBest.status === 200 && animeBest.json.metas.length > 0, `(${animeBest.json.metas.length} items)`);

  const movie = await get(base, '/catalog/movie/mv_latest.json');
  check('catalog movies latest', movie.status === 200 && movie.json.metas.length > 0 && movie.json.metas.every(x => x.type === 'movie'), `(${movie.json.metas.length} items, first: ${movie.json.metas[0] && movie.json.metas[0].name})`);

  const movieTop = await get(base, '/catalog/movie/mv_top.json');
  check('catalog movies top rated', movieTop.status === 200 && movieTop.json.metas.length > 0, `(${movieTop.json.metas.length} items, first: ${movieTop.json.metas[0] && movieTop.json.metas[0].name})`);

  const series = await get(base, '/catalog/series/sr_latest.json');
  check('catalog series latest', series.status === 200 && series.json.metas.length > 0, `(${series.json.metas.length} items, first: ${series.json.metas[0] && series.json.metas[0].name})`);

  const seriesBest = await get(base, '/catalog/series/sr_best.json');
  check('catalog series best of year', seriesBest.status === 200 && seriesBest.json.metas.length > 0, `(${seriesBest.json.metas.length} items)`);

  check('catalog ids are IMDb/tmdb', movie.json.metas.every(x => /^tt\d+$/.test(x.id) || x.id.startsWith('tmdb:')));

  const s = await get(base, '/catalog/series/ad_kdrama_trending/search=Squid%20Game.json');
  check('catalog search', s.status === 200 && Array.isArray(s.json.metas), `(${s.json.metas.length} results)`);

  const pg = await get(base, '/catalog/series/ad_jdrama_latest/skip=20.json');
  check('catalog pagination (skip)', pg.status === 200 && pg.json.metas.length > 0, `(${pg.json.metas.length} items)`);

  const metaId = drama.json.metas[0].id;
  const meta = await get(base, `/meta/series/${encodeURIComponent(metaId)}.json`);
  check(`meta series ${metaId}`, meta.status === 200 && !!meta.json.meta.name, `(${meta.json.meta.name}, ${meta.json.meta.videos ? meta.json.meta.videos.length : 0} episodes)`);

  const movieMetaId = movie.json.metas[0].id;
  const mm = await get(base, `/meta/movie/${encodeURIComponent(movieMetaId)}.json`);
  check(`meta movie ${movieMetaId}`, mm.status === 200 && !!mm.json.meta.name, `(${mm.json.meta.name}, ${mm.json.meta.releaseInfo}, ${mm.json.meta.runtime || 'n/a'})`);

  // Personalised manifest: only anime
  const seg = Buffer.from(JSON.stringify({ catalogs: ['an_anime_latest', 'an_anime_top'] })).toString('base64url');
  const pm = await get(base, `/${seg}/manifest.json`);
  check('personalised manifest (2 anime)', pm.json.catalogs.length === 2 && pm.json.catalogs.every(c => c.id.startsWith('an_')), `(${pm.json.catalogs.map(c => c.id).join(', ')})`);

  const cfg = await get(base, '/configure');
  check('configure page', cfg.status === 200 && cfg.text.includes('AsianDrama Crush') && cfg.text.includes('an_anime_top'));

  server.close();
  console.log(failed ? '\nSOME TESTS FAILED' : '\nALL TESTS PASSED');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
