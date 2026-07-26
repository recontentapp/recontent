import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "../components/components/badge/Badge.gen";

const meta = {
  title: "Display/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  args: {
    label: "Premium",
    variant: "premium",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Premium: Story = {};
