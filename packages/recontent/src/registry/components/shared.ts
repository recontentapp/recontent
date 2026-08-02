export function importName(reference: string): string {
  const [name] = reference.split(".");
  if (!name) {
    throw new Error(`Invalid token variable reference: ${reference}`);
  }
  return name;
}
