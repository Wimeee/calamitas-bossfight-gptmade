# Карта проєкту

`index.html` містить розмітку й підключає `src/main.js`. Точка входу ініціалізує спрайти, кнопки, керування та перевірку оновлень. Весь робочий код — нативні ES-модулі з явними імпортами. Сторонні пакети й крок збірки не потрібні.

У HTML є автоматично створені `modulepreload`-посилання: браузер може завантажувати модулі паралельно, не чекаючи послідовного відкриття їхніх залежностей. `npm run release` оновлює цей список і версії ресурсів разом.

Назва проєкту та погоджені наступні етапи зафіксовані в [ROADMAP.md](ROADMAP.md).

## Меню v18

`ui/menu.js` керує екранами home/bosses/setup/settings/credits. `state.screen` відділяє меню від бою: `game/loop.js` припиняє цикл за меню, а клавіші бою ігноруються. Повернення в меню ставить бій на паузу; продовження використовує той самий об’єкт стану. Новий бій запускається лише після вибору класу й складності.

`core/settings.js` перевіряє та зберігає параметри в `localStorage` під ключем `utbg_settings_v1`. Якість впливає на малювання, але не на кулі, зіткнення чи шкоду. Звук і музика мають незалежні рівні. `render/menu-background.js` малює декоративні іскри власним генератором випадкових чисел і зупиняється при виході з меню.

## Межі модулів

- `config/`: характеристики гравця, класів, складності й Calamitas; чинні значення перенесені без змін.
- `core/`: розміри, арена, математичні функції, процедурний звук, доступ до DOM і поточний стан програми.
- `game/`: створення та завершення бою, фази, загальне оновлення й цикл кадрів.
- `classes/`: поведінка п’яти класів, їхні ресурси, атаки та уміння. `registry.js` з’єднує клас із його реалізацією.
- `combat/`: вибір цілей, шкода, кулі, промені й загальні дії гравця.
- `boss/`: поведінка Calamitas, Bullet Hell, Maelstrom і додаткові вороги.
- `render/`: візуальні ефекти, сцена та процедурні спрайти. Тут не слід змінювати HP, ману чи cooldown механік.
- `input/`: перетворення вводу ПК і телефона на ті самі бойові дії.
- `ui/`: індикатори, кнопки меню й повідомлення про нову версію.
- `systems/`: загальні системи бою. `updateSystems(dt, game)` уже викликається з оновлення гри; місце під Rage/Adrenaline та інші майбутні механіки.

## Стан і порядок виконання

`core/state.js` містить об’єкт `state`: поточний бій, ввід, режим пристрою та стан циклу кадрів. Модулі імпортують цей об’єкт і змінюють його поля. Глобальні змінні на `window` для гри не створюються.

Усередині `state.game` живуть гравець, бос, вороги, снаряди та ефекти. `game/session.js` створює новий бій; `game/phases.js` делегує переходи активному босу; `boss/phases.js` містить фази Calamitas й очищення атак. Класовий стан `game.player.kit` створюється функцією `kit()`.

`game/loop.js` викликає `update(dt)` лише під час гри, а потім малює сцену. Час механік обчислюється з `dt`, а не з окремих таймерів. Пауза зупиняє симуляцію.

Частина модулів взаємно залежить через функції: наприклад, фази залежать від завершення бою, а завершення — від UI. Не слід запускати бій або малювання на верхньому рівні такого модуля. Визначення функцій та даних безпечні; ініціалізація виконується з `main.js`.

## Додати або змінити клас

1. Змінити параметри зброї у `config/classes.js` і механіку у відповідному `classes/<клас>.js`.
2. Реєстр підтримує `attack(weapon)`, `activate()`, `update(dt)` та `updateCombat(dt)`. Останні два необов’язкові: перший оновлює ресурси на початку кадру, другий — бойові об’єкти після вводу й руху гравця.
3. Для нового класу також додати його в HTML-вибір, узгодити допустимі клавіші й індекси у UI та керуванні. Поточні п’ять індексів ще використовуються в частині візуального коду; це не повністю довільна система плагінів.
4. Додати малювання в `render/`, а перевірки механіки — у `tests/`.

Реєстрація зберігає однакові атаки для ПК і телефона. Уміння слід підключати через `classAbility()`, а не дублювати його в обробнику сенсорної кнопки.

## Додати атаку боса

Механіку додати до відповідного модуля `boss/`. Кулі створювати через `combat/projectiles.js`. Якщо атаці потрібне попередження, додати стан попередження та його малювання в `render/effects.js`, зберігши момент фіксації прицілу й затримку перед випуском. Нову фазу Calamitas додавати до `boss/phases.js` і очищати її об’єкти при виході.

## Додати окремого боса

Додати опис до `boss/registry.js`: `config` (id, name, opening), `createBoss()`, `enter(stage, marker, label)`, `update(dt)`, `updateHazards(dt)`, `afterProjectiles()` та `draw(game)`. AI, фази та малювання нового боса розташувати в окремих файлах. Загальний цикл кадрів уже викликає ці обробники через реєстр. Новий бос також потребуватиме цілей/власних об’єктів і майбутнього UI вибору; це не автоматичний імпорт будь-якого Terraria-боса.

## Додати загальну систему

Створити файл у `systems/`, додати її оновлення в `systems/index.js`, а стан — до `makeGame()`. Ввід підключити в `input/`, індикатор — у `ui/` або `render/`. Обов’язково визначити поведінку під час паузи, смерті, нового бою, невразливих фаз і зміни складності. Rage/Adrenaline в цій версії ще не реалізовані.

