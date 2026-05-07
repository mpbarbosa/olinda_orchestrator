# Contributing to olinda-orchestrator

## Getting started

```bash
npm install
npm test          # run the test suite
npm run lint      # ESLint
npm run format    # Prettier (write)
npm run build     # compile TypeScript → dist/
```

## Conventions

- **Language**: TypeScript. All source files live in `src/`; tests in `src/__tests__/`.
- **Step IDs**: Use the `step_00`, `step_10` convention for natural sort order.
- **`stage` vs `phase`**: `stage` is canonical. `phase` is a legacy alias accepted on input; do not introduce new `phase` usage.
- **`execute` vs `handler`**: `execute` is canonical. `handler` is a legacy alias; do not introduce new `handler` usage.
- **Linting**: ESLint with `@typescript-eslint/explicit-function-return-type` enforced on all non-test source files.
- **Formatting**: Prettier with the project `.prettierrc`. Run `npm run format` before committing.
- **Tests**: Vitest. Place test files alongside source in `src/__tests__/`.
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
- **`dist/`**: This directory is committed as part of the release process for jsDelivr CDN delivery. Do not edit files in `dist/` directly.

## Release process

See `scripts/deploy.sh`. It validates (lint + test + build), commits `dist/`, tags, and pushes.

## Reporting issues

Open an issue at <https://github.com/mpbarbosa/olinda-orchestrator/issues>.
