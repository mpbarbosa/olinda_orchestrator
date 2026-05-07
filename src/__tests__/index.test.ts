import { describe, expect, it } from 'vitest';
import * as OrchestratorModule from '../index';

describe('olinda-orchestrator public API (index.ts)', () => {
  it('should export Orchestrator class', () => {
    expect(typeof OrchestratorModule.Orchestrator).toBe('function');
  });

  it('should export StepRegistry and related classes', () => {
    expect(typeof OrchestratorModule.StepRegistry).toBe('function');
    expect(typeof OrchestratorModule.StepRegistrySystemError).toBe('function');
    expect(typeof OrchestratorModule.StepRegistryValidationError).toBe('function');
    expect(typeof OrchestratorModule.WorkflowStepExecutor).toBe('function');
    expect(typeof OrchestratorModule.StepExecutorSystemError).toBe('function');
    expect(typeof OrchestratorModule.StepExecutorValidationError).toBe('function');
  });

  it('should export step registry helpers', () => {
    expect(typeof OrchestratorModule.createStepDefinition).toBe('function');
    expect(typeof OrchestratorModule.findStepsByStage).toBe('function');
    expect(typeof OrchestratorModule.filterStepsByEnabled).toBe('function');
    expect(typeof OrchestratorModule.filterStepsByTags).toBe('function');
    expect(typeof OrchestratorModule.findStepsByPhase).toBe('function');
    expect(typeof OrchestratorModule.groupStepsByStage).toBe('function');
    expect(typeof OrchestratorModule.groupStepsByPhase).toBe('function');
    expect(typeof OrchestratorModule.matchStepRequirements).toBe('function');
    expect(typeof OrchestratorModule.sortStepsById).toBe('function');
    expect(typeof OrchestratorModule.validateStepDependencies).toBe('function');
    expect(typeof OrchestratorModule.validateStepMetadata).toBe('function');
    expect(typeof OrchestratorModule.validateStepInput).toBe('function');
    expect(typeof OrchestratorModule.validateStepOutput).toBe('function');
    expect(typeof OrchestratorModule.calculateTimeout).toBe('function');
    expect(typeof OrchestratorModule.shouldRetryStep).toBe('function');
    expect(typeof OrchestratorModule.calculateRetryDelay).toBe('function');
    expect(typeof OrchestratorModule.formatStepResult).toBe('function');
    expect(typeof OrchestratorModule.createExecutionContext).toBe('function');
    expect(typeof OrchestratorModule.isTimedOut).toBe('function');
    expect(typeof OrchestratorModule.buildErrorMessage).toBe('function');
  });

  it('should not export unexpected properties', () => {
    const allowedExports = [
      'Orchestrator',
      'WorkflowStepExecutor',
      'StepExecutorSystemError',
      'StepExecutorValidationError',
      'StepRegistry',
      'StepRegistrySystemError',
      'StepRegistryValidationError',
      'validateStepInput',
      'validateStepOutput',
      'calculateTimeout',
      'shouldRetryStep',
      'calculateRetryDelay',
      'formatStepResult',
      'createExecutionContext',
      'isTimedOut',
      'buildErrorMessage',
      'createStepDefinition',
      'findStepsByStage',
      'filterStepsByEnabled',
      'filterStepsByTags',
      'findStepsByPhase',
      'groupStepsByStage',
      'groupStepsByPhase',
      'matchStepRequirements',
      'sortStepsById',
      'validateStepDependencies',
      'validateStepMetadata',
    ];
    Object.keys(OrchestratorModule).forEach((key) => {
      expect(allowedExports).toContain(key);
    });
  });

  it('should return undefined for non-existent export', () => {
    const mod = OrchestratorModule as Record<string, unknown>;
    expect(() => mod['NonExistentExport']).not.toThrow();
    expect(mod['NonExistentExport']).toBeUndefined();
  });
});
