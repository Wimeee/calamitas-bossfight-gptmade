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
