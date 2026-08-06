import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionBar } from "./ActionBar.gen";

const meta = {
  title: "Components/ActionBar",
  component: ActionBar,
  argTypes: {
    placement: {
      control: "select",
      options: ["bottom-start", "bottom", "bottom-end"],
    },
  },
  args: {
    placement: "bottom",
    open: true,
  },
} satisfies Meta<typeof ActionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ActionBar {...args}>
      <button type="button">Duplicate</button>
      <button type="button">Archive</button>
      <button type="button">Delete</button>
    </ActionBar>
  ),
};
