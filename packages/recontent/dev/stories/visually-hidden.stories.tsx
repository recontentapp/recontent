import type { Meta, StoryObj } from "@storybook/react-vite";
import { VisuallyHidden } from "../components/components/visually-hidden/VisuallyHidden.gen";

const meta = {
  title: "Accessibility/VisuallyHidden",
  component: VisuallyHidden,
  args: {
    children: "This text is available to assistive technology.",
  },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
