$ErrorActionPreference = "Stop"

$manifestSource = Join-Path $PSScriptRoot "manifest.xml"
if (-not (Test-Path $manifestSource)) {
    Write-Error "manifest.xml dosyasi bulunamadi: $manifestSource"
    exit 1
}

$wefDir = Join-Path $env:LOCALAPPDATA "Microsoft\Office\16.0\Wef"
if (-not (Test-Path $wefDir)) {
    New-Item -ItemType Directory -Path $wefDir -Force | Out-Null
}

$destPath = Join-Path $wefDir "sentience-ai-manifest.xml"
Copy-Item -Path $manifestSource -Destination $destPath -Force

Write-Host "Sentience AI Word Eklentisi basariyla yuklendi!" -ForegroundColor Green
Write-Host "Konum: $destPath" -ForegroundColor Cyan
Write-Host "Microsoft Word'u baslatip 'Ekle > Eklentilerim > Paylasilan Klasor / Developer' kismindan kontrol edebilirsiniz." -ForegroundColor Yellow
