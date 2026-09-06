# ==============================================================================
# Orbit Git History Secret Purge Script (PowerShell for Windows)
# ==============================================================================

Write-Host "==> Starting Git secrets purge..." -ForegroundColor Cyan

$env:FILTER_BRANCH_SQUELCH_WARNING = "1"

# Scrub occurrences in git history
git filter-branch --force --tree-filter '
    if [ -f server/src/services/push.service.ts ]; then
        sed -i "s/DEFAULT_FIREBASE_CREDENTIALS/REDACTED_CREDENTIALS/g" server/src/services/push.service.ts 2>/dev/null || true
    fi
' --tag-name-filter cat -- --all

Write-Host "==> Expiring reflogs and pruning unreferenced blobs..." -ForegroundColor Cyan
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host "==> Git secrets purge complete!" -ForegroundColor Green
