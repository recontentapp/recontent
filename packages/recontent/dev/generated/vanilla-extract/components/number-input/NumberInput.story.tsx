import type { Meta, StoryObj } from "@storybook/react-vite";
import { NumberInput } from "./NumberInput.gen";

const meta = {
  title: "Components/NumberInput",
  component: NumberInput,
  argTypes: {
    invalid: {
      control: "boolean",
    },
  },
  args: {
    defaultValue: 4,
    min: 0,
    max: 10,
    step: 1,
    showStepper: true,
    placeholder: "Enter a quantity",
    suffix: "kg",
  },
} satisfies Meta<typeof NumberInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
