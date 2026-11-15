import { BuddyArt } from "../doodles.tsx";
import { Install } from "./Install.tsx";

export function FinalCta() {
  return (
    <section className="lp-final">
      <div className="lp-wrap lp-final-inner">
        <div className="lp-final-copy">
          <h2 className="lp-h2 lp-h2-big">Give your design system a toolchain.</h2>
          <p className="lp-lede">
            Install it, scaffold a config with <code>recontent init neutral</code>, point{" "}
            <code>introspection.entry</code> at your components, then run{" "}
            <code>recontent inspect</code>.
          </p>
          <Install />
        </div>
        <div className="lp-final-art">
          <BuddyArt />
        </div>
      </div>
    </section>
  );
}
