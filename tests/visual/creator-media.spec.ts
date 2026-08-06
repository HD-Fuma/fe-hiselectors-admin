import { mkdir } from "node:fs/promises";
import type { Page, TestInfo } from "@playwright/test";
import { expect, test } from "./browserDiagnostics";

test.beforeAll(async () => {
  await mkdir("test-results/visual", { recursive: true });
});

async function expectCreatorMedia(
  page: Page,
  path: string,
  screenshotPath: string,
  testInfo: TestInfo,
) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(new URL(path, String(testInfo.project.use.baseURL)).toString());
  await page.locator('[data-app-ready="true"]').waitFor();

  const images = page.locator('img[src*="/creator-media/kr-cr-"]');
  await expect(images.first()).toBeVisible();
  await expect.poll(async () => images.evaluateAll((nodes) =>
    nodes.length > 0 && nodes.every((node) => {
      const image = node as HTMLImageElement;
      return image.complete && image.naturalWidth > 0;
    }),
  )).toBe(true);

  await expect(page.locator(".fuma-creator-profile-fallback")).toHaveCount(0);
  await expect(page.locator(".fuma-creator-media__fallback")).toHaveCount(0);
  await page.screenshot({ path: screenshotPath, fullPage: true });
}

test("creator media loads on list", async ({ page }, testInfo) => {
  await expectCreatorMedia(
    page,
    "/creators",
    "test-results/visual/creator-media-list.png",
    testInfo,
  );
});

test("creator media loads on detail", async ({ page }, testInfo) => {
  await expectCreatorMedia(
    page,
    "/creators/cr-001",
    "test-results/visual/creator-media-detail.png",
    testInfo,
  );
});

test("creator media loads on proposal", async ({ page }, testInfo) => {
  await expectCreatorMedia(
    page,
    "/proposals/new?creator=cr-001",
    "test-results/visual/creator-media-proposal.png",
    testInfo,
  );
});
