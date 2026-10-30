$ErrorActionPreference = "Stop"

$manifestSource = Join-Path $PSScriptRoot "manifest.xml"
if (-not (Test-Path $manifestSource)) {
    Write-Error "manifest.xml dosyasi bulunamadi: $manifestSource"
    exit 1
}

$appDataDir = Join-Path $env:LOCALAPPDATA "SentienceAI\WordAddin"
if (-not (Test-Path $appDataDir)) {
    New-Item -ItemType Directory -Path $appDataDir -Force | Out-Null
}
$manifestDest = Join-Path $appDataDir "manifest.xml"
Copy-Item -Path $manifestSource -Destination $manifestDest -Force

$wefDir = Join-Path $env:LOCALAPPDATA "Microsoft\Office\16.0\Wef"
if (-not (Test-Path $wefDir)) {
    New-Item -ItemType Directory -Path $wefDir -Force | Out-Null
}

Copy-Item -Path $manifestSource -Destination (Join-Path $wefDir "manifest.xml") -Force
Copy-Item -Path $manifestSource -Destination (Join-Path $wefDir "sentience-ai-manifest.xml") -Force
Copy-Item -Path $manifestSource -Destination (Join-Path $wefDir "b720b571-081b-4e38-a7f7-9d6031a56ce2.xml") -Force

$devKeyPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer"
if (Test-Path $devKeyPath) {
    Remove-ItemProperty -Path $devKeyPath -Name "{b720b571-081b-4e38-a7f7-9d6031a56ce2}" -ErrorAction SilentlyContinue
}

$drive = $appDataDir.Substring(0, 1).ToLower()
$uncPath = "\\localhost\" + $drive + "$" + $appDataDir.Substring(2)
$catKeyPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\{B720B571-081B-4E38-A7F7-9D6031A56CE2}"
if (-not (Test-Path $catKeyPath)) {
    New-Item -Path $catKeyPath -Force | Out-Null
}
Set-ItemProperty -Path $catKeyPath -Name "Id" -Value "{B720B571-081B-4E38-A7F7-9D6031A56CE2}" -Force
Set-ItemProperty -Path $catKeyPath -Name "Url" -Value $uncPath -Force
Set-ItemProperty -Path $catKeyPath -Name "Flags" -Value 1 -Type DWord -Force

try {
    $policyKeyPath = "HKCU:\Software\Policies\Microsoft\Office\16.0\WEF\TrustedCatalogs\Catalog01"
    if (-not (Test-Path $policyKeyPath)) {
        New-Item -Path $policyKeyPath -Force | Out-Null
    }
    Set-ItemProperty -Path $policyKeyPath -Name "url" -Value $uncPath -Force
    Set-ItemProperty -Path $policyKeyPath -Name "flags" -Value 1 -Type DWord -Force
} catch { }

Write-Host "Sentience AI Word Eklentisi basariyla kuruldu!" -ForegroundColor Green
Write-Host "Konum: $manifestDest" -ForegroundColor Cyan
Write-Host "Microsoft Word uygulamasinda: Ekle -> Eklentilerim kismindan eklentiyi baslatabilirsiniz." -ForegroundColor Yellow
