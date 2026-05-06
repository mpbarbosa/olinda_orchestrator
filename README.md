# olinda-orchestrator

A generic orchestrator TypeScript Library.

## Installation

```bash
npm install olinda-orchestrator
```

## Usage

```typescript
import { Orchestrator } from 'olinda-orchestrator';

const orchestrator = new Orchestrator<number>([
  { name: 'double', execute: (n) => n * 2 },
  { name: 'toString', execute: async (n) => `Result: ${n}` },
]);

const results = await orchestrator.run(21);
// [
//   { name: 'double',   status: 'fulfilled', value: 42 },
//   { name: 'toString', status: 'fulfilled', value: 'Result: 21' },
// ]
```

## API

### `new Orchestrator<TInput>(tasks?, options?)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tasks` | `Task<TInput>[]` | `[]` | Initial list of tasks |
| `options.stopOnError` | `boolean` | `true` | Stop the pipeline on the first failing task |

### `orchestrator.addTask(task)`

Appends a task to the pipeline and returns `this` for chaining.

### `orchestrator.run(input)`

Runs all tasks sequentially with `input` and returns a `Promise<TaskResult[]>`.

Each `TaskResult` has the shape:

```typescript
type TaskResult = {
  name: string;
  status: 'fulfilled' | 'rejected';
  value?: unknown;   // present when status === 'fulfilled'
  reason?: unknown;  // present when status === 'rejected'
};
```

## Development

```bash
npm run build        # compile TypeScript → dist/
npm test             # run Jest tests
npm run test:coverage # run tests with coverage report
npm run lint         # run ESLint
```

## License

MIT
