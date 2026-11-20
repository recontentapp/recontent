import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sticker } from "./components";

const meta = { title: "Sticker", component: Sticker } satisfies Meta<typeof Sticker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = { args: { children: "New" } };

export const Tilted: Story = { args: { tilt: "left", children: "Sale" } };

export const InACard: Story = {
  name: "In a card",
  render: () => (
    <div>
      <Sticker tilt="right">Hot</Sticker>
      <p>Summer collection</p>
    </div>
  ),
};
