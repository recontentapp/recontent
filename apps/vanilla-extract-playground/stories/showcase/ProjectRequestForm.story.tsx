import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "../../src/generated/components/avatar/Avatar.gen";
import { Badge } from "../../src/generated/components/badge/Badge.gen";
import { Banner } from "../../src/generated/components/banner/Banner.gen";
import { Box } from "../../src/generated/components/box/Box.gen";
import { Button } from "../../src/generated/components/button/Button.gen";
import { Checkbox } from "../../src/generated/components/checkbox/Checkbox.gen";
import { DateInput } from "../../src/generated/components/date-input/DateInput.gen";
import { Divider } from "../../src/generated/components/divider/Divider.gen";
import { Field } from "../../src/generated/components/field/Field.gen";
import { FileInput } from "../../src/generated/components/file-input/FileInput.gen";
import { Grid } from "../../src/generated/components/grid/Grid.gen";
import { MetadataList } from "../../src/generated/components/metadata-list/MetadataList.gen";
import { NumberInput } from "../../src/generated/components/number-input/NumberInput.gen";
import { ProgressBar } from "../../src/generated/components/progress-bar/ProgressBar.gen";
import { RadioList } from "../../src/generated/components/radio-list/RadioList.gen";
import { Select } from "../../src/generated/components/select/Select.gen";
import { Stack } from "../../src/generated/components/stack/Stack.gen";
import { Steps } from "../../src/generated/components/steps/Steps.gen";
import { Switch } from "../../src/generated/components/switch/Switch.gen";
import { Text } from "../../src/generated/components/text/Text.gen";
import { TextInput } from "../../src/generated/components/text-input/TextInput.gen";
import { Textarea } from "../../src/generated/components/textarea/Textarea.gen";
import { container, page, sidebar } from "./ProjectRequestForm.css";

type Priority = "low" | "medium" | "high";
type Team = "design" | "engineering" | "marketing" | "sales";

const teamOptions = [
  { value: "design" as Team, label: "Design" },
  { value: "engineering" as Team, label: "Engineering" },
  { value: "marketing" as Team, label: "Marketing" },
  { value: "sales" as Team, label: "Sales" },
];

const priorityOptions = [
  { value: "low" as Priority, label: "Low", description: "No hard deadline" },
  { value: "medium" as Priority, label: "Medium", description: "Needed within the quarter" },
  { value: "high" as Priority, label: "High", description: "Blocking other work" },
];

const priorityBadgeVariant: Record<Priority, "info" | "warning" | "danger"> = {
  low: "info",
  medium: "warning",
  high: "danger",
};

