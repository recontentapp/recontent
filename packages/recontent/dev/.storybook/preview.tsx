import type { Preview } from "@storybook/react-vite";
import { themeClass } from "../generated/vanilla-extract/tokens.css";
import "./globalStyle.css";

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
