# Development notes

- Read `ARCHITECTURE.md` before structural edits. Keep `index.html` for markup and `styles/` for CSS.
- Preserve desktop and mobile controls, the five existing classes, and all encounter phases unless the user asks to change them.
- Put class logic in `src/classes/`, boss attacks in `src/boss/`, and general battle systems in `src/systems/`. Keep damage and resource changes out of rendering code.
- Use the class registry for attacks and abilities. Do not add replacement copies of existing functions or sprite definitions.
- Use `npm run check` and the tests appropriate to a change. Run the full suite before publishing a release; avoid repeating unrelated checks after they pass.
- Use `npm run release -- <version> "<notes>"` to update resource versions together. Do not hand-edit only `version.json`.
- After publication, verify GitHub Pages deployment and the live version. Distinguish automated checks from a real fight or physical-phone test.
