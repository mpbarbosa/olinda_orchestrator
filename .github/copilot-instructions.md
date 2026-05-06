# Copilot Guidance for `olinda-orchestrator`

This file provides durable, high-signal guidance for Copilot-assisted development in this repository. For full project details and usage, see the authoritative [README.md](../README.md).

## Validation Commands

- Lint: `npm run lint`
- Test: `npm test`
- Build: `npm run build`

## Architecture Boundaries

- Core source modules and the public API are in `src/`.
- The main package entry point is `dist/index.js` (main) and `dist/index.d.ts` (types).
- For package description and usage, refer to the [README.md](../README.md).

## Copilot Guidance Principles

- Focus edits on `src/` for core logic and API changes.
- Route public API changes through the main entry point.
- When uncertain, defer to project conventions and authoritative documentation.
- Do not duplicate implementation details or status snapshots here; reference the README or source files instead.

## Workflow and Runtime Artifacts

- For workflow configuration, see `.workflow-config.yaml`.
- For runtime artifacts and checkpoints, see `.ai_workflow/`.
