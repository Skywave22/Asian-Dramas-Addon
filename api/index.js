'use strict';
// Vercel serverless entry point - all routes are rewritten here by vercel.json
const { handler } = require('../lib/handler');
module.exports = handler;
