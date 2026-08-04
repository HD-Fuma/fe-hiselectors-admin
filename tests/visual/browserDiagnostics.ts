import {
  expect,
  test as base,
  type BrowserContext,
  type Page,
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

function attachPageDiagnostics(
  page: Page,
  diagnostics: BrowserDiagnostics,
  attachedPages: WeakSet<Page>,
) {
  if (attachedPages.has(page)) return;
  attachedPages.add(page);

  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => diagnostics.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    diagnostics.requestFailures.push(
      `${request.method()} ${request.url()} ${request.failure()?.errorText ?? "unknown"}`,
    );
  });
}

async function installContextRoutes(
  context: BrowserContext,
  baseURL: URL,
  diagnostics: BrowserDiagnostics,
) {
  await context.route("**/*", async (route) => {
    const requestUrl = route.request().url();
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
    async ({ context, page }, use, testInfo) => {
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
      const attachedPages = new WeakSet<Page>();
      const attachDiagnostics = (contextPage: Page) =>
        attachPageDiagnostics(contextPage, diagnostics, attachedPages);

      for (const contextPage of context.pages()) attachDiagnostics(contextPage);
      attachDiagnostics(page);
      context.on("page", attachDiagnostics);
      await installContextRoutes(context, new URL(configuredBaseURL), diagnostics);

      await use(diagnostics);

      context.off("page", attachDiagnostics);
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
