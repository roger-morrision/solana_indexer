param(
  [Parameter(Mandatory = $true)][string]$NodeImage,
  [switch]$Start
)
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$compose = Join-Path $PSScriptRoot 'compose.yaml'
$environment = Join-Path $root 'validator/external-rpc.env'
$env:NODE_IMAGE = $NodeImage
$env:EXTERNAL_RPC_ENV_FILE = $environment
try {
  node (Join-Path $root 'src/reduced-preflight.js')
  if ($LASTEXITCODE -ne 0) { throw 'Reduced-mode configuration preflight failed' }
  docker info --format '{{.ServerVersion}}' | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop daemon is unavailable' }
  docker compose -f $compose config --quiet --no-env-resolution
  if ($LASTEXITCODE -ne 0) { throw 'Reduced-mode Compose validation failed' }
  if (-not $Start) { Write-Host 'Preflight passed; rerun with -Start to build and start exporter/API containers.'; exit 0 }
  docker compose -f $compose up -d --build exporter api
  if ($LASTEXITCODE -ne 0) { throw 'Reduced-mode container startup failed' }
  docker compose -f $compose ps
} finally {
  Remove-Item Env:NODE_IMAGE,Env:EXTERNAL_RPC_ENV_FILE -ErrorAction SilentlyContinue
}
