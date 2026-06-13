import type { Handlers } from "fresh";

export const handler: Handlers = {
  async POST(req) {
    try {
      const { context, apiKey } = await req.json();

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

      // Extract JSON from response (strip markdown code fences if present)
      let jsonStr = content.trim();
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const plan = JSON.parse(jsonStr);

      if (!plan.tasks || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
        throw new Error("Invalid response: missing tasks array");
      }

      return new Response(JSON.stringify(plan), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
