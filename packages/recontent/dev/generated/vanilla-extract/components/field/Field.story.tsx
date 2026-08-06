import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field } from "./Field.gen";

const meta = {
  title: "Components/Field",
  component: Field,
  argTypes: {},
  args: {
    label: "Email address",
    description: "We'll only use this to send you order updates.",
    required: true,
    children: null,
  },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Field {...args}>
      <input type="email" placeholder="jane@example.com" />
    </Field>
  ),
};
