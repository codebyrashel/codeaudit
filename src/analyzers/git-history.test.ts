import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { simpleGit } from "simple-git";
import { getFileHistory } from "./git-history.ts";

async function makeTestRepo(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "tracefile-test-"));
  const git = simpleGit(dir);

  await git.init();
  await git.addConfig("user.name", "Test User");
  await git.addConfig("user.email", "test@example.com");

  return dir;
}

test("returns history for a file with one commit", async () => {
  const repoPath = await makeTestRepo();
  const git = simpleGit(repoPath);

  writeFileSync(join(repoPath, "example.ts"), "export const x = 1;");
  await git.add("example.ts");
  await git.commit("initial commit");

  const result = await getFileHistory(repoPath, "example.ts");

  assert.ok(result !== null);
  assert.equal(result?.commitCount, 1);
  assert.equal(result?.createdBy, "Test User");
});

test("distinguishes created date from last modified date across multiple commits", async () => {
  const repoPath = await makeTestRepo();
  const git = simpleGit(repoPath);

  writeFileSync(join(repoPath, "example.ts"), "export const x = 1;");
  await git.add("example.ts");
  await git
    .env({ GIT_AUTHOR_DATE: "2024-01-01T09:00:00", GIT_COMMITTER_DATE: "2024-01-01T09:00:00" })
    .commit("initial commit");

  appendFileSync(join(repoPath, "example.ts"), "\nexport const y = 2;");
  await git.add("example.ts");
  await git
    .env({ GIT_AUTHOR_DATE: "2024-06-01T09:00:00", GIT_COMMITTER_DATE: "2024-06-01T09:00:00" })
    .commit("second commit");

  const result = await getFileHistory(repoPath, "example.ts");

  assert.equal(result?.commitCount, 2);
  assert.notEqual(result?.createdDate, result?.lastModifiedDate);
});


test("returns null for a file with no git history", async () => {
  const repoPath = await makeTestRepo();

  const result = await getFileHistory(repoPath, "never-committed.ts");

  assert.equal(result, null);
});