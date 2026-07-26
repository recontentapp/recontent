import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../components/components/stack/Stack.gen";

const meta = {
  title: "Layout/Stack",
  component: Stack,
  parameters: {
    layout: "centered",
  },
  args: {
    gap: "md",
  },
  argTypes: {
    children: {
      control: false,
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

const itemStyle = {
  backgroundColor: "white",
  borderRadius: 4,
  color: "#1e3a8a",
  padding: 12,
};

export const Default: Story = {
  render: (args) => (
    <Stack {...args}>
      <div style={itemStyle}>First item</div>
      <div style={itemStyle}>Second item</div>
      <div style={itemStyle}>Third item</div>
    </Stack>
  ),
};

export const SmallGap: Story = {
  args: {
    gap: "sm",
  },
  render: Default.render,
};

export const LargeGap: Story = {
  args: {
    gap: "lg",
  },
  render: Default.render,
};
