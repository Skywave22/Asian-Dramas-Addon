'use strict';

// Self-contained configure / landing page (no external CSS/JS, so it also
// works when previewed offline). Users tick the catalogs they want, then
// get a personalised install link.
function configureHtml(REGIONS, ROWS) {
  const regionBoxes = REGIONS.map(r => `
    <label class="card"><input type="checkbox" class="region" value="${r.id}" checked>
      <span>${r.flag} ${r.label}</span><small>${r.full} dramas</small></label>`).join('');
  const rowBoxes = ROWS.map(r => `
    <label class="card"><input type="checkbox" class="row" value="${r.id}" checked>
      <span>${r.suffix}</span></label>`).join('');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AsianDrama Crush - Configure</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0b1e;color:#f3efff;margin:0;padding:24px}
  .wrap{max-width:720px;margin:0 auto} h1{font-size:28px;margin:8px 0} .sub{color:#bdb4e6;line-height:1.5}
  h3{margin:26px 0 10px} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
  .card{display:flex;flex-direction:column;gap:4px;background:#1d1738;border:1px solid #372d63;border-radius:12px;padding:12px;cursor:pointer}
  .card small{color:#a99fd6} input{accent-color:#e84a8a;width:18px;height:18px}
  .out{width:100%;box-sizing:border-box;background:#120d28;color:#ffd7e8;border:1px solid #372d63;border-radius:10px;padding:12px;margin:14px 0}
  button,a.btn{display:inline-block;background:#e84a8a;color:#fff;border:0;border-radius:10px;padding:12px 18px;font-size:16px;cursor:pointer;text-decoration:none;margin-right:8px}
  a.ghost{background:#372d63} .note{color:#a99fd6;font-size:14px;line-height:1.6} code{background:#1d1738;padding:2px 6px;border-radius:6px}
</style></head><body><div class="wrap">
  <h1>🌸 AsianDrama Crush</h1>
  <p class="sub">Latest &amp; trending Korean, Japanese, Chinese and Thai drama catalogs for Stremio, updated automatically from TMDB. <b>Catalog only</b> - press play using your usual stream addons.</p>

  <h3>1. Pick your regions</h3><div class="grid">${regionBoxes}</div>
  <h3>2. Pick your rows</h3><div class="grid">${rowBoxes}</div>

  <h3>3. Install</h3>
  <input class="out" id="url" readonly>
  <div>
    <a class="btn" id="install" href="#">▶ Install in Stremio</a>
    <button id="copy">Copy manifest URL</button>
    <a class="btn ghost" href="https://web.stremio.com/#/addons" target="_blank" rel="noopener">Open Stremio Web</a>
  </div>
  <p class="note">On desktop/mobile: click <b>Install</b>. Or in Stremio go to <code>Addons → paste the manifest URL above</code>. On Stremio Web, paste it in the addons search box. No account or API key needed.</p>

<script>
  function picked(cls){return Array.from(document.querySelectorAll('.'+cls+':checked')).map(x=>x.value);}
  function update(){
    var cfg={regions:picked('region'), rows:picked('row')};
    var seg=btoa(JSON.stringify(cfg)).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
    var manifestUrl=location.origin+'/'+seg+'/manifest.json';
    document.getElementById('url').value=manifestUrl;
    document.getElementById('install').href='stremio://'+location.host+'/'+seg+'/manifest.json';
  }
  document.querySelectorAll('input').forEach(function(i){i.addEventListener('change',update);});
  document.getElementById('copy').onclick=function(){var u=document.getElementById('url');u.select();navigator.clipboard&&navigator.clipboard.writeText(u.value);};
  update();
</script>
</div></body></html>`;
}

module.exports = { configureHtml };
