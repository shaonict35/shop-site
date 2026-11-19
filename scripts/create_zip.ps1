Add-Type -AssemblyName "System.IO.Compression"
Add-Type -AssemblyName "System.IO.Compression.FileSystem"

$sourceDir = "c:\Users\skhan\Desktop\Glowgoodly"
$destinationZip = "c:\Users\skhan\Desktop\Glowgoodly_full_code.zip"

Write-Host "Creating zip archive: $destinationZip ..."

if (Test-Path $destinationZip) {
    Remove-Item $destinationZip -Force
}

$archive = [System.IO.Compression.ZipFile]::Open($destinationZip, [System.IO.Compression.ZipArchiveMode]::Create)

$files = Get-ChildItem -Path $sourceDir -Recurse -File | Where-Object {
    $_.FullName -notmatch '\\node_modules(\\|$)' -and
    $_.FullName -notmatch '\\\.next(\\|$)' -and
    $_.FullName -notmatch '\\\.git(\\|$)' -and
    $_.FullName -notmatch '\\dist(\\|$)' -and
    $_.FullName -notmatch '\\\.tools(\\|$)' -and
    $_.FullName -notmatch '\\\.gemini(\\|$)' -and
    $_.FullName -notmatch '\.zip$' -and
    $_.FullName -notmatch '\.log$'
}

$count = 0
$total = $files.Count

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($sourceDir.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $relativePath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    $count++
    if ($count % 100 -eq 0 -or $count -eq $total) {
        Write-Host "Zipped $count / $total files..."
    }
}

$archive.Dispose()

$zipItem = Get-Item $destinationZip
$zipSizeMb = [math]::Round(($zipItem.Length / 1MB), 2)
Write-Host "=========================================="
Write-Host "ZIP CREATED SUCCESSFULLY!"
Write-Host "Path: $destinationZip"
Write-Host "Size: $zipSizeMb MB ($total files included)"
Write-Host "=========================================="
