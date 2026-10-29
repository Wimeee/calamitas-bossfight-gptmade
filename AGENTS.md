# Development notes

- The game name is **Untitled Terraria Bossfight Game**. Read `ROADMAP.md` for the approved long-term plan. v21 adds Terraria-style movement and the approved left-primary/right-secondary controls. Other class sprite overhauls, new bosses and a full soundtrack remain separate future updates.
- Create a recovery point before major changes. Latest baseline backup branch: `backup/v21-before-canonical-fairness` (the earlier v17 backup is also retained).

- Read `ARCHITECTURE.md` before structural edits. Keep `index.html` for markup and `styles/` for CSS.
- Preserve desktop and mobile controls, the five existing classes, and all encounter phases unless the user asks to change them.
- Put class logic in `src/classes/`, boss attacks in `src/boss/`, and general battle systems in `src/systems/`. Keep damage and resource changes out of rendering code.
- Use the class registry for attacks and abilities. Do not add replacement copies of existing functions or sprite definitions.
- Use `npm run check` and the tests appropriate to a change. Run the full suite before publishing a release; avoid repeating unrelated checks after they pass.
- Use `npm run release -- <version> "<notes>"` to update resource versions together. Do not hand-edit only `version.json`.
- After publication, verify GitHub Pages deployment and the live version. Distinguish automated checks from a real fight or physical-phone test.
- Menu lifecycle lives in `src/ui/menu.js`, preferences in `src/core/settings.js`, and decorative animation in `src/render/menu-background.js`. Menu animation must stop during battles, and game input/update must not run behind the menu.
- Binary menu assets belong in `assets/menu/` with provenance in `ASSETS.md`; never commit local `test-artifacts/` previews.

- User preference: minimize quota spent on verification. For presentation-only changes, run the structural check and a focused visual inspection; do not repeat the full combat suite without a concrete gameplay risk. The explicit user request overrides the generic full-suite release guideline above. Battle presentation overrides live in `styles/battle.css`; preserve the mobile focus layout and canvas/input coordinate agreement.

- Player movement is now platformer physics in `game/movement.js` and `world/terrain.js`. Never reintroduce direct free-flight position updates. Space is reserved for jump/flight; attack is LMB and ability RMB. Platform terrain art remains cached to preserve the measured FPS fix.
