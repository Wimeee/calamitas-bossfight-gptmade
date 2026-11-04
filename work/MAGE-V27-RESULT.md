# Mage / Void Vortex —2026-11-04

Follow-up correction: v27.0.0 mistakenly used bowItem3540 as potion art. Corrected to verified SuperManaPotion2209, with native dimensions and source regression. User's latest318sec fight feedback leads to10%local mage damage nerf. Initial-orb contact policy verified against actual installed2.2.4DLL, unchanged. See BULLET-HELL-CLOCK-RESULT.md; do not repeat the original asset claim without this correction.

User-approved scope: only Void Vortex; no post-Calamitas Vehemence or weapon switching. Replace the old simplified Yharim's Crystal/Nova class. Keep existing encounter, warrior, common Wings of Rebirth/Aegis, controls and per-device camera settings.

## Implemented
- Native130x130 staff, five38x40 orb cells, original Auric magic head on the existing correctly mapped40x56 composite body. Aim/run/air/death-render path shared without changing warrior art.
- Official VoidVortex.cs:49tick use time,70base mana,210base damage,12orbs at90px around the cursor, random shared spin, one stationary4x core. No channel beam or invented alternate fire.
- VoidVortexProj.cs:3updates per60Hz tick; staggered30update beam delays after0..44offset, native spiral/damping, hidden core25updates then1.5scale,90update lifespan,400px explosion,12homing children500updates with20update damage arming, steering/inertia and15sample trails. Rendering and damage are separate; a snapshot prevents newborn children moving on their creation substep.
- ClimaxBeam8px/update,71updates/tick,500update life; actual travelling damage front checks current target and worm geometry in nearest-entry order. No stale-target guaranteed hits. Core splash applies native unbreakable DR/minimum1 to source worm segments; children/direct beams remain absorbed by the existing encounter blocker policy.
- Known equipment passives: Auric mage head +100mana,-20%cost,+22%magic/+10%crit; body+16%damage/+10%crit; legs+12%damage/+10%crit; Ethereal Talisman+60mana,-8%cost,+15%magic/+5%crit and mana magnet.360mana,50mana/cast,39%crit including4%base, no melee3x multiplier.
- Finite encounter loadout60Super Mana Potions,300mana each, automatically used only on insufficient mana. Mana Sickness stacks5sec to10sec and snapshots up to25%damage reduction; real potion stock/icon/debuff clock. Original Item20 cast,Item3 drink,AuricBulletHit explosion through existing bounded sample player/settings.
- AuricRebuke3sec/100HP per second on valid nonworm targets, aggregated quarter-second damage numbers. Native original pulse/bloom/afterimages, cached tint/downsampling, fewer cosmetic trail samples on phones; hostile collision unchanged.
- Removed Nova/resonance labels/secondary action; updated English/Ukrainian descriptions and old tests that specifically required the replaced weapon.

## Verification
Native weapon/lifecycle,30/60/120Hz identical substep result, finite potion/sickness/failure, phase/restart cleanup, current-position ray collision, front-heart/worm/rear-heart ordering, sustained bounded20sec channel, native armor source bounds. Relevant existing class/combat/HUD checks pass. First full run338/339: one old regression demanded the replaced generic impact; updated to native resolved-beam state, regression then passed. Final CI result recorded in release handoff.

Actually viewed six controlled browser frames0,.15,.3,.5,.65,1.1seconds; no runtime exceptions. Fixed opaque rectangular tint found in initial view by preserving native RGB/alpha for additive textures. Not a user-played full fight, physical-phone FPS test or audio-listening claim.

## Fidelity boundaries
Pinned official source1a8cebd27ec5615316b78f71973446b5528d2b78 identifies2.2.2; local original art2.2.4. Code copies used in the audit are retained in the external mage-source folder; provenance.json records native asset hashes. Code/art version gap is explicit. No invented claim of full1:1 current mod behavior.

The browser encounter still has its shared approximate NPC hitboxes/boss incoming balance. Idle mana regeneration20HP/s after1sec delay and finite potion stock are explicit encounter adaptations. Armor defense/DR, Terraria inventory/prefixes and the inherited Tarragon/Bloodflare/Silva full set/proc/revival framework are not simulated. These limits were also present for warrior; this batch supplies the actual weapon and known static equipped bonuses, not an entire tModLoader player engine. No unverified accessory identities from the video have been invented.
