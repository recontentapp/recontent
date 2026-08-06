import type { Meta, StoryObj } from "@storybook/react-vite";
import { Code } from "./Code.gen";

const meta = {
  title: "Components/Code",
  component: Code,
  args: {
    children: "npm install recontent",
  },
} satisfies Meta<typeof Code>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
