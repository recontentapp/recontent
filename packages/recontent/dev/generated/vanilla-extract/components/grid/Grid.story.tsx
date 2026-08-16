import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "./Grid.gen";

const meta = {
  title: "Components/Grid",
  component: Grid,
  argTypes: {
    gap: {
      control: "select",
      options: [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80],
    },
    align: {
      control: "select",
      options: ["start", "center", "end", "stretch"],
    },
    justify: {
      control: "select",
      options: ["start", "center", "end", "stretch", "space-between"],
    },
    autoFlow: {
      control: "select",
      options: ["row", "column", "dense", "row dense", "column dense"],
    },
  },
  args: {
    columns: 3,
    gap: 16,
  },
} satisfies Meta<typeof Grid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Grid {...args}>
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </Grid>
  ),
};

export const Responsive: Story = {
  args: {
    columns: { xs: 1, md: 2, lg: 3 },
    gap: { xs: 8, md: 16, lg: 24 },
  },
};

export const AsymmetricColumns: Story = {
  args: { columns: "1fr 2fr", gap: 8 },
  render: (args) => (
    <Grid {...args}>
      <div>Sidebar</div>
      <div>Content</div>
    </Grid>
  ),
};
