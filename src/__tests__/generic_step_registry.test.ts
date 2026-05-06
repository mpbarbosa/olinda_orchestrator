import { describe, expect, it } from 'vitest';
import type { StepDefinition } from '../step_registry';
import { createStepDefinition } from '../step_registry';
import {
  filterStepsByEnabled,
  filterStepsByTags,
  findStepsByPhase,
  findStepsByStage,
  groupStepsByPhase,
  groupStepsByStage,
  matchStepRequirements,
  sortStepsById,
  validateStepDependencies,
} from '../generic_step_registry';

describe('generic_step_registry', () => {
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

  it('groups, filters, finds, and sorts steps', () => {
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
        phase: 'validate',
        tags: ['quick', 'core'],
        enabled: false,
      }),
    ];

    expect(groupStepsByStage(steps).review).toHaveLength(1);
    expect(groupStepsByPhase(steps).validate).toHaveLength(1);
    expect(filterStepsByTags(steps, ['quick', 'core'])).toHaveLength(1);
    expect(filterStepsByEnabled(steps)).toHaveLength(1);
    expect(findStepsByStage(steps, 'validate')).toHaveLength(1);
    expect(findStepsByPhase(steps, 'validate')).toHaveLength(1);
    expect(sortStepsById(steps).map((step) => step.id)).toEqual(['step_02', 'step_10']);
  });

  it('normalizes missing dependencies to an empty list during validation', () => {
    const steps = [
      { id: 'step_00' },
      { id: 'step_01', dependencies: ['step_00'] },
    ] as StepDefinition[];

    expect(validateStepDependencies(steps)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('reports missing dependencies', () => {
    const steps = [
      createStepDefinition({
        id: 'step_00',
        name: 'Analyze',
        description: 'Analyze project state',
      }),
      createStepDefinition({
        id: 'step_01',
        name: 'Validate',
        description: 'Validate project state',
        dependencies: ['step_99'],
      }),
    ];

    expect(validateStepDependencies(steps)).toEqual({
      valid: false,
      errors: ["Step 'step_01' depends on non-existent step 'step_99'"],
    });
  });
});
