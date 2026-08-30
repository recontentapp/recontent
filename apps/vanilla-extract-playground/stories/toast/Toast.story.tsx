import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToastProvider, useToast } from "../../src/generated/components/toast/Toast.gen";

function ToastDemo() {
  const { toast } = useToast();

  return (
    <button
      type="button"
      onClick={() =>
        toast({
          title: "Changes saved",
          description: "Your project settings were updated successfully.",
          status: "success",
          duration: 4000,
        })
      }
    >
      Show toast
    </button>
  );
}

const meta = {
  title: "Components/Toast",
  component: ToastProvider,
  argTypes: {
    placement: {
      control: "select",
      options: ["top-left", "top-right", "bottom-left", "bottom-right"],
    },
  },
  args: {
    placement: "bottom-right",
  },
} satisfies Meta<typeof ToastProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ToastProvider {...args}>
      <ToastDemo />
    </ToastProvider>
  ),
};
