# Script to fix Next.js/Turbopack cache issues
Write-Host "Cleaning Next.js/Turbopack cache..."

# Remove .next folder
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "✓ Deleted .next folder"
} else {
    Write-Host "✗ .next folder not found"
}

# Remove node_modules cache
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✓ Deleted node_modules cache"
} else {
    Write-Host "✗ node_modules cache not found"
}

# Remove Turbopack cache (if exists)
if (Test-Path .turbopack) {
    Remove-Item -Recurse -Force .turbopack
    Write-Host "✓ Deleted .turbopack folder"
} else {
    Write-Host "✗ .turbopack folder not found"
}

Write-Host ""
Write-Host "Cache cleaned! Please restart your dev server with: npm run dev"
Write-Host ""

