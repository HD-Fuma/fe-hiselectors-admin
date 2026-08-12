import type { Page } from "@playwright/test";
import { expect, test } from "./browserDiagnostics";

async function waitForApp(page: Page) {
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

test("administrator login opens the workspace", async ({ page }) => {
  await page.goto("/login");
  await waitForApp(page);

  await expect(page.getByRole("heading", { name: "Hi-Selectors" })).toBeVisible();
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/creators$/);
  await expect(page.getByTestId("admin-shell")).toBeVisible();
  await expect(page.getByRole("heading", { name: "크리에이터 풀" })).toBeVisible();
});

test("primary administrator routes render their current page", async ({ page }) => {
  const routes = [
    ["/creators", "크리에이터 풀"],
    ["/applicants", "지원자 승인"],
    ["/selectors", "셀렉터스 목록"],
    ["/campaigns", "캠페인 관리"],
    ["/content/reviews", "콘텐츠 검수"],
    ["/performance/selectors", "셀렉터스 성과"],
    ["/settlements", "정산 관리"],
  ] as const;

  for (const [path, title] of routes) {
    await page.goto(path);
    await waitForApp(page);
    await expect(page.getByTestId("admin-shell")).toBeVisible();
    await expect(page.locator(".hsas-page-header").getByRole("heading", { name: title })).toBeVisible();
  }
});
