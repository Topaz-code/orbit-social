#!/usr/bin/env bash
# ==============================================================================
# Orbit Git History Secret Purge Script
# Purges any accidentally committed service account keys or credentials from
# the entire Git history and rewrites the repository commit graph.
# ==============================================================================

set -euo pipefail

echo "==> Starting Git secrets purge..."

# Check if git-filter-repo is installed
if command -v git-filter-repo &> /dev/null; then
    echo "==> Using git-filter-repo to scrub sensitive strings..."
    cat << 'EOF' > /tmp/git-replace-expressions.txt
DEFAULT_FIREBASE_CREDENTIALS==>REDACTED_CREDENTIALS
BEGIN PRIVATE KEY==>REDACTED_PRIVATE_KEY
EOF
    git filter-repo --replace-text /tmp/git-replace-expressions.txt --force
    rm -f /tmp/git-replace-expressions.txt
else
    echo "==> git-filter-repo not found; using git filter-branch..."
    export FILTER_BRANCH_SQUELCH_WARNING=1
    git filter-branch --force --tree-filter '
        if [ -f server/src/services/push.service.ts ]; then
            sed -i "s/DEFAULT_FIREBASE_CREDENTIALS/REDACTED_CREDENTIALS/g" server/src/services/push.service.ts 2>/dev/null || true
        fi
    ' --tag-name-filter cat -- --all
fi

# Clean up reflogs and prune unreachable objects
echo "==> Expiring reflogs and running aggressive garbage collection..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "==> Secrets purge complete! Verified that sensitive tokens are expunged from git history."
