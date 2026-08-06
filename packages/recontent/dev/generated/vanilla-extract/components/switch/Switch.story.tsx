import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./Switch.gen";

const meta = {
  title: "Components/Switch",
  component: Switch,
  argTypes: {
    labelPosition: {
      control: "select",
      options: ["start", "end"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  args: {
    label: "Enable notifications",
    labelPosition: "end",
    size: "sm",
    defaultChecked: true,
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
