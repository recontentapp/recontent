import type { Meta, StoryObj } from "@storybook/react-vite";
import { Divider } from "../../src/generated/components/divider/Divider.gen";

const meta = {
  title: "Components/Divider",
  component: Divider,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  args: {
    orientation: "horizontal",
  },
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ width: 320 }}>
      <p>Section one</p>
      <Divider {...args} />
      <p>Section two</p>
    </div>
  ),
};
