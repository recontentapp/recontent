import type { Meta, StoryObj } from "@storybook/react-vite";
import { TreeList } from "./TreeList.gen";

const meta = {
  title: "Components/TreeList",
  component: TreeList,
  argTypes: {},
  args: {
    label: "Files",
    defaultExpandedIds: ["src"],
    selectedId: "button",
    nodes: [
      {
        id: "src",
        label: "src",
        children: [
          {
            id: "components",
            label: "components",
            children: [
              { id: "button", label: "Button.tsx" },
              { id: "text", label: "Text.tsx" },
            ],
          },
          { id: "index", label: "index.ts" },
        ],
      },
      { id: "readme", label: "README.md" },
    ],
  },
} satisfies Meta<typeof TreeList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
