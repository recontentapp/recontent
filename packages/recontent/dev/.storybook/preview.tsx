import type { Preview } from "@storybook/react-vite";
import { themeClass } from "../generated/vanilla-extract/tokens.css";
import "../generated/vanilla-extract/reset.gen.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className={themeClass}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
