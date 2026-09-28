import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/german-article.tsx", import.meta.url), "utf8");

if (/usePromise\s*,?[^;]*from\s+["']@raycast\/api["']/.test(source)) {
  throw new Error("usePromise must be imported from @raycast/utils, not @raycast/api");
}

if (!/import\s*\{\s*usePromise\s*\}\s*from\s*["']@raycast\/utils["']/.test(source)) {
  throw new Error("The command must import usePromise from @raycast/utils");
}

console.log("Raycast API import boundaries verified");