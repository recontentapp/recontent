import type { Preview } from "@storybook/react-vite";
import { themeClass } from "../components/tokens.css";

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
