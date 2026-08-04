import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "./Box.gen";

const meta = {
  title: "Components/Box",
  component: Box,
  argTypes: {
    padding: {
      control: "select",
      options: [0, "0-5", 1, "1-5", 2, 3, 4, 5, 6, 8, 10, 12],
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
      options: ["sm", "md"],
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
    padding: 4,
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
    padding: 6,
    border: "thin",
    boxShadow: "md",
    borderRadius: "container",
  },
};

export const Sizing: Story = {
  args: {
    padding: 4,
    width: 240,
    height: 120,
    display: "flex",
  },
};

export const Responsive: Story = {
  args: {
    padding: { base: 2, md: 6, lg: 10 },
    display: { base: "block", md: "flex" },
    backgroundColor: 200,
    borderRadius: "element",
  },
};

// No `base` key: padding computes to `unset` (= 0, padding is non-inherited)
// below `md`. This is documented behaviour, not a bug — see the responsive
// support design notes.
export const ResponsiveWithoutBase: Story = {
  args: {
    padding: { md: 6 },
    backgroundColor: 200,
    borderRadius: "element",
  },
};
