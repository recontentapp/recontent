import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "./Link.gen";

const meta = {
  title: "Components/Link",
  component: Link,
  argTypes: {
    underline: {
      control: "select",
      options: ["always", "hover", "none"],
    },
  },
  args: {
    href: "https://example.com",
    underline: "always",
    children: "Visit our documentation",
  },
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
