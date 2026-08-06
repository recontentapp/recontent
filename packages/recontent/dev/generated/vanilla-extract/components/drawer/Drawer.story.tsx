import type { Meta, StoryObj } from "@storybook/react-vite";
import { Drawer } from "./Drawer.gen";
import { Button } from "../button/Button.gen";

const meta = {
  title: "Components/Drawer",
  component: Drawer,
  argTypes: {
    placement: {
      control: "select",
      options: ["left", "right", "top", "bottom"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "full"],
    },
  },
  args: {
    title: "Filters",
    placement: "right",
    size: "md",
    trigger: <Button>Open drawer</Button>,
    footer: (
      <>
        <Button variant="secondary">Reset</Button>
        <Button>Apply</Button>
      </>
    ),
    children: "Refine the results using the filters below.",
  },
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
