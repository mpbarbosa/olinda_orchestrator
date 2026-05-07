# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-05-06

### Added
- `generic_step_registry.ts`: new module of pure utility functions extracted from `step_registry.ts`,
  providing `matchStepRequirements`, `groupStepsByStage`, `filterStepsByTags`, `sortStepsById`,
  `validateStepDependencies`, and related helpers; all re-exported from `step_registry.ts`.
- Comprehensive test suite for `generic_step_registry.ts` in `src/__tests__/generic_step_registry.test.ts`.
- `docs/generic_step_registry.md`: API reference for the new generic utility module.
- `scripts/run-tests-docker.sh`: Docker-based test runner script for CI isolation.

### Changed
- `step_registry.ts`: refactored to delegate pure collection utilities to `generic_step_registry.ts`;
  public API unchanged.
- `.workflow-config.yaml`: switched `project.kind` from `typescript_library` to `generic` and
  added `config_files`, `artifact_dir`, and `test` directory entries for improved automation.
- `README.md`: documentation updates reflecting the new module structure.

## [0.2.1] - 2026-05-06

### Added
- `StepDefinition`, `StepDefinitionInput`, and `StepRequirements` type exports from `step_registry.ts`.
- `validateStepMetadata()` helper for dry-run validation without throwing.
- Dependency checking and lifecycle methods on `StepRegistry`.

### Changed
- `orchestrator.ts`: `Task`/`TaskResult` are now backward-compat aliases for `OrchestratorStep`/`OrchestratorStepResult`.
- Updated CI/CD and docs configuration.

## [0.2.0] - 2026-04-15

### Added
- `step_registry.ts`: stateful Map-based registry for step metadata with filtering, tag support,
  and `StepRegistryValidationError` on invalid registration.
- `src/index.ts` as single public entry point for all exports.

### Changed
- `orchestrator.ts`: `stopOnError` option added; steps receive the same input object.

## [0.1.0] - 2026-04-01

### Added
- Initial TypeScript library scaffold: `orchestrator.ts`, `index.ts`.
- Vitest test suite, ESLint configuration, and `tsconfig.json`.
- `scripts/deploy.sh` for validated release workflow.

[Unreleased]: https://github.com/mpbarbosa/olinda_orchestrator/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/mpbarbosa/olinda_orchestrator/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/mpbarbosa/olinda_orchestrator/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/mpbarbosa/olinda_orchestrator/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mpbarbosa/olinda_orchestrator/releases/tag/v0.1.0
