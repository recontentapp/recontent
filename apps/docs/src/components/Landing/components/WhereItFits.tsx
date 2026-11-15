import { Link } from "vocs";

type Brick = {
  title: string;
  text: string;
  tone: "yellow" | "blue" | "green" | "coral";
  studs: number;
};

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

/** Where it fits: the foundation brick of a codebase. */
export function WhereItFits() {
  return (
    <section className="lp-section lp-wrap lp-fits" id="where-it-fits">
      <div>
        <h2 className="lp-h2">
          One source of truth for <span className="lp-hl">whoever writes UI</span>
        </h2>
        <p className="lp-sub">
          Recontent sits at the base of your design system. Tokens and components are typed once,
          then read the same way by designers, engineers, coding agents and CI.
        </p>
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
