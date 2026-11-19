$filePath = 'C:\Users\skhan\Desktop\Glowgoodly\frontend\src\app\valobasa\page.tsx'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Replace specific Mojibake sequences using regex with unicode escapes
$content = $content -replace '\u00F0\u0178\u008E[\u0000-\u00FF]', '🎁'
$content = $content -replace '\u00F0\u0178\u008F\u00B7(\u00EF\u00B8\u008F)?', '🏷️'
$content = $content -replace '\u00F0\u0178\u009B\u008D(\u00EF\u00B8\u008F)?', '🛍️'
$content = $content -replace '\u00F0\u0178\u2013\u00A5(\u00EF\u00B8\u008F)?', '🖥️'
$content = $content -replace '\u00F0\u0178\u2013\u00BC(\u00EF\u00B8\u008F)?', '🖼️'
$content = $content -replace '\u00F0\u0178\u2014\u2018(\u00EF\u00B8\u008F)?', '🗑️'
$content = $content -replace '\u00F0\u0178\u2014\u201C(\u00EF\u00B8\u008F)?', '📅'
$content = $content -replace '\u00E2\u0153\u008F(\u00EF\u00B8\u008F)?', '✏️'
$content = $content -replace '\u00E2\u0153\u2030(\u00EF\u00B8\u008F)?', '✉️'
$content = $content -replace '\u00E2\u2020\u00A9(\u00EF\u00B8\u008F)?', '↩️'
$content = $content -replace '\u00E2\u0161\u2013(\u00EF\u00B8\u008F)?', '⚖️'
$content = $content -replace '\u00E2\u2013\u201C', '–'
$content = $content -replace '\u00E2\u2020\u2014', '↗'
$content = $content -replace '\u00F0\u0178\u201D\u0094', '💔'
$content = $content -replace '\u00F0\u0178\u008F\u2020', '🏆'
$content = $content -replace '\u00F0\u0178\u008F\u0083', '🏃'
$content = $content -replace '\u00E2\u20AC\u2122', "'"
$content = $content -replace '\u00E2\u20AC\u0153', '"'
$content = $content -replace '\u00E2\u20AC\u009D', '"'
$content = $content -replace '\u00EF\u00B8\u008F', ''
$content = $content -replace '\u00C2\u00B7', '·'
$content = $content -replace 'â ³', '⏳'
$content = $content -replace 'â\s', ' '

# Write back
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)

# Check remaining
$remaining = [regex]::Matches($content, '\u00F0\u0178|\u00E2\u0153|\u00E2\u20AC|\u00E2\u2020|\u00E2\u0161|\u00EF\u00B8')
Write-Host "Remaining matches after unicode cleanup: $($remaining.Count)"

