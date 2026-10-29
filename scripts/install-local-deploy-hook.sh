#!/usr/bin/env bash
# Opt in to rebuilding and redeploying the local Docker stack after every successful Git commit.

set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
git -C "$repo_root" config core.hooksPath .githooks
echo "Installed post-commit deployment hook for $repo_root"
echo "Skip one deployment with: OPENGYM_SKIP_LOCAL_DEPLOY=1 git commit ..."
echo "Disable it with: git config --unset core.hooksPath"
