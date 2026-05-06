# Orchestrator

`src/orchestrator.ts` provides the runtime execution layer for the library. It defines the step execution contract, the orchestrator class itself, and the backward-compatible task aliases kept for older consumers.

## Overview

The `Orchestrator` executes a list of named steps sequentially. Every step receives the **same original input** passed to `run()`. Results are collected in order and represented as fulfilled or rejected entries.

This module is intentionally small:

- `StepExecutor<TInput, TOutput>` defines a sync-or-async step function
- `OrchestratorStep<TInput, TOutput>` defines a named executable step
- `OrchestratorOptions` currently supports `stopOnError`
- `OrchestratorResult<TOutput>` captures each step result
- `Task` and `TaskResult` remain as compatibility aliases
- `Orchestrator<TInput>` runs the pipeline

## Exported types

### `StepExecutor<TInput = unknown, TOutput = unknown>`

```ts
type StepExecutor<TInput, TOutput> = (input: TInput) => Promise<TOutput> | TOutput;
```

Represents a single executable unit. A step can be synchronous or asynchronous.

### `OrchestratorStep<TInput = unknown, TOutput = unknown>`

```ts
type OrchestratorStep<TInput, TOutput> = {
  name: string;
  execute: StepExecutor<TInput, TOutput>;
};
```

Each step must have:

- `name`: used in result objects
- `execute`: the function invoked during `run()`

### `OrchestratorOptions`

```ts
type OrchestratorOptions = {
  stopOnError?: boolean;
};
```

- Defaults to `true`
- When `true`, execution stops after the first rejected step
- When `false`, later steps continue to run even if an earlier step fails

### `OrchestratorResult<TOutput = unknown>`

```ts
type OrchestratorResult<TOutput> = {
  name: string;
  status: 'fulfilled' | 'rejected';
  value?: TOutput;
  reason?: unknown;
};
```

Behavior:

- fulfilled steps store their return value in `value`
- rejected steps store the thrown error or rejection reason in `reason`

### Compatibility aliases

```ts
type Task<TInput, TOutput> = OrchestratorStep<TInput, TOutput>;
type TaskResult<TOutput> = OrchestratorResult<TOutput>;
```

These aliases preserve the older task-oriented API while the canonical vocabulary is now step-oriented.

## `Orchestrator<TInput>`

### Constructor

```ts
new Orchestrator<TInput>(steps?: OrchestratorStep<TInput>[], options?: OrchestratorOptions)
```

Initializes:

- an internal ordered step list
- normalized options with `stopOnError: true` by default

The constructor stores the provided array directly and does not clone it.

### `addStep(step)`

```ts
addStep(step: OrchestratorStep<TInput>): this
```

Appends a step to the end of the pipeline and returns the same orchestrator instance for chaining.

### `addTask(task)`

```ts
addTask(task: Task<TInput>): this
```

Backward-compatible alias for `addStep()`.

### `run(input)`

```ts
async run(input: TInput): Promise<OrchestratorResult[]>
```

Execution rules:

1. Steps run strictly in insertion order.
2. Each step receives the original `input`, not the previous step's output.
3. Each result is pushed into the output array immediately after execution.
4. A thrown error marks that step as `rejected`.
5. If `stopOnError` is `true`, execution stops at the first rejection.
6. If `stopOnError` is `false`, execution continues with remaining steps.

## Example

```ts
import { Orchestrator } from 'olinda-orchestrator';

const orchestrator = new Orchestrator<number>([], { stopOnError: false });

orchestrator
  .addStep({
    name: 'double',
    execute: (value) => value * 2,
  })
  .addStep({
    name: 'fail-if-odd',
    execute: (value) => {
      if (value % 2 !== 0) {
        throw new Error('Input must be even');
      }

      return 'ok';
    },
  });

const results = await orchestrator.run(3);
```

Possible output:

```ts
[
  { name: 'double', status: 'fulfilled', value: 6 },
  {
    name: 'fail-if-odd',
    status: 'rejected',
    reason: Error('Input must be even'),
  },
];
```

## Design notes

- This class is an **execution coordinator**, not a dataflow pipeline.
- It favors simple, predictable control flow over implicit chaining between steps.
- Because each step receives the original input, any shared mutable coordination must happen outside this class or inside closures captured by the step functions.
