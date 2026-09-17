import type { Meta, StoryObj } from "@storybook/react-vite";
import { Collapsible } from "../../src/generated/components/collapsible/Collapsible.gen";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  args: {
    trigger: "What is Recontent?",
    children:
      "Recontent is a content management platform for product teams to manage copy across all their apps and touchpoints.",
    defaultOpen: true,
  },
} satisfies Meta<typeof Collapsible>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
