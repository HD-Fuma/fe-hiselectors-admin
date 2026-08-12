import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ApplicantListPage } from "./ApplicantPages";
import { APPLICANTS } from "./fixtures";

function renderApplicantPage(path = "/applicants") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ApplicantListPage />
    </MemoryRouter>,
  );
}

function resultCount(count: number) {
  return screen.getByText(`총 ${count}건`);
}

describe("applicant filters", () => {
  test("combines keyword, platform, and effective review-status filters", async () => {
    const user = userEvent.setup();
    renderApplicantPage();
    const search = screen.getByRole("search", { name: "검색 조건" });

    await user.type(within(search).getByRole("textbox", { name: "검색어" }), "하린");
    await user.selectOptions(within(search).getByRole("combobox", { name: "SNS 채널" }), "YouTube");
    await user.selectOptions(within(search).getByRole("combobox", { name: "심사 상태" }), "승인");
    await user.click(within(search).getByRole("button", { name: "조회" }));

    expect(resultCount(1)).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "지원자 승인" });
    expect(within(results).getByText("정하린")).toBeInTheDocument();
    expect(within(results).queryByText("김민지")).not.toBeInTheDocument();
    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
  });

  test("category and minimum-criteria toggle change rows and reset restores every filter", async () => {
    const user = userEvent.setup();
    renderApplicantPage();
    const search = screen.getByRole("search", { name: "검색 조건" });
    const minimumCriteria = screen.getByRole("checkbox", { name: "최저 기준 필터링" });

    await user.click(screen.getByRole("button", { name: "패션" }));
    const fashionApplicants = APPLICANTS.filter((applicant) => (
      applicant.id === "ap-003" || applicant.id === "ap-004"
    ));
    expect(resultCount(fashionApplicants.length)).toBeInTheDocument();

    await user.click(minimumCriteria);
    expect(resultCount(fashionApplicants.filter((applicant) => applicant.autoRejected).length)).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "지원자 승인" });
    expect(within(results).getByText("윤소라")).toBeInTheDocument();
    expect(within(results).queryByText("권예나")).not.toBeInTheDocument();

    await user.type(within(search).getByRole("textbox", { name: "검색어" }), "윤소라");
    await user.selectOptions(within(search).getByRole("combobox", { name: "SNS 채널" }), "Instagram");
    await user.selectOptions(within(search).getByRole("combobox", { name: "심사 상태" }), "자동 반려");
    await user.click(within(search).getByRole("button", { name: "조회" }));
    await user.click(within(search).getByRole("button", { name: "초기화" }));

    expect(resultCount(APPLICANTS.length)).toBeInTheDocument();
    expect(minimumCriteria).not.toBeChecked();
    expect(within(search).getByRole("textbox", { name: "검색어" })).toHaveValue("");
    expect(within(search).getByRole("combobox", { name: "SNS 채널" })).toHaveValue("");
    expect(within(search).getByRole("combobox", { name: "심사 상태" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
    expect(within(results).getAllByRole("row")).toHaveLength(APPLICANTS.length + 1);
  });
});
