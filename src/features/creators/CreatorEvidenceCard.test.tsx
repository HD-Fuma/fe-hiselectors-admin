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
    const mosaic = within(card).getByRole("list", { name: "이지아 대표 게시글" });
    expect(within(mosaic).getAllByRole("listitem")).toHaveLength(3);
    expect(within(mosaic).getAllByRole("img", { name: /이지아 대표 게시글:/ })).toHaveLength(3);
    expect(within(card).getAllByRole("img", { name: /플랫폼/ })).toHaveLength(1);
    expect(within(card).getByRole("img", { name: "Instagram 플랫폼" })).toBeInTheDocument();
    expect(within(card).queryByRole("img", { name: "YouTube 플랫폼" })).not.toBeInTheDocument();

    for (const text of ["@zia.trip", "여행 / 리빙/라이프", "#국내여행", "#여행브이로그", "팔로워", "3.3만", "ER", "3.0%"]) {
      expect(within(card).getByText(text)).toBeInTheDocument();
    }
    expect(within(card).queryByText(/AI 적합도/)).not.toBeInTheDocument();
    expect(within(card).queryByText("T3")).not.toBeInTheDocument();
    expect(within(card).queryByText("발송 실패")).not.toBeInTheDocument();
    const metrics = container.querySelectorAll<HTMLElement>(
      ".fuma-creator-card__metrics > div",
    );
    expect(metrics).toHaveLength(2);
    expect(within(metrics[0]).getByText("팔로워")).toBeInTheDocument();
    expect(metrics[0]).toHaveClass("fuma-creator-card__metric--audience");
    expect(metrics[1]).toHaveClass("fuma-creator-card__metric--engagement");
    expect(container.querySelector(".fuma-creator-card__portrait .fuma-creator-card__platform-badge")).toBeInTheDocument();
    expect(container.querySelector(".fuma-creator-card__identity .fuma-creator-card__actions")).not.toBeInTheDocument();

    expect(within(card).getByRole("link", { name: "이지아 프로필 보기" })).toHaveAttribute(
      "href",
      "/creators/cr-003",
    );
    expect(within(card).getByRole("link", { name: "이지아 제안 보내기" })).toHaveAttribute(
      "href",
      "/creators/cr-003#proposal",
    );
  });

  test("shows YouTube subscribers and ER as the only two metrics", () => {
    const { container } = renderCard(CREATORS[1]);
    const card = screen.getByRole("article", { name: "박도윤 크리에이터 카드" });

    expect(within(card).getByRole("img", { name: "YouTube 플랫폼" })).toBeInTheDocument();
    expect(within(card).getByText("구독자")).toBeInTheDocument();
    expect(within(card).getByText("7.6만")).toBeInTheDocument();
    expect(within(card).getByText("ER")).toBeInTheDocument();
    expect(within(card).getByText("집계 불가")).toBeInTheDocument();
    expect(within(card).queryByText("1.7%")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".fuma-creator-card__metrics > div")).toHaveLength(2);
  });

  test.each(["미제안", "발송 실패", "발송 대기", "발송 완료", "셀렉터스 전환"] as const)("keeps the generic proposal action for %s", (status) => {
    renderCard(withStatus(status));
    expect(screen.getByRole("link", { name: "이지아 제안 보내기" })).toHaveAttribute(
      "href",
      "/creators/cr-003#proposal",
    );
  });
});

test("keeps compact metrics and proposal helper contracts", () => {
  expect(compactNumber.format(32_700)).toBe("3.3만");
  expect(proposalAction(withStatus("미제안"))).toEqual({
    label: "제안 보내기",
    to: "/creators/cr-003#proposal",
  });
  expect(proposalTone("발송 완료")).toBe("approved");
  expect(proposalTone("발송 대기")).toBe("pending");
  expect(proposalTone("발송 실패")).toBe("rejected");
  expect(proposalTone("미제안")).toBe("neutral");
});
