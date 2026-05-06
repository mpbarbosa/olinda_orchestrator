# Copilot Guidance for `olinda-orchestrator`

This file provides durable, high-signal guidance for Copilot-assisted development in this repository. For full project details, see the authoritative [README.md](../README.md).

## Validation Commands

- Lint: `npm run lint`
- Test: `npm test`
- Build: `npm run build`

## Architecture Boundaries

- The primary source modules and public API are located in `src/`.
- The main package entry point is exposed via `dist/index.js` (main) and `dist/index.d.ts` (types).
- Refer to the README for the latest package description and usage.

## Copilot Guidance Principles

- Focus edits on `src/` for core logic and API changes.
- Keep public API changes wired through the main entry point.
- When in doubt, prefer durable, project-specific conventions and defer to authoritative documentation.
- Avoid duplicating implementation details or status snapshots in this file; reference the README or source as needed.

For workflow configuration and runtime artifacts, see `.workflow-config.yaml` and `.ai_workflow/`.
