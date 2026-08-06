import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover } from "./Popover.gen";

const meta = {
  title: "Components/Popover",
  component: Popover,
  argTypes: {
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
  },
  args: {
    trigger: <button type="button">Open popover</button>,
    content: (
      <div style={{ padding: 12, maxWidth: 220 }}>
        <p style={{ margin: 0 }}>This is some helpful contextual information shown next to the trigger.</p>
      </div>
    ),
    side: "bottom",
    align: "center",
    defaultOpen: true,
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
