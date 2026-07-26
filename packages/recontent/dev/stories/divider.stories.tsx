import type { Meta, StoryObj } from "@storybook/react-vite";
import { Divider } from "../components/components/divider/Divider.gen";

const meta = {
  title: "Display/Divider",
  component: Divider,
  args: {
    style: { width: 240 },
  },
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
    style: { height: 80 },
  },
};
