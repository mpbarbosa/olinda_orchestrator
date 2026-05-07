# olinda-orchestrator

A generic orchestrator TypeScript Library.

## Installation

```bash
npm install olinda-orchestrator
```

## Usage

```typescript
import { Orchestrator, StepRegistry, WorkflowStepExecutor } from 'olinda-orchestrator';

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

const executor = new WorkflowStepExecutor();
```

`WorkflowStepExecutor` is the barrel-exported alias for the richer `src/step_executor.ts` runtime. The shorter `StepExecutor<TInput, TOutput>` name remains the function type used by `OrchestratorStep.execute`.

## API

### `new Orchestrator<TInput>(steps?, options?)`

| Parameter             | Type                         | Default | Description                                 |
| --------------------- | ---------------------------- | ------- | ------------------------------------------- |
| `steps`               | `OrchestratorStep<TInput>[]` | `[]`    | Initial list of steps                       |
| `options.stopOnError` | `boolean`                    | `true`  | Stop the pipeline on the first failing step |

### `orchestrator.addStep(step)`

Appends a step to the pipeline and returns `this` for chaining.

### `orchestrator.run(input)`

Runs all steps sequentially with `input` and returns a `Promise<OrchestratorResult[]>`.

Each `OrchestratorResult` has the shape:

```typescript
type OrchestratorResult = {
  name: string;
  status: 'fulfilled' | 'rejected';
  value?: unknown; // present when status === 'fulfilled'
  reason?: unknown; // present when status === 'rejected'
};
```

### `new StepRegistry()`

Manages generic step metadata for orchestration-oriented libraries.

### `new WorkflowStepExecutor(options?)`

Executes richer step definitions with:

- input/output validation
- timeout handling
- retry with exponential backoff
- event emission
- execution history and statistics

The package exports the class as `WorkflowStepExecutor` to avoid colliding with the existing `StepExecutor<TInput, TOutput>` function type from `src/orchestrator.ts`.

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

The helper functions are implemented in `src/generic_step_registry.ts` and re-exported through `src/step_registry.ts`.

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
- [docs/step_executor.md](./docs/step_executor.md) — advanced step execution runtime with retries, validation, and events
- [docs/generic_step_registry.md](./docs/generic_step_registry.md) — helper-only step collection and requirement utilities
- [docs/step_registry.md](./docs/step_registry.md) — step metadata model, helper functions, and `StepRegistry` API
- [docs/ci_cd_roadmap.md](./docs/ci_cd_roadmap.md) — phased plan for complete CI/CD on GitHub, jsDelivr, and npm

## Development

```bash
npm run build        # compile TypeScript → dist/
npm test             # run Vitest tests
npm run test:docker  # run Vitest tests inside Docker
npm run test:coverage # run Vitest tests with coverage report
npm run lint         # run ESLint
```

GitHub Actions runs the same baseline validation on every `push` and
`pull_request` via `.github/workflows/ci.yml`, using Node 20 and 22 with
`npm ci`, `npm run lint`, `npm test`, and `npm run build`.

## Repository scripts

These shell scripts are repository maintenance helpers. They are intended for
contributors working from this checkout and are not part of the published npm
package.

### `scripts/run-tests-docker.sh`

Runs `npm ci` and `npm test` inside a Dockerized Node environment while reusing
a named `node_modules` volume between runs.

**Usage**

```bash
bash ./scripts/run-tests-docker.sh
```

**Prerequisites**

- Docker available on `PATH`
- npm available on the host so the script can mirror the host npm version into
  the container

**Environment variables**

| Variable                     | Default                   | Description                                                         |
| ---------------------------- | ------------------------- | ------------------------------------------------------------------- |
| `DOCKER_NODE_IMAGE`          | `node:20-bookworm`        | Node image used for the container run                               |
| `DOCKER_NPM_VERSION`         | host npm version          | npm version installed globally inside the container before `npm ci` |
| `DOCKER_PROJECT_NAME`        | repo directory name       | Base name used to derive the Docker volume name                     |
| `DOCKER_NODE_MODULES_VOLUME` | `${project}_node_modules` | Explicit Docker volume name for `/workspace/node_modules`           |

**Integration**

- Invoked by `npm run test:docker`
- Keeps local containerized test runs aligned with the repository's standard
  `npm test` flow

**Troubleshooting**

- If `docker` is missing, the script exits immediately with an error
- If `npm ci` or `npm test` fails in the container, the script exits non-zero
- Override `DOCKER_NODE_IMAGE` or `DOCKER_NPM_VERSION` when debugging
  environment-specific failures

### `scripts/deploy.sh`

Performs the current manual release flow for this repository: validates the
workspace, rebuilds `dist/`, commits generated artifacts when they change,
creates a version tag, pushes the branch and tag, and prints jsDelivr and
GitHub raw URLs for the release artifacts.

**Usage**

```bash
bash ./scripts/deploy.sh
```

**Prerequisites**

- Clean git working tree
- Configured `origin` remote
- A checked-out branch (not detached `HEAD`)
- `git`, `node`, and `npm` available on `PATH`

**Arguments and environment**

- No positional arguments
- No documented environment variables; behavior is derived from `package.json`,
  the current git branch, and the `origin` remote

**Integration**

- Runs the same validation steps used in development: `npm run lint`, `npm test`,
  and `npm run build`
- Supports the manual deployment flow referenced in
  [`docs/ci_cd_roadmap.md`](./docs/ci_cd_roadmap.md)

**Troubleshooting**

- The script exits non-zero if the working tree is dirty, the version tag
  already exists, `origin` is missing, or required build artifacts are not
  produced
- Review the printed `[deploy]` status lines to see which validation or Git step
  failed before retrying
- Because the script pushes commits and tags, run it only when the current
  branch is ready to publish

## License

MIT
