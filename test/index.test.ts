import * as OrchestratorModule from '../index';

describe('olinda-orchestrator public API (index.ts)', () => {
  it('should export Orchestrator class', () => {
    expect(typeof OrchestratorModule.Orchestrator).toBe('function');
  });

  it('should export Orchestrator types', () => {
    expect(OrchestratorModule).toHaveProperty('OrchestratorOptions');
    expect(OrchestratorModule).toHaveProperty('OrchestratorResult');
    expect(OrchestratorModule).toHaveProperty('OrchestratorStep');
    expect(OrchestratorModule).toHaveProperty('StepExecutor');
    expect(OrchestratorModule).toHaveProperty('Task');
    expect(OrchestratorModule).toHaveProperty('TaskResult');
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

  it('should export step registry types', () => {
    expect(OrchestratorModule).toHaveProperty('DependencyValidationResult');
    expect(OrchestratorModule).toHaveProperty('RequirementMatchResult');
    expect(OrchestratorModule).toHaveProperty('StepDefinition');
    expect(OrchestratorModule).toHaveProperty('StepDefinitionInput');
    expect(OrchestratorModule).toHaveProperty('StepHandler');
    expect(OrchestratorModule).toHaveProperty('StepListFilter');
    expect(OrchestratorModule).toHaveProperty('StepMetadataRecord');
    expect(OrchestratorModule).toHaveProperty('StepRegistryStats');
    expect(OrchestratorModule).toHaveProperty('StepRequirements');
    expect(OrchestratorModule).toHaveProperty('StepRequirementContext');
    expect(OrchestratorModule).toHaveProperty('StepStage');
    expect(OrchestratorModule).toHaveProperty('WorkflowPhase');
  });

  it('should not export unexpected properties', () => {
    const allowedExports = [
      'Orchestrator',
      'OrchestratorOptions',
      'OrchestratorResult',
      'OrchestratorStep',
      'StepExecutor',
      'Task',
      'TaskResult',
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
      'DependencyValidationResult',
      'RequirementMatchResult',
      'StepDefinition',
      'StepDefinitionInput',
      'StepHandler',
      'StepListFilter',
      'StepMetadataRecord',
      'StepRegistryStats',
      'StepRequirements',
      'StepRequirementContext',
      'StepStage',
      'WorkflowPhase',
      '__esModule'
    ];
    Object.keys(OrchestratorModule).forEach((key) => {
      expect(allowedExports).toContain(key);
    });
  });

  it('should return undefined for non-existent export', () => {
    // @ts-expect-error
    expect(() => OrchestratorModule.NonExistentExport).not.toThrow();
    expect(OrchestratorModule.NonExistentExport).toBeUndefined();
  });
});