## Перевірки

`tests/helpers/fixture.cjs` завантажує справжній граф модулів у контрольованому DOM/Canvas-середовищі. Це перевіряє зв’язки модулів і механіку, але не доводить хорошу графіку чи якісне відчуття бою. `classes.test.cjs` ізолює класові механіки від ворожих атак; `regression.test.cjs` запускає справжні фази та поведінку ворогів.

При рефакторингу v17 окремо порівняно v16 і модульний код: 75 сценаріїв, 375 повних знімків стану, допуск координат 0,000001. Старий моноліт не включено до робочого проєкту; він залишається доступним в історії Git на коміті v16 `0e124dd3a5378f9924b8182a0ff4a20ad0ea5fb5`.


## Ритуал v19

`game/ritual.js` керує підготовкою, відстанню до урни, таймлайном і пропуском; `render/ritual.js` лише малює. Реальні кнопки запуску викликають `start({ritual:true})`. `start()` без параметра залишається прямим входом у бій для регресій і бенчмарків. До завершення ритуалу загальне бойове оновлення не запускається, а атаки, вміння, ривки та зілля заблоковані. Пауза та повернення в меню заморожують той самий стан. Завершення й пропуск використовують єдиний перехід у чинний opening encounter з початкової позиції; таймер бою починається з нуля. Декоративна анімація не витрачає бойовий RNG.

## Sprite Era I — Melee (v20)

`config/melee-sprites.js` stores rectangles and anchors for the two user-supplied sheets in `assets/melee/`. `render/melee-atlas.js` loads and prepares transparent frame caches once; `render/warrior.js` selects armor poses and draws the Ark effects. It reads combat state without changing damage, cooldowns, positions or hitboxes. Player, ritual, weapon, projectile and impact renderers delegate only Melee visuals and retain their procedural fallback. Rise/fall poses follow current vertical movement; this does not introduce jumping or gravity.

## Render caches v20.0.1

`render/glow-cache.js` stores bounded reusable glow stamps; `render/projectiles.js` draws enemy bullets without live per-bullet blur. `render/arena-cache.js` stores the static gradient and arena grid/border, keyed by bounds and quality. Keep dynamic seals, moving sparks, bullet positions and warning animations outside static caches. These modules must never mutate combat state.

## Warrior animation clocks (v20.1)

Armor anchors are registered to stable visor/chest landmarks. `warrior.js` owns visual-only WeakMap clocks keyed by game, so clip playback starts on pose entry and uses FPS rather than cycles/second. Dash animation reads the existing dash duration. Facing uses a small dead zone around vertical aim. Weapon angle/scale transitions affect rendering only. `warrior-trails.js` prepares two tapered trail stamps and rotates them at display rate. `melee-atlas.js` bakes aligned in-between effect frames once and releases intermediate ImageBitmaps. Never move player coordinates, alter hitboxes or retime attacks in these render modules.

## Terraria movement v21

`config/movement.js` configures gravity, acceleration, jump, flight, drop-through and double-tap timing. Horizontal top speed still comes from `config/player.js`. `world/terrain.js` caches geometry by arena bounds; `game/movement.js` handles substepped player-only collisions, grounded/support state, jump buffer/coyote time, finite flight and horizontal dashes. Combat and ritual preparation call the same movement function. Maelstrom displacement goes through the same collision resolver.

Platforms are one-way: ascending players pass through, descending feet land, and holding down alone ignores platforms until released. The floor always catches the player. Damage hitboxes are unchanged. `render/terrain.js` caches floor/platform art; `render/mobility.js` draws lightweight wings and a flight gauge. Warrior poses read grounded state and velocity.

`input/dash-gesture.js` handles non-repeated directional taps. Settings migrate old Space-dash to an available Shift/key, reserve Space for jump/flight, expose double-tap enable/disable and optional middle/side-mouse dash binding. Desktop primary is left mouse, secondary right; release logic and all class labels must match. Mobile Jump and Wings are separate held inputs, reset with the other touch state. Class-only tests isolate movement alongside boss AI; integration/physics tests exercise real movement.

### v21.1 encounter fairness
- `config/encounter-balance.js` owns arena-adapted timing, warning intervals, radial counts and primary-source links. Weapon damage remains in class configs.
- Standard Calamitas no longer calls the historical extra-pattern module. Edge previews are pure and do not consume combat RNG; projectile spawn delays cannot deal damage.
- `world/terrain.js` owns the middle platform and shared altar position; `render/altar.js` paints it into the static terrain cache.
- Desktop focus-mode canvas uses contain letterboxing and `canvasPointToWorld` for matching aim coordinates.

## v22 world and rippers
- `config/world.js` defines tile scale and traversable square dimensions. `world/camera.js` owns simulation-side camera tracking; render modules only read `cameraView`. Mouse coordinates retain a viewport anchor so aim stays correct while scrolling. HUD, threat indicators and minimap use screen coordinates.
- `render/arena-cache.js` crops the large static raster to the viewport. Terrain caches narrow strips and a small altar, instead of another full-world canvas.
- `systems/rippers.js` owns normalized meters, timers, activation, source proximity curve and hit loss; `config/rippers.js` owns constants and sources. Damage multipliers are applied once in `combat/damage.js`, not in each class or renderer. Expert, pause, ritual, restart, death and Acceptance rules are explicit.
- C/V bindings and mobile buttons call the same activation function. No automatic use of a full meter.
