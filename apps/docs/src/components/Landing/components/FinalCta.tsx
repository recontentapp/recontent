import { BuddyArt } from "../doodles.tsx";
import { Install } from "./Install.tsx";

export function FinalCta() {
  return (
    <section className="lp-final">
      <div className="lp-wrap lp-final-inner">
        <div className="lp-final-copy">
          <h2 className="lp-h2 lp-h2-big">Let Recontent guard your tokens.</h2>
          <p className="lp-lede">
            Install it, scaffold a config with <code>recontent init neutral</code>, add a plugin,
            then run <code>recontent build</code>.
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
