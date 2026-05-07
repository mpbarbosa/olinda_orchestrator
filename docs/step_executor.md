# Step Executor

`src/step_executor.ts` ports the richer step-execution runtime from `ai_workflow.js` into `olinda-orchestrator`. It combines pure helper functions with a stateful `StepExecutor` class that adds timeout handling, retry logic, validation, event emission, and execution history.

## Overview

This module follows the same split as the source implementation:

- **Pure helpers** for validation, timeout calculation, retry decisions, result formatting, and context shaping
- **`StepExecutor` class** for the side-effecting runtime that executes handlers, emits progress events, and keeps history

At the package barrel level, the class is exported as **`WorkflowStepExecutor`** so it does not collide with the existing `StepExecutor<TInput, TOutput>` function type exported by `src/orchestrator.ts`.

## Exports

### Pure helpers

- `validateStepInput(input, schema?)`
- `validateStepOutput(output, schema?)`
- `calculateTimeout(step, baseTimeout?)`
- `shouldRetryStep(error, attempt, maxRetries?)`
- `calculateRetryDelay(attempt, baseDelay?)`
- `formatStepResult(step, execution)`
- `createExecutionContext(step, globalContext?, previousResults?)`
- `isTimedOut(startTime, timeout)`
- `buildErrorMessage(step, error, attempts)`

### Runtime class

- `StepExecutor`

### Error aliases

- `ValidationError` → re-export of `StepRegistryValidationError`
- `SystemError` → re-export of `StepRegistrySystemError`

Reusing the existing registry error classes keeps retry behavior aligned across the package and avoids introducing a second parallel error hierarchy.

## Validation schemas

Both input and output validators accept the same shape:

```ts
type StepValidationSchema = {
  requiredFields?: string[];
  types?: Record<string, string>;
  validate?: (value: unknown) => true | string | null | undefined;
  requireSuccess?: boolean; // output-only semantic
};
```

Behavior:

- `requiredFields` reports missing keys
- `types` checks `typeof` for present keys
- `validate` can return `true` or an error message
- `requireSuccess` requires `output.success === true`

## Timeouts

Timeouts are expressed in **seconds** on the step definition and converted to milliseconds internally:

```ts
calculateTimeout({ timeout: 120 }, 300); // => 120000
```

If a step omits `timeout`, the executor uses the configured `baseTimeout` (default `300` seconds).

## `StepExecutor` class

### Constructor

```ts
new StepExecutor({
  baseTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  validateInputs?: boolean;
  validateOutputs?: boolean;
  logger?: {
    debug?: (message: string) => void;
    info?: (message: string) => void;
    warn?: (message: string) => void;
    error?: (message: string) => void;
  };
});
```

Defaults:

- `baseTimeout: 300`
- `maxRetries: 3`
- `retryDelay: 1000`
- `validateInputs: true`
- `validateOutputs: true`
- `logger`: no-op logger

The no-op logger preserves the source logging behavior without forcing this smaller library to adopt a global logging dependency.

### Main methods

#### `execute(step, context?)`

Runs one step handler with:

1. optional input validation
2. timeout enforcement
3. optional output validation
4. execution history recording
5. event emission

Failures are re-thrown after the failure result is recorded.

#### `executeWithRetry(step, context?, maxRetries?)`

Retries a failed step with exponential backoff until:

- it succeeds, or
- retries are exhausted, or
- the error is a validation error

When retries are exhausted, the method throws a `SystemError` with the same formatted failure message used by the source implementation.

#### `executeInParallel(steps, context?)`

Runs all steps concurrently and returns a result for each one. It does **not** fail fast when one step rejects.

#### `validateExecution(step, result)`

Checks:

- overall success
- critical-step failure
- expected output fields

#### State helpers

- `getHistory()`
- `getStats()`
- `clearHistory()`

## Events

The executor emits the same event names as the source module:

- `step:start`
- `step:complete`
- `step:error`
- `step:retry`
- `step:timeout`
- `step:validation:error`

## Example

```ts
import {
  WorkflowStepExecutor,
  calculateRetryDelay,
  validateStepInput,
} from 'olinda-orchestrator';

const executor = new WorkflowStepExecutor({
  retryDelay: 250,
});

const result = await executor.executeWithRetry({
  id: 'step_01',
  name: 'Fetch metadata',
  timeout: 30,
  inputSchema: {
    requiredFields: ['projectRoot'],
  },
  outputSchema: {
    requireSuccess: true,
  },
  handler: async (context: { projectRoot: string }) => ({
    success: true,
    root: context.projectRoot,
  }),
});

validateStepInput({ projectRoot: '/tmp/project' }, { requiredFields: ['projectRoot'] });
calculateRetryDelay(2, 250); // => 1000
```
