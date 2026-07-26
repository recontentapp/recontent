import { style } from "@vanilla-extract/css";

export const page = style({
  backgroundColor: "#f7f7f7",
  color: "#111111",
  fontFamily: "system-ui, sans-serif",
  minHeight: "100vh",
  padding: "48px",
});

export const panel = style({
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  maxWidth: "640px",
  padding: "32px",
});

export const eyebrow = style({
  color: "#666666",
  fontSize: "14px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
});

export const title = style({
  fontSize: "32px",
  lineHeight: 1.1,
  margin: 0,
});

export const copy = style({
  lineHeight: 1.5,
  margin: 0,
});
