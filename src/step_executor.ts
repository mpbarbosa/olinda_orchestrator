import { EventEmitter } from 'node:events';
import {
  StepRegistrySystemError,
  StepRegistryValidationError,
} from './step_registry';

export { StepRegistryValidationError as ValidationError, StepRegistrySystemError as SystemError };

type ValidationHook = (value: unknown) => true | string | null | undefined;

export type StepValidationSchema = {
  requiredFields?: string[];
  types?: Record<string, string>;
  validate?: ValidationHook;
  requireSuccess?: boolean;
};

export type StepValidationResult = {
  valid: boolean;
  errors: string[];
};

export type StepResultExecution<TOutput = unknown> = {
  success?: boolean;
  duration?: number;
  output?: TOutput | null;
  error?: string | null;
  attempts?: number;
  skipped?: boolean;
  timestamp?: number;
};

export type ExecutableStep<TContext = unknown, TOutput = unknown> = {
  id: string;
  name: string;
  handler?: (context: TContext) => Promise<TOutput> | TOutput;
  timeout?: number;
  inputSchema?: StepValidationSchema;
  outputSchema?: StepValidationSchema;
  phase?: string;
  critical?: boolean;
  expectedOutput?: string[];
};

export type StepExecutionResult<TOutput = unknown> = {
  stepId: string;
  name: string;
  success: boolean;
  duration: number;
  output: TOutput | null;
  error: string | null;
  attempts: number;
  skipped: boolean;
  timestamp: number;
};

export type ExecutionContext<TStep = unknown, TGlobal = Record<string, unknown>> = {
  step: TStep;
  global: TGlobal;
  results: Record<string, unknown>;
  metadata: {
    stepId: string;
    stepName: string;
    phase: string;
  };
};

export type ExecutionValidationResult = {
  valid: boolean;
  errors: string[];
};

export type StepExecutorLogger = {
  debug?: (message: string) => void;
  info?: (message: string) => void;
  warn?: (message: string) => void;
  error?: (message: string) => void;
};

export type StepExecutorOptions = {
  baseTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  validateInputs?: boolean;
  validateOutputs?: boolean;
  logger?: StepExecutorLogger;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const noopLogger: Required<StepExecutorLogger> = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

export function validateStepInput(
  input: unknown,
  schema: StepValidationSchema | null = null
): StepValidationResult {
  const result: StepValidationResult = {
    valid: true,
    errors: [],
  };

  if (!schema) {
    return result;
  }

  if (schema.requiredFields && Array.isArray(schema.requiredFields)) {
    for (const field of schema.requiredFields) {
      if (!isRecord(input) || input[field] === undefined) {
        result.valid = false;
        result.errors.push(`Missing required field: ${field}`);
      }
    }
  }

  if (schema.types && isRecord(schema.types) && isRecord(input)) {
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (input[field] !== undefined) {
        const actualType = typeof input[field];
        if (actualType !== expectedType) {
          result.valid = false;
          result.errors.push(`Field '${field}' must be ${expectedType}, got ${actualType}`);
        }
      }
    }
  }

  if (schema.validate && typeof schema.validate === 'function') {
    try {
      const customResult = schema.validate(input);
      if (customResult !== true) {
        result.valid = false;
        result.errors.push(customResult || 'Custom validation failed');
      }
    } catch (error) {
      result.valid = false;
      result.errors.push(`Validation error: ${getErrorMessage(error)}`);
    }
  }

  return result;
}

export function validateStepOutput(
  output: unknown,
  schema: StepValidationSchema | null = null
): StepValidationResult {
  const result: StepValidationResult = {
    valid: true,
    errors: [],
  };

  if (!schema) {
    return result;
  }

  if (schema.requiredFields && Array.isArray(schema.requiredFields)) {
    for (const field of schema.requiredFields) {
      if (!isRecord(output) || output[field] === undefined) {
        result.valid = false;
        result.errors.push(`Missing required output field: ${field}`);
      }
    }
  }

  if (schema.requireSuccess && (!isRecord(output) || output.success !== true)) {
    result.valid = false;
    result.errors.push('Step did not report success');
  }

  if (schema.validate && typeof schema.validate === 'function') {
    try {
      const customResult = schema.validate(output);
      if (customResult !== true) {
        result.valid = false;
        result.errors.push(customResult || 'Output validation failed');
      }
    } catch (error) {
      result.valid = false;
      result.errors.push(`Validation error: ${getErrorMessage(error)}`);
    }
  }

  return result;
}

