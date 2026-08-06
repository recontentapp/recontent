import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge.gen";

const meta = {
  title: "Components/Badge",
  component: Badge,
  argTypes: {
    variant: {
      control: "select",
      options: ["info", "success", "warning", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    dot: {
      control: "boolean",
    },
  },
  args: {
    variant: "success",
    size: "sm",
    dot: true,
    children: "Active",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
