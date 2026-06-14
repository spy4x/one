# AGENTS.md — The Only One

## Суть

Минималистичный ИИ-планировщик. Решает "паралич анализа": пользователь скидывает хаос мыслей → DeepSeek строит линейную очередь → на экране **строго одна задача**. Пока не сделал — не видишь остальное.

## Команды

```bash
deno task dev        # Vite dev server (HMR) — порт 8000
deno task dev:deno   # Deno dev server (Builder) — порт 8001
deno task build      # Production build via Vite → _fresh/
deno task start      # Production server — `deno serve -A _fresh/server.js`
```

## Деплой

```bash
# Локально: rsync + docker на homelab
rsync -avz --delete \
  --exclude='.git/' --exclude='node_modules/' --exclude='_fresh/' --exclude='*.md' \
  --filter=':- .dockerignore' \
  ./ homelab:~/ssd-2tb/apps/one/ && \
ssh homelab 'cd ~/ssd-2tb/apps/one && docker compose up -d --build'
```

Поддомен: `one.${DOMAIN}` (по умолч. `one.antonshubin.com`).  
Traefik-метки в `compose.yml` — TLS через `myresolver`, сеть `proxy`.

## Структура

```
├── routes/
│   ├── _app.tsx          — тёмная тема, PWA-линки, глобальный <style>
│   ├── index.tsx         — экран ввода контекста
│   ├── focus.tsx         — экран одной задачи
│   └── api/
│       ├── plan.ts       — POST: DeepSeek → план дня (массив tasks)
│       └── sos.ts        — POST: DeepSeek → пинок-мотивация
├── islands/
│   ├── InputForm.tsx     — поле ввода, API-ключ, генерация
│   └── FocusView.tsx     — задача + таймер + кнопки ГОТОВО/SOS
├── static/
│   ├── manifest.json     — PWA manifest
│   ├── sw.js             — service worker (кэш shell)
│   └── icon.svg          — иконка "1"
├── main.ts               — App = new App() + staticFiles() + fsRoutes()
├── dev.ts                — Builder-режим для разработки
├── vite.config.ts        — Fresh Vite plugin
├── client.ts             — точка входа клиента (пусто, без CSS)
├── Dockerfile            — denoland/deno:2.3.1
├── compose.yml           — Traefik labels: one.${DOMAIN}
├── deno.json             — задачи, импорты (jsr:@fresh/core@^2.2.0)
├── deno.lock             — lock-файл
└── docs/
    ├── architecture.md   — архитектура, промпты, data-flow
    └── todos.md          — план доработок
```

## Архитектура

- **Fresh 2.2** (jsr:@fresh/core) + Vite 7 + Preact 10
- **Хранилище**: только localStorage — никакой БД
- **Состояние дня**: `dayDate`, `tasks[]`, `currentTaskIndex`, `dayActive`
- **Сброс дня**: автоматически в полночь (сравнение `dayDate` c today)
- **PWA**: standalone, тёмная тема (#0a0a0a), service worker кэширует shell
- **AI**: DeepSeek API через /api/plan (промпт диспетчера 80/20) и /api/sos (пинок)
- **2 экрана**: контекст-ловушка (`/`) → фокус на одной задаче (`/focus`)
- **zero-fluff UI**: ни одного лишнего элемента, только задача + таймер + кнопки

## Особенности реализации

1. **Handler signature**: API-хендлеры получают `ctx` (FreshContext), не Request.  
   Тело запроса: `await ctx.req.json()`. Ошибка: `req.json()` вызывает `ctx.json()` (= `Response.json()`).

2. **JSON extraction** (`extractJson` в plan.ts): 3 стратегии — парсинг целиком,
   из markdown-блоков ```json, поиск `{…}` в любом тексте.

3. **Таймер**: на фронте считает обратный отсчёт до дедлайна (`task.time`),
   обновляется каждую секунду.

4. **Ошибки**: сервер возвращает `{ error, detail?, raw? }`, клиент показывает
   красным под полем ввода.
