import type { Preview } from "@storybook/react-vite";
import {
  brandThemes,
  densityThemes,
  modeThemes,
  systemVars,
  themeClass,
} from "../src/generated/tokens.css";

const preview: Preview = {
  globalTypes: {
    mode: {
      description: "Color scheme",
      toolbar: {
        title: "Mode",
        items: Object.keys(modeThemes),
        dynamicTitle: true,
      },
    },
    brand: {
      description: "Brand accent palette",
      toolbar: {
        title: "Brand",
        items: Object.keys(brandThemes),
        dynamicTitle: true,
      },
    },
    density: {
      description: "Layout and component spacing",
      toolbar: {
        title: "Density",
        items: Object.keys(densityThemes),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    mode: "light",
    brand: "neutral",
    density: "comfortable",
  },
  decorators: [
    (Story, context) => {
      const mode = (context.globals.mode ?? "light") as keyof typeof modeThemes;
      const brand = (context.globals.brand ?? "neutral") as keyof typeof brandThemes;
      const density = (context.globals.density ?? "comfortable") as keyof typeof densityThemes;
      const classes = [themeClass, modeThemes[mode], brandThemes[brand], densityThemes[density]]
        .filter(Boolean)
        .join(" ");

      return (
        <div
          className={classes}
          style={{
            backgroundColor: systemVars.colors.backgroundBody,
            color: systemVars.colors.textPrimary,
            fontFamily: systemVars.typography.bodyFontFamily,
            padding: systemVars.spacing[24],
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
