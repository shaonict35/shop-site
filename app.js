/**
 * GlowGoodly cPanel Phusion Passenger Root Application Entry Point
 * 
 * Delegates execution to backend/app.js or compiled dist/server.js
 */

const path = require('path');
const fs = require('fs');

const backendAppPath = path.join(__dirname, 'backend', 'app.js');
const distServerPath = path.join(__dirname, 'backend', 'dist', 'server.js');

if (fs.existsSync(backendAppPath)) {
  require(backendAppPath);
} else if (fs.existsSync(distServerPath)) {
  require(distServerPath);
} else {
  const http = require('http');
  const port = process.env.PORT || 3000;
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('GlowGoodly cPanel Node.js Application is starting up. Please run npm run build in backend directory.');
  }).listen(port);
}

