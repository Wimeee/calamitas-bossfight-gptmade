# Development notes

- The game name is **Untitled Terraria Bossfight Game**. Read `ROADMAP.md` for the approved long-term plan. v19 adds the approved title logo and summoning ritual. Sprite overhaul, physics, new bosses and a full soundtrack remain separate future updates.
- Create a recovery point before major changes. Latest baseline backup branch: `backup/v18-before-summoning-ritual` (the earlier v17 backup is also retained).

- Read `ARCHITECTURE.md` before structural edits. Keep `index.html` for markup and `styles/` for CSS.
- Preserve desktop and mobile controls, the five existing classes, and all encounter phases unless the user asks to change them.
- Put class logic in `src/classes/`, boss attacks in `src/boss/`, and general battle systems in `src/systems/`. Keep damage and resource changes out of rendering code.
- Use the class registry for attacks and abilities. Do not add replacement copies of existing functions or sprite definitions.
- Use `npm run check` and the tests appropriate to a change. Run the full suite before publishing a release; avoid repeating unrelated checks after they pass.
- Use `npm run release -- <version> "<notes>"` to update resource versions together. Do not hand-edit only `version.json`.
- After publication, verify GitHub Pages deployment and the live version. Distinguish automated checks from a real fight or physical-phone test.
- Menu lifecycle lives in `src/ui/menu.js`, preferences in `src/core/settings.js`, and decorative animation in `src/render/menu-background.js`. Menu animation must stop during battles, and game input/update must not run behind the menu.
- Binary menu assets belong in `assets/menu/` with provenance in `ASSETS.md`; never commit local `test-artifacts/` previews.
