import type { Meta, StoryObj } from "@storybook/react-vite";
import { Banner } from "./Banner.gen";

const meta = {
  title: "Components/Banner",
  component: Banner,
  argTypes: {
    status: {
      control: "select",
      options: ["info", "success", "warning", "danger"],
    },
  },
  args: {
    status: "warning",
    title: "Your trial ends in 3 days",
    children: "Upgrade your plan to keep access to all features.",
  },
} satisfies Meta<typeof Banner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Banner {...args} actions={<button type="button">Upgrade</button>} onDismiss={() => {}} />
  ),
};
