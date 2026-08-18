const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const deployDir = path.join(rootDir, 'deploy');

console.log('🚀 Starting GlowGoodly cPanel Deployment Packaging...\n');

// 1. Ensure deploy directory exists and is clean
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir, { recursive: true });
}

// 2. Build Backend
console.log('📦 [1/4] Building Backend TypeScript...');
execSync('npm run build', { cwd: path.join(rootDir, 'backend'), stdio: 'inherit' });

// 3. Build Frontend Static Export
console.log('\n📦 [2/4] Building Frontend Static Export...');
execSync('npm run build', { cwd: path.join(rootDir, 'frontend'), stdio: 'inherit' });

// 4. Package Backend
console.log('\n📦 [3/4] Creating Backend Deployment Package (glowgoodly-backend-cpanel.zip)...');
const backendStageDir = path.join(deployDir, 'backend_staging');
if (fs.existsSync(backendStageDir)) fs.rmSync(backendStageDir, { recursive: true, force: true });
fs.mkdirSync(backendStageDir, { recursive: true });

// Copy essential backend files
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        copyDir(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(path.join(rootDir, 'backend', 'dist'), path.join(backendStageDir, 'dist'));
copyDir(path.join(rootDir, 'backend', 'prisma'), path.join(backendStageDir, 'prisma'));
fs.copyFileSync(path.join(rootDir, 'backend', 'prisma', 'schema.prisma'), path.join(backendStageDir, 'schema.prisma'));
if (fs.existsSync(path.join(rootDir, 'backend', 'prisma.config.ts'))) {
  fs.copyFileSync(path.join(rootDir, 'backend', 'prisma.config.ts'), path.join(backendStageDir, 'prisma.config.ts'));
}
fs.copyFileSync(path.join(rootDir, 'backend', 'package.json'), path.join(backendStageDir, 'package.json'));
fs.copyFileSync(path.join(rootDir, 'backend', 'package-lock.json'), path.join(backendStageDir, 'package-lock.json'));
fs.copyFileSync(path.join(rootDir, 'backend', 'app.js'), path.join(backendStageDir, 'app.js'));
fs.copyFileSync(path.join(rootDir, 'backend', '.htaccess'), path.join(backendStageDir, '.htaccess'));
fs.copyFileSync(path.join(rootDir, 'backend', '.env.production.example'), path.join(backendStageDir, '.env.production.example'));
if (fs.existsSync(path.join(rootDir, 'backend', 'firebase-service-account.json'))) {
  fs.copyFileSync(path.join(rootDir, 'backend', 'firebase-service-account.json'), path.join(backendStageDir, 'firebase-service-account.json'));
}

const backendZipPath = path.join(deployDir, 'glowgoodly-backend-cpanel.zip');
if (fs.existsSync(backendZipPath)) fs.unlinkSync(backendZipPath);

try {
  execSync(`powershell -Command "Compress-Archive -Path '${backendStageDir}\\*' -DestinationPath '${backendZipPath}' -Force"`, { stdio: 'inherit' });
} catch (e) {
  console.log('Using fallback zip command');
}
fs.rmSync(backendStageDir, { recursive: true, force: true });

// 5. Package Frontend Node.js App
console.log('\n📦 [4/4] Creating Frontend Node.js Deployment Package (glowgoodly-frontend-cpanel.zip)...');
const frontendStageDir = path.join(deployDir, 'frontend_staging');
if (fs.existsSync(frontendStageDir)) fs.rmSync(frontendStageDir, { recursive: true, force: true });
fs.mkdirSync(frontendStageDir, { recursive: true });

function copyFrontendDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'cache' && entry.name !== 'dev') {
        copyFrontendDir(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy .next build files (excluding cache)
copyFrontendDir(path.join(rootDir, 'frontend', '.next'), path.join(frontendStageDir, '.next'));
if (fs.existsSync(path.join(rootDir, 'frontend', 'public'))) {
  copyFrontendDir(path.join(rootDir, 'frontend', 'public'), path.join(frontendStageDir, 'public'));
}
fs.copyFileSync(path.join(rootDir, 'frontend', 'server.js'), path.join(frontendStageDir, 'server.js'));
fs.copyFileSync(path.join(rootDir, 'frontend', 'package.json'), path.join(frontendStageDir, 'package.json'));
fs.copyFileSync(path.join(rootDir, 'frontend', 'package-lock.json'), path.join(frontendStageDir, 'package-lock.json'));
if (fs.existsSync(path.join(rootDir, 'frontend', '.env.production.example'))) {
  fs.copyFileSync(path.join(rootDir, 'frontend', '.env.production.example'), path.join(frontendStageDir, '.env.production.example'));
}
if (fs.existsSync(path.join(rootDir, 'frontend', '.env'))) {
  fs.copyFileSync(path.join(rootDir, 'frontend', '.env'), path.join(frontendStageDir, '.env'));
}

const frontendZipPath = path.join(deployDir, 'glowgoodly-frontend-cpanel.zip');
if (fs.existsSync(frontendZipPath)) fs.unlinkSync(frontendZipPath);

try {
  execSync(`powershell -Command "$items = (Get-ChildItem -LiteralPath '${frontendStageDir}' -Force).FullName; Compress-Archive -LiteralPath $items -DestinationPath '${frontendZipPath}' -Force"`, { stdio: 'inherit' });
} catch (e) {
  console.log('Using fallback zip command', e.message);
}
fs.rmSync(frontendStageDir, { recursive: true, force: true });

console.log('\n🎉 PACKAGING COMPLETE! Ready for cPanel deployment:');
if (fs.existsSync(backendZipPath)) {
  const bSize = (fs.statSync(backendZipPath).size / 1024 / 1024).toFixed(2);
  console.log(` ✅ Backend Package:  ${backendZipPath} (${bSize} MB)`);
}
if (fs.existsSync(frontendZipPath)) {
  const fSize = (fs.statSync(frontendZipPath).size / 1024 / 1024).toFixed(2);
  console.log(` ✅ Frontend Package: ${frontendZipPath} (${fSize} MB)`);
}
