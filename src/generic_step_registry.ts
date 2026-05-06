/**
 * Generic step registry helpers shared by registry implementations.
 */

import type {
  DependencyValidationResult,
  RequirementMatchResult,
  StepDefinition,
  StepRequirementContext,
  StepStage,
  WorkflowPhase,
} from './step_registry';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function matchStepRequirements(
  step: Pick<StepDefinition, 'requirements'>,
  context: StepRequirementContext = {}
): RequirementMatchResult {
  const result: RequirementMatchResult = {
    met: true,
    missing: [],
  };

  const requirements = step.requirements;
  if (!requirements || Object.keys(requirements).length === 0) {
    return result;
  }

  if (requirements.files && Array.isArray(requirements.files)) {
    const availableFiles = context.files ?? [];
    const missingFiles = requirements.files.filter((file) => !availableFiles.includes(file));
    if (missingFiles.length > 0) {
      result.met = false;
      result.missing.push(...missingFiles.map((file) => `file:${file}`));
    }
  }

  if (requirements.tools && Array.isArray(requirements.tools)) {
    const availableTools = context.tools ?? [];
    const missingTools = requirements.tools.filter((tool) => !availableTools.includes(tool));
    if (missingTools.length > 0) {
      result.met = false;
      result.missing.push(...missingTools.map((tool) => `tool:${tool}`));
    }
  }

  if (requirements.config && isRecord(requirements.config)) {
    const config = context.config ?? {};
    for (const [key, value] of Object.entries(requirements.config)) {
      if (config[key] !== value) {
        result.met = false;
        result.missing.push(`config:${key}=${String(value)}`);
      }
    }
  }

  if (requirements.env && Array.isArray(requirements.env)) {
    const env = context.env ?? {};
    const missingEnv = requirements.env.filter((variable) => !env[variable]);
    if (missingEnv.length > 0) {
      result.met = false;
      result.missing.push(...missingEnv.map((variable) => `env:${variable}`));
    }
  }

  return result;
}

export function groupStepsByStage(steps: StepDefinition[]): Record<StepStage, StepDefinition[]> {
  const groups: Record<StepStage, StepDefinition[]> = {};

  for (const step of steps) {
    groups[step.stage] ??= [];
    groups[step.stage].push(step);
  }

  return groups;
}

export function groupStepsByPhase(steps: StepDefinition[]): Record<WorkflowPhase, StepDefinition[]> {
  return groupStepsByStage(steps);
}

export function filterStepsByTags(steps: StepDefinition[], tags?: string[]): StepDefinition[] {
  if (!tags || tags.length === 0) {
    return steps;
  }

  return steps.filter((step) => tags.every((tag) => step.tags.includes(tag)));
}

export function filterStepsByEnabled(
  steps: StepDefinition[],
  enabledOnly = true
): StepDefinition[] {
  if (!enabledOnly) {
    return steps;
  }

  return steps.filter((step) => step.enabled !== false);
}

export function findStepsByStage(steps: StepDefinition[], stage: StepStage): StepDefinition[] {
  return steps.filter((step) => step.stage === stage);
}

export function findStepsByPhase(steps: StepDefinition[], phase: WorkflowPhase): StepDefinition[] {
  return findStepsByStage(steps, phase);
}

export function sortStepsById(steps: StepDefinition[]): StepDefinition[] {
  return [...steps].sort((left, right) => {
    const leftNumber = parseInt(left.id.match(/\d+/)?.[0] ?? '999', 10);
    const rightNumber = parseInt(right.id.match(/\d+/)?.[0] ?? '999', 10);
    return leftNumber - rightNumber;
  });
}

export function validateStepDependencies(steps: StepDefinition[]): DependencyValidationResult {
  const result: DependencyValidationResult = {
    valid: true,
    errors: [],
  };

  const stepIds = new Set(steps.map((step) => step.id));

  for (const step of steps) {
    const dependencies = Array.isArray(step.dependencies) ? step.dependencies : [];
    for (const dependency of dependencies) {
      if (!stepIds.has(dependency)) {
        result.valid = false;
        result.errors.push(`Step '${step.id}' depends on non-existent step '${dependency}'`);
      }
    }
  }

  return result;
}
