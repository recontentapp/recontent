import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./Slider.gen";

const meta = {
  title: "Components/Slider",
  component: Slider,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  args: {
    defaultValue: 40,
    min: 0,
    max: 100,
    step: 1,
    showValueLabel: true,
    marks: [
      { value: 0, label: "0" },
      { value: 50, label: "50" },
      { value: 100, label: "100" },
    ],
  },
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
