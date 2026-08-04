import { copyFile } from "node:fs/promises";

const outputDirectory = new URL("../dist/", import.meta.url);

await copyFile(new URL("index.html", outputDirectory), new URL("404.html", outputDirectory));

console.log("Created GitHub Pages SPA fallback at dist/404.html");
