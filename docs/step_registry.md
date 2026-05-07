# Step Registry

`src/step_registry.ts` provides the metadata, normalization, validation, and storage layer for orchestrated steps. Its collection-oriented helper functions now live in `src/generic_step_registry.ts` and are re-exported from `src/step_registry.ts`.

## Overview

This module serves two purposes:

1. It exposes **pure helpers** for validating and working with step definitions.
2. It provides the stateful `StepRegistry` class, a mutable wrapper around an internal `Map`.

For the helper-only surface, see [docs/generic_step_registry.md](./generic_step_registry.md).

The registry is generic by design. Stage labels are free-form strings, and the module preserves compatibility with older phase-oriented terminology by aliasing `WorkflowPhase` to `StepStage`.

## Core type model

### `StepStage` and `WorkflowPhase`

```ts
type StepStage = string;
type WorkflowPhase = StepStage;
```

`phase` is a compatibility alias for `stage`. When both are provided in input metadata, they must match.

### `StepRequirements`

```ts
type StepRequirements = {
  files?: string[];
  tools?: string[];
  config?: Record<string, unknown>;
  env?: string[];
};
```

Requirements describe what must exist in a runtime context before a step can run.

### `StepDefinitionInput`

This is the loose input shape accepted by `createStepDefinition()` and by registry write operations.

Important compatibility points:

- `stage` and `phase` are both accepted
- `execute` and `handler` are both accepted
- `registeredAt` and `registered` are both accepted

### `StepDefinition`

This is the normalized internal/output shape used by the registry.

Defaults applied during normalization:

- `stage`: `'default'` when neither `stage` nor `phase` is provided
- `dependencies`: `[]`
- `tags`: `[]`
- `critical`: `false`
- `enabled`: `true` unless explicitly `false`
- `timeout`: `300`
- `requirements`: `{}`
- `metadata.version`: `'1.0.0'`
- `metadata.registeredAt`: `null` unless provided

The normalized executor field is always exposed as `execute`.

## Errors

### `StepRegistryValidationError`

Thrown when step metadata is invalid or when a registry operation targets an invalid or missing step.

Typical cases:

- duplicate registration
- invalid metadata shape
- update/check of a non-existent step

### `StepRegistrySystemError`

Reserved for system-level behavior. It is currently used by the stubbed `loadStepsFromDirectory()` method.

## Validation and normalization helpers

### `validateStepMetadata(metadata)`

```ts
validateStepMetadata(metadata: unknown): string[]
```

Returns a list of validation errors without throwing.

Checks include:

- `id`, `name`, and `description` are required
- `id` must match `^[a-z0-9_]+$`
- `stage` and `phase` must be non-empty strings when present
- `stage` and `phase` must match when both are provided
- `dependencies` and `tags` must be arrays of strings
- `critical` and `enabled` must be booleans
- `timeout` must be a positive number
- `requirements` must be an object
- `execute` and `handler` must be functions when present

### `createStepDefinition(metadata)`

```ts
createStepDefinition(metadata: StepDefinitionInput): StepDefinition
```

Validates the input and returns a normalized `StepDefinition`.

Normalization behavior:

- resolves stage with `stage ?? phase ?? 'default'`
- prefers `execute`, falling back to `handler`
- folds metadata into a single `metadata` object containing `registeredAt` and `version`

If validation fails, it throws `StepRegistryValidationError`.

## Requirement matching

### `matchStepRequirements(step, context)`

```ts
matchStepRequirements(
  step: Pick<StepDefinition, 'requirements'>,
  context?: StepRequirementContext
): RequirementMatchResult
```

Compares a step's requirements against a supplied context.

Returns:

```ts
type RequirementMatchResult = {
  met: boolean;
  missing: string[];
};
```

Missing requirements are reported with typed prefixes:

- `file:path/to/file`
- `tool:git`
- `config:key=value`
- `env:VARIABLE_NAME`

That prefix format is part of the public output contract and is useful for diagnostics.

## Collection helpers

### `groupStepsByStage(steps)`

Buckets steps by `step.stage`.

### `groupStepsByPhase(steps)`

Compatibility alias for `groupStepsByStage()`.

### `filterStepsByTags(steps, tags)`

Applies an **AND match**:

- if `tags` is empty or omitted, all steps are returned
- otherwise, a step must include every requested tag

