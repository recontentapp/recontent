import type { Meta, StoryObj } from "@storybook/react-vite";
import { Outline } from "../../src/generated/components/outline/Outline.gen";

const meta = {
  title: "Components/Outline",
  component: Outline,
  argTypes: {},
  args: {
    activeId: "introduction",
    items: [
      { id: "introduction", label: "Introduction" },
      {
        id: "getting-started",
        label: "Getting started",
        children: [
          { id: "installation", label: "Installation", depth: 1 },
          { id: "configuration", label: "Configuration", depth: 1 },
        ],
      },
      { id: "api-reference", label: "API reference" },
      { id: "faq", label: "FAQ" },
    ],
  },
} satisfies Meta<typeof Outline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
