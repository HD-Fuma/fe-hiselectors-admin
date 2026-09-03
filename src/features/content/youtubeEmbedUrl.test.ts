import { youtubeEmbedUrl } from "./youtubeEmbedUrl";

test("keeps the STT start timestamp without enabling autoplay", () => {
  const url = new URL(youtubeEmbedUrl("youtube-901", 8.9) ?? "");

  expect(url.searchParams.get("start")).toBe("8");
  expect(url.searchParams.has("autoplay")).toBe(false);
});

test("omits playback parameters until a timestamp is selected", () => {
  const url = new URL(youtubeEmbedUrl("youtube-901") ?? "");

  expect(url.searchParams.has("start")).toBe(false);
  expect(url.searchParams.has("autoplay")).toBe(false);
});
