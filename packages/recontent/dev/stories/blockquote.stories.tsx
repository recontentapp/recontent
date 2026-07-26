import type { Meta, StoryObj } from "@storybook/react-vite";
import { Blockquote } from "../components/components/blockquote/Blockquote.gen";

const meta = {
  title: "Typography/Blockquote",
  component: Blockquote,
  args: {
    children: "Design is not just what it looks like and feels like. Design is how it works.",
  },
} satisfies Meta<typeof Blockquote>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
