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
      text: "Design tokens, defined once and typed in recontent.config.ts.",
      tone: "yellow",
      studs: 6,
    },
  ],
  [
    {
      title: "Styling",
      text: "StyleX, Tailwind, vanilla-extract or plain CSS.",
      tone: "blue",
      studs: 3,
    },
    {
      title: "Components",
      text: "Your codebase's own building blocks.",
      tone: "green",
      studs: 3,
    },
  ],
  [
    {
      title: "Pages & experiences",
      text: "What your users see and touch.",
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
          The brick everything else <span className="lp-hl">snaps onto</span>.
        </h2>
        <p className="lp-sub">
          Recontent doesn&apos;t replace your styling library or your components. It sits underneath
          them, so the tokens they share are defined once and checked everywhere.
        </p>
        <p className="lp-more">
          <Link to="/guides/using-plugins" className="lp-link">
            Using plugins
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
