import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "../../src/generated/components/switch/Switch.gen";

const meta = {
  title: "Components/Switch",
  component: Switch,
  argTypes: {
    labelPosition: {
      control: "select",
      options: ["start", "end"],
    },
  },
  args: {
    label: "Enable notifications",
    labelPosition: "end",
    defaultChecked: true,
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
