import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "./Select.gen";

const meta = {
  title: "Components/Select",
  component: Select,
  argTypes: {
    clearable: {
      control: "boolean",
    },
  },
  args: {
    defaultValue: "fr",
    placeholder: "Select a language",
    clearable: true,
    options: [
      { value: "en", label: "English" },
      { value: "fr", label: "French" },
      { value: "es", label: "Spanish" },
      { value: "de", label: "German" },
      { value: "it", label: "Italian", disabled: true },
    ],
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
