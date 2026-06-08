# Agent Notes

This project is a browser-based retro top-view driving game built with
Three.js. Use these notes as the working contract for future agent changes.

## Workflow

- Do not run the local game or dev server. A human will handle local gameplay
  checks and browser execution.
- Agents may run tests and builds only:
  - `npm test`
  - `npm run build`
- Do not automatically run tests or builds after every agent task.
- Do not test after every small edit, and do not treat test/build as a required
  handoff step for ordinary work.
- Run tests and builds before committing code changes, or when the user
  explicitly asks for verification.
- Avoid adding obvious tests that only restate constants, imports, or trivial
  behavior. Add tests when they protect non-obvious game logic, map generation,
  collision behavior, or regressions that are realistic to break.

## Tuning And Constants

- Gameplay and presentation tuning values belong in `src/constants.js`.
- This includes driving feel, camera behavior, effects, gas, enemies, crashes,
  timing, counts, radii, speeds, lerp factors, and similar values that affect
  game play or visual staging.
- Keep local implementation details in the owning module when they are not
  meaningful tuning knobs, such as one-off geometry math, temporary variables,
  or private helper calculations.
- If a change introduces a new reusable tuning value, add it to
  `src/constants.js` and import it where needed instead of scattering literals.

## Implementation Style

- Prefer the existing small-module structure under `src/`.
- Keep changes narrowly scoped to the requested behavior.
- Respect map-specific data in `src/maps/`; shared map behavior should stay in
  `src/map.js`.
- Browser-facing modules such as `scene.js`, `car.js`, and `ui.js` may be hard
  to test directly in Node. Favor pure helper extraction only when it makes the
  code clearer or protects meaningful behavior.
- Preserve existing user changes in the worktree. Do not revert or overwrite
  unrelated edits.

## Verification

Do not run verification automatically after every agent change. Before
committing code changes, or when the user explicitly asks for verification, run:

```sh
npm test
npm run build
```

If either command cannot be run, report why and describe the remaining risk.
