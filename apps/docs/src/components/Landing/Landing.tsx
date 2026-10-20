import { Diff } from "./components/Diff.tsx";
import { FinalCta } from "./components/FinalCta.tsx";
import { Hero } from "./components/Hero.tsx";
import { LandingRoot } from "./components/LandingRoot.tsx";
import { Plugins } from "./components/Plugins.tsx";
import { Themes } from "./components/Themes.tsx";
import { TokenLayers } from "./components/TokenLayers.tsx";
import { WhereItFits } from "./components/WhereItFits.tsx";
import "../../generated/tokens.css";
import "./landing.css";

export function Landing() {
  return (
    <LandingRoot>
      <Hero />
      <WhereItFits />
      <TokenLayers />
      <Diff />
      <Themes />
      <Plugins />
      <FinalCta />
    </LandingRoot>
  );
}
