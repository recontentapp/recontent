import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/components/card/Card.gen";

const meta = {
  title: "Layout/Card",
  component: Card,
  args: {
    style: { width: 360 },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Project overview</CardTitle>
        <CardDescription>Review the latest activity from your team.</CardDescription>
      </CardHeader>
      <CardContent>All systems are operating normally.</CardContent>
      <CardFooter>Updated a moment ago</CardFooter>
    </Card>
  ),
};
