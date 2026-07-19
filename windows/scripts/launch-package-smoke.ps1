param([Parameter(Mandatory = $true)][string]$PackageRoot)
$ErrorActionPreference = 'Stop'
$exe = Join-Path $PackageRoot 'Safeparts.exe'
if (-not (Test-Path $exe)) { throw 'Packaged Safeparts.exe was not found.' }
$startedAt = Get-Date
$process = Start-Process $exe -PassThru
try {
    Start-Sleep -Seconds 5
    if ($process.HasExited) {
        Get-WinEvent -FilterHashtable @{ LogName = 'Application'; StartTime = $startedAt.AddSeconds(-2) } -ErrorAction SilentlyContinue |
            Where-Object { $_.Message -like '*Safeparts.exe*' } |
            Select-Object -First 5 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
            Format-List |
            Out-String |
            Write-Output
        throw "Packaged Safeparts exited during launch smoke with code $($process.ExitCode)."
    }
    Write-Output 'Packaged native Windows launch smoke passed.'
}
finally {
    if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force }
}
