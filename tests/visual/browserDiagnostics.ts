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
