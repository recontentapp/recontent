"use client";

import { useEffect, useState } from "react";
import { Link } from "vocs";
import { Underline } from "../doodles.tsx";
import { CodePanel, lines, type Line } from "./CodePanel.tsx";

const STEP_DURATION_MS = 6000;

type Step = {
  id: string;
  title: string;
  command: string;
  code: Line[];
  tone?: "coral" | "blue";
  error?: string;
};

// Real output of each command, trimmed. Overview and search end with a `Next:` line so agents
// always know the next drill-down step.
const steps: Step[] = [
  {
    id: "orient",
    title: "1. Orient",
    command: "recontent inspect",
    code: lines(`$ recontent inspect

# Overview

## Tokens (15)
## Themes (2)
\`default\`, \`dark\`
## Components (2)

\`Button\`, \`Select\`

Next: \`recontent inspect components Button\``),
  },
  {
    id: "search",
    title: "2. Search",
    command: 'inspect search danger "#ef4444"',
    tone: "blue",
    code: lines(`$ recontent inspect search danger "#ef4444"

# Search: \`danger\`, \`"#ef4444"\`

2 matches.

## Tokens (1)

| Token | Value | CSS |
| --- | --- | --- |
| \`system.color.danger\` | \`#ef4444\` | \`--system-color-danger\` |

## Components (1)

- \`Alert\` — Status banner. · matched in prop \`tone\`

Next: \`recontent inspect components Alert\``),
  },
  {
    id: "drill",
    title: "3. Drill down",
    command: "inspect components Select",
    tone: "blue",
    code: lines(`$ recontent inspect components Select

## Select

Picks one option from a list.

Import: \`import { Select } from "@acme/ds"\`

Source: \`src/components/Select.tsx:17\`

| Prop | Type | Required |
| --- | --- | --- |
| \`onChange\` | \`(value: string) => void\` | no |
| \`options\` | \`{ value: string; label: string; }[]\` | yes |
| \`value\` | \`string\` | no |`),
  },
  {
    id: "recover",
    title: "4. Recover",
    command: "inspect tokens system.colr",
    tone: "coral",
    code: lines(`$ recontent inspect tokens system.colr`),
    error: 'No token or group matches "system.colr". Did you mean `system.color`? (exit 2)',
  },
];

/** Agents: an auto-advancing carousel showing one terminal output at a time. */
export function Agents() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = setTimeout(() => {
      setActiveIndex((current) => (current + 1) % steps.length);
    }, STEP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, paused]);

  const active = steps[activeIndex]!;

  return (
    <section className="lp-section lp-wrap">
      <h2 className="lp-h2">
        Agents stop{" "}
        <span className="lp-underlined">
          guessing
          <Underline color="#f05a3c" />
        </span>{" "}
        props.
      </h2>
      <p className="lp-sub">
        Coding agents invent prop names and hardcode hex values. <code>recontent inspect</code>{" "}
        gives them the exact API: compact answers, real identifiers, and recoverable errors.
      </p>
      <p className="lp-more">
        <Link to="/guides/agents" className="lp-link">
          Coding with agents
        </Link>
      </p>
      <div
        className="lp-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="lp-carousel-tabs" role="tablist" aria-label="Agent inspect workflow">
          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                id={`agent-tab-${step.id}`}
                aria-selected={isActive}
                aria-controls={`agent-panel-${step.id}`}
                className={`lp-carousel-tab${isActive ? " is-active" : ""}`}
                onClick={() => setActiveIndex(index)}
              >
                <strong>{step.title}</strong>
                <code>{step.command}</code>
                {isActive ? (
                  <span className="lp-carousel-progress" aria-hidden="true">
                    <span
                      key={activeIndex}
                      className={`lp-carousel-progress-bar${paused ? " is-paused" : ""}`}
                    />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div
          className="lp-carousel-panel"
          role="tabpanel"
          id={`agent-panel-${active.id}`}
          aria-labelledby={`agent-tab-${active.id}`}
        >
          <CodePanel
            title={active.title}
            code={active.code}
            language="sh"
            tone={active.tone}
            error={active.error}
          />
        </div>
      </div>
    </section>
  );
}
