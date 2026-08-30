import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropdownButton } from "../../src/generated/components/dropdown-button/DropdownButton.gen";

const meta = {
  title: "Components/DropdownButton",
  component: DropdownButton,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
  },
  args: {
    label: "Actions",
    variant: "primary",
    size: "md",
    items: [
      { value: "edit", label: "Edit" },
      { value: "duplicate", label: "Duplicate" },
      { value: "delete", label: "Delete" },
    ],
  },
} satisfies Meta<typeof DropdownButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
