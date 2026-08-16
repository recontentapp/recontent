import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "./Box.gen";

const meta = {
  title: "Components/Box",
  component: Box,
  argTypes: {
    padding: {
      control: "select",
      options: [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80],
    },
    borderRadius: {
      control: "select",
      options: ["none", "inner", "element", "container", "page", "full"],
    },
    border: {
      control: "select",
      options: ["thin", "thick"],
    },
    boxShadow: {
      control: "select",
      options: ["sm", "md", "lg", "inset"],
    },
    backgroundColor: {
      control: "select",
      options: [200],
    },
    display: {
      control: "select",
      options: ["block", "inline-block", "inline", "flex", "inline-flex", "grid", "none"],
    },
  },
  args: {
    padding: 16,
    borderRadius: "element",
    backgroundColor: 200,
    children: "Box content",
  },
} satisfies Meta<typeof Box>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBorderAndShadow: Story = {
  args: {
    padding: 24,
    border: "thin",
    boxShadow: "md",
    borderRadius: "container",
  },
};

export const Sizing: Story = {
  args: {
    padding: 16,
    width: 240,
    height: 120,
    display: "flex",
  },
};

export const Responsive: Story = {
  args: {
    padding: { xs: 8, md: 24, lg: 40 },
    display: { xs: "block", md: "flex" },
    backgroundColor: 200,
    borderRadius: "element",
  },
};

// No `xs` key: padding computes to `unset` (= 0, padding is non-inherited)
// below `md`. This is documented behaviour, not a bug — see the responsive
// support design notes.
export const ResponsiveWithoutBase: Story = {
  args: {
    padding: { md: 24 },
    backgroundColor: 200,
    borderRadius: "element",
  },
};
