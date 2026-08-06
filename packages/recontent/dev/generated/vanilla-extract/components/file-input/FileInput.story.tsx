import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileInput } from "./FileInput.gen";

const meta = {
  title: "Components/FileInput",
  component: FileInput,
  argTypes: {},
  args: {
    label: "Drag and drop files here, or click to browse",
    accept: "image/*",
    multiple: true,
    dropzone: true,
  },
} satisfies Meta<typeof FileInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
