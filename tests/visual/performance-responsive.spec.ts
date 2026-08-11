import type { Locator, Page, TestInfo } from "@playwright/test";
import { expect, test } from "./browserDiagnostics";

const VIEWPORTS = [
  { height: 1_000, width: 1_440 },
  { height: 900, width: 1_024 },
  { height: 900, width: 768 },
] as const;

const PERFORMANCE_ROUTES = [
  {
    charts: ["선택 기간 성과 추이", "캠페인 전환 성과", "셀렉터스 성과 순위"],
    metricGroup: "성과 요약",
    path: "/performance",
    title: "관리자 성과 대시보드",
  },
  {
    charts: ["크리에이터 영향력 비교"],
    metricGroup: "크리에이터 성과 요약",
    path: "/performance/creators",
    title: "크리에이터 영향력 분석",
  },
  {
    path: "/performance/contents",
    statusMonitor: "콘텐츠 상태 추적",
    title: "콘텐츠 성과",
  },
] as const;

async function openPerformancePage(
  page: Page,
  path: string,
  testInfo: TestInfo,
) {
  const target = new URL(path, String(testInfo.project.use.baseURL));
  await page.goto(target.toString());
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function expectWithinViewport(page: Page, locator: Locator) {
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();

  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
}

async function expectChartsNotClipped(page: Page) {
  const charts = page.locator(".fuma-performance-chart");
  const chartCount = await charts.count();
  expect(chartCount).toBeGreaterThan(0);

  for (let index = 0; index < chartCount; index += 1) {
    const chart = charts.nth(index);
    await expect(chart).toBeVisible();
    await expectWithinViewport(page, chart);

    const geometry = await chart.evaluate((node) => {
      const chartRect = node.getBoundingClientRect();
      const plottedElements = node.querySelectorAll(
        "svg, svg [data-date], .fuma-performance-bar-chart__row, .fuma-performance-ranking__item",
      );

      return {
        chartLeft: chartRect.left,
        chartRight: chartRect.right,
        clientWidth: node.clientWidth,
        plottedRects: [...plottedElements].map((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        }),
        scrollWidth: node.scrollWidth,
      };
    });

    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    for (const rect of geometry.plottedRects) {
      expect(rect.left).toBeGreaterThanOrEqual(geometry.chartLeft - 1);
      expect(rect.right).toBeLessThanOrEqual(geometry.chartRight + 1);
    }
  }
}

for (const route of PERFORMANCE_ROUTES) {
  for (const viewport of VIEWPORTS) {
    test(`${route.path} fits the ${viewport.width}px viewport`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await openPerformancePage(page, route.path, testInfo);

      await expect(page.getByRole("heading", { name: route.title })).toBeVisible();
      if ("statusMonitor" in route) {
        const statusMonitor = page.getByRole("region", {
          name: route.statusMonitor,
        });
        await expect(statusMonitor).toBeVisible();
        await expect(
          statusMonitor.getByRole("heading", { name: route.statusMonitor }),
        ).toBeVisible();
        await expect(
          statusMonitor.getByRole("button", { name: "이상 감지" }),
        ).toBeVisible();
        await expect(statusMonitor.getByRole("table")).toBeVisible();
        await expect(
          statusMonitor.getByRole("columnheader", { name: "Σ 총합" }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole("group", { name: route.metricGroup }),
        ).toBeVisible();
        for (const chartName of route.charts) {
          await expect(page.getByRole("figure", { name: chartName })).toBeVisible();
        }
      }

      const documentGeometry = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      expect(documentGeometry.scrollWidth).toBeLessThanOrEqual(
        documentGeometry.viewportWidth + 1,
      );
      if (!("statusMonitor" in route)) {
        await expectChartsNotClipped(page);
      }

      const tableWraps = page.locator(
        "statusMonitor" in route
          ? ".fuma-content-status-monitor__table-wrap"
          : ".fuma-performance-results .hsas-dense-table-wrap",
      );
      expect(await tableWraps.count()).toBeGreaterThan(0);
      if (
        viewport.width === 768 ||
        (viewport.width === 1_024 && route.path !== "/performance")
      ) {
        const localOverflow = await tableWraps.evaluateAll((nodes) =>
          nodes.every((node) => node.scrollWidth > node.clientWidth),
        );
        expect(localOverflow).toBe(true);
      }
    });
  }
}
