import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "../../src/generated/components/spinner/Spinner.gen";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"],
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "disabled", "accent"],
    },
  },
  args: {
    size: "lg",
    color: "accent",
    label: "Loading",
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
