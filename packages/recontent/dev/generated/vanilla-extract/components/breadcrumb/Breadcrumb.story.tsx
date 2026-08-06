import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumb } from "./Breadcrumb.gen";

const meta = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  args: {
    items: [
      { label: "Home", href: "#" },
      { label: "Projects", href: "#" },
      { label: "Recontent", href: "#" },
      { label: "Settings" },
    ],
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