### `filterStepsByEnabled(steps, enabledOnly = true)`

- with the default `true`, only enabled steps are returned
- with `false`, the input collection is returned unchanged

### `findStepsByStage(steps, stage)`

Returns only steps whose `stage` exactly matches the requested label.

### `findStepsByPhase(steps, phase)`

Compatibility alias for `findStepsByStage()`.

### `sortStepsById(steps)`

Returns a new array sorted by the **first numeric suffix** found in the step ID.

Examples:

- `step_01` sorts before `step_10`
- IDs without digits are treated as `999`

This function does not sort lexicographically.

### `validateStepDependencies(steps)`

Verifies that every declared dependency refers to an existing step ID in the provided collection.

Returns:

```ts
type DependencyValidationResult = {
  valid: boolean;
  errors: string[];
};
```

The function detects missing dependencies, but it does **not** detect cycles or enforce stage ordering.

## `StepRegistry`

`StepRegistry` wraps the helper logic in a mutable store backed by:

- `Map<string, StepDefinition>` for lookup
- `registrationOrder: string[]` to preserve insertion order independently from sorted listing

### `register(stepId, definition)`

```ts
register(stepId: string, definition: Omit<StepDefinitionInput, 'id'>): StepDefinition
```

Registers a new step.

Behavior:

- rejects duplicate IDs
- injects `id: stepId`
- stamps `registeredAt` with `Date.now()`
- stores the normalized step
- appends the ID to registration order

### `update(stepId, updates)`

```ts
update(stepId: string, updates: Partial<StepDefinitionInput>): StepDefinition
```

Updates an existing step by rebuilding it through `createStepDefinition()`.

Behavior:

- preserves the original registration timestamp
- merges extra metadata fields
- allows compatibility inputs such as `phase` and `handler`

### `unregister(stepId)`

Deletes the step from both the internal map and the registration-order list.

Returns `true` if the step existed and was removed.

### `get(stepId)` / `has(stepId)`

- `get()` returns the normalized step or `null`
- `has()` returns a boolean

### `list(filter?)`

```ts
list(filter?: StepListFilter): StepDefinition[]
```

Supports filtering by:

- `stage` or `phase`
- `tags`
- `enabledOnly`

Returned order is always the result of `sortStepsById()`, not insertion order.

### `getByStage()` / `getByPhase()`

Return grouped step maps keyed by stage.

### `getInOrder()`

Returns steps in explicit registration order, preserving insertion sequence rather than numeric ID ordering.

### `validateAll()`

Runs `validateStepDependencies()` across all registered steps.

### `checkRequirements(stepId, context?)`

Looks up the step and delegates to `matchStepRequirements()`.

Throws `StepRegistryValidationError` if the step does not exist.

### `clear()`

Removes all registered steps and resets registration order.

### `getStats()`

Returns:

```ts
type StepRegistryStats = {
  total: number;
  enabled: number;
  disabled: number;
  critical: number;
  byStage: Record<StepStage, number>;
};
```

This is useful for summaries and diagnostics across a configured registry.

### `loadStepsFromDirectory(dir)`

Currently unimplemented and always throws:

```ts
StepRegistrySystemError(`loadStepsFromDirectory not yet implemented: ${dir}`)
```

## Example

```ts
import { StepRegistry } from 'olinda-orchestrator';

const registry = new StepRegistry();

registry.register('step_00', {
  name: 'Analyze',
  description: 'Analyze project state',
  stage: 'prepare',
  tags: ['core'],
  critical: true,
});

registry.register('step_01', {
  name: 'Validate',
  description: 'Validate project state',
  stage: 'validate',
  dependencies: ['step_00'],
  requirements: {
    tools: ['git'],
    files: ['package.json'],
  },
});

const prepareSteps = registry.list({ stage: 'prepare' });
const dependencyCheck = registry.validateAll();
const requirements = registry.checkRequirements('step_01', {
  tools: ['git', 'node'],
  files: ['package.json', 'README.md'],
});
const stats = registry.getStats();
```

## Design notes

- Pure helpers are the canonical logic surface; the class is a wrapper around them.
- Stage and phase are intentionally unified to simplify migration.
- Sorting and insertion order are deliberately separate concepts:
    - `list()` returns numeric ID order
    - `getInOrder()` returns registration order
