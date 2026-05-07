---
name: docker-test-fix
description: Run the full test suite inside Docker, inspect failures, and fix them. Use this when asked to run Dockerized tests, diagnose failing tests from a container run, or make the suite pass in Docker.
---

Use this skill to drive Docker-based test debugging end-to-end in this repository.

## Repository-specific entrypoints

- Prefer the existing shell script: `scripts/run-tests-docker.sh`
- Equivalent npm entrypoint: `npm run test:docker`
- The script already handles the Docker image, npm version alignment, dependency install, and `npm test` execution inside the container.

## Workflow

1. Confirm the repository contains `scripts/run-tests-docker.sh`. If it does, use it as the primary entrypoint. If it does not, fall back to `npm run test:docker`.
2. Run the full test suite inside Docker from the repository root.
3. Read the full test output and identify the first concrete failure:
   - failing test names
   - assertion diffs
   - stack traces
   - TypeScript or runtime errors that prevent tests from finishing
   - setup or environment problems in the Docker run itself
4. Fix the underlying repository issue instead of patching around symptoms.
5. Re-run the Docker test command after each meaningful fix until the suite passes or a real blocker remains.

## Repair guidance

- Keep fixes surgical and consistent with existing patterns in `src/` and `src/__tests__/`.
- Prefer fixing production code when the failure reveals a real behavior bug.
- Update tests only when the implementation is correct and the expectation is stale or incomplete.
- Do not hide failures with broad catches, skipped tests, weakened assertions, or environment-specific hacks.
- If Docker-specific behavior differs from the host environment, fix the portability issue so the suite is reliable in Docker.

## Investigation checklist

When reviewing a failed run, explicitly check for:

- path or case-sensitivity issues that appear only on Linux containers
- missing files in package or test inputs
- timing assumptions or order-dependent tests
- Node.js or npm version differences surfaced by the container
- tests that rely on local machine state instead of repository state

## Expected result

Return a concise summary that states:

- which Docker command was used
- what failed
- what was changed to fix it
- whether the Docker test suite now passes, or what blocker remains
