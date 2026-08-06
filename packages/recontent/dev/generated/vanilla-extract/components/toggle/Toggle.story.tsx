import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toggle } from "./Toggle.gen";

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  args: {
    size: "sm",
    defaultValue: "list",
    options: [
      { value: "list", label: "List" },
      { value: "grid", label: "Grid" },
    ],
  },
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
