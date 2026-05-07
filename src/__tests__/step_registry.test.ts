import { describe, expect, it } from 'vitest';
import {
  StepRegistry,
  StepRegistrySystemError,
  StepRegistryValidationError,
  createStepDefinition,
  filterStepsByEnabled,
  filterStepsByTags,
  findStepsByStage,
  groupStepsByStage,
  matchStepRequirements,
  sortStepsById,
  validateStepDependencies,
  validateStepMetadata,
} from '../step_registry';

describe('step_registry', () => {
  describe('validateStepMetadata', () => {
    it('accepts valid metadata', () => {
      expect(
        validateStepMetadata({
          id: 'step_00',
          name: 'Analyze',
          description: 'Analyze project state',
        })
      ).toEqual([]);
    });

    it('rejects invalid metadata', () => {
      expect(validateStepMetadata(null)).toContain('metadata must be an object');
      expect(
        validateStepMetadata({
          id: 'INVALID-ID',
          name: 'Test',
          description: 'Test',
        })
      ).toContain('id must contain only lowercase letters, numbers, and underscores');
    });
  });

  describe('createStepDefinition', () => {
    it('applies defaults', () => {
      expect(
        createStepDefinition({
          id: 'step_01',
          name: 'Test Step',
          description: 'Test description',
        })
      ).toMatchObject({
        stage: 'default',
        dependencies: [],
        tags: [],
        critical: false,
        enabled: true,
        timeout: 300,
      });
    });

    it('throws a validation error for invalid metadata', () => {
      expect(() =>
        createStepDefinition({
          id: 'bad-id',
          name: '',
          description: '',
        })
      ).toThrow(StepRegistryValidationError);
    });
  });

  describe('pure helpers', () => {
    it('matches requirements against context', () => {
      const result = matchStepRequirements(
        {
          requirements: {
            files: ['package.json'],
            tools: ['npm'],
            config: { mode: 'strict' },
            env: ['CI'],
          },
        },
        {
          files: ['package.json'],
          tools: ['npm'],
          config: { mode: 'strict' },
          env: { CI: 'true' },
        }
      );

      expect(result).toEqual({ met: true, missing: [] });
    });

    it('groups, filters, sorts, and validates step lists', () => {
      const steps = [
        createStepDefinition({
          id: 'step_10',
          name: 'Quality',
          description: 'Quality checks',
          stage: 'review',
          tags: ['slow'],
        }),
        createStepDefinition({
          id: 'step_02',
          name: 'Validate',
          description: 'Validation checks',
          stage: 'validate',
          tags: ['quick', 'core'],
          enabled: false,
          dependencies: ['step_99'],
        }),
      ];

      expect(groupStepsByStage(steps).review).toHaveLength(1);
      expect(filterStepsByTags(steps, ['quick', 'core'])).toHaveLength(1);
      expect(filterStepsByEnabled(steps)).toHaveLength(1);
      expect(findStepsByStage(steps, 'validate')).toHaveLength(1);
      expect(sortStepsById(steps).map((step) => step.id)).toEqual(['step_02', 'step_10']);
      expect(validateStepDependencies(steps)).toEqual({
        valid: false,
        errors: ["Step 'step_02' depends on non-existent step 'step_99'"],
      });
    });
  });

  describe('StepRegistry', () => {
    it('registers, updates, lists, and unregisters steps', () => {
      const registry = new StepRegistry();

      registry.register('step_00', {
        name: 'Analyze',
        description: 'Analyze project',
        stage: 'prepare',
      });
      registry.register('step_01', {
        name: 'Validate',
        description: 'Validate project',
        stage: 'validate',
        tags: ['core'],
      });

      expect(registry.has('step_00')).toBe(true);
      expect(registry.list().map((step) => step.id)).toEqual(['step_00', 'step_01']);
      expect(registry.list({ stage: 'validate' }).map((step) => step.id)).toEqual(['step_01']);

      registry.update('step_01', { enabled: false });
      expect(registry.get('step_01')?.enabled).toBe(false);
      expect(registry.list().map((step) => step.id)).toEqual(['step_00']);
      expect(registry.unregister('step_00')).toBe(true);
      expect(registry.has('step_00')).toBe(false);
    });

    it('returns registration order and stage grouping', () => {
      const registry = new StepRegistry();
      registry.register('step_10', {
        name: 'Quality',
        description: 'Quality checks',
        stage: 'review',
      });
      registry.register('step_02', {
        name: 'Validate',
        description: 'Validation checks',
        stage: 'validate',
      });

      expect(registry.getInOrder().map((step) => step.id)).toEqual(['step_10', 'step_02']);
      expect(registry.getByStage().validate.map((step) => step.id)).toEqual(['step_02']);
    });

    it('validates dependencies, checks requirements, and returns stats', () => {
      const registry = new StepRegistry();
      registry.register('step_00', {
        name: 'Analyze',
        description: 'Analyze project',
        stage: 'prepare',
        critical: true,
      });
      registry.register('step_01', {
        name: 'Validate',
        description: 'Validate project',
        stage: 'validate',
        dependencies: ['step_00'],
        requirements: { files: ['package.json'] },
      });

      expect(registry.validateAll()).toEqual({ valid: true, errors: [] });
      expect(registry.checkRequirements('step_01', { files: [] })).toEqual({
        met: false,
        missing: ['file:package.json'],
      });
      expect(registry.getStats()).toEqual({
        total: 2,
        enabled: 2,
        disabled: 0,
        critical: 1,
        byStage: {
          prepare: 1,
          validate: 1,
        },
      });
    });

    it('throws target-specific errors for invalid operations', () => {
      const registry = new StepRegistry();

      expect(() =>
        registry.register('step_00', {
          name: 'Analyze',
          description: 'Analyze project',
        })
      ).not.toThrow();

      expect(() =>
        registry.register('step_00', {
          name: 'Analyze Again',
          description: 'Duplicate',
        })
      ).toThrow(StepRegistryValidationError);

      expect(() => registry.update('missing', { enabled: false })).toThrow(
        StepRegistryValidationError
      );
      expect(() => registry.checkRequirements('missing', {})).toThrow(StepRegistryValidationError);
      expect(() => registry.loadStepsFromDirectory('./steps')).toThrow(StepRegistrySystemError);
    });

    it('clears the registry', () => {
      const registry = new StepRegistry();
      registry.register('step_00', {
        name: 'Analyze',
        description: 'Analyze project',
      });

      registry.clear();

      expect(registry.list()).toEqual([]);
      expect(registry.getInOrder()).toEqual([]);
    });
  });
});
