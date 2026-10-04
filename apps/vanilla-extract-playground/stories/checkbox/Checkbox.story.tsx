import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "../../src/generated/components/checkbox/Checkbox.gen";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  args: {
    label: "Accept terms and conditions",
    defaultChecked: true,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
