export type StepExecutor<TInput = unknown, TOutput = unknown> = (
  input: TInput
) => Promise<TOutput> | TOutput;

export type OrchestratorStep<TInput = unknown, TOutput = unknown> = {
  name: string;
  execute: StepExecutor<TInput, TOutput>;
};

export type OrchestratorOptions = {
  /** Stop execution on the first step failure. Defaults to true. */
  stopOnError?: boolean;
};

export type OrchestratorResult<TOutput = unknown> = {
  name: string;
  status: 'fulfilled' | 'rejected';
  value?: TOutput;
  reason?: unknown;
};

/**
 * Backward-compatible alias for the previous task-based API.
 */
export type Task<TInput = unknown, TOutput = unknown> = OrchestratorStep<TInput, TOutput>;

/**
 * Backward-compatible alias for the previous task-result API.
 */
export type TaskResult<TOutput = unknown> = OrchestratorResult<TOutput>;

/**
 * Orchestrator runs a sequence of named steps in order, collecting results.
 */
export class Orchestrator<TInput = unknown> {
  private readonly steps: OrchestratorStep<TInput>[];
  private readonly options: Required<OrchestratorOptions>;

  constructor(steps: OrchestratorStep<TInput>[] = [], options: OrchestratorOptions = {}) {
    this.steps = steps;
    this.options = { stopOnError: true, ...options };
  }

  /** Add a step to the end of the pipeline. */
  addStep(step: OrchestratorStep<TInput>): this {
    this.steps.push(step);
    return this;
  }

  /** Backward-compatible alias for addStep. */
  addTask(task: Task<TInput>): this {
    return this.addStep(task);
  }

  /** Execute all steps with the provided input and return their results. */
  async run(input: TInput): Promise<OrchestratorResult[]> {
    const results: OrchestratorResult[] = [];

    for (const step of this.steps) {
      try {
        const value = await step.execute(input);
        results.push({ name: step.name, status: 'fulfilled', value });
      } catch (reason) {
        results.push({ name: step.name, status: 'rejected', reason });
        if (this.options.stopOnError) {
          break;
        }
      }
    }

    return results;
  }
}
