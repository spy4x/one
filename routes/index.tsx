import InputForm from "../islands/InputForm.tsx";

export default function Home() {
  return (
    <div style={{
      padding: "24px",
      width: "100%",
      maxWidth: "480px",
      display: "flex",
      flexDirection: "column",
      minHeight: "100dvh",
    }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontSize: "22px",
          fontWeight: 700,
          letterSpacing: "-0.5px",
          marginBottom: "6px",
        }}>
          The Only One
        </h1>
        <p style={{ fontSize: "14px", color: "#555" }}>
          Сбрось хаос — получи фокус
        </p>
      </div>
      <InputForm />
    </div>
  );
}
