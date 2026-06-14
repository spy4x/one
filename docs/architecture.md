# Architecture — The Only One

## Data Flow

```
User input → POST /api/plan → DeepSeek API → { tasks[] } → localStorage
                                                              ↓
User sees → GET /focus → FocusView island → reads localStorage → shows task[0]
                                                              ↓
                                                [ГОТОВО] → currentTaskIndex++
                                                [SOS]    → POST /api/sos → пинок
```

## Prompts

### /api/plan — Диспетчер задач

Роль: "Ты жесткий диспетчер задач."

Правила:
1. Вычленить главную задачу дня (80/20)
2. Привязать остальные к временным маркерам
3. Линейная очередь — активен только один пункт
4. Учесть контекст локации (добавить "Смена среды" если надо)

Формат ответа:
```json
{
  "tasks": [
    {"text": "задача", "time": "ЧЧ:ММ | null", "duration": "N мин | null", "location": "локация | null"}
  ]
}
```

### /api/sos — Пинок

Роль: "Ты мотивационный пинок."

Правила:
- Учесть контекст текущей задачи
- Предложить конкретное действие (смена обстановки, перерыв, микрошаги)
- 1-2 предложения на русском

## State (localStorage)

| Ключ | Формат | Описание |
|------|--------|----------|
| `deepseek_api_key` | string | API-ключ DeepSeek |
| `last_context` | string | Сырой ввод пользователя |
| `tasks` | JSON string | Массив `{text, time?, duration?, location?}` от AI |
| `currentTaskIndex` | number | Индекс активной задачи (0-based) |
| `dayDate` | string | `new Date().toDateString()` — для автосброса |
| `dayActive` | "true" / "false" | Флаг активного дня |

## Компоненты

### InputForm (island)
- textarea для контекста
- input для API-ключа
- Кнопка "Сгенерировать фокус"
- Показывает ошибки красным
- Определяет активный день (предлагает продолжить/сбросить)

### FocusView (island)
- Показывает одну задачу крупным шрифтом
- Таймер/дедлайн (обновляется每秒)
- Кнопка ГОТОВО → следующая задача или "День выполнен"
- Кнопка SOS → модалка с пинком от AI
- Автосброс дня при загрузке

## API Routes

### POST /api/plan
Request: `{ context: string, apiKey: string }`  
Response 200: `{ tasks: Task[] }`  
Response 400/500: `{ error: string, detail?: string, raw?: string }`

### POST /api/sos
Request: `{ task: string, tasks: Task[], apiKey: string }`  
Response 200: `{ message: string }` (фолбэк при ошибке API)

## Error Handling

1. Клиент: `fetch → res.json()` — если res не OK, показать `data.error`
2. Если ответ не JSON — поймать `res.text()` и показать первые 200 символов
3. Сервер: все ошибки обёрнуты в `{ error: "…", detail: "…" }` с 500
4. Сервер логирует в stdout (видно через `docker logs`)

## PWA

- manifest.json: standalone, #0a0a0a, иконка SVG
- sw.js: кэширует `/`, `/focus`, `/manifest.json`, `/icon.svg`
- service worker регистрируется через `<script defer src="/sw.js">`
- Тёмная тема по умолчанию, без переключения

## Известные особенности

1. **Handler signature**: хендлеры получают `ctx` (FreshContext), а не `Request`.
   Тело: `ctx.req.json()`. Не путать с `ctx.json()` (отправить JSON).
2. **JSON парсинг** (`extractJson`): три стратегии на случай, если DeepSeek
   оборачивает JSON в markdown или добавляет текст.
3. **DeepSeek model**: в ответе может быть `deepseek-v4-flash` или другая модель.
   Поле задачи — `text` (не `name`). Если AI поменяет формат — `extractJson`
   отработает, но поля могут не совпасть.
