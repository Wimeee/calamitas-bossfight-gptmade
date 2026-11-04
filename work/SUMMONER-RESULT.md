# Native summoner preset — v29.0.0

## Loadout and controls

- One Cosmic Energy from Cosmic Immaterializer (10slots), one Fiery Draconid from Yharon's Kindle Staff (5slots), native Kaleidoscope on LMB. RMB only chooses focus, with no invented free volley or cooldown.
- Auric Tesla summon helmet/body/legs, Nucleogenesis, Papyrus Scarab, Necromantic Scroll, shared Wings of Rebirth and Asgardian Aegis. Bewitching and a pre-applied Summoning Potion:1base+2head+4set+4Nucleogenesis+1Papyrus+1Scroll+1Bewitching+1potion=15slots. Potion lasts480combat seconds; expiry lowers capacity14 and removes the5slot Draconid. A new attempt restores the preset.
- Two summons cost10mana each once during preparation. Whip is free; minions attack autonomously. Mana resources remain mage-only. Minion capacity/native buff icons added underHP; UK/EN controls updated.

## Source fidelity

Primary C#: CalamityModPublic1a8cebd27ec5615316b78f71973446b5528d2b78 reports2.2.2; original installed art2.2.4. Exact gap retained in provenance. Equipment is pre-SCal after Exo Mechs, consistent with existing Ark/Photoviscerator progression. Found COMPLETE Summoner Guide Calamity2.0 (YouTube yJtExEWLupo), but playback was unavailable; no video-viewing claim. Official wiki and actual code take priority over stale1.12whip advice.

Cosmic base560,10slots,120Hz native movement and100update cooldown;5–7half-damage bolts and one full star, proper native homing, star288square death area. Draconid base325,5slots,120Hz movement/fire/ram/rebound,2xram contact,60Hz native fireballs. Original minion/projectile sprite frames and sounds retained. Persistent bodies survive worm absorption; outgoing shots stop at nearest worm part; native splash resolves to1per armored part. Invulnerable phases don't bank hits. Phase cleanup keeps entities, clears outgoing projectiles and whip.

Kaleidoscope installed1.4.4:180base/30tick animation/velocity12,40segments/range2.2/extraUpdates1. Actual FillWhipControlPoints decoded from local tModLoader IL; shared animated points drive rendering and collision. Original22x160/5cells texture, native whip crack atmidpoint. Calamity SummonTag gives8flat/10%tagcrit, replacing vanilla20. No old instantaneous850damage cone or35%tag.

Preset additive summon multiplier2.55 from audited armor/accessory bonuses; ordinary minions don't inherit armor crit. Nucleogenesis60base apparatus proc/100worldtick cooldown and native debuff timers; Miracle1500HP/s, Dragonfire480HP/s baseline. No recursive apparatus procs. Existing shared boss DR/rippers/vulnerability approximations remain; full Terraria armor revival/defense engine, Irradiated contact penalty and every engine debuff interaction are not reproduced. This is a playable native preset, not a literal tModLoader engine port.

## Resources and verification

25new original resource files (native RGBA losslessPNG, native Terraria PCM losslessWAV and one original OGG), all hashes recorded. Cached tint sheets, bounded shots/effects, reduced mobile particles. No generated art or synthesized replacement sounds. Existing generic legacy cosmicStar utility retained for old generic-shot integration; production summoner uses the new native controller.

383/383full regression tests pass (58.6sec, concurrency4); first run exposed one obsolete instantaneous-whip fixture, then real sweep/part1damage assertion was verified. Nine new controller tests + two original-resource presentation/audio tests; fixed30/60/120Hz outcomes, slot accounting, no duplicate summons, minion persistence, worm blocking, ram/rebound and potion expiry. Actual desktop/mobile browser galleries inspected,8sample events/9files decoded with no failures or JS errors. No physical-phoneFPS, listening test or natural full-fight duration claim. Manual balance feedback is still valuable.