function ProjectRequestForm() {
  const [name, setName] = useState("Self-serve billing portal");
  const [requester, setRequester] = useState("Ada Lovelace");
  const [team, setTeam] = useState<Team | undefined>("engineering");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<Date | null>(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15),
  );
  const [budget, setBudget] = useState<number | null>(12000);
  const [description, setDescription] = useState(
    "Let customers manage seats, invoices and payment methods without opening a support ticket.",
  );
  const [notifyStakeholders, setNotifyStakeholders] = useState(true);
  const [needsLegalReview, setNeedsLegalReview] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const initials = useMemo(
    () =>
      requester
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [requester],
  );

  const completedFields = [
    name.trim().length > 0,
    requester.trim().length > 0,
    team !== undefined,
    dueDate !== null,
    description.trim().length > 0,
  ].filter(Boolean).length;
  const totalFields = 5;
  const completion = Math.round((completedFields / totalFields) * 100);

  const canSubmit = completedFields === totalFields && confirmed;

  return (
    <div className={page}>
      <div className={container}>
        <Grid columns={{ xs: 1, lg: "2fr 1fr" }} gap={32}>
          <Stack gap={24}>
            <Stack gap={4}>
              <Text variant="heading-page">New project request</Text>
              <Text variant="paragraph-body-m" color="secondary">
                Submit a brief so the operations team can triage and staff your project.
              </Text>
            </Stack>

            {submitted && (
              <Banner status="success" title="Request submitted">
                Operations will review "{name}" and get back to you within two business days.
              </Banner>
            )}

            <Stack gap={16}>
              <Text variant="heading-section-3">Overview</Text>
              <Field label="Project name" required>
                <TextInput
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Self-serve billing portal"
                />
              </Field>

              <Grid columns={{ xs: 1, sm: 2 }} gap={16}>
                <Field label="Requested by" required>
                  <TextInput
                    value={requester}
                    onChange={(event) => setRequester(event.target.value)}
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Team" required>
                  <Select
                    options={teamOptions}
                    value={team}
                    onValueChange={setTeam}
                    placeholder="Select a team"
                  />
                </Field>
              </Grid>

              <Field
                label="Description"
                description="What problem does this solve, and for whom?"
                required
              >
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  minRows={4}
                  showCharacterCount
                  maxLength={400}
                />
              </Field>
            </Stack>

            <Divider />

            <Stack gap={16}>
              <Text variant="heading-section-3">Planning</Text>
              <Field label="Priority" required>
                <RadioList
                  options={priorityOptions}
                  value={priority}
                  onValueChange={(value) => setPriority(value)}
                  orientation="horizontal"
                />
              </Field>

              <Grid columns={{ xs: 1, sm: 2 }} gap={16}>
                <Field label="Target date" required>
                  <DateInput value={dueDate} onValueChange={setDueDate} clearable />
                </Field>
                <Field label="Estimated budget" description="In USD">
                  <NumberInput
                    value={budget}
                    onValueChange={setBudget}
                    min={0}
                    step={500}
                    prefix="$"
                  />
                </Field>
              </Grid>

              <Field
                label="Supporting documents"
                description="Briefs, mockups or research (PDF, PNG)"
              >
                <FileInput
                  accept=".pdf,.png,.jpg"
                  multiple
                  files={files}
                  onFilesChange={setFiles}
                />
              </Field>
            </Stack>

            <Divider />

            <Stack gap={12}>
              <Text variant="heading-section-3">Review &amp; confirm</Text>
              <Switch
                checked={notifyStakeholders}
                onCheckedChange={setNotifyStakeholders}
                label="Notify team stakeholders when this request is triaged"
                labelPosition="end"
              />
              <Switch
                checked={needsLegalReview}
                onCheckedChange={setNeedsLegalReview}
                label="This project involves a new vendor or contract"
                labelPosition="end"
              />
              <Checkbox
                checked={confirmed}
                onCheckedChange={setConfirmed}
                label="I confirm the details above are accurate"
                required
              />
            </Stack>

            <Stack direction="row" gap={12} justify="end">
              <Button variant="secondary" onClick={() => setSubmitted(false)}>
                Save as draft
              </Button>
              <Button variant="primary" disabled={!canSubmit} onClick={() => setSubmitted(true)}>
                Submit request
              </Button>
            </Stack>
          </Stack>

          <Box className={sidebar} padding={20} borderRadius="container" border="thin">
            <Stack gap={20}>
              <Stack direction="row" gap={12} align="center">
                <Avatar text={initials || "?"} size="lg" />
                <Stack gap={0}>
                  <Text variant="paragraph-body-m-strong">{requester || "Unnamed requester"}</Text>
                  <Text variant="tiny-caption" color="secondary">
                    {team
                      ? teamOptions.find((option) => option.value === team)?.label
                      : "No team selected"}
                  </Text>
                </Stack>
              </Stack>

              <ProgressBar
                value={completion}
                label="Form completion"
                showValueLabel
                status={completion === 100 ? "success" : "default"}
              />

              <Divider />

              <Stack gap={8}>
                <Text variant="tiny-caption-strong" color="secondary" textTransform="uppercase">
                  Preview
                </Text>
                <Text variant="paragraph-body-l-strong">{name || "Untitled project"}</Text>
                <Text variant="paragraph-body-m" color="secondary">
                  {description || "No description yet."}
                </Text>
                <Stack direction="row" gap={8} wrap>
                  <Badge variant={priorityBadgeVariant[priority]}>
                    {priorityOptions.find((option) => option.value === priority)?.label} priority
                  </Badge>
                  {needsLegalReview && <Badge variant="warning">Needs legal review</Badge>}
                  {notifyStakeholders && <Badge variant="info">Stakeholders notified</Badge>}
                </Stack>
              </Stack>

              <Divider />

              <MetadataList
                orientation="horizontal"
                gap={8}
                items={[
                  {
                    label: "Target date",
                    value: dueDate ? dueDate.toLocaleDateString() : "Not set",
                  },
                  {
                    label: "Budget",
                    value: budget !== null ? `$${budget.toLocaleString()}` : "Not set",
                  },
                  {
                    label: "Attachments",
                    value:
                      files.length > 0
                        ? `${files.length} file${files.length > 1 ? "s" : ""}`
                        : "None",
                  },
                ]}
              />

              <Divider />

              <Steps
                orientation="vertical"
                size="sm"
                activeStep={submitted ? 2 : 1}
                steps={[
                  { label: "Draft" },
                  { label: "Submitted for review" },
                  { label: "Triaged by operations" },
                ]}
              />
            </Stack>
          </Box>
        </Grid>
      </div>
    </div>
  );
}

const meta = {
  title: "Showcase/Project Request Form",
  component: ProjectRequestForm,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ProjectRequestForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
