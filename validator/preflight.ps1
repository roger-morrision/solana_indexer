$ErrorActionPreference = 'Stop'
$minimumRamGB = 512
$minimumFreeDiskGB = 2500
$computer = Get-CimInstance Win32_ComputerSystem
$ramGB = [math]::Round($computer.TotalPhysicalMemory / 1GB)
$freeDiskGB = [math]::Round((Get-PSDrive -Name C).Free / 1GB)
$wslDistros = @(wsl.exe --list --quiet 2>$null | Where-Object { $_.Trim() })
$checks = @(
  [pscustomobject]@{ Check = 'RAM'; Required = "${minimumRamGB} GB"; Actual = "${ramGB} GB"; Pass = $ramGB -ge $minimumRamGB },
  [pscustomobject]@{ Check = 'Free disk'; Required = "${minimumFreeDiskGB} GB across dedicated NVMe volumes"; Actual = "${freeDiskGB} GB on C:"; Pass = $freeDiskGB -ge $minimumFreeDiskGB },
  [pscustomobject]@{ Check = 'Linux'; Required = 'Ubuntu 24.04 bare metal'; Actual = if ($wslDistros.Count) { "WSL: $($wslDistros -join ', ')" } else { 'No WSL distro' }; Pass = $false },
  [pscustomobject]@{ Check = 'Public network'; Required = 'Static public IPv4, >=1 Gbit/s symmetric, not behind NAT'; Actual = 'Manual verification required'; Pass = $false }
)
$checks | Format-Table -AutoSize
if ($checks.Pass -contains $false) { Write-Error 'Host is not production-ready for a mainnet Agave RPC node. Do not bypass this gate.' }
