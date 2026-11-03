# Замір v17

Дата: 29.10.2026. Порівняння v16 і модульного коду на цьому комп’ютері. П’ять повторів, медіана; seeded-середовище тестів.

| Обчислення | v16 | v17 |
|---|---:|---:|
| 30 000 пошуків найближчої цілі серед 10 ворогів | 302.59 мс | 16.94 мс |
| 1200 оновлень симуляції, Summoner | 43.37 мс | 46.89 мс |

Пошук цілі став дешевшим завдяки видаленню копіювання та сортування масиву. У повній симуляції явного прискорення не встановлено: результати мають розкид. Це CPU-замір Node із підмінним Canvas; він не вимірює браузерний FPS, GPU, затримки телефона чи плавність рендерингу.

Повторити поточний замір: `npm run benchmark`. Порівняння потребує історичного HTML v16; він доступний у Git. Сирі дані: [benchmarks/v17-cpu.json](benchmarks/v17-cpu.json).

## v20.0.1 — browser rendering profile

A local browser profile used the actual renderer, a fixed mixed set of 240 enemy projectiles, High graphics, 1.6-second samples and eight warm-up frames. Before: median RAF interval 33.3 ms (44 sampled frames); disabling live shadow blur gave 5.6 ms. After caching projectile glows and arena surfaces: median RAF interval 5.6 ms (213 frames), with glows enabled. Median JavaScript draw submission remained about 1.3 ms in both versions; the improvement is in raster/compositor work, not simulation. The browser was uncapped; these numbers are comparative test-environment measurements, not promised player-device FPS.

Projectile glow textures are bounded to 96 variants. Arena gradient/grid/border rebuild only when arena bounds or Low/High mode change. Ritual spark halos use the same cache. A focused test verifies no new raster surfaces over 40 warmed dense-bullet frames and no projectile-state mutation. No damage, speed, projectile count or collision changes. Baseline commit: 3bfdf6e57e6fc6d878bbe421dd03dcc76c4d62c7.


## v26.0.1 text raster cache
Actual Edge Canvas isolated test: 90 outlined combat labels across120 frames, after10 warm-up frames. Before1291.2ms/162000 destination draw calls; after216.3ms/10800 calls. About6x faster text submission, 15x fewer destination submissions. This is NOT full-fight FPS and does not establish120FPS on the user device. Bitmap labels retain native fonts, outline, tint, scale and locale. Cache limited128 entries and262144pixels per label, unloaded font pages bypass it. No combat changes.


## v26.0.3 — full-scene profile and FPS meter
Controlled Edge browser scenes used the complete loaded game renderer on High,1920x1080 viewport and1280x720 backing canvas. Simulation CPU time was generally about0.1ms; dense Ark lighting dominated drawing. Final Ark-heavy median draw submission7.2ms versus19.8ms baseline; Ark subpass5.9ms versus19.4ms. Tail samples still varied considerably; these are comparative CPU submission measurements, not guaranteed120FPS or full-GPU frame times. See benchmarks/v26.0.3-browser.json.
Native light layers are precomposed with opacity applied before additive blending (128opacity steps), keeping native textures, particles, trajectories and lifetimes. Tint cache is capped96entries and light cache192entries (~43MB with supplied textures). Browser comparison of160lights had mean RGB difference0.086/255; minor subpixel/opacity differences remain, no claim of bit-exact pixels. A shared-transform-only fallback was measured but not shipped because it did not remove enough submission work.
FPS overlay defaults on and can be disabled in graphics settings. Current FPS uses500ms windows; minimum is the inverse slowest raw RAF interval in the current attempt, before simulation dt clamp. It includes real short hitches, including cold-start stalls. New game resets minimum; pause/menu and document visibility events invalidate the timestamp baseline without clearing the previous minimum. Hidden tabs skip simulation/render work. No framerate cap is introduced.


## v26.0.4 — Firefox sword texture churn
User reproduced drops only while attacking with Ark. Installed Firefox159 live-RAF tests confirmed steady attacks still allocated200new canvases over6.5seconds, up to13per frame; the96entry tint cache could not retain the recurring palette. Updated it to256entry LRU with16Mpixel budget, normalized cyclic hues and prewarmed the native sword/constellation palette. Retired compatible surfaces are reused (pool capped8surfaces/1Mpixel), and completed static tints become immutable ImageBitmaps where supported, with safe disposal and a Canvas fallback. Smoke caches individual original80x80cells (last column79px) rather than resampling a559x480sheet on every particle. Frame cache capped384entries. Texture/particle counts and combat mechanics remain unchanged.
After preparation, steady attacks in a recorded Firefox run created46new canvases/6.5s(max1/frame), and tint rasterizations stopped increasing. Frame-time results remained variable (recorded attack p95~27.8ms vs33.3ms baseline; other runs were slower), so this does not establish120FPS or guarantee all drops gone. Cold GPU/text first-use hitches can remain. benchmarks/v26.0.4-firefox.json contains raw data. Transparent battle Canvas was retained after an opaque-context experiment performed worse.
Main menu now starts resource preparation in the background and awaits it before a new fight, displaying Preparing when needed. Game clock remains stopped; leaving setup cancels delayed launch. Existing synchronous start API remains for tests/debug. Initial test preparation took roughly2.6–6.5seconds in fresh isolated Firefox profiles; later launches reuse it.


## v26.0.5 — native backdrop resampling
A second Firefox diagnostic found significant cost in drawing the1200x1200native backdrop at a different scale on every frame. Cache one raster at the current backing resolution, keep native source/cover geometry, ambient position, camera tracking, all sword effects and combat unchanged. Reuse on zoom; rebuild on resize/smoothing/source change. One surface capped16Mpixels; oversized requests use original image. Alternating frozen-scene Firefox test (18Ark particles,0shots) recorded original medians27.8/27.8ms, cached27.8/22.2ms; p95 fluctuated and one cached run was slower. Mean image RGB difference0.029/255. This is a bounded rendering improvement, not a claim that user-device drops or120FPS are solved. Raw data: benchmarks/v26.0.5-firefox.json. Focused11checks passed, structural143modules154assets; no unchanged full combat suite repeated for presentation-only change.


## v26.0.6 — skip invisible native rendering
Audit of worm,brothers,BH4/Maelstrom and heavy Ark effects confirmed rendering rather than simulation dominates these samples. No universal120FPS claim. Added conservative screen bounds for native hostile sprite cells (including alt frames), Ark lights/sparkles and generic Ark particle images. Bounds include affine camera transforms, rotations/reflections, source anchors, full glow size and a2pixel margin. Individual trail samples remain tested independently; an offscreen projectile head cannot hide a visible trail. Lights skip before opacity raster creation. Simulation, lifetimes, damage and visible effects are unchanged. Missing/invalid transform APIs fall back to original rendering.
In an identical synthetic stress frame (500projectiles,600native hit particles,many offscreen), destination draws fell2213to613; Edge CPU draw submission11.93to8.89ms, Firefox59.97to47.4ms. Both browsers showed0different pixel channels. These absolute times reflect isolated headless profiles, not player-device FPS. Mostly visible-scene timings varied: heavy Ark median6.5to6.7ms in separate Edge runs, so do not claim universal speedup. Focused21checks pass, structural144modules155assets. Raw data: benchmarks/v26.0.6-culling.json.
