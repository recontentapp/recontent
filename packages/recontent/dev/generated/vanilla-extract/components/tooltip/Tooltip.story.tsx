import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip } from "./Tooltip.gen";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  argTypes: {
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
  },
  args: {
    content: "Saves your changes",
    side: "top",
    align: "center",
    defaultOpen: true,
    children: <button type="button">Save</button>,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
