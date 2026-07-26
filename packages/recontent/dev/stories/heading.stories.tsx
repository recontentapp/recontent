import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading } from "../components/components/heading/Heading.gen";

const meta = {
  title: "Typography/Heading",
  component: Heading,
  args: {
    children: "Build interfaces with confidence",
    level: 2,
  },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LevelOne: Story = {
  args: { level: 1 },
};

export const LevelTwo: Story = {};

export const LevelThree: Story = {
  args: { level: 3 },
};
