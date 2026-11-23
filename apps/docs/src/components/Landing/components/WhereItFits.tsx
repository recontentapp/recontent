import { Link } from "vocs";

type Brick = {
  title: string;
  text: string;
  tone: "yellow" | "blue" | "green" | "coral";
  studs: number;
};

const pains = [
  {
    title: "Drifting tokens",
    text: "Values copied across CSS, Tailwind, TypeScript, and Figma fall out of sync.",
    tone: "coral",
  },
  {
    title: "Stale component docs",
    text: "Docs sites go out of date the week after someone writes them.",
    tone: "yellow",
  },
  {
    title: "Agents that guess",
    text: "Coding agents invent prop names and hardcode hex colors.",
    tone: "blue",
  },
] as const;

// The stack, foundation first: each row snaps onto the one before it.
const stack: Brick[][] = [
  [
    {
      title: "Recontent",
      text: "Tokens, components & their docs, typed",
      tone: "yellow",
      studs: 6,
    },
  ],
  [
    {
      title: "Styling",
      text: "CSS, Tailwind, StyleX & more",
      tone: "blue",
      studs: 3,
    },
    {
      title: "Your components",
      text: "Your codebase's own building blocks",
      tone: "green",
      studs: 3,
    },
  ],
  [
    {
      title: "People, agents & CI",
      text: "Everyone builds UI from the same source",
      tone: "coral",
      studs: 5,
    },
  ],
];

function LegoBrick({ brick }: { brick: Brick }) {
  return (
    <div className={`lp-brick lp-tone-${brick.tone}`}>
      <span className="lp-studs" aria-hidden="true">
        {Array.from({ length: brick.studs }, (_, index) => (
          <i key={index} />
        ))}
      </span>
      <h3 className="lp-h3">{brick.title}</h3>
      <p>{brick.text}</p>
    </div>
  );
}

/** Where it fits: pain points solved alongside the foundation brick stack. */
export function WhereItFits() {
  return (
    <section className="lp-section lp-wrap lp-fits" id="where-it-fits">
      <div>
        <h2 className="lp-h2">
          One source of truth. <span className="lp-hl">Zero drift.</span>
        </h2>
        <ul className="lp-pain-list">
          {pains.map((pain) => (
            <li key={pain.title} className={`lp-pain-item lp-pain-dot-${pain.tone}`}>
              <strong>{pain.title}.</strong> {pain.text}
            </li>
          ))}
        </ul>
        <p className="lp-more">
          <Link to="/introduction/why-recontent" className="lp-link">
            Why Recontent
          </Link>
        </p>
      </div>
      <ol className="lp-stack">
        {stack.map((row, index) => (
          <li key={index} className="lp-stack-row">
            {row.map((brick) => (
              <LegoBrick key={brick.title} brick={brick} />
            ))}
          </li>
        ))}
      </ol>
    </section>
  );
}
