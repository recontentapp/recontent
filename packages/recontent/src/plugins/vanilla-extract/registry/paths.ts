export function componentArtifactPath(id: string, name: string, suffix: string): string {
  return `components/${id}/${name}${suffix}`;
}
