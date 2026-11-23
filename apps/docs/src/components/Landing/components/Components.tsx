import { Link } from "vocs";
import { CodePanel, lines } from "./CodePanel.tsx";

const jsdoc = lines(`/**
 * Triggers an action.
 *
 * @usage Prefer a link when the click only navigates.
 * @link <caption>Figma</caption> https://figma.com/file/ds/button
 * @example <caption>Basic</caption>
 * <Button label="Save" />
 * @stories ./Button.stories.tsx
 * @category Actions
 */
export function Button(props: ButtonProps) {}

/** @deprecated Use {@link Button} instead. */
export function PrimaryButton(props: ButtonProps) {}`);

const outputs = [
  {
    name: "recontent inspect",
    to: "/cli/inspect",
    text: "exact props, defaults, usage notes, and examples on demand",
  },
  {
    name: "design.html",
    to: "/plugins/docs",
    text: "searchable (⌘K) static site with theme switcher and embedded Storybook stories",
  },
  {
    name: "DESIGN.md",
    to: "/plugins/design-md",
    text: "compact component list coding agents load up front",
  },
  {
    name: "recontent diff",
    to: "/guides/diffs",
    text: "removed props and narrowed unions caught in CI",
  },
];

/** Components: documentation lives next to the code, and reaches every output. */
export function Components() {
  return (
    <section className="lp-section lp-wrap">
      <h2 className="lp-h2">
        Write JSDoc once. <span className="lp-hl">Read it everywhere.</span>
      </h2>
      <p className="lp-sub">
        Stop maintaining component docs in a separate wiki. Recontent reads your React components
        with the TypeScript compiler and turns JSDoc next to your code into every output.
      </p>
      <p className="lp-more">
        <Link to="/guides/documenting-components" className="lp-link">
          Documenting components
        </Link>
      </p>
      <div className="lp-pair">
        <CodePanel title="Button.tsx" code={jsdoc} />
        <div>
          <p className="lp-chips-title">It shows up in</p>
          <ul className="lp-chips">
            {outputs.map((output) => (
              <li key={output.name}>
                <Link to={output.to}>
                  <code>{output.name}</code>
                  <span>{output.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
