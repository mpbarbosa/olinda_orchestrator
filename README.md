# olinda-orchestrator

A generic orchestrator TypeScript Library.

## Installation

```bash
npm install olinda-orchestrator
```

## Usage

```typescript
import { Orchestrator, StepRegistry } from 'olinda-orchestrator';

const orchestrator = new Orchestrator<number>([
  { name: 'double', execute: (n) => n * 2 },
  { name: 'toString', execute: async (n) => `Result: ${n}` },
]);

const results = await orchestrator.run(21);
// [
//   { name: 'double',   status: 'fulfilled', value: 42 },
//   { name: 'toString', status: 'fulfilled', value: 'Result: 21' },
// ]

const registry = new StepRegistry();
registry.register('step_00', {
  name: 'Analyze',
  description: 'Analyze the current project state',
  stage: 'prepare',
  tags: ['core'],
});
```

## API

### `new Orchestrator<TInput>(steps?, options?)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `steps` | `OrchestratorStep<TInput>[]` | `[]` | Initial list of steps |
| `options.stopOnError` | `boolean` | `true` | Stop the pipeline on the first failing step |

### `orchestrator.addStep(step)`

Appends a step to the pipeline and returns `this` for chaining.

### `orchestrator.run(input)`

Runs all steps sequentially with `input` and returns a `Promise<OrchestratorResult[]>`.

Each `OrchestratorResult` has the shape:

```typescript
type OrchestratorResult = {
  name: string;
  status: 'fulfilled' | 'rejected';
  value?: unknown;   // present when status === 'fulfilled'
  reason?: unknown;  // present when status === 'rejected'
};
```

### `new StepRegistry()`

Manages generic step metadata for orchestration-oriented libraries.

#### Main exports

- `createStepDefinition(metadata)` — validate and normalize a step definition
- `validateStepMetadata(metadata)` — return validation errors without throwing
- `matchStepRequirements(step, context)` — check file/tool/config/env requirements
- `groupStepsByStage(steps)` — bucket steps by stage labels
- `filterStepsByTags(steps, tags)` — AND-match tags
- `filterStepsByEnabled(steps)` — keep enabled steps by default
- `findStepsByStage(steps, stage)` — select a single stage label
- `sortStepsById(steps)` — natural step ordering for IDs such as `step_00`, `step_10`
- `validateStepDependencies(steps)` — detect missing dependencies
- `StepRegistry` — mutable registry wrapper for register/update/list/stats operations

#### Step registry example

```typescript
import { StepRegistry } from 'olinda-orchestrator';

const registry = new StepRegistry();

registry.register('step_00', {
  name: 'Analyze',
  description: 'Analyze project state',
  stage: 'prepare',
});

registry.register('step_01', {
  name: 'Validate',
  description: 'Validate project state',
  stage: 'validate',
  dependencies: ['step_00'],
});

const steps = registry.list();
const validation = registry.validateAll();
const stats = registry.getStats();
```

## Documentation

- [docs/orchestrator.md](./docs/orchestrator.md) — runtime execution model and `Orchestrator` API
- [docs/step_registry.md](./docs/step_registry.md) — step metadata model, helper functions, and `StepRegistry` API
- [docs/ci_cd_roadmap.md](./docs/ci_cd_roadmap.md) — phased plan for complete CI/CD on GitHub, jsDelivr, and npm

## Development

```bash
npm run build        # compile TypeScript → dist/
npm test             # run Jest tests
npm run test:docker  # run Jest tests inside Docker
npm run test:coverage # run tests with coverage report
npm run lint         # run ESLint
```

## License

MIT
