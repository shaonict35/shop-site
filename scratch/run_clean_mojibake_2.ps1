$json = Get-Content 'C:\Users\skhan\Desktop\Glowgoodly\scratch\clean_all_mojibake_2.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$filePath = 'C:\Users\skhan\Desktop\Glowgoodly\frontend\src\app\valobasa\page.tsx'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

$applied = 0
foreach ($item in $json) {
    if ($content.Contains($item.from)) {
        $occurrences = ([regex]::Matches($content, [regex]::Escape($item.from))).Count
        $content = $content.Replace($item.from, $item.to)
        $applied += $occurrences
        Write-Host "Replaced '$($item.from)' -> '$($item.to)' ($occurrences times)"
    }
}

Write-Host "Total Mojibake replacements applied in round 2: $applied"
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Host "File saved successfully."

