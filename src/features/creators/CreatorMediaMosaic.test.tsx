import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import {
  CreatorContentPhoto,
  CreatorProfilePhoto,
  type CreatorFeaturedContentFixture,
} from "../../entities/creator";
import { CreatorMediaMosaic } from "./CreatorMediaMosaic";

afterEach(() => {
  vi.unstubAllEnvs();
});

const contents: CreatorFeaturedContentFixture[] = [
  {
    id: "coast",
    title: "여름 바다 산책",
    mediaType: "이미지",
    views: 42_300,
    visual: "coast",
    thumbnailUrl: "/creator-media/cr-003-01.jpg",
  },
  {
    id: "city",
    title: "도시 여행 노트",
    mediaType: "이미지",
    views: 28_100,
    visual: "city",
    thumbnailUrl: "/creator-media/cr-003-02.jpg",
  },
  {
    id: "packing",
    title: "3박 4일 패킹",
    mediaType: "동영상",
    views: 19_600,
    visual: "packing",
    thumbnailUrl: "/creator-media/cr-003-03.jpg",
  },
];

test("renders three local representative-post tiles without platform captions", () => {
  const { rerender } = render(
    <CreatorMediaMosaic contents={contents} creatorName="이지아" />,
  );
  let mosaic = screen.getByRole("list", { name: "이지아 대표 게시글" });
  expect(within(mosaic).getAllByRole("listitem")).toHaveLength(3);
  expect(within(mosaic).getAllByRole("img", { name: /이지아 대표 게시글:/ })).toHaveLength(3);
  expect(within(mosaic).getByAltText("이지아 대표 게시글: 여름 바다 산책")).toHaveAttribute(
    "src",
    "/creator-media/cr-003-01.jpg",
  );
  expect(within(mosaic).getByRole("img", { name: "동영상" })).toBeInTheDocument();
  expect(mosaic).not.toHaveTextContent(/Instagram|YouTube|Facebook/);

  rerender(<CreatorMediaMosaic contents={contents.slice(0, 2)} creatorName="이지아" />);
  mosaic = screen.getByRole("list", { name: "이지아 대표 게시글" });
  expect(within(mosaic).getAllByRole("listitem")).toHaveLength(3);
  expect(within(mosaic).getByRole("img", { name: "이지아 대표 게시글 없음" })).toBeInTheDocument();
});

test("replaces failed content and profile images with neutral fallbacks", () => {
  const { rerender } = render(
    <CreatorMediaMosaic contents={contents} creatorName="이지아" />,
  );
  fireEvent.error(screen.getByAltText("이지아 대표 게시글: 여름 바다 산책"));
  expect(
    screen.getByRole("img", { name: "이지아 대표 게시글: 여름 바다 산책 이미지 없음" }),
  ).toHaveTextContent("여름 바다 산책");

  rerender(<CreatorProfilePhoto creatorName="이지아" src="/broken.jpg" />);
  fireEvent.error(screen.getByAltText("이지아 프로필 이미지"));
  expect(screen.getByRole("img", { name: "이지아 프로필 이미지 없음" })).toHaveTextContent("이");

  rerender(<CreatorProfilePhoto creatorName="이지아" src="" />);
  expect(screen.getByRole("img", { name: "이지아 프로필 이미지 없음" })).toBeInTheDocument();
});

test("prefixes local creator images with the configured Vite base URL", () => {
  vi.stubEnv("BASE_URL", "/fe-selectors-admin/");

  render(
    <CreatorProfilePhoto
      creatorName="이지아"
      src="/creator-media/cr-003-profile.jpg"
    />,
  );

  expect(screen.getByAltText("이지아 프로필 이미지")).toHaveAttribute(
    "src",
    "/fe-selectors-admin/creator-media/cr-003-profile.jpg",
  );
});

test("profile photo recovers when its source changes and never renders an empty src", () => {
  const { rerender } = render(
    <CreatorProfilePhoto creatorName="이지아" src="/broken-profile.jpg" />,
  );

  fireEvent.error(screen.getByAltText("이지아 프로필 이미지"));
  expect(screen.getByRole("img", { name: "이지아 프로필 이미지 없음" })).toBeInTheDocument();

  rerender(<CreatorProfilePhoto creatorName="이지아" src="/valid-profile.jpg" />);
  expect(screen.getByAltText("이지아 프로필 이미지")).toHaveAttribute(
    "src",
    "/valid-profile.jpg",
  );

  rerender(<CreatorProfilePhoto creatorName="이지아" src="" />);
  expect(screen.queryByAltText("이지아 프로필 이미지")).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "이지아 프로필 이미지 없음" })).toBeInTheDocument();
});

test("content photo recovers when its source changes and never renders an empty src", () => {
  const { rerender } = render(
    <CreatorContentPhoto
      creatorName="이지아"
      src="/broken-content.jpg"
      title="여름 바다 산책"
    />,
  );

  fireEvent.error(screen.getByAltText("이지아 대표 게시글: 여름 바다 산책"));
  expect(
    screen.getByRole("img", { name: "이지아 대표 게시글: 여름 바다 산책 이미지 없음" }),
  ).toBeInTheDocument();

  rerender(
    <CreatorContentPhoto
      creatorName="이지아"
      src="/valid-content.jpg"
      title="여름 바다 산책"
    />,
  );
  expect(screen.getByAltText("이지아 대표 게시글: 여름 바다 산책")).toHaveAttribute(
    "src",
    "/valid-content.jpg",
  );

  rerender(
    <CreatorContentPhoto creatorName="이지아" src="" title="여름 바다 산책" />,
  );
  expect(screen.queryByAltText("이지아 대표 게시글: 여름 바다 산책")).not.toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: "이지아 대표 게시글: 여름 바다 산책 이미지 없음" }),
  ).toBeInTheDocument();
});
