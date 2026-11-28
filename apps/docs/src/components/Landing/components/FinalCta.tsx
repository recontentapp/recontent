import { Link } from "vocs";
import { BuddyArt } from "../doodles.tsx";
import { CopyAgentPrompt } from "./CopyAgentPrompt.tsx";

export function FinalCta() {
  return (
    <section className="lp-final">
      <div className="lp-wrap lp-final-inner">
        <div className="lp-final-copy">
          <h2 className="lp-h2 lp-h2-big">Start in minutes, not weeks.</h2>
          <p className="lp-lede">
            Start from a preset with <code>recontent init --preset neutral</code> or{" "}
            <code>recontent init --preset material</code>—or import existing Figma and Tokens Studio
            files with <code>recontent init --dtcg tokens/</code>.
          </p>
          <div className="lp-ctas">
            <CopyAgentPrompt />
            <Link to="/introduction/getting-started" className="lp-btn lp-btn-primary">
              Read docs
            </Link>
          </div>
        </div>
        <div className="lp-final-art">
          <BuddyArt />
        </div>
      </div>
    </section>
  );
}
