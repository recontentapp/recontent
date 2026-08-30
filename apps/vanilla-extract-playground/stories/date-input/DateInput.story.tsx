import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateInput } from "../../src/generated/components/date-input/DateInput.gen";

const meta = {
  title: "Components/DateInput",
  component: DateInput,
  argTypes: {
    granularity: {
      control: "select",
      options: ["day", "month", "year"],
    },
  },
  args: {
    clearable: true,
  },
} satisfies Meta<typeof DateInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
