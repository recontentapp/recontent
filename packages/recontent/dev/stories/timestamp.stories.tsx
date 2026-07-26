import type { Meta, StoryObj } from "@storybook/react-vite";
import { Timestamp } from "../components/components/timestamp/Timestamp.gen";

const meta = {
  title: "Typography/Timestamp",
  component: Timestamp,
  args: {
    dateTime: "2026-07-16T20:30:00Z",
    children: "Updated 2 minutes ago",
  },
} satisfies Meta<typeof Timestamp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
