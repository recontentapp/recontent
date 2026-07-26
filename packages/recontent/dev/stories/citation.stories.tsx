import type { Meta, StoryObj } from "@storybook/react-vite";
import { Citation } from "../components/components/citation/Citation.gen";

const meta = {
  title: "Typography/Citation",
  component: Citation,
  args: {
    children: "Dieter Rams, Ten Principles for Good Design",
  },
} satisfies Meta<typeof Citation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
