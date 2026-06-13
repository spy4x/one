import type { Handlers } from "fresh";

export const handler: Handlers = {
  async POST(req) {
    try {
      const { task, tasks, apiKey } = await req.json();

      if (!apiKey) {
        return new Response(
          JSON.stringify({ message: "Соберись! Ты можешь больше." }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const tasksList = (tasks || [])
        .map((t: { text: string; time?: string }) =>
          `- ${t.text}${t.time ? ` (${t.time})` : ""}`
        )
        .join("\n");

      const prompt =
        `Пользователь застрял на задаче и нажал SOS.

Текущая задача: ${task || "неизвестно"}

Весь план на день:
${tasksList || "нет плана"}

Дай жесткий пинок-мотивацию, чтобы вывести из ступора. Учти контекст задачи.
Предложи конкретное действие прямо сейчас (смена обстановки, перерыв, разбивка задачи на микрошаги).
Ответь коротко — 1-2 предложения на русском. Без оформления, просто текст.`;

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
                content: "Ты мотивационный пинок. Отвечай коротко и жестко.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 300,
          }),
        },
      );

      const data = await response.json();
      const message = data.choices?.[0]?.message?.content ||
        "Вставай и делай. Сейчас.";

      return new Response(JSON.stringify({ message }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(
        JSON.stringify({ message: "Вставай и делай. Сейчас." }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
