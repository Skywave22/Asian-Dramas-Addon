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
  check('manifest.json', m.status === 200 && Array.isArray(m.json.catalogs), `(${m.json && m.json.catalogs.length} catalogs)`);
  check('catalog plan = K Latest/Trending, C Latest/Trending, J Latest',
    JSON.stringify(m.json.catalogs.map(c => c.id)) === JSON.stringify(['ad_kdrama_latest', 'ad_kdrama_trending', 'ad_cdrama_latest', 'ad_cdrama_trending', 'ad_jdrama_latest']),
    `(${m.json.catalogs.map(c => c.id).join(', ')})`);

  const first = m.json.catalogs[0];
  const c = await get(base, `/catalog/series/${first.id}.json`);
  check(`catalog ${first.id}`, c.status === 200 && c.json.metas.length > 0, `(${c.json && c.json.metas.length} items, first: ${c.json && c.json.metas[0] && c.json.metas[0].name})`);

  check('catalog ids are IMDb/tmdb', !!c.json && c.json.metas.every(x => /^tt\d+$/.test(x.id) || x.id.startsWith('tmdb:')));

  const s = await get(base, `/catalog/series/ad_kdrama_trending/search=Squid%20Game.json`);
  check('catalog search', s.status === 200 && Array.isArray(s.json.metas), `(${s.json && s.json.metas.length} results)`);

  const pg = await get(base, `/catalog/series/ad_jdrama_latest/skip=20.json`);
  check('catalog pagination (skip)', pg.status === 200 && pg.json.metas.length > 0, `(${pg.json && pg.json.metas.length} items)`);

  const metaId = c.json.metas[0].id;
  const meta = await get(base, `/meta/series/${encodeURIComponent(metaId)}.json`);
  check(`meta ${metaId}`, meta.status === 200 && !!meta.json.meta.name, `(${meta.json && meta.json.meta.name}, ${meta.json && meta.json.meta.videos ? meta.json.meta.videos.length : 0} episodes)`);

  const cfg = await get(base, '/configure');
  check('configure page', cfg.status === 200 && cfg.text.includes('AsianDrama Crush'));

  server.close();
  console.log(failed ? '\nSOME TESTS FAILED' : '\nALL TESTS PASSED');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
