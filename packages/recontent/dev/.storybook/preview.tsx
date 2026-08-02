import type { Preview } from "@storybook/react-vite";
// import { themeClass } from "../components/tokens.css";
import "./globalStyle.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <div>
        <Story />
      </div>
    ),
  ],
};

export default preview;
