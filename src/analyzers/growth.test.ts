import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { simpleGit } from "simple-git";
import { getGrowthStats } from "./growth.ts";

async function makeTestRepo(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "tracefile-growth-test-"));
  const git = simpleGit(dir);

  await git.init();
  await git.addConfig("user.name", "Test User");
  await git.addConfig("user.email", "test@example.com");

  return dir;
}

test("reports line count growth between first and current commit", async () => {
  const repoPath = await makeTestRepo();
  const git = simpleGit(repoPath);

  writeFileSync(join(repoPath, "example.ts"), "line1\nline2\nline3");
  await git.add("example.ts");
  await git.commit("initial commit");

  appendFileSync(join(repoPath, "example.ts"), "\nline4\nline5");
  await git.add("example.ts");
  await git.commit("second commit");

  const result = await getGrowthStats(repoPath, "example.ts");

  assert.equal(result?.firstLineCount, 3);
  assert.equal(result?.currentLineCount, 5);
});

test("returns null for a file with no git history", async () => {
  const repoPath = await makeTestRepo();

  const result = await getGrowthStats(repoPath, "never-committed.ts");

  assert.equal(result, null);
});