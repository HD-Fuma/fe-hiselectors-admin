import { snsAccountHref } from ".";

test("builds YouTube channel URLs from UC ids and handle URLs from @ accounts", () => {
  expect(snsAccountHref("YouTube", "UCDNvRZRgvkBTUkQzFoT_8rA"))
    .toBe("https://www.youtube.com/channel/UCDNvRZRgvkBTUkQzFoT_8rA");
  expect(snsAccountHref("YouTube", "@14FMBC"))
    .toBe("https://www.youtube.com/@14FMBC");
  expect(snsAccountHref("YouTube", "14FMBC"))
    .toBe("https://www.youtube.com/@14FMBC");
  expect(snsAccountHref("Instagram", "ggyonghouse"))
    .toBe("https://www.instagram.com/ggyonghouse");
});
