import {
  expect,
  test as base,
  type BrowserContext,
  type ConsoleMessage,
  type Request,
  type WebError,
} from "@playwright/test";
import {
  isAllowedHttpUrl,
  isAllowedWebSocketUrl,
} from "./browserDiagnosticsPolicy";

export interface BrowserDiagnostics {
  consoleErrors: string[];
  externalRequests: string[];
  externalWebSockets: string[];
  pageErrors: string[];
  requestFailures: string[];
}

interface BrowserDiagnosticFixtures {
  browserDiagnostics: BrowserDiagnostics;
}

async function installContextRoutes(
  context: BrowserContext,
  baseURL: URL,
  diagnostics: BrowserDiagnostics,
) {
  await context.route("**/*", async (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.startsWith("https://cdn.jsdelivr.net/gh/orioncactus/pretendard/")) {
      await route.fulfill({ contentType: "text/css", body: "" });
      return;
    }
    if (requestUrl.startsWith("http://localhost:8080/api/admin/creators?")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            content: [{
              id: 113,
              snsCode: "INSTAGRAM",
              accountId: "seo.yeon",
              creatorName: "김서연",
              followerCount: 82_400,
              engagementRate: 4.25,
              lastContentAt: "2026-08-12T20:00:00",
              category: "BEAUTY",
              recent90DayContentCount: 14,
            }],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 20,
          },
        }),
      });
      return;
    }
    if (requestUrl === "http://localhost:8080/api/admin/categories") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{
            id: 1,
            code: "BEAUTY",
            name: "뷰티",
            displayOrder: 1,
            enabled: true,
            keywords: [],
          }],
        }),
      });
      return;
    }
    if (isAllowedHttpUrl(new URL(requestUrl), baseURL)) {
      await route.continue();
      return;
    }

    diagnostics.externalRequests.push(requestUrl);
    await route.abort("blockedbyclient");
  });

  await context.routeWebSocket(
    () => true,
    async (webSocketRoute) => {
      const socketUrl = webSocketRoute.url();
      if (isAllowedWebSocketUrl(new URL(socketUrl), baseURL)) {
        webSocketRoute.connectToServer();
        return;
      }

      diagnostics.externalWebSockets.push(socketUrl);
      await webSocketRoute.close({
        code: 1008,
        reason: "External WebSocket blocked by visual diagnostics",
      });
    },
  );
}

export const test = base.extend<BrowserDiagnosticFixtures>({
  browserDiagnostics: [
    async ({ context }, use, testInfo) => {
      const configuredBaseURL = testInfo.project.use.baseURL;
      if (typeof configuredBaseURL !== "string") {
        throw new Error("Visual diagnostics require a string Playwright baseURL.");
      }

      const diagnostics: BrowserDiagnostics = {
        consoleErrors: [],
        externalRequests: [],
        externalWebSockets: [],
        pageErrors: [],
        requestFailures: [],
      };
      const recordConsoleError = (message: ConsoleMessage) => {
        if (message.type() === "error") diagnostics.consoleErrors.push(message.text());
      };
      const recordRequestFailure = (request: Request) => {
        if (
          request.failure()?.errorText === "net::ERR_ABORTED" &&
          request.url().startsWith("http://localhost:8080/api/admin/")
        ) return;
        diagnostics.requestFailures.push(
          `${request.method()} ${request.url()} ${request.failure()?.errorText ?? "unknown"}`,
        );
      };
      const recordWebError = (webError: WebError) => {
        diagnostics.pageErrors.push(webError.error().message);
      };

      context.on("console", recordConsoleError);
      context.on("requestfailed", recordRequestFailure);
      context.on("weberror", recordWebError);
      await installContextRoutes(context, new URL(configuredBaseURL), diagnostics);

      await use(diagnostics);

      context.off("console", recordConsoleError);
      context.off("requestfailed", recordRequestFailure);
      context.off("weberror", recordWebError);
      expect(diagnostics.externalRequests).toEqual([]);
      expect(diagnostics.externalWebSockets).toEqual([]);
      expect(diagnostics.consoleErrors).toEqual([]);
      expect(diagnostics.pageErrors).toEqual([]);
      expect(diagnostics.requestFailures).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
