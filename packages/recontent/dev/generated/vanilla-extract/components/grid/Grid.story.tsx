import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "./Grid.gen";

const meta = {
  title: "Components/Grid",
  component: Grid,
  argTypes: {
    gap: {
      control: "select",
      options: [0, "0-5", 1, "1-5", 2, 3, 4, 5, 6, 8, 10, 12],
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
    gap: 4,
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

export const AsymmetricColumns: Story = {
  args: { columns: "1fr 2fr", gap: 2 },
  render: (args) => (
    <Grid {...args}>
      <div>Sidebar</div>
      <div>Content</div>
    </Grid>
  ),
};
