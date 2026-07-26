import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "../components/components/skeleton/Skeleton.gen";

const meta = {
  title: "Feedback/Skeleton",
  component: Skeleton,
  args: {
    style: { width: 240, height: 24 },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Avatar: Story = {
  args: {
    style: { width: 48, height: 48, borderRadius: "50%" },
  },
};
