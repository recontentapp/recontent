import type { Meta, StoryObj } from "@storybook/react-vite";
import { SegmentedControls } from "../../src/generated/components/segmented-controls/SegmentedControls.gen";

const meta = {
  title: "Components/SegmentedControls",
  component: SegmentedControls,
  argTypes: {},
  args: {
    defaultValue: "week",
    options: [
      { value: "day", label: "Day" },
      { value: "week", label: "Week" },
      { value: "month", label: "Month" },
      { value: "year", label: "Year" },
    ],
  },
} satisfies Meta<typeof SegmentedControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
