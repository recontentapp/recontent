import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusDot } from "../components/components/status-dot/StatusDot.gen";

const meta = {
  title: "Display/StatusDot",
  component: StatusDot,
  parameters: {
    layout: "centered",
  },
  args: {
    status: "success",
  },
} satisfies Meta<typeof StatusDot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Warning: Story = {
  args: { status: "warning" },
};

export const Error: Story = {
  args: { status: "error" },
};
