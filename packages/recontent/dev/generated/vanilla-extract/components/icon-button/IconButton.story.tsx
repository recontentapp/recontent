import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./IconButton.gen";

const meta = {
  title: "Components/IconButton",
  component: IconButton,
  argTypes: {
    icon: {
      control: "select",
      options: ["check", "chevronDown", "close", "info", "alert", "search"],
    },
    variant: {
      control: "select",
      options: ["primary", "secondary"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  args: {
    icon: "search",
    label: "Search",
    variant: "primary",
    size: "md",
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
