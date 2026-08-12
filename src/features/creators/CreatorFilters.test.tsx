import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CreatorListPage, ProposalHistoryPage } from "./CreatorPages";
import { CREATORS, PROPOSALS } from "./fixtures";

function renderCreatorPage(path = "/creators") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CreatorListPage />
    </MemoryRouter>,
  );
}

function renderProposalPage(path = "/proposals") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ProposalHistoryPage />
    </MemoryRouter>,
  );
}

function resultCount(count: number) {
  return screen.getByText(`총 ${count}건`);
}

describe("creator filters", () => {
  test("paginates both card and list views and returns to page one after filtering", async () => {
    const user = userEvent.setup();
    renderCreatorPage();

    const cards = screen.getByRole("list", { name: "크리에이터 목록" });
    expect(cards.querySelectorAll(':scope > [role="listitem"]')).toHaveLength(20);
    expect(screen.getByText(`1 / ${Math.ceil(CREATORS.length / 20)} 페이지`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    expect(screen.getByText(`2 / ${Math.ceil(CREATORS.length / 20)} 페이지`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "목록" }));
    expect(screen.getByText(`1 / ${Math.ceil(CREATORS.length / 20)} 페이지`)).toBeInTheDocument();
    const table = screen.getByRole("region", { name: "크리에이터 목록" });
    expect(within(table).getAllByRole("row")).toHaveLength(21);

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    const search = screen.getByRole("search", { name: "검색 조건" });
    await user.type(within(search).getByRole("textbox", { name: "키워드" }), "@seo.yeon");
    await user.click(within(search).getByRole("button", { name: "조회" }));

    expect(resultCount(1)).toBeInTheDocument();
    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(2);
    expect(within(table).getByText("@seo.yeon")).toBeInTheDocument();
  });

  test("combines platform, comma-formatted follower range, and category filters, then resets all", async () => {
    const user = userEvent.setup();
    renderCreatorPage();
    const search = screen.getByRole("search", { name: "검색 조건" });
    const minimum = within(search).getByRole("textbox", { name: "최소 팔로워·구독자" });
    const maximum = within(search).getByRole("textbox", { name: "최대 팔로워·구독자" });
    const platform = within(search).getByRole("combobox", { name: "플랫폼" });

    await user.type(minimum, "100,000");
    await user.type(maximum, "200,000");
    await user.selectOptions(platform, "Instagram");
    await user.click(screen.getByRole("button", { name: "여행" }));
    await user.click(within(search).getByRole("button", { name: "조회" }));

    const expectedCount = CREATORS.filter((creator) => (
      creator.category === "여행"
      && creator.profile.platform === "Instagram"
      && creator.profile.followers >= 100_000
      && creator.profile.followers <= 200_000
    )).length;
    expect(resultCount(expectedCount)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "여행" })).toHaveAttribute("aria-pressed", "true");

    await user.click(within(search).getByRole("button", { name: "초기화" }));

    expect(resultCount(CREATORS.length)).toBeInTheDocument();
    expect(minimum).toHaveValue("");
    expect(maximum).toHaveValue("");
    expect(platform).toHaveValue("");
    expect(screen.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(`1 / ${Math.ceil(CREATORS.length / 20)} 페이지`)).toBeInTheDocument();
  });
});

describe("proposal history filters", () => {
  test("filters by status, date, and keyword and reset restores status and pagination", async () => {
    const user = userEvent.setup();
    renderProposalPage();
    const totalPages = Math.ceil(PROPOSALS.length / 20);
    const failedStatus = screen.getByRole("button", { name: "발송 실패" });

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    expect(screen.getByText(`2 / ${totalPages} 페이지`)).toBeInTheDocument();

    await user.click(failedStatus);
    const failedCount = PROPOSALS.filter((proposal) => proposal.status === "발송 실패").length;
    expect(resultCount(failedCount)).toBeInTheDocument();
    expect(screen.getByText(`1 / ${Math.ceil(failedCount / 20)} 페이지`)).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    const sentDate = within(search).getByLabelText("발송일");
    const keyword = within(search).getByRole("textbox", { name: "ID 또는 이름" });
    fireEvent.change(sentDate, { target: { value: "2026-08-01" } });
    await user.type(keyword, "이지아");
    await user.click(within(search).getByRole("button", { name: "조회" }));

    const combinedCount = PROPOSALS.filter((proposal) => (
      proposal.status === "발송 실패"
      && proposal.sentAt.startsWith("2026-08-01")
      && [proposal.targetId, proposal.targetName, proposal.receiver, proposal.recipientEmail]
        .some((value) => value.toLocaleLowerCase("ko-KR").includes("이지아"))
    )).length;
    expect(resultCount(combinedCount)).toBeInTheDocument();

    await user.click(within(search).getByRole("button", { name: "초기화" }));

    expect(resultCount(PROPOSALS.length)).toBeInTheDocument();
    expect(sentDate).toHaveValue("");
    expect(keyword).toHaveValue("");
    expect(screen.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(`1 / ${totalPages} 페이지`)).toBeInTheDocument();
  });
});
