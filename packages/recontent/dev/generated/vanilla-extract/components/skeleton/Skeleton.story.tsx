import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./Skeleton.gen";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "circular", "rectangular"],
    },
    radius: {
      control: "select",
      options: ["none", "inner", "element", "container", "page", "full"],
    },
  },
  args: {
    variant: "text",
    lines: 3,
    animate: true,
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
