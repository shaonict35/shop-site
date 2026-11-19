Add-Type -AssemblyName System.IO.Compression.FileSystem
$ProgressPreference = 'SilentlyContinue'

$root = "c:\Users\skhan\Desktop\Glowgoodly"
Set-Location $root

Write-Host "Starting GlowGoodly Production Deployment Packaging..." -ForegroundColor Cyan

# ==============================================================================
# 1. PACKAGE BACKEND (deploy-api-backend.zip)
# ==============================================================================
Write-Host "Preparing deploy-api-backend.zip..." -ForegroundColor Yellow

$backendStaging = Join-Path $root "deploy_staging_backend"
if (Test-Path $backendStaging) { Remove-Item $backendStaging -Recurse -Force }
New-Item -ItemType Directory -Path $backendStaging -Force | Out-Null

# Copy required production backend files
Copy-Item (Join-Path $root "backend\app.js") -Destination $backendStaging -Force
Copy-Item (Join-Path $root "backend\package.json") -Destination $backendStaging -Force
if (Test-Path (Join-Path $root "backend\package-lock.json")) {
    Copy-Item (Join-Path $root "backend\package-lock.json") -Destination $backendStaging -Force
}
if (Test-Path (Join-Path $root "backend\.htaccess")) {
    Copy-Item (Join-Path $root "backend\.htaccess") -Destination $backendStaging -Force
}

# Production .env (from .env.production)
$envProdSource = Join-Path $root "backend\.env.production"
if (-not (Test-Path $envProdSource)) { $envProdSource = Join-Path $root "backend\.env" }
Copy-Item $envProdSource -Destination (Join-Path $backendStaging ".env") -Force

# Public folder
$publicSource = Join-Path $root "backend\public"
if (Test-Path $publicSource) {
    Copy-Item $publicSource -Destination (Join-Path $backendStaging "public") -Recurse -Force
}

# Uploads folder
$uploadsSource = Join-Path $root "backend\uploads"
if (Test-Path $uploadsSource) {
    Copy-Item $uploadsSource -Destination (Join-Path $backendStaging "uploads") -Recurse -Force
} else {
    New-Item -ItemType Directory -Path (Join-Path $backendStaging "uploads") -Force | Out-Null
}

# Prisma folder (only schema.prisma, strictly excluding any *.db files)
$prismaStaging = Join-Path $backendStaging "prisma"
New-Item -ItemType Directory -Path $prismaStaging -Force | Out-Null
Copy-Item (Join-Path $root "backend\prisma\schema.prisma") -Destination $prismaStaging -Force

# For cPanel MySQL production, ensure provider is mysql
$stagedSchema = Join-Path $prismaStaging "schema.prisma"
$schemaContent = [System.IO.File]::ReadAllText($stagedSchema, [System.Text.Encoding]::UTF8)
$schemaContent = $schemaContent -replace 'provider\s*=\s*"sqlite"', 'provider = "mysql"'
[System.IO.File]::WriteAllText($stagedSchema, $schemaContent, [System.Text.Encoding]::UTF8)

# Copy tsconfig.json and src (so cPanel can run npm run build or ts-node cleanly)
if (Test-Path (Join-Path $root "backend\tsconfig.json")) {
    Copy-Item (Join-Path $root "backend\tsconfig.json") -Destination $backendStaging -Force
}
$srcSource = Join-Path $root "backend\src"
if (Test-Path $srcSource) {
    Copy-Item $srcSource -Destination (Join-Path $backendStaging "src") -Recurse -Force
}

# Dist folder (compiled JavaScript if built)
$distSource = Join-Path $root "backend\dist"
if (Test-Path $distSource) {
    Copy-Item $distSource -Destination (Join-Path $backendStaging "dist") -Recurse -Force
} else {
    $distStaging = Join-Path $backendStaging "dist"
    New-Item -ItemType Directory -Path $distStaging -Force | Out-Null
}

# Remove any SQLite .db files that might have been copied
Get-ChildItem -Path $backendStaging -Recurse -Filter "*.db*" | Remove-Item -Force -ErrorAction SilentlyContinue

# Compress Backend ZIP
$backendZipPath = Join-Path $root "deploy-api-backend.zip"
if (Test-Path $backendZipPath) { Remove-Item $backendZipPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($backendStaging, $backendZipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Remove-Item $backendStaging -Recurse -Force

Write-Host "deploy-api-backend.zip successfully created!" -ForegroundColor Green

# ==============================================================================
# 2. PACKAGE FRONTEND (deploy-shop-frontend.zip)
# ==============================================================================
Write-Host "Preparing deploy-shop-frontend.zip..." -ForegroundColor Yellow

$frontendStaging = Join-Path $root "deploy_staging_frontend"
if (Test-Path $frontendStaging) { Remove-Item $frontendStaging -Recurse -Force }
New-Item -ItemType Directory -Path $frontendStaging -Force | Out-Null

# Copy static assets from public/
$frontendPublic = Join-Path $root "frontend\public"
if (Test-Path $frontendPublic) {
    Copy-Item "$frontendPublic\*" -Destination $frontendStaging -Recurse -Force
}

# Copy .htaccess
$htaccessPath = Join-Path $frontendPublic ".htaccess"
if (Test-Path $htaccessPath) {
    Copy-Item $htaccessPath -Destination $frontendStaging -Force
}

# Copy compiled static / out / dist files if available
$frontendOut = Join-Path $root "frontend\out"
if (Test-Path $frontendOut) {
    Copy-Item "$frontendOut\*" -Destination $frontendStaging -Recurse -Force
}

# Compress Frontend ZIP
$frontendZipPath = Join-Path $root "deploy-shop-frontend.zip"
if (Test-Path $frontendZipPath) { Remove-Item $frontendZipPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($frontendStaging, $frontendZipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Remove-Item $frontendStaging -Recurse -Force

Write-Host "deploy-shop-frontend.zip successfully created!" -ForegroundColor Green
Write-Host "Both deployment packages are ready in the root workspace!" -ForegroundColor Cyan
