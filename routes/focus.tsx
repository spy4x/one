import FocusView from "../islands/FocusView.tsx";

export default function Focus() {
  return (
    <div style={{
      padding: "24px",
      width: "100%",
      maxWidth: "480px",
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
    }}>
      <FocusView />
    </div>
  );
}
