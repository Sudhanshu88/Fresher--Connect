param(
    [int]$Port = 3000,
    [string]$Hostname = "0.0.0.0"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $repoRoot "frontend"

Push-Location $frontendRoot
try {
    $env:PORT = [string]$Port
    & npm.cmd "run" "dev" "--" "--hostname" $Hostname "--port" ([string]$Port)
} finally {
    Pop-Location
}
