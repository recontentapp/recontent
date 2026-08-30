import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "../../src/generated/components/tabs/Tabs.gen";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    variant: {
      control: "select",
      options: ["line", "pill"],
    },
  },
  args: {
    variant: "line",
    orientation: "horizontal",
    fitted: false,
    items: [
      { value: "overview", label: "Overview", content: "Overview content goes here." },
      {
        value: "activity",
        label: "Activity",
        icon: "info",
        content: "Activity content goes here.",
      },
      { value: "settings", label: "Settings", content: "Settings content goes here." },
    ],
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
