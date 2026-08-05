import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CREATORS, type CreatorFixture } from "./fixtures";
import {
  CreatorEvidenceCard,
  compactNumber,
  proposalAction,
  proposalTone,
} from "./CreatorEvidenceCard";

const zia = CREATORS[2];

const withStatus = (status: CreatorFixture["proposalStatus"]): CreatorFixture => ({
  ...zia,
  proposalStatus: status,
});

function renderCard(creator: CreatorFixture = zia) {
  return render(
    <MemoryRouter>
      <ul>
        <CreatorEvidenceCard creator={creator} />
      </ul>
    </MemoryRouter>,
  );
}

describe("CreatorEvidenceCard", () => {
  test("matches the reference structure for one Instagram profile", () => {
    const { container } = renderCard();
    const card = screen.getByRole("article", { name: "이지아 크리에이터 카드" });

    expect(card.parentElement).toHaveAttribute("role", "listitem");
    expect(within(card).getByAltText("이지아 프로필 이미지")).toHaveAttribute(
      "src",
      "/creator-media/cr-003-profile.jpg",
    );
    const mosaic = within(card).getByRole("list", { name: "이지아 인기 콘텐츠" });
    expect(within(mosaic).getAllByRole("listitem")).toHaveLength(3);
    expect(within(mosaic).getAllByRole("img", { name: /이지아 인기 콘텐츠:/ })).toHaveLength(3);
    expect(within(card).getAllByRole("img", { name: /플랫폼/ })).toHaveLength(1);
    expect(within(card).getByRole("img", { name: "Instagram 플랫폼" })).toBeInTheDocument();
    expect(within(card).queryByRole("img", { name: "YouTube 플랫폼" })).not.toBeInTheDocument();

    for (const text of ["@zia.trip", "여행 / 라이프", "콘텐츠 142개", "평균 반응", "980", "팔로워", "3.3만"]) {
      expect(within(card).getByText(text)).toBeInTheDocument();
    }
    expect(within(card).queryByText("평균 반응률")).not.toBeInTheDocument();
    expect(within(card).queryByText("평균 조회")).not.toBeInTheDocument();
    const metrics = container.querySelectorAll<HTMLElement>(
      ".fuma-creator-card__metrics > div",
    );
    expect(metrics).toHaveLength(2);
    expect(within(metrics[0]).queryByText("팔로워·구독자")).not.toBeInTheDocument();
    expect(within(metrics[1]).getByText("팔로워·구독자")).toHaveClass(
      "hsas-visually-hidden",
    );
    expect(container.querySelector(".fuma-creator-card__portrait .fuma-creator-card__platform-badge")).toBeInTheDocument();
    expect(container.querySelector(".fuma-creator-card__identity .fuma-creator-card__actions")).not.toBeInTheDocument();

    expect(within(card).getByRole("link", { name: "이지아 상세 보기" })).toHaveAttribute(
      "href",
      "/creators/cr-003",
    );
    expect(within(card).getByRole("link", { name: "이지아 다시 제안" })).toHaveAttribute(
      "href",
      "/creators/cr-003#proposal",
    );
  });

  test("shows YouTube average views and subscribers as the only two metrics", () => {
    const { container } = renderCard(CREATORS[1]);
    const card = screen.getByRole("article", { name: "박도윤 크리에이터 카드" });

    expect(within(card).getByRole("img", { name: "YouTube 플랫폼" })).toBeInTheDocument();
    expect(within(card).getByText("평균 조회")).toBeInTheDocument();
    expect(within(card).getByText("2.7만")).toBeInTheDocument();
    expect(within(card).getByText("구독자")).toBeInTheDocument();
    expect(within(card).getByText("7.6만")).toBeInTheDocument();
    expect(within(card).queryByText("평균 반응")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".fuma-creator-card__metrics > div")).toHaveLength(2);
  });

  test.each([
    ["미제안", "영입 제안", "/creators/cr-003#proposal"],
    ["발송 실패", "다시 제안", "/creators/cr-003#proposal"],
    ["발송 대기", "제안 이력", "/proposals?creator=cr-003"],
    ["발송 완료", "제안 이력", "/proposals?creator=cr-003"],
    ["셀렉터스 전환", "제안 이력", "/proposals?creator=cr-003"],
  ] as const)("keeps the %s proposal action", (status, label, href) => {
    renderCard(withStatus(status));
    expect(screen.getByRole("link", { name: `이지아 ${label}` })).toHaveAttribute("href", href);
  });
});

test("keeps compact metrics and proposal helper contracts", () => {
  expect(compactNumber.format(32_700)).toBe("3.3만");
  expect(proposalAction(withStatus("미제안"))).toEqual({
    label: "영입 제안",
    to: "/creators/cr-003#proposal",
  });
  expect(proposalTone("발송 완료")).toBe("approved");
  expect(proposalTone("발송 대기")).toBe("pending");
  expect(proposalTone("발송 실패")).toBe("rejected");
  expect(proposalTone("미제안")).toBe("neutral");
});
