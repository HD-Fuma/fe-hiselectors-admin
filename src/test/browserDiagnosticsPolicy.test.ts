import { describe, expect, it } from "vitest";
import {
  isAllowedHttpUrl,
  isAllowedWebSocketUrl,
} from "../../tests/visual/browserDiagnosticsPolicy";

const BASE_URL = new URL("http://127.0.0.1:4174");

describe("visual browser diagnostics URL policy", () => {
  it("allows only the configured HTTP origin and inline resources", () => {
    expect(isAllowedHttpUrl(new URL("http://127.0.0.1:4174/creators"), BASE_URL)).toBe(
      true,
    );
    expect(isAllowedHttpUrl(new URL("data:text/plain,fixture"), BASE_URL)).toBe(true);
    expect(
      isAllowedHttpUrl(new URL("blob:http://127.0.0.1:4174/test-resource"), BASE_URL),
    ).toBe(true);
    expect(isAllowedHttpUrl(new URL("http://localhost:4174/creators"), BASE_URL)).toBe(
      false,
    );
    expect(isAllowedHttpUrl(new URL("https://127.0.0.1:4174/creators"), BASE_URL)).toBe(
      false,
    );
    expect(isAllowedHttpUrl(new URL("https://example.com/asset.js"), BASE_URL)).toBe(
      false,
    );
  });

  it("allows ws and wss only on the configured host and explicit port", () => {
    expect(
      isAllowedWebSocketUrl(new URL("ws://127.0.0.1:4174/hmr"), BASE_URL),
    ).toBe(true);
    expect(
      isAllowedWebSocketUrl(new URL("wss://127.0.0.1:4174/socket"), BASE_URL),
    ).toBe(true);
    expect(
      isAllowedWebSocketUrl(new URL("ws://127.0.0.1:4175/hmr"), BASE_URL),
    ).toBe(false);
    expect(isAllowedWebSocketUrl(new URL("ws://localhost:4174/hmr"), BASE_URL)).toBe(
      false,
    );
    expect(
      isAllowedWebSocketUrl(new URL("http://127.0.0.1:4174/not-a-socket"), BASE_URL),
    ).toBe(false);
  });

  it("compares effective default ports across HTTP and WebSocket schemes", () => {
    expect(
      isAllowedWebSocketUrl(
        new URL("ws://127.0.0.1/socket"),
        new URL("http://127.0.0.1"),
      ),
    ).toBe(true);
    expect(
      isAllowedWebSocketUrl(
        new URL("wss://127.0.0.1/socket"),
        new URL("https://127.0.0.1"),
      ),
    ).toBe(true);
    expect(
      isAllowedWebSocketUrl(
        new URL("ws://127.0.0.1/socket"),
        new URL("https://127.0.0.1"),
      ),
    ).toBe(false);
  });
});
