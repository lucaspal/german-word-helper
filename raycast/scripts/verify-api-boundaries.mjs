import { readFile } from "node:fs/promises";

const command = await readFile(new URL("../src/german-article.tsx", import.meta.url), "utf8");
const dictionary = await readFile(new URL("../src/lib/dictionary.ts", import.meta.url), "utf8");

if (command.includes("usePromise") || /usePromise[^;]*@raycast\/api/.test(command)) {
  throw new Error("The command must not depend on the unsupported @raycast/api usePromise export");
}

for (const required of ["LOOKUP_DEBOUNCE_MS", "AbortController", "controller.abort()"] ) {
  if (!command.includes(required)) throw new Error(`Missing lookup safeguard: ${required}`);
}

for (const required of ["Api-User-Agent", "Retry-After", "CACHE_TTL_MS"]) {
  if (!dictionary.includes(required)) throw new Error(`Missing dictionary safeguard: ${required}`);
}

console.log("Raycast API and lookup safeguards verified");
