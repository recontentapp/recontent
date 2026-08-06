import type { Meta, StoryObj } from "@storybook/react-vite";
import { Timeline } from "./Timeline.gen";

const meta = {
  title: "Components/Timeline",
  component: Timeline,
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  args: {
    orientation: "vertical",
    size: "sm",
    items: [
      {
        label: "Order placed",
        description: "Your order has been placed.",
        timestamp: "2026-08-01",
        icon: "check",
        status: "success",
      },
      {
        label: "Order shipped",
        description: "Your order is on its way.",
        timestamp: "2026-08-03",
        icon: "info",
        status: "neutral",
      },
      {
        label: "Delivery failed",
        description: "We couldn't deliver your package.",
        timestamp: "2026-08-05",
        icon: "alert",
        status: "error",
      },
    ],
  },
} satisfies Meta<typeof Timeline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
