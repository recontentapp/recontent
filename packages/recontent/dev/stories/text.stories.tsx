import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../components/components/text/Text.gen";

const meta = {
  title: "Typography/Text",
  component: Text,
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Paragraph: Story = {};

export const Inline: Story = {
  args: { as: "span" },
};
