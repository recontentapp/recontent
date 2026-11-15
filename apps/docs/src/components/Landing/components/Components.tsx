import { Link } from "vocs";
import { CodePanel, lines } from "./CodePanel.tsx";

const jsdoc = lines(`/**
 * Triggers an action.
 *
 * @usage Prefer a link when the click only navigates.
 * @example <caption>Basic</caption>
 * <Button label="Save" />
 * @category Actions
 */
export function Button(props: ButtonProps) {}

/** @deprecated Use {@link Button} instead. */
export function PrimaryButton(props: ButtonProps) {}`);

const outputs = [
  { name: "recontent inspect", text: "props, usage and examples, on demand" },
  { name: "design.html", text: "a page per component, for your team" },
  { name: "DESIGN.md", text: "the list of components, for agents" },
  { name: "recontent diff", text: "removed props and values, caught in CI" },
];

/** Components: documentation lives next to the code, and reaches every output. */
export function Components() {
  return (
    <section className="lp-section lp-wrap">
      <h2 className="lp-h2">
        Write JSDoc once. <span className="lp-hl">Read it everywhere.</span>
      </h2>
      <p className="lp-sub">
        Recontent reads your React components with the TypeScript checker: props, defaults,
        subcomponents, the types they use. Usage notes, examples and deprecations are JSDoc tags
        that stay next to the code they describe.
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
                <code>{output.name}</code>
                <span>{output.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
