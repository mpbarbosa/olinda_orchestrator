# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Compile TypeScript → dist/
npm run build:watch    # Watch mode
npm run clean          # Remove dist/
npm run lint           # ESLint on src/**/*.ts
npm test               # Run Vitest
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Coverage via v8
npm run test:docker    # Run tests inside Docker
```

To run a single test file:
```bash
npx vitest run src/__tests__/orchestrator.test.ts
```

To release: see `scripts/deploy.sh` — it validates (lint + test + build), commits `dist/`, tags, and pushes.

## Architecture

This is a zero-dependency TypeScript library published to npm. Three source modules form the entire API:

**`src/orchestrator.ts`** — Runtime execution engine. Accepts an array of named steps (`OrchestratorStep[]`), runs them sequentially (all receive the same input), and returns fulfilled/rejected results. Stops on first error by default; pass `stopOnError: false` to continue. `Task`/`TaskResult` are backward-compat aliases.

**`src/step_registry.ts`** — Stateful Map-based registry for step metadata (`StepDefinition`). Normalizes and validates step definitions on registration (throws `StepRegistryValidationError` on failure). Supports filtering by stage, tags, and enabled status; dependency checking; and lifecycle methods. Re-exports all helpers from `generic_step_registry.ts`.

**`src/generic_step_registry.ts`** — Pure utility functions operating on step collections: `matchStepRequirements`, `groupStepsByStage`, `filterStepsByTags`, `sortStepsById`, `validateStepDependencies`, etc.

`src/index.ts` is the single public entry point — all exports flow through it.

## Key Type Distinctions

- `StepDefinitionInput`: loose input shape (accepts `phase`/`stage`, `execute`/`handler` interchangeably)
- `StepDefinition`: normalized internal shape with defaults applied (`stage='default'`, `timeout=300`, `enabled=true`)
- `StepRequirements`: optional constraints on files, tools, config values, and env vars

`validateStepMetadata()` returns errors without throwing; the `create*` methods throw on invalid input. Use the former for dry-run validation.

## Conventions

- Step IDs are free-form but conventionally use `step_00`, `step_10`, etc. for natural sort order.
- `phase` is a legacy alias for `stage`; both are accepted in input but `stage` is canonical internally.
- The `dist/` directory is committed to the repo as part of the release process (jsDelivr CDN delivery).
- Tests live in `src/__tests__/`, use Vitest, and are colocated with the source they test.
- ESLint enforces explicit return types on all non-test functions.
