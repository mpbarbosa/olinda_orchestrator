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
  });

  it('should not export unexpected properties', () => {
    const allowedExports = [
      'Orchestrator',
      'StepRegistry',
      'StepRegistrySystemError',
      'StepRegistryValidationError',
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
