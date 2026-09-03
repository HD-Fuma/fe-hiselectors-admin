import { render, screen } from "@testing-library/react";
import { YouTubeShortsCard } from "./YouTubeShortsCard";

test("shows the YouTube channel name", () => {
  render(
    <YouTubeShortsCard
      accountName="하린의 생활연구소"
      avatarUrl=""
      creatorName="하린"
    >
      <p>콘텐츠 설명</p>
    </YouTubeShortsCard>,
  );

  expect(screen.getByText("하린의 생활연구소")).toBeInTheDocument();
});
