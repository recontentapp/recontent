import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "./Text.gen";

const meta = {
  title: "Components/Text",
  component: Text,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "tiny-caption",
        "paragraph-body-m",
        "heading-branding-page",
        "heading-section-1",
        "heading-page-l",
      ],
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "disabled", "accent"],
    },
    align: {
      control: "select",
      options: ["left", "center", "right", "justify"],
    },
    textTransform: {
      control: "select",
      options: ["none", "capitalize", "uppercase", "lowercase", "full-width"],
    },
  },
  args: {
    variant: "paragraph-body-m",
    color: "primary",
    children: "The quick brown fox jumps over the lazy dog.",
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Heading: Story = {
  args: { variant: "heading-branding-page", children: "Page title" },
};

export const Truncated: Story = {
  args: {
    children:
      "This is a very long sentence that should be truncated with an ellipsis once it overflows its container width.",
    truncate: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
};

export const Responsive: Story = {
  args: {
    variant: { xs: "tiny-caption", md: "paragraph-body-m", lg: "heading-page-l" },
    align: { xs: "left", md: "center" },
  },
};

export const ClampedToTwoLines: Story = {
  args: {
    children:
      "This is a very long sentence that should be clamped to exactly two lines once it overflows its container width, with an ellipsis at the end.",
    truncate: 2,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
};
