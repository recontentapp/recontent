import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextInput } from "../../src/generated/components/text-input/TextInput.gen";

const meta = {
  title: "Components/TextInput",
  component: TextInput,
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "tel", "url"],
    },
  },
  args: {
    type: "text",
    placeholder: "Enter your name",
    iconLeft: "search",
    clearable: true,
    defaultValue: "Ada Lovelace",
  },
} satisfies Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
