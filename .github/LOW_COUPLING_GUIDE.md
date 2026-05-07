# Low Coupling Guide

Low coupling means modules depend on as little of each other as possible — ideally only on stable interfaces, never on internal implementation details. Apply this guide to all code added or modified in `olinda-orchestrator`.

## Principles

**Depend on interfaces, not implementations.** Accept `StepDefinition` shapes, not `StepRegistry` instances, when the registry itself is not needed.

**Import only what you use.** Named imports make the dependency surface explicit. Avoid barrel-importing an entire module when you need one function.

**Avoid circular runtime imports.** `generic_step_registry.ts` may import shared step types from `step_registry.ts` with `import type`, but helper behavior must stay independent of the registry class or other runtime logic.

**Inject collaborators; do not reach for them.** Pass context, configuration, and handlers as arguments rather than importing singletons or global state.

## Dependency Direction in This Project

```
generic_step_registry  (pure helpers; type-only imports from step_registry are acceptable)
step_registry          (runtime imports helpers; owns StepRegistry behavior)
orchestrator           (independent step runner; no registry dependency)
index (public API)     (re-exports orchestrator + step_registry)
```

Keep runtime dependencies one-way. Type-only imports are acceptable when they avoid duplicating shared shapes, but helper modules must not reach back into registry behavior or instantiate higher-level collaborators.

## Signs of Tight Coupling to Avoid

- Importing a module only to access one constant or type — move it to a shared types file instead
- A function that constructs a `StepRegistry` internally when an instance could be passed in
- Re-implementing logic from another module rather than importing and calling it
- `isRecord` or similar primitive utilities duplicated across files

## Checklist for Review

- [ ] The module's import list contains only what it actually uses
- [ ] No circular dependency is introduced (`npx madge --circular src/`)
- [ ] Dependency direction follows the hierarchy above
- [ ] Collaborators are passed in (injected) rather than imported as singletons
