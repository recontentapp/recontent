import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "./Accordion.gen";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  argTypes: {},
  args: {},
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        value: "item1",
        trigger: "Item 1",
        content: "Content for item 1",
      },
      {
        value: "item2",
        trigger: "Item 1",
        content: "Content for item 1",
      },
      {
        value: "item3",
        trigger: "Item 1",
        content: "Content for item 1",
      },
    ],
  },
};
