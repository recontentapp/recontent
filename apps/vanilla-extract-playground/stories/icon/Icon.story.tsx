import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../../src/generated/components/icon/Icon.gen";

const meta = {
  title: "Components/Icon",
  component: Icon,
  argTypes: {
    icon: {
      control: "select",
      options: ["check", "chevronDown", "close", "info", "alert", "search"],
    },
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
    icon: "check",
    size: "lg",
    color: "primary",
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NumericSize: Story = {
  args: { size: 48 },
};

export const Labelled: Story = {
  args: { icon: "info", label: "Information" },
};
