import { style } from "@vanilla-extract/css";
import { vars } from "../../src/generated/tokens.css";

export const page = style({
  minHeight: "100vh",
  padding: "48px 24px",
  backgroundColor: vars.system.colors.backgroundBody,
});

export const container = style({
  maxWidth: "1080px",
  margin: "0 auto",
});

export const sidebar = style({
  position: "sticky",
  top: "24px",
  alignSelf: "start",
  backgroundColor: vars.system.colors.backgroundCard,
});
