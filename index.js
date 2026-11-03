'use strict';
// Local / any-Node-host entry point. On Vercel, api/index.js is used instead.
const http = require('http');
const { handler } = require('./lib/handler');

if (require.main === module) {
  const port = process.env.PORT || 7000;
  http.createServer(handler).listen(port, '0.0.0.0', () => {
    console.log(`🌸 AsianDrama Crush running on http://localhost:${port}`);
    console.log(`   Configure : http://localhost:${port}/configure`);
    console.log(`   Manifest  : http://localhost:${port}/manifest.json`);
  });
}

module.exports = handler;
