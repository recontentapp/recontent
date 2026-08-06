import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "./Dialog.gen";
import { Button } from "../button/Button.gen";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "fullscreen"],
    },
  },
  args: {
    title: "Delete project",
    description: "This action cannot be undone.",
    size: "md",
    trigger: <Button>Open dialog</Button>,
    footer: (
      <>
        <Button variant="secondary">Cancel</Button>
        <Button>Confirm</Button>
      </>
    ),
    children: "Are you sure you want to delete this project? All of its content will be permanently removed.",
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
