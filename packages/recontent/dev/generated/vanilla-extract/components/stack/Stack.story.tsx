import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "../box/Box.gen";
import { Stack } from "./Stack.gen";

function Swatch({ label }: { label: string }) {
  return (
    <Box padding={16} borderRadius="element" backgroundColor={200}>
      {label}
    </Box>
  );
}

const meta = {
  title: "Components/Stack",
  component: Stack,
  argTypes: {
    direction: {
      control: "radio",
      options: ["row", "column"],
    },
    gap: {
      control: "select",
      options: [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80],
    },
    align: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
    },
    justify: {
      control: "select",
      options: ["start", "center", "end", "space-between", "space-around", "space-evenly"],
    },
  },
  args: {
    direction: "row",
    gap: 16,
    children: (
      <>
        <Swatch label="One" />
        <Swatch label="Two" />
        <Swatch label="Three" />
      </>
    ),
  },
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Row: Story = {};

export const Column: Story = {
  args: {
    direction: "column",
  },
};

export const JustifyBetween: Story = {
  args: {
    justify: "space-between",
  },
};

export const Responsive: Story = {
  args: {
    direction: { xs: "column", md: "row" },
    gap: { xs: 8, md: 16, lg: 24 },
  },
};

export const Wrapping: Story = {
  args: {
    wrap: true,
    gap: 8,
    children: Array.from({ length: 10 }, (_, index) => (
      <Swatch key={index} label={`Item ${index + 1}`} />
    )),
  },
};
