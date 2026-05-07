import { describe, expect, it } from 'vitest';
import {
  StepExecutor,
  ValidationError,
  SystemError,
  buildErrorMessage,
  calculateRetryDelay,
  calculateTimeout,
  createExecutionContext,
  formatStepResult,
  isTimedOut,
  shouldRetryStep,
  validateStepInput,
  validateStepOutput,
} from '../step_executor';

describe('step_executor', () => {
  describe('validateStepInput', () => {
    it('returns valid for no schema', () => {
      const result = validateStepInput({ data: 'test' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates required fields', () => {
      const schema = { requiredFields: ['name', 'value'] };
      const result = validateStepInput({ name: 'test' }, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: value');
    });

    it('validates field types', () => {
      const schema = { types: { age: 'number' } };
      const result = validateStepInput({ age: 'twenty' }, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.some((error) => error.includes('must be number'))).toBe(true);
    });

    it('runs custom validator', () => {
      const schema = {
        validate: (input: unknown) =>
          typeof input === 'object' && input !== null && 'value' in input && input.value > 0
            ? true
            : 'Value must be positive',
      };
      const result = validateStepInput({ value: -5 }, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Value must be positive');
    });

    it('passes valid input', () => {
      const schema = {
        requiredFields: ['name'],
        types: { name: 'string' },
      };
      const result = validateStepInput({ name: 'test' }, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateStepOutput', () => {
    it('returns valid for no schema', () => {
      const result = validateStepOutput({ data: 'test' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates required output fields', () => {
      const schema = { requiredFields: ['result', 'status'] };
      const result = validateStepOutput({ result: 'ok' }, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required output field: status');
    });

    it('validates success flag', () => {
      const schema = { requireSuccess: true };
      const result = validateStepOutput({ success: false }, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Step did not report success');
    });

    it('runs custom validator', () => {
      const schema = {
        validate: (output: unknown) =>
          typeof output === 'object' && output !== null && 'count' in output && output.count > 0
            ? true
            : 'Count must be positive',
      };
      const result = validateStepOutput({ count: 0 }, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Count must be positive');
    });
  });

  describe('calculateTimeout', () => {
    it('uses step timeout if provided', () => {
      expect(calculateTimeout({ timeout: 600 }, 300)).toBe(600000);
    });

    it('uses base timeout if step has no timeout', () => {
      expect(calculateTimeout({}, 300)).toBe(300000);
    });

    it('defaults to 300 seconds', () => {
      expect(calculateTimeout({})).toBe(300000);
    });
  });

  describe('shouldRetryStep', () => {
    it('returns false if max retries exceeded', () => {
      expect(shouldRetryStep(new Error('Test error'), 3, 3)).toBe(false);
    });

    it('returns false for ValidationError', () => {
      expect(shouldRetryStep(new ValidationError('Invalid input'), 0, 3)).toBe(false);
    });

    it('returns true for system errors', () => {
      expect(shouldRetryStep(new SystemError('Connection failed'), 0, 3)).toBe(true);
    });

    it('returns true for generic errors', () => {
      expect(shouldRetryStep(new Error('Unknown error'), 1, 3)).toBe(true);
    });
  });

  describe('calculateRetryDelay', () => {
    it('calculates exponential backoff', () => {
      expect(calculateRetryDelay(0, 1000)).toBe(1000);
      expect(calculateRetryDelay(1, 1000)).toBe(2000);
      expect(calculateRetryDelay(2, 1000)).toBe(4000);
      expect(calculateRetryDelay(3, 1000)).toBe(8000);
    });

    it('uses default base delay', () => {
      expect(calculateRetryDelay(0)).toBe(1000);
      expect(calculateRetryDelay(1)).toBe(2000);
    });
  });

  describe('formatStepResult', () => {
    it('formats successful result', () => {
      const result = formatStepResult(
        { id: 'step1', name: 'Test Step' },
        {
          success: true,
          duration: 1500,
          output: { data: 'result' },
          timestamp: 1000,
        }
      );

      expect(result.stepId).toBe('step1');
      expect(result.name).toBe('Test Step');
      expect(result.success).toBe(true);
      expect(result.duration).toBe(1500);
      expect(result.output).toEqual({ data: 'result' });
      expect(result.attempts).toBe(1);
    });

    it('formats failed result', () => {
      const result = formatStepResult(
        { id: 'step1', name: 'Test Step' },
        {
          success: false,
          error: 'Execution failed',
          duration: 500,
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Execution failed');
    });

    it('handles skipped result', () => {
      const result = formatStepResult(
        { id: 'step1', name: 'Test Step' },
        { skipped: true }
      );

      expect(result.skipped).toBe(true);
    });
  });

  describe('createExecutionContext', () => {
    it('creates basic context', () => {
      const step = { id: 'step1', name: 'Test', phase: 'testing' };
      const context = createExecutionContext(step);

      expect(context.step).toBe(step);
      expect(context.metadata.stepId).toBe('step1');
      expect(context.metadata.phase).toBe('testing');
    });

    it('includes global context', () => {
      const global = { projectRoot: '/path' };
      const context = createExecutionContext({ id: 'step1', name: 'Test' }, global);

      expect(context.global).toBe(global);
    });

    it('includes previous results', () => {
      const results = { step1: { success: true } };
      const context = createExecutionContext({ id: 'step2', name: 'Test' }, {}, results);

      expect(context.results).toBe(results);
    });
  });

  describe('isTimedOut', () => {
    it('returns false when not timed out', () => {
      expect(isTimedOut(Date.now(), 5000)).toBe(false);
    });

    it('returns true when timed out', () => {
      expect(isTimedOut(Date.now() - 6000, 5000)).toBe(true);
    });
  });

  describe('buildErrorMessage', () => {
    it('builds message without retries', () => {
      const message = buildErrorMessage({ id: 'step1' }, new Error('Failed'), 1);

      expect(message).toBe("Step 'step1' failed: Failed");
    });

    it('builds message with retries', () => {
      const message = buildErrorMessage({ id: 'step1' }, new Error('Failed'), 3);

      expect(message).toBe("Step 'step1' failed (after 3 attempts): Failed");
    });
  });

  describe('StepExecutor', () => {
    it('initializes with default options', () => {
      const executor = new StepExecutor();

      expect(executor.options.baseTimeout).toBe(300);
      expect(executor.options.maxRetries).toBe(3);
      expect(executor.options.retryDelay).toBe(1000);
      expect(executor.executionHistory).toEqual([]);
    });

    it('accepts custom options', () => {
      const executor = new StepExecutor({
        baseTimeout: 600,
        maxRetries: 5,
        retryDelay: 2000,
      });

      expect(executor.options.baseTimeout).toBe(600);
      expect(executor.options.maxRetries).toBe(5);
      expect(executor.options.retryDelay).toBe(2000);
    });

    it('executes step successfully', async () => {
      const executor = new StepExecutor();
      const step = {
        id: 'step1',
        name: 'Test Step',
        handler: () => ({ data: 'success' }),
      };

      const result = await executor.execute(step);

      expect(result.success).toBe(true);
      expect(result.stepId).toBe('step1');
      expect(result.output).toEqual({ data: 'success' });
    });

    it('throws error for missing handler', async () => {
      const executor = new StepExecutor();

      await expect(
        executor.execute({ id: 'step1', name: 'Test' })
      ).rejects.toThrow(ValidationError);
    });

    it('validates input with schema', async () => {
      const executor = new StepExecutor();
      const step = {
        id: 'step1',
        name: 'Test',
        handler: () => ({}),
        inputSchema: { requiredFields: ['name'] },
      };

      await expect(executor.execute(step, {})).rejects.toThrow(ValidationError);
    });

    it('validates output with schema', async () => {
      const executor = new StepExecutor();
      const step = {
        id: 'step1',
        name: 'Test',
        handler: () => ({}),
        outputSchema: { requiredFields: ['result'] },
      };

      await expect(executor.execute(step, {})).rejects.toThrow(ValidationError);
    });

    it('records execution history', async () => {
      const executor = new StepExecutor();
      await executor.execute({
        id: 'step1',
        name: 'Test',
        handler: () => ({}),
      });

      expect(executor.executionHistory).toHaveLength(1);
      expect(executor.executionHistory[0].stepId).toBe('step1');
    });

    it('emits step:start event', async () => {
      const executor = new StepExecutor();
      let eventData: { stepId: string; name: string } | undefined;

      executor.on('step:start', (data) => {
        eventData = data as { stepId: string; name: string };
      });

      await executor.execute({
        id: 'step1',
        name: 'Test',
        handler: () => ({}),
      });

      expect(eventData?.stepId).toBe('step1');
    });

    it('emits step:complete event', async () => {
      const executor = new StepExecutor();
      let eventData: { success: boolean } | undefined;

      executor.on('step:complete', (data) => {
        eventData = data as { success: boolean };
      });

      await executor.execute({
        id: 'step1',
        name: 'Test',
        handler: () => ({}),
      });

      expect(eventData?.success).toBe(true);
    });

    it('handles step timeout', async () => {
      const executor = new StepExecutor({ baseTimeout: 1 });

      await expect(
        executor.execute({
          id: 'step1',
          name: 'Test',
          handler: async () => {
            await new Promise<void>((resolve) => {
              setTimeout(() => resolve(), 1100);
            });
            return undefined;
          },
        })
      ).rejects.toThrow(SystemError);
    });

    it('succeeds on first attempt', async () => {
      const executor = new StepExecutor();

      const result = await executor.executeWithRetry({
        id: 'step1',
        name: 'Test',
        handler: () => ({ success: true }),
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1);
    });

    it('retries on failure', async () => {
      const executor = new StepExecutor({ retryDelay: 10 });
      let attempts = 0;

      const result = await executor.executeWithRetry({
        id: 'step1',
        name: 'Test',
        handler: () => {
          attempts += 1;
          if (attempts < 2) {
            throw new Error('Temporary failure');
          }

          return { success: true };
        },
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it('exhausts retries and fails', async () => {
      const executor = new StepExecutor({ maxRetries: 2, retryDelay: 10 });

      await expect(
        executor.executeWithRetry({
          id: 'step1',
          name: 'Test',
          handler: () => {
            throw new Error('Permanent failure');
          },
        })
      ).rejects.toThrow(SystemError);
    });

    it('does not retry ValidationError', async () => {
      const executor = new StepExecutor({ maxRetries: 3, retryDelay: 10 });

      await expect(
        executor.executeWithRetry({
          id: 'step1',
          name: 'Test',
          handler: () => {
            throw new ValidationError('Invalid');
          },
        })
      ).rejects.toThrow(SystemError);

      expect(executor.executionHistory).toHaveLength(1);
    });

    it('emits step:retry event', async () => {
      const executor = new StepExecutor({ retryDelay: 10 });
      let retryCount = 0;
      let attempts = 0;

      executor.on('step:retry', () => {
        retryCount += 1;
      });

      await executor.executeWithRetry({
        id: 'step1',
        name: 'Test',
        handler: () => {
          attempts += 1;
          if (attempts < 2) {
            throw new Error('Fail once');
          }

          return {};
        },
      });

      expect(retryCount).toBe(1);
    });

    it('executes multiple steps in parallel', async () => {
      const executor = new StepExecutor();
      const results = await executor.executeInParallel([
        { id: 'step1', name: 'Test1', handler: () => ({ result: 1 }) },
        { id: 'step2', name: 'Test2', handler: () => ({ result: 2 }) },
        { id: 'step3', name: 'Test3', handler: () => ({ result: 3 }) },
      ]);

      expect(results).toHaveLength(3);
      expect(results.every((result) => result.success)).toBe(true);
    });

    it('collects parallel failures without failing fast', async () => {
      const executor = new StepExecutor();
      const results = await executor.executeInParallel([
        { id: 'step1', name: 'Test1', handler: () => ({ result: 1 }) },
        {
          id: 'step2',
          name: 'Test2',
          handler: () => {
            throw new Error('Parallel failure');
          },
        },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Parallel failure');
    });

    it('validates execution results', () => {
      const executor = new StepExecutor();
      const validation = executor.validateExecution(
        {
          critical: true,
          expectedOutput: ['result'],
        },
        {
          success: false,
          output: {},
        }
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Step execution failed');
      expect(validation.errors).toContain('Critical step failed');
    });

    it('returns history and stats', async () => {
      const executor = new StepExecutor();

      await executor.execute({
        id: 'step1',
        name: 'Test1',
        handler: () => ({ result: 1 }),
      });
      await executor.execute({
        id: 'step2',
        name: 'Test2',
        handler: () => ({ result: 2 }),
      });

      expect(executor.getHistory()).toHaveLength(2);
      expect(executor.getStats().successful).toBe(2);
    });

    it('clears history', async () => {
      const executor = new StepExecutor();

      await executor.execute({
        id: 'step1',
        name: 'Test1',
        handler: () => ({ result: 1 }),
      });

      executor.clearHistory();

      expect(executor.executionHistory).toEqual([]);
    });
  });
});