export function calculateTimeout(
  step: Pick<ExecutableStep, 'timeout'> | null | undefined,
  baseTimeout = 300
): number {
  const stepTimeout = step?.timeout || baseTimeout;
  return stepTimeout * 1000;
}

export function shouldRetryStep(error: unknown, attempt: number, maxRetries = 3): boolean {
  if (attempt >= maxRetries) {
    return false;
  }

  if (error instanceof StepRegistryValidationError) {
    return false;
  }

  return true;
}

export function calculateRetryDelay(attempt: number, baseDelay = 1000): number {
  return baseDelay * Math.pow(2, attempt);
}

export function formatStepResult<TOutput = unknown>(
  step: Pick<ExecutableStep, 'id' | 'name'>,
  execution: StepResultExecution<TOutput>
): StepExecutionResult<TOutput> {
  return {
    stepId: step.id,
    name: step.name,
    success: execution.success === true,
    duration: execution.duration || 0,
    output: execution.output || null,
    error: execution.error || null,
    attempts: execution.attempts || 1,
    skipped: execution.skipped === true,
    timestamp: execution.timestamp || Date.now(),
  };
}

export function createExecutionContext<
  TStep extends Pick<ExecutableStep, 'id' | 'name' | 'phase'>,
  TGlobal extends Record<string, unknown> = Record<string, unknown>,
>(
  step: TStep,
  globalContext = {} as TGlobal,
  previousResults: Record<string, unknown> = {}
): ExecutionContext<TStep, TGlobal> {
  return {
    step,
    global: globalContext,
    results: previousResults,
    metadata: {
      stepId: step.id,
      stepName: step.name,
      phase: step.phase || 'execution',
    },
  };
}

export function isTimedOut(startTime: number, timeout: number): boolean {
  return Date.now() - startTime >= timeout;
}

export function buildErrorMessage(
  step: Pick<ExecutableStep, 'id'>,
  error: unknown,
  attempts: number
): string {
  const attemptStr = attempts > 1 ? ` (after ${attempts} attempts)` : '';
  return `Step '${step.id}' failed${attemptStr}: ${getErrorMessage(error)}`;
}

export class StepExecutor extends EventEmitter {
  public options: Required<Omit<StepExecutorOptions, 'logger'>> & {
    logger: Required<StepExecutorLogger>;
  };

  public executionHistory: StepExecutionResult[];

  constructor(options: StepExecutorOptions = {}) {
    super();
    this.options = {
      baseTimeout: options.baseTimeout || 300,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      validateInputs: options.validateInputs !== false,
      validateOutputs: options.validateOutputs !== false,
      logger: {
        debug: options.logger?.debug ?? noopLogger.debug,
        info: options.logger?.info ?? noopLogger.info,
        warn: options.logger?.warn ?? noopLogger.warn,
        error: options.logger?.error ?? noopLogger.error,
      },
    };
    this.executionHistory = [];
  }

