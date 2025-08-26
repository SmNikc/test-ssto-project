# Быстрый старт для Windows PowerShell
$env:KEYCLOAK_ENABLED="false"
Set-Location -Path "C:\Projects\test-ssto-project"
docker compose up -d
Start-Process powershell -ArgumentList "-NoExit","-Command","cd .\backend-nest; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd .\frontend; npm run dev"
