import { screen, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";
import { QUALIFICATIONS, SELECTED_QUALIFICATION } from "./fixtures";

function expectColumnHeaders(region: HTMLElement, names: string[]) {
  for (const name of names) {
    expect(within(region).getByRole("columnheader", { name })).toBeInTheDocument();
  }
}

function expectStatusTone(row: HTMLElement, label: string, tone: string) {
  expect(within(row).getByText(label)).toHaveClass(`hsas-status-pill--${tone}`);
}

describe("cohort management", () => {
  test("renders all cohort fixtures with their periods, statuses, counts, and static controls", () => {
    renderRoute("/cohorts");

    expect(screen.getByRole("heading", { name: "셀렉터스 기수 관리" })).toBeInTheDocument();
    expect(screen.getByText("SL101")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    expect(within(search).getByRole("textbox", { name: "기수명" })).toHaveAttribute(
      "placeholder",
      "기수명 검색",
    );
    expect(within(search).getByRole("combobox", { name: "모집 상태" })).toHaveTextContent(
      "전체모집 예정모집 중마감",
    );
    expect(within(search).getByRole("button", { name: "조회" })).toHaveAttribute(
      "type",
      "button",
    );
    expect(within(search).getByRole("button", { name: "초기화" })).toHaveAttribute(
      "type",
      "button",
    );
    expect(screen.getByRole("button", { name: "기수 생성" })).toHaveAttribute(
      "type",
      "button",
    );

    expect(screen.getByText("총 3건")).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "기수 목록" });
    expectColumnHeaders(results, [
      "기수명",
      "모집 기간",
      "활동 기간",
      "모집 상태",
      "참여자 수",
      "관리",
    ]);

    const fourthRow = within(results).getByRole("row", { name: /4기/ });
    expect(within(fourthRow).getByText("2026-08-10 ~ 2026-08-24")).toBeInTheDocument();
    expect(within(fourthRow).getByText("2026-09-01 ~ 2026-11-30")).toBeInTheDocument();
    expect(within(fourthRow).getByText("모집 예정")).toBeInTheDocument();
    expectStatusTone(fourthRow, "모집 예정", "pending");
    expect(within(fourthRow).getByText("0")).toBeInTheDocument();
    expect(within(fourthRow).getByRole("button", { name: "4기 수정" })).toHaveAttribute(
      "type",
      "button",
    );

    const thirdRow = within(results).getByRole("row", { name: /3기/ });
    expect(within(thirdRow).getByText("2026-07-20 ~ 2026-08-10")).toBeInTheDocument();
    expect(within(thirdRow).getByText("2026-08-17 ~ 2026-11-16")).toBeInTheDocument();
    expect(within(thirdRow).getByText("모집 중")).toBeInTheDocument();
    expectStatusTone(thirdRow, "모집 중", "approved");
    expect(within(thirdRow).getByText("38")).toBeInTheDocument();

    const secondRow = within(results).getByRole("row", { name: /2기/ });
    expect(within(secondRow).getByText("2026-03-01 ~ 2026-03-15")).toBeInTheDocument();
    expect(within(secondRow).getByText("2026-04-01 ~ 2026-06-30")).toBeInTheDocument();
    expect(within(secondRow).getByText("마감")).toBeInTheDocument();
    expectStatusTone(secondRow, "마감", "neutral");
    expect(within(secondRow).getByText("54")).toBeInTheDocument();
    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
    expect(screen.getByText("페이지당 20개")).toBeInTheDocument();
  });
});

describe("selector overview", () => {
  test("renders each selector with its cohort, status, and formatted performance metrics", () => {
    renderRoute("/selectors");

    expect(screen.getByRole("heading", { name: "기수별 셀렉터스 현황" })).toBeInTheDocument();
    expect(screen.getByText("SL201")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    expect(within(search).getByRole("textbox", { name: "셀렉터스명" })).toHaveAttribute(
      "placeholder",
      "이름 검색",
    );
    expect(within(search).getByRole("combobox", { name: "기수" })).toHaveTextContent(
      "전체4기3기2기",
    );
    expect(within(search).getByRole("combobox", { name: "활동 상태" })).toHaveTextContent(
      "전체활동 중경고박탈수료",
    );
    expect(within(search).getByRole("button", { name: "조회" })).toBeInTheDocument();
    expect(within(search).getByRole("button", { name: "초기화" })).toBeInTheDocument();

    expect(screen.getByText("총 4건")).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "셀렉터스 목록" });
    expectColumnHeaders(results, [
      "이름",
      "기수",
      "SNS",
      "활동 상태",
      "콘텐츠 수",
      "위반 횟수",
      "클릭",
      "전환",
      "최근 활동일",
    ]);

    const seoyeonRow = within(results).getByRole("row", { name: /김서연/ });
    for (const value of [
      "3기",
      "Instagram / YouTube",
      "활동 중",
      "18",
      "0",
      "12,840",
      "428",
      "2026-08-02",
    ]) {
      expect(within(seoyeonRow).getByText(value)).toBeInTheDocument();
    }
    expectStatusTone(seoyeonRow, "활동 중", "approved");

    const doyoonRow = within(results).getByRole("row", { name: /박도윤/ });
    for (const value of ["3기", "YouTube", "경고", "11", "2", "7,640", "206", "2026-08-01"]) {
      expect(within(doyoonRow).getByText(value)).toBeInTheDocument();
    }
    expectStatusTone(doyoonRow, "경고", "pending");

    const jiaRow = within(results).getByRole("row", { name: /이지아/ });
    for (const value of ["2기", "Instagram", "박탈", "7", "3", "3,120", "54", "2026-07-18"]) {
      expect(within(jiaRow).getByText(value)).toBeInTheDocument();
    }
    expectStatusTone(jiaRow, "박탈", "rejected");

    const haneulRow = within(results).getByRole("row", { name: /오하늘/ });
    for (const value of ["2기", "Instagram", "수료", "24", "0", "18,600", "711", "2026-07-31"]) {
      expect(within(haneulRow).getByText(value)).toBeInTheDocument();
    }
    expectStatusTone(haneulRow, "수료", "neutral");
    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
  });
});