  async execute<TContext = unknown, TOutput = unknown>(
    step: ExecutableStep<TContext, TOutput>,
    context: TContext = {} as TContext
  ): Promise<StepExecutionResult<TOutput>> {
    const startTime = Date.now();

    this.options.logger.debug(`Executing step: ${step.id}`);
    this.emit('step:start', { stepId: step.id, name: step.name });

    try {
      if (!step.handler || typeof step.handler !== 'function') {
        throw new StepRegistryValidationError(`Step '${step.id}' has no valid handler function`);
      }

      if (this.options.validateInputs && step.inputSchema) {
        const inputValidation = validateStepInput(context, step.inputSchema);
        if (!inputValidation.valid) {
          const error = new StepRegistryValidationError(
            `Input validation failed: ${inputValidation.errors.join(', ')}`
          );
          this.emit('step:validation:error', { stepId: step.id, errors: inputValidation.errors });
          throw error;
        }
      }

      const timeout = calculateTimeout(step, this.options.baseTimeout);
      const output = await this._executeWithTimeout(step.handler, context, timeout);

      if (this.options.validateOutputs && step.outputSchema) {
        const outputValidation = validateStepOutput(output, step.outputSchema);
        if (!outputValidation.valid) {
          const error = new StepRegistryValidationError(
            `Output validation failed: ${outputValidation.errors.join(', ')}`
          );
          this.emit('step:validation:error', { stepId: step.id, errors: outputValidation.errors });
          throw error;
        }
      }

      const duration = Date.now() - startTime;
      const result = formatStepResult(step, {
        success: true,
        duration,
        output,
        timestamp: startTime,
      });

      this.executionHistory.push(result);
      this.emit('step:complete', result);
      this.options.logger.info(`Step '${step.id}' completed in ${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = formatStepResult(step, {
        success: false,
        duration,
        error: getErrorMessage(error),
        timestamp: startTime,
      });

      this.executionHistory.push(result);
      this.emit('step:error', { ...result, error });
      this.options.logger.error(`Step '${step.id}' failed: ${getErrorMessage(error)}`);

      throw error;
    }
  }

  async executeWithRetry<TContext = unknown, TOutput = unknown>(
    step: ExecutableStep<TContext, TOutput>,
    context: TContext = {} as TContext,
    maxRetries: number | null = null
  ): Promise<StepExecutionResult<TOutput>> {
    const retries = maxRetries !== null ? maxRetries : this.options.maxRetries;
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const result = await this.execute(step, context);
        result.attempts = attempt + 1;
        return result;
      } catch (error) {
        lastError = error;

        if (attempt < retries && shouldRetryStep(error, attempt, retries)) {
          const delay = calculateRetryDelay(attempt, this.options.retryDelay);
          this.options.logger.warn(
            `Step '${step.id}' failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms`
          );
          this.emit('step:retry', { stepId: step.id, attempt, delay });

          await this._sleep(delay);
        } else {
          break;
        }
      }
    }

    const errorMsg = buildErrorMessage(step, lastError, retries + 1);
    throw new StepRegistrySystemError(errorMsg);
  }

  async executeInParallel<TContext = unknown, TOutput = unknown>(
    steps: Array<ExecutableStep<TContext, TOutput>>,
    context: TContext = {} as TContext
  ): Promise<Array<StepExecutionResult<TOutput>>> {
    this.options.logger.debug(`Executing ${steps.length} steps in parallel`);

    const promises = steps.map((step) =>
      this.execute(step, context).catch((error) =>
        formatStepResult<TOutput>(step, {
          success: false,
          error: getErrorMessage(error),
          timestamp: Date.now(),
        })
      )
    );

    const results = await Promise.all(promises);

    const successful = results.filter((result) => result.success).length;
    this.options.logger.info(
      `Parallel execution complete: ${successful}/${steps.length} succeeded`
    );

    return results;
  }

  validateExecution(
    step: Pick<ExecutableStep, 'critical' | 'expectedOutput'>,
    result: Pick<StepExecutionResult, 'success' | 'output'>
  ): ExecutionValidationResult {
    const validation: ExecutionValidationResult = {
      valid: true,
      errors: [],
    };

    if (!result.success) {
      validation.valid = false;
      validation.errors.push('Step execution failed');
    }

    if (step.critical && !result.success) {
      validation.valid = false;
      validation.errors.push('Critical step failed');
    }

    if (step.expectedOutput && result.output && isRecord(result.output)) {
      for (const field of step.expectedOutput) {
        if (result.output[field] === undefined) {
          validation.valid = false;
          validation.errors.push(`Missing expected output: ${field}`);
        }
      }
    }

    return validation;
  }

  getHistory(): StepExecutionResult[] {
    return [...this.executionHistory];
  }

  getStats(): {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    totalDuration: number;
    averageDuration: number;
  } {
    const total = this.executionHistory.length;
    const successful = this.executionHistory.filter((result) => result.success).length;
    const failed = total - successful;
    const totalDuration = this.executionHistory.reduce((sum, result) => sum + result.duration, 0);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      totalDuration,
      averageDuration: total > 0 ? totalDuration / total : 0,
    };
  }

  clearHistory(): void {
    this.executionHistory = [];
    this.options.logger.debug('Cleared execution history');
  }

  private async _executeWithTimeout<TContext, TOutput>(
    handler: (context: TContext) => Promise<TOutput> | TOutput,
    context: TContext,
    timeout: number
  ): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const error = new StepRegistrySystemError(`Step execution timed out after ${timeout}ms`);
        this.emit('step:timeout', { timeout });
        reject(error);
      }, timeout);

      Promise.resolve(handler(context))
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(getErrorMessage(error)));
        });
    });
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      if (typeof timer.unref === 'function') {
        timer.unref();
      }
    });
  }
}
