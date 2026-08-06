import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectableCard } from "./SelectableCard.gen";

const meta = {
  title: "Components/SelectableCard",
  component: SelectableCard,
  argTypes: {
    control: {
      control: "select",
      options: ["radio", "checkbox"],
    },
  },
  args: {
    control: "radio",
    children: "Starter plan",
  },
} satisfies Meta<typeof SelectableCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