describe("selector qualification management", () => {
  test("renders qualification records and the inert manual qualification form", () => {
    renderRoute("/selectors/qualifications");

    expect(screen.getByRole("heading", { name: "셀렉터스 자격 관리" })).toBeInTheDocument();
    expect(screen.getByText("SL301")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    expect(within(search).getByRole("textbox", { name: "셀렉터스명" })).toBeInTheDocument();
    expect(within(search).getByRole("combobox", { name: "기수" })).toHaveTextContent(
      "전체3기2기",
    );
    expect(within(search).getByRole("combobox", { name: "현재 자격" })).toHaveTextContent(
      "전체활동 중경고박탈수료",
    );
    expect(within(search).getByRole("combobox", { name: "블랙리스트" })).toHaveTextContent(
      "전체등록미등록",
    );

    expect(screen.getByText("총 3건")).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "자격 관리 목록" });
    expectColumnHeaders(results, [
      "셀렉터스",
      "기수",
      "현재 자격",
      "누적 패널티",
      "박탈 사유",
      "블랙리스트",
      "차기 기수 제한",
      "관리",
    ]);

    const doyoonRow = within(results).getByRole("row", { name: /박도윤/ });
    for (const value of ["박도윤 (sl-002)", "3기", "경고", "2회", "-", "미등록", "없음"]) {
      expect(within(doyoonRow).getByText(value)).toBeInTheDocument();
    }
    expectStatusTone(doyoonRow, "미등록", "neutral");
    expectStatusTone(doyoonRow, "없음", "neutral");

    const jiaRow = within(results).getByRole("row", { name: /이지아/ });
    for (const value of [
      "이지아 (sl-003)",
      "2기",
      "박탈",
      "3회",
      "콘텐츠 운영 기준 위반 3회 누적",
      "등록",
      "참여 제한",
    ]) {
      expect(within(jiaRow).getByText(value)).toBeInTheDocument();
    }
    expectStatusTone(jiaRow, "등록", "rejected");
    expectStatusTone(jiaRow, "참여 제한", "rejected");
    expect(within(jiaRow).getByRole("button", { name: "이지아 자격 선택" })).toHaveAttribute(
      "type",
      "button",
    );

    const haneulRow = within(results).getByRole("row", { name: /오하늘/ });
    for (const value of ["오하늘 (sl-004)", "2기", "수료", "0회", "-", "미등록", "없음"]) {
      expect(within(haneulRow).getByText(value)).toBeInTheDocument();
    }

    expect(QUALIFICATIONS).toContain(SELECTED_QUALIFICATION);
    expect(SELECTED_QUALIFICATION).toMatchObject({
      selectorId: "sl-003",
      name: "이지아",
      proposedStatus: "활동 중",
      changeReason: "위반 콘텐츠 삭제 및 소명 확인",
    });
    const manualSection = screen.getByRole("region", { name: "수동 자격 관리" });
    expect(within(manualSection).getByRole("textbox", { name: "선택 셀렉터스" })).toHaveValue(
      `${SELECTED_QUALIFICATION.name} (${SELECTED_QUALIFICATION.selectorId})`,
    );
    expect(within(manualSection).getByRole("textbox", { name: "선택 셀렉터스" })).toHaveAttribute(
      "readonly",
    );
    expect(within(manualSection).getByRole("group", { name: "현재 자격" })).toHaveTextContent(
      SELECTED_QUALIFICATION.currentStatus,
    );
    expect(within(manualSection).getByRole("combobox", { name: "변경 자격" })).toHaveValue(
      SELECTED_QUALIFICATION.proposedStatus,
    );
    expect(
      within(manualSection).getByRole("checkbox", { name: "차기 기수 참여 제한" }),
    ).toHaveProperty("checked", SELECTED_QUALIFICATION.nextCohortRestricted);
    expect(
      within(manualSection).getByRole("checkbox", { name: "블랙리스트 등록" }),
    ).toHaveProperty("checked", SELECTED_QUALIFICATION.blacklisted);
    expect(within(manualSection).getByRole("textbox", { name: "변경 사유" })).toHaveValue(
      SELECTED_QUALIFICATION.changeReason,
    );
    expect(within(manualSection).getByRole("textbox", { name: "변경 사유" })).toHaveAttribute(
      "placeholder",
      "변경 사유를 입력하세요.",
    );
    expect(within(manualSection).getByRole("button", { name: "자격 변경" })).toHaveAttribute(
      "type",
      "button",
    );
  });
});
