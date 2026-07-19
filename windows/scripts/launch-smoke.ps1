$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$exe = Get-ChildItem (Join-Path $root 'windows/Safeparts.App/bin') -Recurse -Filter 'Safeparts.App.exe' |
    Where-Object { $_.FullName -match 'Release' -and $_.FullName -match 'win-x64' } |
    Select-Object -First 1
if (-not $exe) { throw 'Built Safeparts.App.exe was not found.' }
$bridge = Join-Path $root 'target/debug/safeparts_uniffi.dll'
if (-not (Test-Path $bridge)) { throw 'Built safeparts_uniffi.dll was not found.' }
Copy-Item $bridge (Join-Path $exe.DirectoryName 'safeparts_uniffi.dll') -Force
$process = Start-Process $exe.FullName -PassThru
try {
    Start-Sleep -Seconds 5
    if ($process.HasExited) { throw "Safeparts exited during launch smoke with code $($process.ExitCode)." }
    Write-Output 'Native Windows launch smoke passed.'
}
finally {
    if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force }
}
