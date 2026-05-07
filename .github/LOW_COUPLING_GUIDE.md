# Low Coupling Guide

Low coupling means modules depend on as little of each other as possible — ideally only on stable interfaces, never on internal implementation details. Apply this guide to all code added or modified in `olinda-orchestrator`.

## Principles

**Depend on interfaces, not implementations.** Accept `StepDefinition` shapes, not `StepRegistry` instances, when the registry itself is not needed.

**Import only what you use.** Named imports make the dependency surface explicit. Avoid barrel-importing an entire module when you need one function.

**Avoid circular imports.** `generic_step_registry.ts` must not import from `step_registry.ts`. Direction of dependency: helpers ← registry ← orchestrator ← public API.

**Inject collaborators; do not reach for them.** Pass context, configuration, and handlers as arguments rather than importing singletons or global state.

## Dependency Direction in This Project

```
generic_step_registry  (no project imports)
       ↑
step_registry          (imports from generic_step_registry)
       ↑
orchestrator           (imports from step_registry)
       ↑
index (public API)     (re-exports from orchestrator + step_registry)
```

No arrow should ever reverse. Any new file should fit into this hierarchy or introduce a new, clearly named layer.

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
