# Infernum-style Calamitas intro

Replaces the invented sigil/title with the original ritual/title sequence. Calamity SCalRitualDrama:270ticks of upward red/magenta dust, growing bloom/darkness, final laugh/90dust burst/dual pulse. Infernum SCalIntroScreen:300ticks, native DynamicSpriteFont, black THanosAura cover, first line revealed after40%, name revealed together at newline, original Item100 on letter additions, four afterimages, final23% text fade.

Infernum source pinned399342f1d21dba29de5576f251ab95a02eaeb449: Content/BossIntroScreens/InfernumScreens/SCalIntroScreen.cs, BaseIntroScreen.cs, Assets/Effects/Shapes/SCalIntroLetterShader.fx, Localization/en-US.hjson. Calamity source pinned1a8cebd27ec5615316b78f71973446b5528d2b78: Projectiles/Boss/SCalRitualDrama.cs. Calamity code2.2.2 versus installed art2.2.4 remains explicit.

Original font decoded using installed ReLogic DynamicSpriteFontReader IL; retain3pages/37UK-EN glyphs. Native font deliberately renders Latin lowercase i as a dot (10x9 source rectangle); not a missing texture. Original PNG pixels, cover, Perlin noise and PCM Item100; integrity hashes in assets/intro-original/provenance.json. Canvas port of native per-letter shader at24Hz on reused glyph surfaces. Bloom tints warmed before entry, no per-frame surface allocation. Attribution in ASSETS/credits.

This is a browser presentation adaptation, not a verified pixel-identical GPU port. Deterministic dust replaces native random particles; screen shake honors existing setting. Existing battle remains paused until title finishes, unlike the independent native overlay. Does not enable Infernum AI/difficulty or change class/boss balance. UK translation and smaller viewport fit added. Existing skip/pause/menu/restart maintained; sounds emitted by update, never draw. No combat RNG consumed by presentation.

Validation:18focused ritual/title/music/media tests passed; structural check. Actual English/UK browser contact sheets viewed, no JS errors. No original game video newly watched, no physical-phone/audio-listening claim.
