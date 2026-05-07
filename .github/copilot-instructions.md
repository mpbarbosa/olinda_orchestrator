# Copilot Guidance for `olinda-orchestrator`

This file provides durable, high-signal guidance for Copilot-assisted development in this repository.
For full project details and implementation specifics, refer to the authoritative docs: `README.md`, `CHANGELOG.md`, `CLAUDE.md`, and `CONTRIBUTING.md`.

## Validation Commands

- Lint: `npm run lint`
- Test: `npm test`
- Build: `npm run build`

## Architecture Boundaries

- Core source modules and the public API are in `src/`.
- Main package entry points: `dist/index.js` (main), `dist/index.d.ts` (types).

## Copilot Guidance Principles

- Focus edits on `src/` for core logic and API changes.
- Route public API changes through the main entry point.
- When uncertain, defer to project conventions and authoritative documentation.
- Prefer referencing authoritative docs over duplicating implementation details.

## Workflow and Runtime Artifacts

- Workflow configuration: `.workflow-config.yaml`
- Runtime artifacts and checkpoints: `.ai_workflow/`
