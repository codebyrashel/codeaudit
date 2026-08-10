#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { Project } from "ts-morph";
import { resolve, relative } from "node:path";
import { existsSync } from "node:fs";
import { getFileHistory } from "./analyzers/git-history.ts";
import { getUsedBy } from "./analyzers/used-by.ts";
import { getGrowthStats } from "./analyzers/growth.ts";

const program = new Command();

program
  .name("tracefile")
  .description("Show why a file exists: git history, who imports it, and how it's grown over time.")
  .version("0.1.0");

program
  .argument("<file>", "path to the file to audit")
  .option("--tsconfig <path>", "path to tsconfig.json", "./tsconfig.json")
  .option("--json", "output results as JSON instead of formatted text")
  .action(async (fileArg: string, options: { tsconfig: string; json?: boolean }) => {
    const repoPath = process.cwd();
    const absoluteFilePath = resolve(repoPath, fileArg);

    if (!existsSync(absoluteFilePath)) {
      console.error(chalk.red(`Error: File not found: "${fileArg}"`));
      process.exitCode = 1;
      return;
    }

    if (!existsSync(options.tsconfig)) {
      console.error(chalk.red(`Error: Could not find a tsconfig.json at "${options.tsconfig}"`));
      process.exitCode = 1;
      return;
    }

    const history = await getFileHistory(repoPath, fileArg);
    const growth = await getGrowthStats(repoPath, fileArg);

    const project = new Project({ tsConfigFilePath: options.tsconfig });
    const usedBy = getUsedBy(project, absoluteFilePath);

    if (options.json) {
      console.log(JSON.stringify({ file: fileArg, history, growth, usedBy }, null, 2));
      return;
    }

    printReport(fileArg, history, growth, usedBy);
  });

function printReport(
  fileArg: string,
  history: Awaited<ReturnType<typeof getFileHistory>>,
  growth: Awaited<ReturnType<typeof getGrowthStats>>,
  usedBy: ReturnType<typeof getUsedBy>
): void {
  console.log(chalk.bold(`\n📄 ${fileArg}\n`));

  if (!history) {
    console.log(chalk.dim("No git history found for this file (untracked, or not yet committed).\n"));
  } else {
    console.log(`Created:        ${chalk.cyan(formatDate(history.createdDate))} by ${history.createdBy}`);
    console.log(`Last modified:  ${chalk.cyan(formatDate(history.lastModifiedDate))} by ${history.lastModifiedBy}`);
    console.log(`Commits:        ${history.commitCount}`);
  }

  if (growth && growth.firstLineCount !== growth.currentLineCount) {
    const arrow = growth.currentLineCount > growth.firstLineCount ? "↑" : "↓";
    console.log(`Growth:         ${growth.firstLineCount} → ${growth.currentLineCount} lines ${arrow}`);
  }

  console.log();

  if (usedBy === null) {
    console.log(chalk.yellow("This file wasn't found in the TypeScript project (check the --tsconfig path)."));
  } else if (usedBy.length === 0) {
    console.log(chalk.yellow("Used by: nothing — no other file imports this one."));
  } else {
    console.log(chalk.bold(`Used by (${usedBy.length}):`));
    for (const path of usedBy) {
      console.log(`  ${relative(process.cwd(), path)}`);
    }
  }

  console.log();
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

program.parse();