#!/usr/bin/env bash
# ==============================================================================
# Deploy Script for olinda-orchestrator
# ==============================================================================
# Installs dependencies, validates the package, builds dist/, commits the
# compiled artifacts, creates a version tag, pushes to GitHub, and prints
# jsDelivr + GitHub URLs for the generated files.
#
# Usage:
#   bash scripts/deploy.sh
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${CYAN}[deploy]${NC} $*"; }
success() { echo -e "${GREEN}[deploy] ✓${NC} $*"; }
warn()    { echo -e "${YELLOW}[deploy] ⚠${NC} $*"; }
error()   { echo -e "${RED}[deploy] ✗${NC} $*" >&2; }
fail()    { error "$*"; exit 1; }

command -v git >/dev/null 2>&1 || fail "git not found on PATH."
command -v npm >/dev/null 2>&1 || fail "npm not found on PATH."
command -v node >/dev/null 2>&1 || fail "node not found on PATH."

ORIGIN_URL="$(git remote get-url origin 2>/dev/null || true)"
CURRENT_BRANCH="$(git branch --show-current)"
PACKAGE_NAME="$(node -p "require('./package.json').name")"
PACKAGE_VERSION="$(node -p "require('./package.json').version")"
PACKAGE_MAIN="$(node -p "require('./package.json').main || 'dist/index.js'")"
PACKAGE_TYPES="$(node -p "require('./package.json').types || ''")"
TAG="v${PACKAGE_VERSION}"

if [[ -z "${ORIGIN_URL}" ]]; then
  fail "Git remote 'origin' is not configured."
fi

if [[ -z "${CURRENT_BRANCH}" ]]; then
  fail "Could not determine current git branch (detached HEAD?)."
fi

REPO_SLUG="$(
  ORIGIN_URL="${ORIGIN_URL}" node <<'EOF'
const originUrl = process.env.ORIGIN_URL ?? '';
const normalized = originUrl.replace(/\.git$/, '');
let match = normalized.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+)$/);
if (!match) {
  match = normalized.match(/^git@github\.com:([^/]+\/[^/]+)$/);
}
if (!match) {
  process.exit(1);
}
process.stdout.write(match[1]);
EOF
)"

if [[ -z "${REPO_SLUG}" ]]; then
  fail "Could not derive the GitHub owner/repo from origin: ${ORIGIN_URL}"
fi

if [[ -n "$(git status --porcelain)" ]]; then
  fail "Working tree is not clean. Commit or stash your changes before deploying."
fi

if git rev-parse --verify --quiet "refs/tags/${TAG}" >/dev/null; then
  fail "Git tag ${TAG} already exists."
fi

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   olinda-orchestrator  ·  Deploy          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""
info "Project root : ${PROJECT_ROOT}"
info "Repository   : ${REPO_SLUG}"
info "Branch       : ${CURRENT_BRANCH}"
info "Version      : ${PACKAGE_VERSION}"
info "Git tag      : ${TAG}"
echo ""

info "Step 1/5 — Syncing with origin/${CURRENT_BRANCH} …"
git pull --rebase origin "${CURRENT_BRANCH}"
git fetch origin --tags
success "Repository is up to date"
echo ""

info "Step 2/5 — Installing dependencies …"
npm ci --prefer-offline --no-audit
success "Dependencies installed"
echo ""

info "Step 3/5 — Running lint and tests …"
npm run lint
npm test
success "Validation passed"
echo ""

info "Step 4/5 — Building dist/ …"
npm run build
[[ -f "${PACKAGE_MAIN}" ]] || fail "Expected build artifact not found: ${PACKAGE_MAIN}"
if [[ -n "${PACKAGE_TYPES}" ]]; then
  [[ -f "${PACKAGE_TYPES}" ]] || fail "Expected type declaration not found: ${PACKAGE_TYPES}"
fi
success "Build complete"
echo ""

info "Step 5/5 — Publishing artifacts to GitHub …"
git add -f dist/

if git diff --cached --quiet; then
  warn "Build artifacts unchanged — no deploy commit created"
else
  git commit -m "chore: build artifacts for ${TAG}

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
  success "Committed build artifacts"
fi

git tag "${TAG}"
git push origin "${CURRENT_BRANCH}"
git push origin "${TAG}"
success "Pushed branch and tag to GitHub"
echo ""

JSDL_BRANCH_BASE="https://cdn.jsdelivr.net/gh/${REPO_SLUG}@${CURRENT_BRANCH}"
JSDL_TAG_BASE="https://cdn.jsdelivr.net/gh/${REPO_SLUG}@${TAG}"
RAW_BRANCH_BASE="https://raw.githubusercontent.com/${REPO_SLUG}/${CURRENT_BRANCH}"
RAW_TAG_BASE="https://raw.githubusercontent.com/${REPO_SLUG}/${TAG}"

info "jsDelivr CDN URLs:"
echo ""
echo -e "  ${GREEN}Latest (${CURRENT_BRANCH})${NC}"
echo "    ${JSDL_BRANCH_BASE}/${PACKAGE_MAIN}"
if [[ -n "${PACKAGE_TYPES}" ]]; then
  echo "    ${JSDL_BRANCH_BASE}/${PACKAGE_TYPES}"
fi
echo ""
echo -e "  ${GREEN}Pinned (${TAG})${NC}"
echo "    ${JSDL_TAG_BASE}/${PACKAGE_MAIN}"
if [[ -n "${PACKAGE_TYPES}" ]]; then
  echo "    ${JSDL_TAG_BASE}/${PACKAGE_TYPES}"
fi
echo ""

info "GitHub raw URLs:"
echo ""
echo -e "  ${GREEN}Latest (${CURRENT_BRANCH})${NC}"
echo "    ${RAW_BRANCH_BASE}/${PACKAGE_MAIN}"
if [[ -n "${PACKAGE_TYPES}" ]]; then
  echo "    ${RAW_BRANCH_BASE}/${PACKAGE_TYPES}"
fi
echo ""
echo -e "  ${GREEN}Pinned (${TAG})${NC}"
echo "    ${RAW_TAG_BASE}/${PACKAGE_MAIN}"
if [[ -n "${PACKAGE_TYPES}" ]]; then
  echo "    ${RAW_TAG_BASE}/${PACKAGE_TYPES}"
fi
echo ""

success "Deployment metadata for ${PACKAGE_NAME}@${PACKAGE_VERSION} is ready."
