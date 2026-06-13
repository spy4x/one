import { useState } from "preact/hooks";

export default function InputForm() {
  const [context, setContext] = useState("");
  const [apiKey, setApiKey] = useState(() =>
    typeof localStorage !== "undefined"
      ? localStorage.getItem("deepseek_api_key") || ""
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError("Укажи API-ключ DeepSeek");
      return;
    }
    if (!context.trim()) {
      setError("Напиши, что планируешь");
      return;
    }

    setLoading(true);
    setError("");

    localStorage.setItem("deepseek_api_key", apiKey);
    localStorage.setItem("last_context", context);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, apiKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка сервера");
      }

      localStorage.setItem("tasks", JSON.stringify(data.tasks));
      localStorage.setItem("currentTaskIndex", "0");
      localStorage.setItem("dayDate", new Date().toDateString());
      localStorage.setItem("dayActive", "true");

      globalThis.location.href = "/focus";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  };

  const hasExistingDay = typeof localStorage !== "undefined" &&
    localStorage.getItem("dayActive") === "true";

  const handleResume = () => {
    globalThis.location.href = "/focus";
  };

  const handleReset = () => {
    localStorage.removeItem("dayActive");
    localStorage.removeItem("tasks");
    localStorage.removeItem("currentTaskIndex");
    localStorage.removeItem("dayDate");
    setContext("");
  };

  return (
    <div>
      {hasExistingDay && (
        <div style={{
          background: "#141414",
          border: "1px solid #222",
          borderRadius: "12px",
          padding: "14px 16px",
          marginBottom: "16px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: "14px", color: "#888" }}>
            Есть активный день
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleResume}
              style={{
                padding: "8px 16px",
                background: "#e0e0e0",
                color: "#0a0a0a",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Продолжить
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: "8px 16px",
                border: "1px solid #333",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#666",
              }}
            >
              Сбросить
            </button>
          </div>
        </div>
      )}

      <textarea
        placeholder={"Тренировка в 18:00, курьер до 13:00,\nдопилить сайт, отправить 2 заявки..."}
        value={context}
        onInput={(e) => {
          setContext((e.target as HTMLTextAreaElement).value);
          setError("");
        }}
        style={{
          width: "100%",
          minHeight: "160px",
          background: "#141414",
          border: "1px solid #222",
          borderRadius: "12px",
          padding: "16px",
          fontSize: "16px",
          lineHeight: "1.5",
          resize: "none",
          outline: "none",
          color: "#e0e0e0",
          fontFamily: "inherit",
        }}
      />

      <div style={{ marginTop: "12px" }}>
        <label style={{
          display: "block",
          fontSize: "12px",
          color: "#555",
          marginBottom: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          API-ключ DeepSeek
        </label>
        <input
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onInput={(e) => {
            setApiKey((e.target as HTMLInputElement).value);
            setError("");
          }}
          style={{
            width: "100%",
            background: "#141414",
            border: "1px solid #222",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "14px",
            outline: "none",
            color: "#e0e0e0",
            fontFamily: "monospace",
          }}
        />
      </div>

      {error && (
        <p style={{
          color: "#ff4444",
          fontSize: "13px",
          marginTop: "10px",
          lineHeight: "1.4",
        }}>
          {error}
        </p>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: "16px",
          padding: "14px",
          background: loading ? "#1a1a1a" : "#e0e0e0",
          color: loading ? "#555" : "#0a0a0a",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: 600,
          transition: "all 0.15s",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Думаю..." : "Сгенерировать фокус"}
      </button>
    </div>
  );
}
