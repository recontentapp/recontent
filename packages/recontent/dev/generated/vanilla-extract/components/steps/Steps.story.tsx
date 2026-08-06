import type { Meta, StoryObj } from "@storybook/react-vite";
import { Steps } from "./Steps.gen";

const meta = {
  title: "Components/Steps",
  component: Steps,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  args: {
    orientation: "horizontal",
    size: "sm",
    activeStep: 1,
    steps: [
      { label: "Account", description: "Create your account" },
      { label: "Profile", description: "Add your details" },
      { label: "Confirm", description: "Review and submit" },
    ],
  },
} satisfies Meta<typeof Steps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
