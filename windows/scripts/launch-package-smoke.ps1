param([Parameter(Mandatory = $true)][string]$PackageRoot)
$ErrorActionPreference = 'Stop'
$exe = Join-Path $PackageRoot 'Safeparts.exe'
if (-not (Test-Path $exe)) { throw 'Packaged Safeparts.exe was not found.' }
$process = Start-Process $exe -PassThru
try {
    Start-Sleep -Seconds 5
    if ($process.HasExited) { throw "Packaged Safeparts exited during launch smoke with code $($process.ExitCode)." }
    Write-Output 'Packaged native Windows launch smoke passed.'
}
finally {
    if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force }
}
