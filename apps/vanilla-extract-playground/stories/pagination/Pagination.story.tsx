import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pagination } from "../../src/generated/components/pagination/Pagination.gen";

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  args: {
    page: 4,
    pageCount: 12,
    size: "sm",
    showFirstLast: true,
    onPageChange: () => {},
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [page, setPage] = useState(4);
    return <Pagination {...args} page={page} onPageChange={setPage} />;
  },
};
