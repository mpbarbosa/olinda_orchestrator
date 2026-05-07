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

/** Steps whose IDs contain no numeric component sort after all numbered steps. */
const NUMERIC_SORT_FALLBACK = 999;

/** Returns true when `value` is a non-null, non-array plain object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks whether all requirements declared on `step` are satisfied by `context`.
 * Returns `{ met: true, missing: [] }` when requirements are absent or all met.
 */
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

/** Groups steps by their `stage`, returning a map of stage name → step array. */
export function groupStepsByStage(steps: StepDefinition[]): Record<StepStage, StepDefinition[]> {
  const groups: Record<StepStage, StepDefinition[]> = {};

  for (const step of steps) {
    groups[step.stage] ??= [];
    groups[step.stage].push(step);
  }

  return groups;
}

/**
 * @deprecated Use `groupStepsByStage` instead. `phase` is a legacy alias for `stage`.
 */
export function groupStepsByPhase(
  steps: StepDefinition[]
): Record<WorkflowPhase, StepDefinition[]> {
  return groupStepsByStage(steps);
}

/**
 * Returns only the steps that match ALL of the provided tags.
 * Returns all steps when `tags` is empty or omitted.
 */
export function filterStepsByTags(steps: StepDefinition[], tags?: string[]): StepDefinition[] {
  if (!tags || tags.length === 0) {
    return steps;
  }

  return steps.filter((step) => tags.every((tag) => step.tags.includes(tag)));
}

/**
 * Returns only enabled steps when `enabledOnly` is true (the default).
 * Pass `false` to return all steps regardless of their `enabled` flag.
 */
export function filterStepsByEnabled(
  steps: StepDefinition[],
  enabledOnly = true
): StepDefinition[] {
  if (!enabledOnly) {
    return steps;
  }

  return steps.filter((step) => step.enabled !== false);
}

/** Returns all steps whose `stage` matches the given value. */
export function findStepsByStage(steps: StepDefinition[], stage: StepStage): StepDefinition[] {
  return steps.filter((step) => step.stage === stage);
}

/**
 * @deprecated Use `findStepsByStage` instead. `phase` is a legacy alias for `stage`.
 */
export function findStepsByPhase(steps: StepDefinition[], phase: WorkflowPhase): StepDefinition[] {
  return findStepsByStage(steps, phase);
}

/**
 * Returns a sorted copy of `steps` ordered by the first numeric run in each ID.
 * Steps with no numeric component in their ID sort after all numbered steps.
 */
export function sortStepsById(steps: StepDefinition[]): StepDefinition[] {
  return [...steps].sort((left, right) => {
    const leftNumber = parseInt(left.id.match(/\d+/)?.[0] ?? String(NUMERIC_SORT_FALLBACK), 10);
    const rightNumber = parseInt(right.id.match(/\d+/)?.[0] ?? String(NUMERIC_SORT_FALLBACK), 10);
    return leftNumber - rightNumber;
  });
}

/**
 * Validates that every dependency declared on each step refers to a known step ID.
 * Returns `{ valid: true, errors: [] }` when all dependencies resolve.
 */
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
