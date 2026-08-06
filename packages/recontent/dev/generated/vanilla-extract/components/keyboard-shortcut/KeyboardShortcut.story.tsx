import type { Meta, StoryObj } from "@storybook/react-vite";
import { KeyboardShortcut } from "./KeyboardShortcut.gen";

const meta = {
  title: "Components/KeyboardShortcut",
  component: KeyboardShortcut,
  argTypes: {},
  args: {
    keys: ["Ctrl", "Shift", "P"],
  },
} satisfies Meta<typeof KeyboardShortcut>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
