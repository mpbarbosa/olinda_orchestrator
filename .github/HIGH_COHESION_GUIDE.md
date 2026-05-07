# High Cohesion Guide

A module or class has high cohesion when every element it contains serves a single, well-defined purpose. Apply this guide to all code added or modified in `olinda-orchestrator`.

## Principles

**One responsibility per module.** A source file should be answerable in one sentence: "This module _____." If the sentence requires "and", split the file.

**One responsibility per function.** A function should do one thing and do it completely. Validation, transformation, and I/O belong in separate functions.

**Group by concept, not by type.** Avoid files that collect all interfaces, all utilities, or all helpers regardless of domain. Keep types and their related logic together.

## Patterns to Follow

- `generic_step_registry.ts` — pure helper functions that operate on step data; no registry state
- `step_registry.ts` — registry class and step definition logic; imports helpers, does not re-implement them
- `orchestrator.ts` — self-contained step execution lifecycle; keeps pipeline running concerns separate from registry metadata concerns

## Signs of Low Cohesion to Avoid

- A file that has grown a "misc" or "utils" section
- A class with methods that do not share data or purpose
- Functions that accept a flag parameter to switch between two different behaviours
- A module that must be imported by every other module in the project

## Checklist for Review

- [ ] The module's responsibility fits in one sentence
- [ ] Every exported symbol is directly related to that responsibility
- [ ] No function does more than one conceptual thing
- [ ] Private helpers live next to the code that uses them, not in a shared grab-bag
