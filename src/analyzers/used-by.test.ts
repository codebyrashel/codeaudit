import { test } from "node:test";
import assert from "node:assert/strict";
import { Project } from "ts-morph";
import { getUsedBy } from "./used-by.ts";

test("lists files that import the target file", () => {
  const project = new Project({ useInMemoryFileSystem: true });

  project.createSourceFile("src/math.ts", `export function add(a: number, b: number) { return a + b; }`);
  project.createSourceFile("src/main.ts", `import { add } from "./math.js"; add(1, 2);`);
  project.createSourceFile("src/other.ts", `import { add } from "./math.js"; add(3, 4);`);

  const results = getUsedBy(project, "src/math.ts");

  assert.equal(results?.length, 2);
  assert.ok(results?.some((path) => path.endsWith("main.ts")));
  assert.ok(results?.some((path) => path.endsWith("other.ts")));
});

test("returns an empty array for a file nothing imports", () => {
  const project = new Project({ useInMemoryFileSystem: true });

  project.createSourceFile("src/ghost.ts", `export const x = 1;`);

  const results = getUsedBy(project, "src/ghost.ts");

  assert.deepEqual(results, []);
});

test("returns null for a file not in the project", () => {
  const project = new Project({ useInMemoryFileSystem: true });

  project.createSourceFile("src/main.ts", `export const x = 1;`);

  const results = getUsedBy(project, "src/does-not-exist.ts");

  assert.equal(results, null);
});