param(
  [string]$Repo = "MIST-BEN/kaoyan-study-site"
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

Write-Step "Checking local git repository"
git rev-parse --is-inside-work-tree | Out-Null
$branch = (git branch --show-current).Trim()
if ($branch -ne "main") {
  Write-Host "Current branch is '$branch'. Switching is not automatic; publish from main for GitHub Pages." -ForegroundColor Yellow
}

Write-Step "Checking GitHub CLI"
$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
  Write-Host "GitHub CLI (gh) is not installed." -ForegroundColor Yellow
  Write-Host "Create https://github.com/$Repo as a public empty repository, then run:"
  Write-Host "  git push -u origin main"
  Write-Host "After the push, open repository Settings > Pages and publish from main / root."
  exit 1
}

Write-Step "Checking GitHub authentication"
try {
  gh auth status | Out-Host
} catch {
  Write-Host "Run 'gh auth login' first, then run this script again." -ForegroundColor Yellow
  exit 1
}

Write-Step "Ensuring remote"
$remote = ""
try {
  $remote = (git remote get-url origin).Trim()
} catch {
  $remote = ""
}
if (-not $remote) {
  git remote add origin "https://github.com/$Repo.git"
}

Write-Step "Ensuring GitHub repository"
gh repo view $Repo | Out-Null
if ($LASTEXITCODE -ne 0) {
  gh repo create $Repo --public --source . --remote origin
}

Write-Step "Pushing main"
git push -u origin main

Write-Step "Enabling GitHub Pages"
$pagesExists = $false
try {
  gh api "repos/$Repo/pages" | Out-Null
  $pagesExists = $true
} catch {
  $pagesExists = $false
}

if ($pagesExists) {
  gh api -X PUT "repos/$Repo/pages" -f "source[branch]=main" -f "source[path]=/" | Out-Null
} else {
  gh api -X POST "repos/$Repo/pages" -f "source[branch]=main" -f "source[path]=/" | Out-Null
}

Write-Host ""
Write-Host "Published. Site URL should become available shortly:" -ForegroundColor Green
Write-Host "https://MIST-BEN.github.io/kaoyan-study-site/"
