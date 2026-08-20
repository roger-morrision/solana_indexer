$ErrorActionPreference = 'Stop'
docker compose -f (Join-Path $PSScriptRoot 'compose.yaml') down --volumes
Write-Host 'Removed the development validator and its disposable ledger.'
