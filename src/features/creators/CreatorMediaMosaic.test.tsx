import { render, screen, within } from "@testing-library/react";
import type { CreatorFeaturedContentFixture } from "./fixtures";
import { CreatorPortrait } from "./CreatorArtwork";
import { CreatorMediaMosaic } from "./CreatorMediaMosaic";

const contents: CreatorFeaturedContentFixture[] = [
  {
    id: "coast",
    platform: "Instagram",
    title: "여름 바다 산책",
    mediaType: "이미지",
    views: 42_300,
    visual: "coast",
  },
  {
    id: "city",
    platform: "Facebook",
    title: "도시 여행 노트",
    mediaType: "이미지",
    views: 28_100,
    visual: "city",
  },
  {
    id: "packing",
    platform: "YouTube",
    title: "3박 4일 패킹",
    mediaType: "동영상",
    views: 19_600,
    visual: "packing",
  },
];

test("renders up to three locally drawn popular-content tiles", () => {
  const { rerender } = render(
    <CreatorMediaMosaic contents={contents} creatorName="이지아" />,
  );
  let mosaic = screen.getByRole("list", { name: "이지아 인기 콘텐츠" });
  expect(within(mosaic).getAllByRole("listitem")).toHaveLength(3);
  expect(within(mosaic).getAllByRole("img", { name: /이지아 인기 콘텐츠:/ })).toHaveLength(
    3,
  );
  expect(within(mosaic).getByText("Instagram")).toBeInTheDocument();
  expect(within(mosaic).getByText("Facebook")).toBeInTheDocument();
  expect(within(mosaic).getByText("YouTube")).toBeInTheDocument();
  expect(within(mosaic).getByRole("img", { name: "동영상" })).toBeInTheDocument();
  expect(within(mosaic).getByText("4.2만")).toBeInTheDocument();

  rerender(<CreatorMediaMosaic contents={contents.slice(0, 2)} creatorName="이지아" />);
  mosaic = screen.getByRole("list", { name: "이지아 인기 콘텐츠" });
  expect(within(mosaic).getAllByRole("listitem")).toHaveLength(2);

  rerender(<CreatorMediaMosaic contents={[]} creatorName="이지아" />);
  mosaic = screen.getByRole("list", { name: "이지아 인기 콘텐츠" });
  expect(within(mosaic).queryAllByRole("listitem")).toHaveLength(0);
});

test("draws an accessible local creator portrait", () => {
  const { container } = render(<CreatorPortrait creatorName="이지아" variant="coral" />);
  expect(screen.getByRole("img", { name: "이지아 프로필 이미지" })).toBeInTheDocument();
  expect(container.querySelector("svg")).toBeInTheDocument();
  expect(container.querySelector("img")).not.toBeInTheDocument();
});
