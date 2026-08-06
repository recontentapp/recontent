import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./Avatar.gen";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"],
    },
    shape: {
      control: "select",
      options: ["circle", "square"],
    },
  },
  args: {
    text: "JD",
    alt: "Jane Doe",
    size: "base",
    shape: "circle",
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
