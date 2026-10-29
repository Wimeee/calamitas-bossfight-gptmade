# Untitled Terraria Bossfight Game

Поточний епізод: **Supreme Calamitas — Brimstone Trial**. Повний план наступних оновлень — у [ROADMAP.md](ROADMAP.md).

Фанатський HTML/Canvas-босфайт. П’ять класів, усі наявні фази Calamitas, керування на ПК і телефоні. Версія 17 розділяє код на модулі зі збереженням механік і балансу v16.

[Грати](https://wimeee.github.io/calamitas-bossfight-gptmade/)

## v21.1 — Fairness & Arena View
Бій адаптовано до платформної фізики за [поточним описом Supreme Calamitas](https://calamitymod.wiki.gg/wiki/Supreme_Calamitas): п'ять 15-секундних Bullet Hell із трьома напрямними секціями, розріджені крайові потоки без додаткових Spiral/Cross/Pincer і прицільного черепа; віяла по 8 дротиків, одиночна черга Hellblast, Gigablast, ривки з фіксованим попередженням. Fireblast/Gigablast м'яко наводяться, зупиняються перед рівномірним вибухом. Кількість дротиків у вибуху залежить від складності.

Sepulcher рухається до відьми й випускає прискорюване кільце, брати чергують залпи та зміну сторін, Seekers стріляють синхронно. Друга фаза починається після братів. Maelstrom з'являється біля вівтаря з попередженням; його швидкість та притягання дозволяють утекти бігом. Це браузерна адаптація: швидкості й дистанції підібрано під нашу арену, а допоміжний AI залишається спрощеним.

Нормальний ігровий екран збільшено; кнопка «Екран» вмикає повноекранну арену без фонового малюнка сторінки, з резервним режимом на весь viewport. Урна постійно стоїть по центру другого ярусу; поява гравця та ритуал використовують цю саму платформу. Шкоду класів не змінено. Точка відновлення: `backup/v21-before-canonical-fairness`.

Перевірено автоматично класи, фізику, фази, попередження й вибухи; у браузері — звичайний і повноекранний вигляд. Повне ручне проходження та фізичний телефон не перевірялися.

## v18 — Main Menu

Титульний екран із власною емблемою, ілюстрованим багряним фоном, туманом та іскрами, що піднімаються знизу. Play → Supreme Calamitas → клас і складність → бій. Інші боси поки позначені Coming Soon.

Settings зберігає окремі гучності музики та звуків, якість ефектів, тряску, клавіші дій і мобільні параметри. Музика типово вимкнена. Меню можна відкрити під час бою кнопкою «☰ Меню» або Escape; бій стає на паузу й доступний для продовження.

Перемальовування меню зупиняється під час бою; симуляція бою не працює за меню. Ефекти меню мають власний генератор випадкових чисел і не впливають на патерни боса. Відомості про ілюстрацію та емблему — у [assets/menu/ASSETS.md](assets/menu/ASSETS.md).

## Запуск для розробки

Потрібен Node.js 22 або новіший. Встановлювати пакети не потрібно.

```sh
npm run dev
```

Якщо встановлено лише Node без npm, ті самі дії доступні напряму: `node scripts/server.cjs`, `node --experimental-vm-modules scripts/check.cjs`, `node --experimental-vm-modules --test tests/*.test.cjs`.

Відкрити `http://127.0.0.1:8877`. Для іншого порту встановити змінну `PORT`. Гру слід відкривати через локальний сервер: нативні JavaScript-модулі не призначені для запуску подвійним кліком по HTML.

```sh
npm run check
npm test
```

Перша команда перевіряє синтаксис і зв’язки модулів, шляхи та версію ресурсів. Друга запускає перевірки фаз, класів, керування, променів і арени. Node може показати попередження про експериментальний VM API: він використовується лише тестовим середовищем, у браузері його немає.

## Де що змінювати

| Завдання | Файли |
|---|---|
| Баланс класів / реєстрація поведінки | `config/classes.js` / `src/classes/registry.js` |
| Ark, комбо, SNAP, парирування | `src/classes/melee.js` |
| Нагрів і Exo Shot | `src/classes/ranger.js` |
| Резонанс і Nova | `src/classes/mage.js` |
| Міньйони, хлист, командний залп | `src/classes/summoner.js` |
| Celestus, повернення й stealth | `src/classes/rogue.js` |
| Фази та пороги HP | `src/boss/phases.js` / `config/calamitas.js` |
| Гравець і складності | `config/player.js`, `config/difficulty.js` |
| Підключення босів | `src/boss/registry.js` |
| Атаки боса та Bullet Hell | `src/boss/` |
| Влучання, кулі, промені | `src/combat/` |
| Малювання та спрайти | `src/render/` |
| ПК, сенсор, екранний режим | `src/input/` |
| Загальні майбутні системи | `src/systems/` |
| Стилі | `styles/` |

Подробиці та порядок додавання нових механік — у [ARCHITECTURE.md](ARCHITECTURE.md).

## Керування

- ПК: WASD / стрілки — рух, ПКМ — атака, ЛКМ — уміння класу, Space — ривок, H — лікування, B — регенерація, P — пауза, R — новий бій.
- Телефон: рух стіком, автоматичне наведення й атака, окремі кнопки уміння, ривка та зіль. Доступне ручне наведення.
- Клас обирається до початку бою й фіксується на весь бій.

## Публікація

Проєкт залишається звичайним статичним сайтом. Збірка, npm-залежності та сторонній ігровий рушій не потрібні. GitHub Pages публікує файли з `main`; workflow `Game checks` додатково перевіряє зміни.

Перед новою версією:

```sh
npm run release -- 17.0.1 "Короткий опис змін"
npm run check
npm test
```

Команда `release` узгоджує версії HTML, імпортів, CSS, runtime-конфігурації та `version.json`, щоб браузер завантажував нові модулі. Вона не створює коміт і не публікує сайт. Після оновлення `main` потрібно дочекатися успішного Pages deployment і перевірити живу версію.

Проєкт — неофіційна фанатська робота за мотивами Calamity Mod. Намальовані всередині гри спрайти та процедурні звуки не є офіційними ресурсами мода.


## v19 — Summoning Ritual

New approved flaming title logo. Enter the arena, move close to the urn, then press **E / Enter** or tap **Викликати**. The ritual gathers embers into rotating sigils, darkens the arena, reveals the title letter by letter and summons Calamitas. **Enter / Space** or **Пропустити інтро** skips the animation after its first moment. Pause/menu/resume work during preparation and the intro. Combat time and resources stay frozen until the original first Bullet Hell begins. No class balance or enemy sprite overhaul in this release. Restore point: `backup/v18-before-summoning-ritual`.

## v19.1 — Battle UI

The battle screen now shares the menu atmosphere: dim illustrated backdrop, compact gold-and-brimstone HUD, viewport-sized arena, dropdown battle options, collapsible controls/phase guide, refreshed result overlay and mobile controls. Gameplay and canvas coordinates are unchanged. Validation was limited to structural/module checks and desktop/mobile visual inspection as requested; no repeated combat suite. Restore point: `backup/v19-before-battle-ui`.

## v19.1.1 — FPS hotfix

Remove battle-wide `:has` selectors and the fixed body background; keep the illustrated backdrop on a separate static layer. Isolate canvas painting, remove the large arena shadow/backdrop blur, and disable animated HUD bar widths. Ritual controls now write DOM properties only when values change. Low quality omits the decorative battle background. Targeted ritual tests include zero unchanged control writes over 120 preparation frames; no claim of device-specific FPS. Previous recovery commit: ae072efd9635a42060441ed2fc9ec2291a8ae320.

## v20 — Sprite Era I: Melee

Only the warrior receives the supplied armor and Ark artwork. Animated armor covers idle, horizontal/vertical movement, dash, hurt and death; Ark uses sprite frames for held scissors, slashes, spinning throws, SNAP, parry, Big Rip, bolts and hits. Other classes and all combat values remain unchanged. Source black backgrounds/labels are removed once on load and frames are cached, with procedural fallback if assets cannot load.

Focused validation: existing 52 Ark checks plus sprite matte/pose/fallback tests and browser inspection. Recovery branch: `backup/v19.1.1-before-melee-sprites`.

## v20.0.1 — measured rendering fix

Enemy bullet glows, static arena layers and ritual spark halos are rasterized once and reused. This removes per-frame shadow filtering while preserving projectile bodies and mechanics. In the local 240-bullet browser comparison, median frame interval fell from 33.3 to 5.6 ms; actual device FPS varies. Terraria physics remains a separate next update.

## v20.1 — Warrior Animation Polish

Register armor frames to chest/visor landmarks; run clips at explicit FPS from pose entry (5 idle, 10 run, 7 rise/fall) and drive dash frames from its existing duration. Keep facing stable near vertical aim and freeze the pose on pause. Remove whole-pixel position snapping.

Ark now has continuous blade motion, smooth wind-up/recovery and a tapered, cached cosmic ribbon instead of rotating the six whole slash pictures. Add 36 cached in-between effect frames across open scissors, spin, SNAP, Big Rip and impacts. Source sheets are unchanged; intermediate effects are composited from them during loading. No live blur or per-frame pixel processing.

Focused checks: registered landmarks, frame timing, facing, dash progression, pause, sprite fallback and the existing 52 Ark mechanics/input checks. Terraria physics is reserved for v21. Recovery branch: `backup/v20.0.1-before-animation-polish`.

## v21 — Terraria Movement

The arena now has solid ground and three platform levels. A/D or left/right run with fast acceleration and braking. Space (also W/up) jumps; hold Space in the air to use 2.4 seconds of wings. Landing on ground or a platform refills flight. S accelerates falling; hold S+Space to pass downward through all platforms. No fall damage. Bosses and projectiles pass through platforms.

Desktop controls: **left mouse attacks, right mouse activates the class ability**. Releasing left mouse performs the existing Ark SNAP. Dash with double-tap A/D or left/right, or Left Shift. Settings can disable double-tap and bind dash to another key, middle mouse or mouse side buttons. Existing saved Space-dash settings migrate off Space.

Mobile controls have distinct Jump, Wings and Dash buttons; the stick handles running/downward input. Wing time is shown on the HUD and beside airborne players. Ritual preparation uses the same physics; the urn and campfire are placed on terrain. Maelstrom pull respects terrain collisions.

Validation: full 30-group suite passed after integrating physics and updated input expectations, plus focused checks for later drop-through/mobile refinements. Ground/platform collision, finite wings, refill, frame-rate consistency (30/60/120), input migration, all five classes and existing encounter phases covered. Desktop and 390px mobile layouts inspected; no full physical-phone playthrough. Class damage and encounter schedules are unchanged; further encounter tuning can follow gameplay feedback. Restore point: `backup/v20.1-before-terraria-physics`.
