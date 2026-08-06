import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetadataList } from "./MetadataList.gen";

const meta = {
  title: "Components/MetadataList",
  component: MetadataList,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  args: {
    orientation: "horizontal",
    columns: 2,
    items: [
      { label: "Status", value: "Published", icon: "check" },
      { label: "Author", value: "Jane Doe" },
      { label: "Created", value: "Jan 12, 2026" },
      { label: "Updated", value: "Feb 3, 2026" },
    ],
  },
} satisfies Meta<typeof MetadataList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
