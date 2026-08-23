import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "../box/Box.gen";
import { Stack } from "../stack/Stack.gen";
import { StackItem } from "./StackItem.gen";

const meta = {
  title: "Components/StackItem",
  component: StackItem,
  argTypes: {
    basis: {
      control: "select",
      options: [undefined, "auto", "full", 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80],
    },
    alignSelf: {
      control: "select",
      options: ["auto", "start", "center", "end", "stretch", "baseline"],
    },
    grow: {
      control: "boolean",
    },
    shrink: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <Stack direction="row" gap={8}>
        <Story />
      </Stack>
    ),
  ],
  args: {
    children: <Box padding={16} backgroundColor={200} borderRadius="element" />,
  },
} satisfies Meta<typeof StackItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Grow: Story = {
  args: {
    grow: true,
  },
};

export const FixedBasis: Story = {
  args: {
    basis: 48,
    grow: false,
    shrink: false,
  },
};

export const Responsive: Story = {
  args: {
    basis: { xs: "full", md: 24 },
    grow: { xs: true, md: false },
  },
};

export const AlignSelfEnd: Story = {
  decorators: [
    (Story) => (
      <Stack direction="row" gap={8} align="stretch">
        <Box padding={32} backgroundColor={200} borderRadius="element">
          Sibling
        </Box>
        <Story />
      </Stack>
    ),
  ],
  args: {
    alignSelf: "end",
  },
};
