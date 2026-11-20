import { Link } from "vocs";
import { Underline } from "../doodles.tsx";
import { CodePanel, lines } from "./CodePanel.tsx";

// Real output of each command, trimmed. The overview ends with a `Next:` line, which is what makes
// the drill-down obvious to an agent.
const overview = lines(`$ recontent inspect

# Overview

## Tokens (15)
## Components (2)

\`Button\`, \`Select\`

Next: \`recontent inspect components Button\``);

const select = lines(`$ recontent inspect components Select

## Select

Picks one option from a list.

Import: \`import { Select } from "@acme/ds"\`

Source: \`src/components/Select.tsx:17\`

| Prop | Type | Required |
| --- | --- | --- |
| \`onChange\` | \`(value: string) => void\` | no |
| \`options\` | \`{ value: string; label: string; }[]\` | yes |
| \`value\` | \`string\` | no |`);

const typo = lines(`$ recontent inspect tokens system.colr`);

const extras = [
  {
    label: "DESIGN.md",
    fn: "designMD()",
    to: "/plugins/design-md",
    text: "Your tokens and a few lines of guidance, loaded by agents up front.",
  },
  {
    label: "JSON for scripts",
    fn: "--format json",
    to: "/cli/inspect#for-scripts",
    text: "The full detail, on stdout, with stable exit codes.",
  },
  {
    label: "Works from npm",
    fn: "--from @acme/ds",
    to: "/guides/publishing",
    text: "Apps browse an installed design system without its source.",
  },
];

/** Agents: the centerpiece. A three-step session, then the other ways in. */
export function Agents() {
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
        Coding agents hallucinate prop names and hard-code hex values.{" "}
        <code>recontent inspect</code> hands them the exact API: small answers, real identifiers,
        recoverable errors.
      </p>
      <p className="lp-more">
        <Link to="/guides/agents" className="lp-link">
          Coding with agents
        </Link>
      </p>
      <ol className="lp-steps">
        <li>
          <CodePanel title="1. Orient" code={overview} language="sh" />
        </li>
        <li>
          <CodePanel title="2. Drill down" code={select} language="sh" tone="blue" />
        </li>
        <li>
          <CodePanel
            title="3. Recover"
            code={typo}
            language="sh"
            tone="coral"
            error='No token or group matches "system.colr". Did you mean `system.color`? (exit 2)'
          />
        </li>
      </ol>
      <ul className="lp-cards">
        {extras.map((extra) => (
          <li key={extra.label}>
            <Link to={extra.to} className="lp-output">
              <strong>{extra.label}</strong>
              <code>{extra.fn}</code>
              <span>{extra.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
