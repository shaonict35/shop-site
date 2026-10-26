/**
 * ==============================================================================
 * GlowGoodly API Engine — Production cPanel Phusion Passenger Bootstrapper
 * ==============================================================================
 * Architecture: Zero-Crash Resilient Entrypoint
 * Handles:
 *  1. Environment variable normalization & URI-encoding for MySQL / MariaDB
 *  2. Unhandled exception interception to eliminate opaque 503 errors
 *  3. Seamless delegation to compiled TypeScript engine (dist/server.js)
 *  4. Automatic diagnostic server if build or Prisma client is missing
 * ==============================================================================
 */

const path = require('path');
const fs = require('fs');
const http = require('http');

// 1. Explicitly load environment variables from application root
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

// 2. MySQL Connection String Auto-Construction & Sanitization
function setupDatabaseEnvironment() {
  const dbUser = process.env.DB_USER || 'sitecadh_alamain';
  const dbPass = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'sitecadh_glowgoodly_db';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '3306';

  let rawUrl = process.env.DATABASE_URL;

  if (!rawUrl || rawUrl.trim() === '' || rawUrl.startsWith('file:')) {
    // Construct robust connection string with URI encoding for special characters
    const encodedUser = encodeURIComponent(dbUser);
    const encodedPass = encodeURIComponent(dbPass);
    const encodedDb = encodeURIComponent(dbName);
    process.env.DATABASE_URL = `mysql://${encodedUser}:${encodedPass}@${dbHost}:${dbPort}/${encodedDb}`;
  } else if (rawUrl.startsWith('mariadb://')) {
    process.env.DATABASE_URL = rawUrl.replace(/^mariadb:\/\//, 'mysql://');
  }

  // Ensure discrete variables exist for components querying them directly
  if (!process.env.DB_USER) process.env.DB_USER = dbUser;
  if (!process.env.DB_NAME) process.env.DB_NAME = dbName;
  if (!process.env.DB_HOST) process.env.DB_HOST = dbHost;
  if (!process.env.DB_PORT) process.env.DB_PORT = dbPort;
}

setupDatabaseEnvironment();

// 3. Phusion Passenger Port Resolution
const PORT = process.env.PORT || 5000;

// 4. Safe Bootloader Execution
const distServerPath = path.resolve(__dirname, 'dist', 'server.js');

try {
  if (!fs.existsSync(distServerPath)) {
    throw new Error(
      `Compiled server entry point not found at "${distServerPath}". Run 'npm run build' via cPanel Terminal.`
    );
  }

  // Execute compiled application engine
  require(distServerPath);
  console.log(`🚀 [Passenger Bootstrapper] Successfully mounted GlowGoodly API on port ${PORT}`);
} catch (bootError) {
  console.error('❌ [Passenger Bootstrapper Fatal Error]:', bootError);

  // Fallback HTTP Server to provide actionable diagnostics instead of Passenger 503
  const server = http.createServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GlowGoodly API — cPanel Deployment Diagnostic</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; line-height: 1.6; }
          .container { max-width: 860px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .badge { display: inline-block; background: #ef4444; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
          h1 { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
          p { color: #94a3b8; font-size: 15px; margin-bottom: 20px; }
          .code-box { background: #090d16; border: 1px solid #334155; border-radius: 8px; padding: 16px; overflow-x: auto; color: #fca5a5; font-family: Consolas, Monaco, "Courier New", monospace; font-size: 13px; margin-bottom: 24px; white-space: pre-wrap; word-break: break-all; }
          .solution-box { background: #064e3b; border: 1px solid #059669; border-radius: 8px; padding: 20px; color: #ecfdf5; margin-bottom: 24px; }
          .solution-box h2 { font-size: 16px; font-weight: 600; margin-bottom: 10px; color: #a7f3d0; }
          .terminal-cmd { background: #022c22; color: #6ee7b7; padding: 12px 16px; border-radius: 6px; font-family: monospace; font-size: 14px; user-select: all; display: block; border: 1px solid #047857; margin-top: 8px; }
          .footer { font-size: 13px; color: #64748b; text-align: center; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">Deployment Setup Required</div>
          <h1>GlowGoodly API Engine Bootstrapping</h1>
          <p>The Node.js server started under Phusion Passenger, but encountered an initialization blocker:</p>
          
          <div class="code-box"><strong>Error Details:</strong>\n${bootError.stack || bootError.message}</div>

          <div class="solution-box">
            <h2>💡 Quick 1-Click Fix (Run in cPanel Terminal):</h2>
            <p style="color: #d1fae5; font-size: 14px; margin-bottom: 8px;">Run this command to install dependencies, generate the Linux Prisma MySQL engine, build TypeScript, and restart the app:</p>
            <code class="terminal-cmd">source /home/sitecadh/nodevenv/api.glowgoodly.com/20/bin/activate && cd /home/sitecadh/api.glowgoodly.com && npm install && npx prisma generate --schema=./prisma/schema.prisma && npm run build && mkdir -p tmp && touch tmp/restart.txt</code>
          </div>

          <div class="footer">
            GlowGoodly Production Node.js Engine &bull; Environment: ${process.env.NODE_ENV || 'production'} &bull; Database: MySQL (${process.env.DB_NAME || 'sitecadh_glowgoodly_db'})
          </div>
        </div>
      </body>
      </html>
    `);
  });

  server.listen(PORT, () => {
    console.log(`⚠️ [Passenger Bootstrapper] Serving diagnostic dashboard on port ${PORT}`);
  });
}
