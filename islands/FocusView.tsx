import { useEffect, useState } from "preact/hooks";

interface Task {
  text: string;
  time?: string | null;
  duration?: string | null;
  location?: string | null;
}

type ViewState =
  | { type: "loading" }
  | { type: "redirect" }
  | { type: "done" }
  | { type: "empty" }
  | { type: "active"; tasks: Task[]; currentIndex: number };

export default function FocusView() {
  const [state, setState] = useState<ViewState>({ type: "loading" });
  const [sosMessage, setSosMessage] = useState("");
  const [showSos, setShowSos] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [timeStr, setTimeStr] = useState("");

  // Initialize: check localStorage, validate day, redirect if needed
  useEffect(() => {
    const dayDate = localStorage.getItem("dayDate");
    const today = new Date().toDateString();

    // Auto-reset at midnight
    if (dayDate !== today) {
      localStorage.clear();
      setState({ type: "redirect" });
      globalThis.location.href = "/";
      return;
    }

    const dayActive = localStorage.getItem("dayActive");
    const stored = localStorage.getItem("tasks");
    const idx = localStorage.getItem("currentTaskIndex");

    if (!stored || dayActive !== "true") {
      setState({ type: "redirect" });
      globalThis.location.href = "/";
      return;
    }

    const tasks: Task[] = JSON.parse(stored);
    const currentIndex = idx ? parseInt(idx, 10) : 0;

    if (tasks.length === 0 || currentIndex >= tasks.length) {
      setState({ type: "done" });
      return;
    }

    setState({ type: "active", tasks, currentIndex });
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (state.type !== "active") return;

    const task = state.tasks[state.currentIndex];
    if (!task?.time || !task.time.includes(":")) return;

    const interval = setInterval(() => {
      const [h, m] = task.time!.split(":").map(Number);
      const deadline = new Date();
      deadline.setHours(h, m, 0, 0);

      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) {
        setTimeStr("⚠️ Время вышло");
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeStr(
          `Осталось ${mins}:${secs.toString().padStart(2, "0")}`,
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  const handleDone = () => {
    if (state.type !== "active") return;

    if (state.currentIndex < state.tasks.length - 1) {
      const next = state.currentIndex + 1;
      localStorage.setItem("currentTaskIndex", next.toString());
      setState({ ...state, currentIndex: next });
      setTimeStr("");
    } else {
      localStorage.setItem("dayActive", "false");
      setState({ type: "done" });
    }
  };

  const handleSos = async () => {
    if (state.type !== "active") return;

    setSosLoading(true);
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: state.tasks[state.currentIndex].text,
          tasks: state.tasks,
          apiKey: localStorage.getItem("deepseek_api_key"),
        }),
      });
      const data = await res.json();
      setSosMessage(data.message || "Соберись!");
    } catch {
      setSosMessage("Выдохни. Встань. Сделай шаг.");
    } finally {
      setSosLoading(false);
      setShowSos(true);
    }
  };

  const handleNewDay = () => {
    localStorage.clear();
    globalThis.location.href = "/";
  };

  // --- Render states ---

  if (state.type === "loading") {
    return null;
  }

  if (state.type === "done") {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: "48px",
          marginBottom: "16px",
          lineHeight: 1,
        }}>
          ✅
        </div>
        <h2 style={{
          fontSize: "24px",
          fontWeight: 600,
          marginBottom: "8px",
          letterSpacing: "-0.3px",
        }}>
          День выполнен
        </h2>
        <p style={{ color: "#666", marginBottom: "32px", fontSize: "15px" }}>
          Все задачи закрыты. Ты молодец.
        </p>
        <button
          onClick={handleNewDay}
          style={{
            padding: "12px 32px",
            background: "#e0e0e0",
            color: "#0a0a0a",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 600,
          }}
        >
          Новый день
        </button>
      </div>
    );
  }

  if (state.type !== "active") {
    return null;
  }

  const task = state.tasks[state.currentIndex];
  const isUrgent = timeStr === "⚠️ Время вышло";

  return (
    <>
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
        {/* Task counter */}
        <p style={{
          fontSize: "11px",
          color: "#444",
          marginBottom: "20px",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          fontWeight: 500,
        }}>
          Задача {state.currentIndex + 1} / {state.tasks.length}
        </p>

        {/* The one task */}
        <h2 style={{
          fontSize: "clamp(24px, 6vw, 36px)",
          fontWeight: 500,
          lineHeight: "1.35",
          letterSpacing: "-0.5px",
          marginBottom: "16px",
          wordBreak: "break-word",
        }}>
          {task.text}
        </h2>

        {/* Location */}
        {task.location && (
          <p style={{
            fontSize: "13px",
            color: "#666",
            marginBottom: "6px",
          }}>
            📍 {task.location}
          </p>
        )}

        {/* Duration hint */}
        {task.duration && !task.time && (
          <p style={{
            fontSize: "13px",
            color: "#555",
            marginBottom: "6px",
          }}>
            🕐 {task.duration}
          </p>
        )}

        {/* Time marker / countdown */}
        {task.time && (
          <p style={{
            fontSize: "18px",
            fontWeight: 600,
            color: isUrgent ? "#ff4444" : "#888",
            marginTop: "4px",
            fontVariantNumeric: "tabular-nums",
            fontFamily: "monospace",
          }}>
            {task.time && !timeStr ? `⏰ ${task.time}` : timeStr}
          </p>
        )}
      </div>

      {/* Bottom actions */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginTop: "auto",
        paddingBottom: "16px",
      }}>
        <button
          onClick={handleSos}
          disabled={sosLoading}
          style={{
            flex: 1,
            padding: "14px 12px",
            border: "1px solid #222",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#666",
            transition: "all 0.15s",
            opacity: sosLoading ? 0.5 : 1,
          }}
        >
          {sosLoading ? "..." : "SOS"}
        </button>
        <button
          onClick={handleDone}
          style={{
            flex: 2,
            padding: "14px",
            background: "#e0e0e0",
            color: "#0a0a0a",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          ГОТОВО
        </button>
      </div>

      {/* SOS Modal */}
      {showSos && (
        <div
          onClick={() => setShowSos(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#141414",
              border: "1px solid #222",
              borderRadius: "16px",
              padding: "28px 24px",
              maxWidth: "400px",
              width: "100%",
            }}
          >
            <p style={{
              fontSize: "17px",
              lineHeight: "1.55",
              marginBottom: "24px",
              color: "#e0e0e0",
            }}>
              {sosMessage}
            </p>
            <button
              onClick={() => setShowSos(false)}
              style={{
                width: "100%",
                padding: "12px",
                background: "#e0e0e0",
                color: "#0a0a0a",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              Понял
            </button>
          </div>
        </div>
      )}
    </>
  );
}
