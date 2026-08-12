import { readFile } from "node:fs/promises";

const repositoryBase = "/fe-hiselectors-admin/";

async function readRequired(relativePath) {
  try {
    return await readFile(new URL(relativePath, import.meta.url), "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error(`Missing required Pages artifact: ${relativePath}`, {
        cause: error,
      });
    }

    throw error;
  }
}

const indexHtml = await readRequired("../dist/index.html");
const fallbackHtml = await readRequired("../dist/404.html");

for (const [name, html] of [
  ["index.html", indexHtml],
  ["404.html", fallbackHtml],
]) {
  if (html.includes('/src/main.tsx')) {
    throw new Error(`${name} still references the Vite development entrypoint.`);
  }

  if (!html.includes(`${repositoryBase}assets/`)) {
    throw new Error(`${name} does not use the GitHub Pages repository base path.`);
  }

  if (!html.includes('<div id="root"></div>')) {
    throw new Error(`${name} is missing the React application root.`);
  }
}

console.log(`Verified GitHub Pages build at ${repositoryBase}`);
