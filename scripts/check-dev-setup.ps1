$ErrorActionPreference = 'Stop'

function Get-CommandVersion {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CommandName,
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  $command = Get-Command $CommandName -ErrorAction SilentlyContinue
  if (-not $command) {
    return $null
  }

  try {
    $output = & $CommandName @Arguments 2>$null | Select-Object -First 1
    if ($null -eq $output) {
      return '(installed, no version output)'
    }

    return ($output | Out-String).Trim()
  }
  catch {
    return '(installed, version check failed)'
  }
}

function Write-StatusLine {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,
    [Parameter(Mandatory = $false)]
    [string]$Value
  )

  if ($Value) {
    Write-Host ("[ok] {0}: {1}" -f $Label, $Value)
  }
  else {
    Write-Host ("[missing] {0}" -f $Label)
  }
}

$checks = @(
  @{ Label = 'git'; Command = 'git'; Arguments = @('--version'); RequiredForWeb = $true },
  @{ Label = 'node'; Command = 'node'; Arguments = @('-v'); RequiredForWeb = $true },
  @{ Label = 'npm'; Command = 'npm'; Arguments = @('-v'); RequiredForWeb = $true },
  @{ Label = 'pnpm'; Command = 'pnpm'; Arguments = @('-v'); RequiredForWeb = $true },
  @{ Label = 'rustup'; Command = 'rustup'; Arguments = @('--version'); RequiredForWeb = $false },
  @{ Label = 'cargo'; Command = 'cargo'; Arguments = @('--version'); RequiredForWeb = $false }
)

$missingRequired = @()
$missingOptional = @()

Write-Host 'planner-app dev setup check'
Write-Host ''

foreach ($check in $checks) {
  $version = Get-CommandVersion -CommandName $check.Command -Arguments $check.Arguments
  Write-StatusLine -Label $check.Label -Value $version

  if (-not $version) {
    if ($check.RequiredForWeb) {
      $missingRequired += $check.Label
    }
    else {
      $missingOptional += $check.Label
    }
  }
}

Write-Host ''

if (Test-Path node_modules) {
  Write-Host '[info] Root node_modules exists.'
}
else {
  Write-Host '[info] Root node_modules is missing. Run pnpm install after installing Node and pnpm.'
}

if (Test-Path 'apps\desktop\node_modules') {
  Write-Host '[info] apps\desktop\node_modules exists.'
}

Write-Host ''

if ($missingRequired.Count -eq 0) {
  Write-Host '[ready] Web development prerequisites are installed.'
  Write-Host 'Next commands: pnpm install, pnpm typecheck, pnpm test, pnpm dev:web'
}
else {
  Write-Host ('[action] Missing web prerequisites: {0}' -f ($missingRequired -join ', '))
  Write-Host 'Install Git for Windows, Node.js 20+, and pnpm 9+, then run this script again.'
}

if ($missingOptional.Count -eq 0) {
  Write-Host '[ready] Rust prerequisites are installed for server-rust/desktop work.'
}
else {
  Write-Host ('[optional] Missing Rust/Tauri prerequisites: {0}' -f ($missingOptional -join ', '))
  Write-Host 'You only need these if you plan to run apps/server-rust or apps/desktop.'
}

if ($missingRequired.Count -gt 0) {
  exit 1
}
