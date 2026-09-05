import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AppealDeck — Decode your Amazon notice. Draft your POA. You submit yourself.";
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0f",
        color: "#e4e4e8",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "8px",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="32" height="32" rx="7" fill="#10b981" />
          <path d="M9 11h7M9 15h10M9 19h6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="20" cy="19" r="4" fill="none" stroke="#ffffff" strokeWidth="2" />
          <line
            x1="23"
            y1="22"
            x2="26"
            y2="25"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>
          Appeal<span style={{ color: "#10b981" }}>Deck</span>
        </span>
      </div>
      <p
        style={{
          fontSize: 18,
          color: "#a1a1aa",
          maxWidth: "520px",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Decode your Amazon notice. Draft your POA. You submit yourself.
      </p>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
