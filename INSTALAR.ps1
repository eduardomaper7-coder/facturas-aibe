Write-Host "Instalando Facturas AIBE..." -ForegroundColor Cyan

if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Ejecuta este archivo desde la carpeta del proyecto." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "Se ha creado .env.local. Debes rellenar las claves de Supabase." -ForegroundColor Yellow
}

npm install

Write-Host ""
Write-Host "Instalación terminada." -ForegroundColor Green
Write-Host "Edita .env.local y después ejecuta: npm run dev"
