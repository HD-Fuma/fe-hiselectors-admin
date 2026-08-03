import { defineConfig } from "@playwright/test";

const configuredPort = process.env.FUMA_VISUAL_PORT ?? "4173";
const port = Number(configuredPort);

if (!/^\d+$/.test(configuredPort) || !Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("FUMA_VISUAL_PORT must be a numeric TCP port between 1 and 65535.");
}

const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "test-results/playwright",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    colorScheme: "light",
    deviceScaleFactor: 1,
    contextOptions: {
      reducedMotion: "reduce",
    },
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
