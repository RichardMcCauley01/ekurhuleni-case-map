#!/usr/bin/env bash
# Deploy /workspace/ekurhuleni-case to GitHub Pages.
# NOT RUN YET: the owner wants to review the site first. Run only after review:
#   bash tools/deploy_github_pages.sh            # -> repo ekurhuleni-case-map
# (Routes/crime data are prebuilt; this script only rebuilds data.js + SEO/static text.)
# (public repo, served from branch main, root folder).
# Prerequisite (one time, done by the account owner): gh auth login   (GitHub.com, HTTPS, browser/device login)
# Usage: tools/deploy_github_pages.sh [repo-name]    (default: ekurhuleni-case-map)
# It never force-pushes: it clones the existing repo (if any), syncs files, and commits the changes normally.
set -euo pipefail
REPO="${1:-${REPO:-ekurhuleni-case-map}}"
SITE="$(cd "$(dirname "$0")/.." && pwd)"
gh auth status >/dev/null 2>&1 || { echo "ERROR: GitHub CLI is not logged in. Run: gh auth login"; exit 1; }
OWNER="$(gh api user --jq .login)"
OWNER_LC="$(echo "$OWNER" | tr '[:upper:]' '[:lower:]')"
URL="https://${OWNER_LC}.github.io/${REPO}/"
echo "Deploying to ${OWNER}/${REPO} -> ${URL}"
gh auth setup-git >/dev/null

# 1) rebuild data + static/SEO files with the final URL
python3 "$SITE/tools/build_data.py"
python3 "$SITE/tools/build_static.py" --url "$URL"

# 2) get (or create) the repo
WORK="$(mktemp -d)"
if gh repo view "$OWNER/$REPO" >/dev/null 2>&1; then
  gh repo clone "$OWNER/$REPO" "$WORK/repo" -- --quiet
else
  gh repo create "$OWNER/$REPO" --public --description "Neutral, source-cited case map of the 2026 Ekurhuleni killings of women (static site)" --homepage "$URL"
  mkdir -p "$WORK/repo" && git -C "$WORK/repo" init -q -b main
  git -C "$WORK/repo" remote add origin "https://github.com/$OWNER/$REPO.git"
fi

# 3) sync site files (no screenshots, no node_modules)
python3 - "$SITE" "$WORK/repo" <<'PY'
import os, shutil, sys
src, dst = sys.argv[1], sys.argv[2]
for name in os.listdir(dst):
    if name == '.git': continue
    p = os.path.join(dst, name); shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
keep = ['index.html', 'css', 'js', 'data', 'og-image.png', 'robots.txt', 'sitemap.xml', 'site.json', 'README.md']  # tools/raw (large source workbooks) is not published
keep += [f for f in os.listdir(src) if f.startswith('google') and f.endswith('.html')]   # Search Console file verification
for k in keep:
    s = os.path.join(src, k)
    if os.path.isdir(s): shutil.copytree(s, os.path.join(dst, k))
    elif os.path.exists(s): shutil.copy2(s, os.path.join(dst, k))
os.makedirs(os.path.join(dst, 'tools'), exist_ok=True)
for f in os.listdir(os.path.join(src, 'tools')):
    if f.endswith(('.py', '.sh', '.js')): shutil.copy2(os.path.join(src, 'tools', f), os.path.join(dst, 'tools', f))
open(os.path.join(dst, '.nojekyll'), 'w').close()
PY

# 4) commit + push (normal push, no force)
cd "$WORK/repo"
git add -A
if git diff --cached --quiet; then echo "No changes to deploy."; else
  git -c user.name="$OWNER" -c user.email="${OWNER}@users.noreply.github.com" commit -q -m "Update site $(date +%Y-%m-%d)"
  git push -q -u origin main
fi

# 5) enable Pages (main, /) if not already enabled
if ! gh api "repos/$OWNER/$REPO/pages" >/dev/null 2>&1; then
  gh api -X POST "repos/$OWNER/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null
fi
echo "Waiting for the Pages build..."
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "${URL}robots.txt" || true)
  [ "$code" = "200" ] && break; sleep 10
done
curl -sI "$URL" | head -1
echo "Live: $URL   Sitemap: ${URL}sitemap.xml"
