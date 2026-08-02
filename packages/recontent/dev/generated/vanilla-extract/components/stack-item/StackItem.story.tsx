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
      options: [undefined, "auto", "full", 0, "0-5", 1, "1-5", 2, 3, 4, 5, 6, 8, 10, 12],
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
      <Stack direction="row" gap={2}>
        <Story />
      </Stack>
    ),
  ],
  args: {
    children: <Box padding={4} backgroundColor={200} borderRadius="element" />,
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
    basis: 12,
    grow: false,
    shrink: false,
  },
};

export const AlignSelfEnd: Story = {
  decorators: [
    (Story) => (
      <Stack direction="row" gap={2} align="stretch">
        <Box padding={8} backgroundColor={200} borderRadius="element">
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
