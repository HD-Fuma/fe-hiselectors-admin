import type { Route } from "@playwright/test";
import { expect, test } from "./browserDiagnostics";

const EARLY_POPUP_CONSOLE_ERROR = "diagnostics: early about:blank popup error";

function removeExpectedDiagnostic(
  diagnostics: string[],
  predicate: (diagnostic: string) => boolean,
) {
  const index = diagnostics.findIndex(predicate);
  expect(index).toBeGreaterThanOrEqual(0);
  diagnostics.splice(index, 1);
}

test("captures diagnostics emitted before a popup page is available", async ({
  browserDiagnostics,
  context,
  page,
}, testInfo) => {
  await page.goto("/login");

  const blankPopupPromise = context.waitForEvent("page");
  const openedBlankPopup = await page.evaluate((diagnostic) => {
    const popup = window.open("about:blank", "_blank");
    if (popup) {
      (popup as Window & { console: Console }).console.error(diagnostic);
    }
    return popup !== null;
  }, EARLY_POPUP_CONSOLE_ERROR);
  expect(openedBlankPopup).toBe(true);
  const blankPopup = await blankPopupPromise;

  await expect
    .poll(() =>
      browserDiagnostics.consoleErrors.filter(
        (diagnostic) => diagnostic === EARLY_POPUP_CONSOLE_ERROR,
      ).length,
    )
    .toBe(1);
  removeExpectedDiagnostic(
    browserDiagnostics.consoleErrors,
    (diagnostic) => diagnostic === EARLY_POPUP_CONSOLE_ERROR,
  );
  await blankPopup.close();

  const baseURL = String(testInfo.project.use.baseURL);
  const popupRequestUrl = new URL(
    "/__browser-diagnostics-first-popup-request__",
    baseURL,
  ).toString();
  let resolveAbortedRequest!: (evidence: { contextPageCount: number }) => void;
  const abortedRequest = new Promise<{ contextPageCount: number }>((resolve) => {
    resolveAbortedRequest = resolve;
  });
  const abortFirstPopupRequest = async (route: Route) => {
    const evidence = { contextPageCount: context.pages().length };
    await route.abort("connectionreset");
    resolveAbortedRequest(evidence);
  };
  await context.route(popupRequestUrl, abortFirstPopupRequest, { times: 1 });

  const requestPopupPromise = context.waitForEvent("page");
  const openedRequestPopup = await page.evaluate((url) => {
    return window.open(url, "_blank") !== null;
  }, popupRequestUrl);
  expect(openedRequestPopup).toBe(true);
  const requestEvidence = await abortedRequest;
  expect(requestEvidence.contextPageCount).toBe(1);

  await expect
    .poll(() =>
      browserDiagnostics.requestFailures.find((diagnostic) =>
        diagnostic.includes(popupRequestUrl),
      ),
    )
    .toContain("net::ERR_CONNECTION_RESET");

  removeExpectedDiagnostic(browserDiagnostics.requestFailures, (diagnostic) =>
    diagnostic.includes(popupRequestUrl),
  );

  await context.unroute(popupRequestUrl, abortFirstPopupRequest);
  const requestPopup = await requestPopupPromise;
  await requestPopup.close();
});
