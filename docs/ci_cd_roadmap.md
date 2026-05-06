# CI/CD Roadmap

This roadmap takes `olinda-orchestrator` from local validation and manual deployment to a complete, auditable CI/CD workflow for GitHub, jsDelivr, and npm.

## Current State

- Local validation exists via `npm run lint`, `npm test`, and `npm run build`
- Docker-based test execution exists via `npm run test:docker`
- Deployment metadata is generated locally via `scripts/deploy.sh`
- No GitHub Actions workflows are configured yet

## Roadmap

| Phase | Goal | Deliverables |
|---|---|---|
| 1. Baseline CI | Validate every pull request and push | `.github/workflows/ci.yml` running `npm ci`, `npm run lint`, `npm test`, and `npm run build` on Node 20 and 22; branch protection requiring CI to pass |
| 2. Quality Signals | Make failures easier to diagnose | Coverage upload, test summaries, dependency caching, and concurrency cancellation for superseded runs |
| 3. Release Hygiene | Standardize versioned releases | Tag-based release workflow for `v*`; clean checkout, rebuild `dist/`, generate release notes, and publish a GitHub Release |
| 4. CDN Delivery | Make GitHub and jsDelivr deployment reproducible in CI | Move the essential `scripts/deploy.sh` flow into a workflow that tags, pushes `dist/`, and publishes pinned jsDelivr and GitHub raw URLs as release outputs or artifacts |
| 5. npm Publish | Add package registry delivery | Publish workflow using `NPM_TOKEN`, gated by version tags or manual dispatch; reuse `prepublishOnly` checks and optionally enable npm provenance |
| 6. Security and Maintenance | Reduce supply-chain and automation risk | Dependabot for npm and GitHub Actions, CodeQL or an explicit `npm audit` policy, secret scanning, and pinned action SHAs |
| 7. Operational Safety | Prevent bad or accidental releases | Protected `main`, required reviews, deployment environments with approvals, manual `workflow_dispatch` for production publish, and rollback guidance |
| 8. Developer UX | Keep local and CI flows aligned | README updates, status badges, release-process documentation, and contributor guidance for tagging and publishing |

## Recommended Implementation Order

1. Add baseline CI for pull requests and pushes.
2. Add a tag-driven GitHub Release workflow.
3. Add protected npm publishing.
4. Add security, maintenance, and release hardening.

## Target End State

- Every pull request is linted, tested, and built automatically.
- Every version tag creates a GitHub Release and publishes CDN-ready artifacts.
- npm publishing is automated, protected, and reproducible.
- Releases are auditable and no longer depend on a maintainer's local machine.
