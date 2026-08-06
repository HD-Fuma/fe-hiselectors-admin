import { render, screen, within } from "@testing-library/react";
import { MediaTiles } from "./MediaTiles";

test("renders supplied media URLs as thumbnails and keeps the silhouette fallback", () => {
  render(
    <MediaTiles
      count={3}
      kinds={["이미지", "동영상", "이미지"]}
      label="수정 감지본"
      urls={[
        "/creator-media/kr-cr-003-01.jpg",
        "/creator-media/kr-cr-003-02.jpg",
      ]}
    />,
  );

  const media = screen.getByRole("region", { name: "수정 감지본 미디어" });
  const tiles = within(media).getAllByRole("listitem");

  expect(within(tiles[0]).getByRole("img", { name: "수정 감지본 이미지 1" })).toHaveAttribute(
    "src",
    "/creator-media/kr-cr-003-01.jpg",
  );
  expect(within(tiles[1]).getByRole("img", { name: "수정 감지본 동영상 2" })).toHaveAttribute(
    "src",
    "/creator-media/kr-cr-003-02.jpg",
  );
  expect(within(tiles[2]).getByRole("img", { name: "이미지 미리보기 3" })).toHaveProperty(
    "tagName",
    "svg",
  );
});
