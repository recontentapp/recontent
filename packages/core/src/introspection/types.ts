export const INTROSPECTION_SCHEMA_VERSION = "1";

export type IntrospectionConfigInput = {
  tsConfigPath: string;
  componentsConfigPath: string;
};
export type NamedProps = {
  type: "named";
  name: string;
  sourceFilePath: string;
  checksum: string;
};
export type InlinePropsDependency = {
  name: string;
  sourceFilePath: string;
  checksum: string;
};
export type InlineProps = {
  type: "inline";
  content: string;
  dependencies: InlinePropsDependency[];
};
export type UnverifiedComponentDeclaration = {
  name: string;
  sourceFilePath: string | null;
  props: NamedProps | InlineProps | null;
};
export type ComponentDeclaration = {
  name: string;
  sourceFilePath: string;
  props: NamedProps | InlineProps;
};
export type InterfaceMember = {
  name: string;
  value: string;
  isOptional: boolean;
  isDeprecated: boolean;
  defaultValue: string | null;
  description: string | null;
};
export type Dependency = { sourceFilePath: string; name: string; checksum: string };
export type DictItem = {
  name: string;
  generics: string | null;
  sourceFilePath: string;
  description: string | null;
  isDeprecated: boolean;
  type: "interface" | "enum" | "type";
  value: string | null;
  members: InterfaceMember[];
  dependencies: Dependency[];
  external?: boolean;
  packageName?: string;
};
export type Checksum = string;
export type Dict = Record<Checksum, DictItem>;
export type IntrospectionLog = { message: string; context: Record<string, unknown> };
export type IntrospectionResult = {
  schemaVersion: string;
  componentDeclarations: ComponentDeclaration[];
  dict: Dict;
  warnings: IntrospectionLog[];
};
