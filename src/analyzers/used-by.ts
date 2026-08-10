import type { Project } from "ts-morph";

export function getUsedBy(project: Project, targetFilePath: string): string[] | null {
  const targetFile = project.getSourceFile(targetFilePath);

  if (!targetFile) {
    return null;
  }

  return targetFile
    .getReferencingSourceFiles()
    .map((file) => file.getFilePath());
}