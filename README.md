# tracefile

A CLI that tells you why a file exists: when it was created, who created it, who currently imports it, and how it's grown over time.

## Why?

Structure tools (import graphs, dependency analyzers) tell you *what* connects to what. They don't tell you the story behind a file: who wrote it, when, whether it's actually used anymore, or whether it's quietly ballooned into something that needs splitting. `tracefile` combines git history with your project's real import graph to answer "why does this file exist, and is it still earning its place?" in one command.

## Installation

```bash
npm install -g tracefile
```

Or run without installing:

```bash
npx tracefile <file>
```

### From source (for contributing)

```bash
git clone https://github.com/codebyrashel/tracefile.git
cd tracefile
npm install
npm run build
npm link
```

## Usage

```bash
tracefile <file> [options]
```

- `<file>` - required, path to the file to audit
- `--tsconfig <path>` - optional, defaults to `./tsconfig.json`
- `--json` - output machine-readable JSON instead of formatted text, for scripting or CI

## Examples:

```bash
# Audit a file in the current project
tracefile src/services/payment.ts

# Use a tsconfig in a different location
tracefile src/utils/helpers.ts --tsconfig ./packages/api/tsconfig.json

# Get JSON output
tracefile src/services/payment.ts --json
```

## Example output

```
$ tracefile src/analyzers/git-history.ts

📄 src/analyzers/git-history.ts

Created:        Aug 10, 2026 by codebyrashel
Last modified:  Aug 10, 2026 by codebyrashel
Commits:        2
Growth:         38 → 43 lines ↑

Used by (2):
  src/cli.ts
  src/analyzers/git-history.test.ts
```

## What it checks

- **History** - when the file was first committed and by whom, when it was last modified and by whom, and total commit count (via git log)
- **Growth** - line count at first commit vs. current line count on disk
- **Used by** - every other file in the project that currently imports this one (via TypeScript's real import graph, not text search)

## Known limitations

- **Single-file scans only.** `tracefile` audits one file per run - no directory-wide or "audit everything" mode yet.
- **No commit message summarization.** The tool reports *when* and *by whom* a file changed, not *why* in prose - reading the actual commit messages/diffs is still on you. A future version could summarize this, but that's a meaningfully bigger feature (real diff/message analysis) deliberately left out of v1.
- **Renamed/moved files may lose early history.** Git's rename detection is heuristic, not guaranteed - a file that was renamed or moved may show a shorter history than its true lifetime if git didn't track the rename as a rename.
- **Requires the file to be part of the TypeScript project.** If a file isn't included by the given `tsconfig.json` (wrong `--tsconfig` path, or excluded via `tsconfig`'s own `include`/`exclude`), the "Used by" section can't be computed.

## License

ISC