import { getFileHistory } from "./analyzers/git-history.ts";

const result = await getFileHistory(".", "package.json");
console.log(result);