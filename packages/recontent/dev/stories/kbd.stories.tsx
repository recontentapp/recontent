import type { Meta, StoryObj } from "@storybook/react-vite";
import { Kbd } from "../components/components/kbd/Kbd.gen";

const meta = {
  title: "Typography/Kbd",
  component: Kbd,
  parameters: {
    layout: "centered",
  },
  args: {
    children: "⌘ K",
  },
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
