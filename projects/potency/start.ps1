$compose = "docker compose -f docker-compose.yml -f docker-compose.dev.yml"

Write-Host "Building services..." -ForegroundColor Cyan
Invoke-Expression "$compose build"
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed." -ForegroundColor Red; exit 1 }

Write-Host "Starting services..." -ForegroundColor Cyan
Invoke-Expression "$compose up -d"
if ($LASTEXITCODE -ne 0) { Write-Host "Startup failed." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Potency is running:" -ForegroundColor Green
Write-Host "  Frontend  http://localhost:3000"
Write-Host "  API       http://localhost:4000"
Write-Host "  MongoDB   localhost:27017"
Write-Host ""
Write-Host "Logs: docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
