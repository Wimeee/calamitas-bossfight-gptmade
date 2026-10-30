# Calamitas local media test
Original assets: Calamity Mod / Azafure, LLC and the original contributing artists and sound designers.
Pinned source commit: `1a8cebd27ec5615316b78f71973446b5528d2b78`.
Source: https://github.com/CalamityTeam/CalamityModPublic
Original terms: SOURCE-LICENSE.md. These files remain proprietary; this folder does not assert a redistribution license.

This is a local compatibility test, not a public release. Do not publish these assets or upload this working copy to GitHub Pages as though the assets were freely licensed.

manifest.json records original repository paths and Git blob SHA-1 values. Files are byte-identical to the pinned originals.
- hooded.png: primary boss sheet, 120×1302, two columns and 21 rows. Seven groups of six frames.
- unhooded.png: alternate/rematch sheet, 120×1260. Available to the renderer as the optional boss.skin='unhooded' preview skin.
- forcefield.png: original soft field texture. The original ring is shader-driven; Canvas uses a cached approximation.
- immune-ring.png: original SemiCircularSmearVertical texture, used while immune.
- altar.ogg, laugh.ogg, dash.ogg, cast.ogg, big-cast.ogg, hellblast.ogg: six original sound effects. No soundtrack imported.

Animation mapping follows SupremeCalamitas.cs FrameAnimationType and FindFrame. Phase II uses the hooded sheet's punch poses plus a red flame aura. Removing the hood is an alternate/rematch appearance in the source, not the default phase-II transition.
The original shader and Terraria audio engine were not copied. The browser renderer and WebAudio adapter are project-specific implementations.

## User-supplied ready shield
shield.png is the user's 200×200 PNG attachment supplied on 2026-10-30. It replaces the generated ring and the tinted shader mask in the local renderer. It is copied unchanged; only black matte is converted to alpha once at load time, retaining the PNG's red hue, cloudy pattern and rim. The file hash is recorded in manifest.json.
Reference search: https://calamitymod.wiki.gg/wiki/File:Calamitas_Shield.gif (the user's PNG is used directly, not claimed to be byte-identical to that GIF).
