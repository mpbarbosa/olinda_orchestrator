# Generic Step Registry Helpers

`src/generic_step_registry.ts` contains the collection and requirement-matching helpers that `src/step_registry.ts` re-exports as part of the package API.

## Purpose

This module isolates the reusable, stateless parts of step-registry behavior:

- requirement matching
- grouping by stage or phase
- filtering by tags and enabled status
- exact stage/phase lookup
- natural step-ID sorting
- dependency validation

`src/step_registry.ts` remains the main public entry point for step-definition normalization, error types, and the mutable `StepRegistry` class.

## Exports

### `matchStepRequirements(step, context)`

Checks `files`, `tools`, `config`, and `env` requirements and returns:

```ts
type RequirementMatchResult = {
  met: boolean;
  missing: string[];
};
```

Missing values use the same typed prefixes as the main step-registry API:

- `file:path/to/file`
- `tool:npm`
- `config:key=value`
- `env:CI`

### `groupStepsByStage(steps)` / `groupStepsByPhase(steps)`

- `groupStepsByStage()` buckets steps by `step.stage`
- `groupStepsByPhase()` is a compatibility alias for phase-oriented callers

### `filterStepsByTags(steps, tags)`

Applies an AND match. Every requested tag must be present.

### `filterStepsByEnabled(steps, enabledOnly = true)`

- with `true`, only enabled steps are returned
- with `false`, the original collection is returned unchanged

### `findStepsByStage(steps, stage)` / `findStepsByPhase(steps, phase)`

Return only steps whose stage/phase matches exactly.

### `sortStepsById(steps)`

Returns a new array sorted by the first numeric component in the step ID.

### `validateStepDependencies(steps)`

Checks that every dependency points at an existing step ID in the supplied collection.

Unlike the original inline implementation, this helper tolerates step-shaped objects that omit
`dependencies` and treats them as `[]`, which keeps validation safe for partially normalized input.
