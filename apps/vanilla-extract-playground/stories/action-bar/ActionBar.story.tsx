import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionBar } from "../../src/generated/components/action-bar/ActionBar.gen";
import { Button } from "../../src/generated/components/button/Button.gen";

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
      <Button type="button">Duplicate</Button>
      <Button variant="secondary" type="button">
        Archive
      </Button>
    </ActionBar>
  ),
};
