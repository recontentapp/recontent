import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./Textarea.gen";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  argTypes: {},
  args: {
    placeholder: "Write a description...",
    defaultValue: "This is an example description.",
    minRows: 4,
    maxLength: 200,
    showCharacterCount: true,
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
