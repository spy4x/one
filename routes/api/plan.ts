import type { Handlers } from "fresh";

/** Try multiple strategies to extract a JSON object from AI text output */
function extractJson(text: string): Record<string, unknown> | null {
  const s = text.trim();

  // 1 — try to parse the whole thing as JSON
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // not valid JSON, continue
  }

  // 2 — strip markdown code fences ```json ... ``` or ``` ... ```
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // fall through
    }
  }

  // 3 — find the first { and last } and try that slice
  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const sliced = s.slice(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(sliced);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // fall through
    }
  }

  return null;
}

export const handler: Handlers = {
  async POST(ctx) {
    try {
      const { context, apiKey } = await ctx.req.json();

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "API key required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!context?.trim()) {
        return new Response(
          JSON.stringify({ error: "Context is empty" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const prompt =
        `Ты жесткий диспетчер задач. Пользователь предоставил поток сознания на день.

Контекст пользователя: ${context}

Твоя задача:
1. Вычлени главную задачу дня (правило 80/20 — задача, которая дает максимальный результат).
2. Привяжи остальные задачи к временным маркерам, которые указал пользователь.
3. Построй линейную очередь, где в каждый момент времени активен ТОЛЬКО ОДИН пункт.
4. Учти контекст локации: если что-то не работает дома, добавь шаг "Смена среды".
5. Будь конкретным. Не используй общие фразы.

Ответь строго в формате JSON, БЕЗ лишнего текста и БЕЗ markdown-разметки:
{
  "tasks": [
    {"text": "Описание задачи", "time": "ЧЧ:ММ или null", "duration": "N мин или null", "location": "локация или null"}
  ]
}

ВАЖНО: tasks должен быть массивом минимум из 1 задачи, первая задача — самая срочная/важная.`;

      const response = await fetch(
        "https://api.deepseek.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content:
                  "You are a strict task dispatcher. Always respond in valid JSON only, no markdown.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: data.error?.message || "API error" }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const content = data.choices?.[0]?.message?.content || "";

      if (!content) {
        return new Response(
          JSON.stringify({ error: "Пустой ответ от AI. Попробуй ещё раз." }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      // Extract JSON — try multiple strategies
      const plan = extractJson(content);
      if (!plan) {
        return new Response(
          JSON.stringify({
            error: "AI вернул невалидный JSON. Попробуй ещё раз.",
            raw: content.substring(0, 500),
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!plan.tasks || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
        return new Response(
          JSON.stringify({ error: "AI не создал задач. Уточни планы и попробуй снова." }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify(plan), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      const detail = e instanceof Error
        ? `${e.name}: ${e.message}${e.stack ? "\n" + e.stack.slice(0, 300) : ""}`
        : String(e);
      console.error("[/api/plan] error:", detail);
      return new Response(
        JSON.stringify({
          error: "Внутренняя серверная ошибка. Попробуй ещё раз.",
          detail,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
