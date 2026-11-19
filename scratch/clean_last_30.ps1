$filePath = 'C:\Users\skhan\Desktop\Glowgoodly\frontend\src\app\valobasa\page.tsx'
$lines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)

for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ($line -match '\u00F0\u0178|\u00E2\u0153|\u00E2\u20AC|\u00E2\u2020|\u00E2\u0161|\u00EF\u00B8') {
        $line = $line -replace '\u00F0\u0178\u008E\s*', '🎁 '
        $line = $line -replace '\u00F0\u0178\u009B\s*', '🛍️ '
        $line = $line -replace '\u00F0\u0178\u201D\u0094', '💔'
        $line = $line -replace '\u00F0\u0178\u008F\u0083', '🏃'
        $line = $line -replace '💇\u00E2\u20AC\s*\u00E2\u2122\u20AC', '💇‍♀️'
        $line = $line -replace '💇â€.*â™€', '💇‍♀️'
        $lines[$i] = $line
    }
}

[System.IO.File]::WriteAllLines($filePath, $lines, [System.Text.Encoding]::UTF8)
Write-Host "Processed last lines."

