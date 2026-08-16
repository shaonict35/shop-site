/**
 * GlowGoodly Backend — cPanel Phusion Passenger Application Entry Point
 * 
 * This file serves as the root startup file recognized by cPanel's "Setup Node.js App".
 * It delegates execution to the compiled TypeScript server in ./dist/server.js
 */

const path = require('path');
const fs = require('fs');

// Ensure environment variables are loaded
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Verify dist/server.js exists
const distServerPath = path.join(__dirname, 'dist', 'server.js');

if (fs.existsSync(distServerPath)) {
  console.log('🚀 [cPanel Passenger] Starting GlowGoodly API Engine from dist/server.js...');
  require(distServerPath);
} else {
  console.error('❌ [cPanel Passenger] Compiled dist/server.js not found!');
  console.error('Please run "npm run build" in your cPanel Terminal to compile TypeScript files.');
  
  // Fallback simple HTTP responder to display helpful error message in browser
  const http = require('http');
  const port = process.env.PORT || 5000;
  http.createServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; background: #fff5f5; color: #9b2c2c;">
          <h2>⚠️ GlowGoodly Backend Build Required</h2>
          <p>The compiled file <code>dist/server.js</code> was not found.</p>
          <p><strong>Fix:</strong> Open your cPanel Terminal, enter your application virtual environment, and run:</p>
          <pre style="background: #fed7d7; padding: 10px; border-radius: 4px;">npm run build</pre>
        </body>
      </html>
    `);
  }).listen(port);
}
