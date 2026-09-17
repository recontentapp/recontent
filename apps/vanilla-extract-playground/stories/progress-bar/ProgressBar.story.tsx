import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressBar } from "../../src/generated/components/progress-bar/ProgressBar.gen";

const meta = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  argTypes: {
    status: {
      control: "select",
      options: ["default", "success", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  args: {
    value: 65,
    status: "default",
    size: "sm",
    label: "Uploading files…",
    showValueLabel: true,
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
