import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../src/generated/components/button/Button.gen";

const meta = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  args: {
    variant: "primary",
    size: "md",
    children: "Continue",
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true },
};

export const CustomElement: Story = {
  args: {
    render: <a href="#" />,
    children: "Go somewhere",
  },
};
