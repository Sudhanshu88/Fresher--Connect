param(
    [int]$Port = 5000
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repoRoot "backend"
$venvPython = Join-Path $backendRoot ".venv\Scripts\python.exe"
$pythonCommand = if (Test-Path $venvPython) { $venvPython } else { "python" }

Push-Location $backendRoot
try {
    $env:PORT = [string]$Port
    & $pythonCommand "server.py"
} finally {
    Pop-Location
}
