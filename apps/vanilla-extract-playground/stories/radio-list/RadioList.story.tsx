import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioList } from "../../src/generated/components/radio-list/RadioList.gen";

const meta = {
  title: "Components/RadioList",
  component: RadioList,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  args: {
    orientation: "vertical",
    defaultValue: "standard",
    options: [
      {
        value: "standard",
        label: "Standard shipping",
        description: "Delivered in 5-7 business days",
      },
      {
        value: "express",
        label: "Express shipping",
        description: "Delivered in 1-2 business days",
      },
      {
        value: "pickup",
        label: "Store pickup",
        description: "Ready within 2 hours",
        disabled: true,
      },
    ],
  },
} satisfies Meta<typeof RadioList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
