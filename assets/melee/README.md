# Melee sprite sources

Both PNG sheets were supplied by the user in this chat and are preserved unchanged. They are used only for Melee armor and Ark of the Cosmos visuals. No authorship/license metadata was attached to the files.

- `armor-source.png`: 1672×941; idle, run, rise, fall, dash, hurt and death poses.
- `ark-source.png`: 1672×941; closed/open scissors, slash, spin, SNAP, Big Rip, bolts and impacts.

`config/melee-sprites.js` defines explicit crops and hand/body anchors. `render/melee-atlas.js` removes the external black matte and sheet labels once during loading, preserving enclosed dark armor. Prepared frames use ImageBitmap where available. The render loop only selects a cached frame and draws it; it never scans pixels or decodes images. If loading fails, existing procedural graphics remain available.
