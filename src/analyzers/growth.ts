import { simpleGit } from "simple-git";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface GrowthStats {
  firstLineCount: number;
  currentLineCount: number;
}

export async function getGrowthStats(
  repoPath: string,
  filePath: string
): Promise<GrowthStats | null> {
  const git = simpleGit(repoPath);

  let log;
  try {
    log = await git.log({ file: filePath });
  } catch {
    return null;
  }

  if (log.all.length === 0) {
    return null;
  }

  const oldest = log.all[log.all.length - 1];
  if (!oldest) {
    return null;
  }

  let firstContent: string;
  try {
    firstContent = await git.show([`${oldest.hash}:${filePath}`]);
  } catch {
    return null;
  }

  const currentContent = readFileSync(join(repoPath, filePath), "utf-8");

  return {
    firstLineCount: countLines(firstContent),
    currentLineCount: countLines(currentContent),
  };
}

function countLines(content: string): number {
  if (content.length === 0) return 0;
  return content.split("\n").length;
}