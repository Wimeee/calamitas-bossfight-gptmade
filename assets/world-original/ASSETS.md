# Original local game artwork

Private local prototype only; no publication authorized. Artwork remains owned by its respective creators (Calamity Mod team / Re-Logic). This folder does not confer a redistribution license.

- `altar-assembled.png`: CalamityMod2.2.4 `Tiles/Furniture/CraftingStations/SCalAltarLarge.rawimg`, 5x3 tiles assembled to80x48 without gutters. Current placed Altar of the Accursed. Source layout: pinned Calamity commit1a8cebd27ec5615316b78f71973446b5528d2b78, `Tiles/Furniture/CraftingStations/SCalAltar.cs`, class SCalAltarLarge. Art version and behavior source are intentionally recorded separately.
- `CeremonialUrn.png`: CalamityMod2.2.4 `Items/SummonItems/CeremonialUrn.rawimg`, original34x54 item sprite.
- `campfire-assembled.png`: locally installed Terraria `Content/Images/Tiles_215.xnb`, style0, first8 frames; 3x2 tiles per frame, native48x32, arranged vertically. Tile gutters removed only.
- `heart-lantern-assembled.png`: locally installed Terraria `Content/Images/Tiles_42.xnb`, HangingLanterns style9, lit column, native16x32. Tile gutters removed only. Identity: https://terraria.wiki.gg/wiki/Tile_IDs/Part2

RGBA colors retained; no generated artwork, recoloring or background removal. `manifest.json` includes source and derived SHA256 hashes; entries also document intermediate extraction assets retained under work/local-art, not all copied here.

Reproducible extraction script: work/prepare-original-art.cjs. Raw format documented by tModLoader ImageIO.cs. XNB decompressor is work-only xnb@1.3.0 (bundle header1.2.1), LGPL-3.0; its code is not part of the browser game.
