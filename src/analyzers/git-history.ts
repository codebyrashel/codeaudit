import { simpleGit } from "simple-git";

export interface FileHistory {
  createdDate: string;
  createdBy: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  commitCount: number;
}

export async function getFileHistory(
  repoPath: string,
  filePath: string
): Promise<FileHistory | null> {
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

  const mostRecent = log.all[0];
  const oldest = log.all[log.all.length - 1];

  if (!mostRecent || !oldest) {
    return null;
  }

  return {
    createdDate: oldest.date,
    createdBy: oldest.author_name,
    lastModifiedDate: mostRecent.date,
    lastModifiedBy: mostRecent.author_name,
    commitCount: log.all.length,
  };
}
