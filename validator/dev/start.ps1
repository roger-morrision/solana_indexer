$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
docker compose -f (Join-Path $PSScriptRoot 'compose.yaml') up -d --build
docker compose -f (Join-Path $PSScriptRoot 'compose.yaml') ps
Write-Host 'Waiting for the local validator...'
for ($attempt = 1; $attempt -le 60; $attempt++) {
  $health = docker inspect --format '{{.State.Health.Status}}' solana-indexer-validator 2>$null
  if ($health -eq 'healthy') { Write-Host 'Local validator is healthy at http://127.0.0.1:8899'; exit 0 }
  if ($health -eq 'unhealthy') { docker logs --tail 100 solana-indexer-validator; throw 'Validator became unhealthy' }
  Start-Sleep -Seconds 2
}
docker logs --tail 100 solana-indexer-validator
throw 'Validator did not become healthy within 120 seconds'
