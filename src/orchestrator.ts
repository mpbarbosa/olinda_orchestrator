export type Task<TInput = unknown, TOutput = unknown> = {
  name: string;
  execute: (input: TInput) => Promise<TOutput> | TOutput;
};

export type OrchestratorOptions = {
  /** Stop execution on the first task failure. Defaults to true. */
  stopOnError?: boolean;
};

export type TaskResult<TOutput = unknown> = {
  name: string;
  status: 'fulfilled' | 'rejected';
  value?: TOutput;
  reason?: unknown;
};

/**
 * Orchestrator runs a sequence of named tasks in order, collecting results.
 */
export class Orchestrator<TInput = unknown> {
  private readonly tasks: Task<TInput>[];
  private readonly options: Required<OrchestratorOptions>;

  constructor(tasks: Task<TInput>[] = [], options: OrchestratorOptions = {}) {
    this.tasks = tasks;
    this.options = { stopOnError: true, ...options };
  }

  /** Add a task to the end of the pipeline. */
  addTask(task: Task<TInput>): this {
    this.tasks.push(task);
    return this;
  }

  /** Execute all tasks with the provided input and return their results. */
  async run(input: TInput): Promise<TaskResult[]> {
    const results: TaskResult[] = [];

    for (const task of this.tasks) {
      try {
        const value = await task.execute(input);
        results.push({ name: task.name, status: 'fulfilled', value });
      } catch (reason) {
        results.push({ name: task.name, status: 'rejected', reason });
        if (this.options.stopOnError) {
          break;
        }
      }
    }

    return results;
  }
}
