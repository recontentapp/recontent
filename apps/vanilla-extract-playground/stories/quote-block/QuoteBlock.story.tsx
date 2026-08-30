import type { Meta, StoryObj } from "@storybook/react-vite";
import { QuoteBlock } from "../../src/generated/components/quote-block/QuoteBlock.gen";

const meta = {
  title: "Components/QuoteBlock",
  component: QuoteBlock,
  argTypes: {},
  args: {
    citation: "Antoine de Saint-Exupéry",
    children:
      "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.",
  },
} satisfies Meta<typeof QuoteBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
