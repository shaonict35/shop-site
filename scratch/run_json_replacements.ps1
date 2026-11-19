$json = Get-Content 'C:\Users\skhan\Desktop\Glowgoodly\scratch\replacements.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$targetPath = 'C:\Users\skhan\Desktop\Glowgoodly\frontend\src\app\valobasa\page.tsx'
$content = [System.IO.File]::ReadAllText($targetPath, [System.Text.Encoding]::UTF8)

$applied = 0
foreach ($item in $json) {
    if ($content.Contains($item.from)) {
        $content = $content.Replace($item.from, $item.to)
        $applied++
    }
}
Write-Host "Applied $applied exact phrase replacements."

# Currency replacement: replace à§³ and ৳ with Tk 
$content = $content.Replace('à§³', 'Tk ')
$content = $content.Replace('৳', 'Tk ')

[System.IO.File]::WriteAllText($targetPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "File saved successfully."

