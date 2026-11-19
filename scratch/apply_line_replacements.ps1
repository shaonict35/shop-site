$json = Get-Content 'C:\Users\skhan\Desktop\Glowgoodly\scratch\line_replacements.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$filePath = 'C:\Users\skhan\Desktop\Glowgoodly\frontend\src\app\valobasa\page.tsx'
$lines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)

$count = 0
foreach ($item in $json) {
    $idx = [int]$item.line - 1
    if ($idx -ge 0 -and $idx -lt $lines.Length) {
        $lines[$idx] = [string]$item.text
        $count++
    }
}
Write-Host "Updated $count lines."

[System.IO.File]::WriteAllLines($filePath, $lines, [System.Text.Encoding]::UTF8)
Write-Host "File successfully written."

