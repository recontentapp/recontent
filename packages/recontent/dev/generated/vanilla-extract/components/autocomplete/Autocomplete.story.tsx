import type { Meta, StoryObj } from "@storybook/react-vite";
import { Autocomplete } from "./Autocomplete.gen";

const meta = {
  title: "Components/Autocomplete",
  component: Autocomplete,
  argTypes: {
    multiple: {
      control: "boolean",
    },
  },
  args: {
    options: [
      { value: "en", label: "English" },
      { value: "fr", label: "French" },
      { value: "es", label: "Spanish" },
      { value: "de", label: "German" },
      { value: "it", label: "Italian" },
    ],
    placeholder: "Search a language…",
  },
} satisfies Meta<typeof Autocomplete>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
