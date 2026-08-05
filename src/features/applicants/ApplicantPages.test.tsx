import { act, fireEvent, screen, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";
import { APPLICANTS } from "./fixtures";

function expectColumnHeaders(region: HTMLElement, names: string[]) {
  for (const name of names) {
    expect(within(region).getByRole("columnheader", { name })).toBeInTheDocument();
  }
}

function expectStatusTone(row: HTMLElement, label: string, tone: string) {
  expect(within(row).getByText(label)).toHaveClass(`hsas-status-pill--${tone}`);
}

describe("applicant review list", () => {
  test("renders all review and delivery states in their associated applicant rows", () => {
    renderRoute("/applicants");

    expect(screen.getByRole("heading", { name: "지원자 심사" })).toBeInTheDocument();
    expect(screen.getByText("AP101")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    expect(within(search).getByRole("textbox", { name: "검색어" })).toHaveAttribute(
      "placeholder",
      "지원자 ID 또는 이름 검색",
    );
    expect(within(search).getByRole("combobox", { name: "SNS 채널" })).toHaveTextContent(
      "전체InstagramYouTube",
    );
    expect(within(search).getByRole("combobox", { name: "심사 상태" })).toHaveTextContent(
      "전체검토 대기승인반려자동 반려",
    );
    expect(within(search).getByRole("combobox", { name: "자동 반려" })).toHaveTextContent(
      "전체해당비해당",
    );
    expect(within(search).getByRole("combobox", { name: "결과 전송" })).toHaveTextContent(
      "전체전송 대기전송 완료전송 실패",
    );
    expect(within(search).getByRole("button", { name: "조회" })).toHaveAttribute(
      "type",
      "button",
    );
    expect(within(search).getByRole("button", { name: "초기화" })).toHaveAttribute(
      "type",
      "button",
    );

    expect(screen.getByText("지원자 목록", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("총 4건")).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "지원자 목록" });
    expectColumnHeaders(results, [
      "선택",
      "지원자 ID",
      "이름",
      "SNS 채널",
      "팔로워·구독자",
      "콘텐츠 수",
      "최근 활동일",
      "평균 조회 수",
      "평균 반응 수",
      "심사 상태",
      "자동 반려",
      "결과 전송",
      "상세",
    ]);

    const minjiRow = within(results).getByRole("row", { name: /ap-001 김민지/ });
    for (const value of [
      "Instagram",
      "58,420",
      "126",
      "2026-08-02",
      "21,840",
      "1,472",
      "검토 대기",
      "비해당",
      "전송 대기",
    ]) {
      expect(within(minjiRow).getByText(value)).toBeInTheDocument();
    }
    expect(within(minjiRow).getByRole("checkbox", { name: "김민지 선택" })).toBeInTheDocument();
    expect(within(minjiRow).getByRole("link", { name: "김민지 상세 보기" })).toHaveAttribute(
      "href",
      "/applicants/ap-001",
    );
    expectStatusTone(minjiRow, "검토 대기", "pending");
    expectStatusTone(minjiRow, "비해당", "neutral");
    expectStatusTone(minjiRow, "전송 대기", "pending");

    const soraRow = within(results).getByRole("row", { name: /ap-003 윤소라/ });
    for (const value of [
      "Instagram",
      "860",
      "2",
      "2026-03-14",
      "340",
      "18",
      "자동 반려",
      "해당",
      "전송 실패",
    ]) {
      expect(within(soraRow).getByText(value)).toBeInTheDocument();
    }
    expect(within(soraRow).getByRole("checkbox", { name: "윤소라 선택" })).toBeInTheDocument();
    expect(within(soraRow).getByRole("link", { name: "윤소라 상세 보기" })).toHaveAttribute(
      "href",
      "/applicants/ap-003",
    );
    expectStatusTone(soraRow, "자동 반려", "rejected");
    expectStatusTone(soraRow, "해당", "rejected");
    expectStatusTone(soraRow, "전송 실패", "rejected");

    const harinRow = within(results).getByRole("row", { name: /ap-002 정하린/ });
    expectStatusTone(harinRow, "승인", "approved");
    expectStatusTone(harinRow, "전송 완료", "approved");
    const yenaRow = within(results).getByRole("row", { name: /ap-004 권예나/ });
    expectStatusTone(yenaRow, "반려", "rejected");
    expectStatusTone(yenaRow, "전송 완료", "approved");

    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
    expect(screen.getByText("페이지당 20개")).toBeInTheDocument();
  });

  test("derives each list delivery status from a non-empty primary delivery record", () => {
    for (const applicant of APPLICANTS) {
      expect(applicant.deliveries[0]).toBeDefined();
      expect(applicant).not.toHaveProperty("deliveryStatus");
    }
  });
});

describe("applicant detail review", () => {
  test("renders the manual-review applicant, AI report, inert decision controls, and pending delivery rows", () => {
    renderRoute("/applicants/ap-001");

    expect(screen.getByRole("heading", { name: "지원자 상세 심사" })).toBeInTheDocument();
    expect(screen.getByText("AP102")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "목록" })).toHaveAttribute("href", "/applicants");

    const tabs = screen.getByRole("navigation", { name: "섹션" });
    expect(within(tabs).getByText("기본 정보")).toHaveAttribute("aria-current", "page");
    for (const label of ["SNS 지표", "AI 요약 리포트", "심사 처리", "결과 전송"]) {
      expect(within(tabs).getByText(label)).toBeInTheDocument();
    }

    const basic = screen.getByRole("region", { name: "기본 정보" });
    for (const label of ["지원자 ID", "이름", "지원일", "이메일", "연락처", "심사 상태"]) {
      expect(within(basic).getByText(label)).toBeInTheDocument();
    }
    for (const value of [
      "ap-001",
      "김민지",
      "2026-08-03 09:12",
      "minji@example.com",
      "010-4821-7326",
      "검토 대기",
    ]) {
      expect(within(basic).getByText(value)).toBeInTheDocument();
    }

    const metrics = screen.getByRole("region", { name: "SNS 채널 정보" });
    const expectedMetricPairs = [
      ["SNS 채널", "Instagram"],
      ["계정명", "@minji.daily"],
      ["팔로워·구독자", "58,420"],
      ["콘텐츠 수", "126"],
      ["최근 활동일", "2026-08-02"],
      ["평균 조회 수", "21,840"],
      ["평균 반응 수", "1,472"],
    ];
    for (const [label, value] of expectedMetricPairs) {
      expect(within(metrics).getByText(label)).toBeInTheDocument();
      expect(within(metrics).getByText(value)).toBeInTheDocument();
    }

    const ai = screen.getByRole("region", { name: "AI 요약 리포트" });
    expect(within(ai).getByText("91점")).toBeInTheDocument();
    expect(
      within(ai).getByText(
        "뷰티·패션 콘텐츠의 반응이 안정적이며 최근 활동이 꾸준한 지원자입니다.",
      ),
    ).toBeInTheDocument();
    for (const evidence of [
      "최근 30일 평균 조회 수 21,840회",
      "평균 반응률 6.7%",
      "최근 60일 콘텐츠 14건",
    ]) {
      expect(within(ai).getByText(evidence)).toBeInTheDocument();
    }

    const review = screen.getByRole("region", { name: "심사 처리" });
    expect(within(review).getByText("자동 반려 여부")).toBeInTheDocument();
    expectStatusTone(review, "비해당", "neutral");
    expect(within(review).getByRole("textbox", { name: "내부 검토 의견" })).toHaveValue(
      "최근 게시물 품질과 브랜드 적합성을 확인했습니다.",
    );
    expect(within(review).getByRole("combobox", { name: "반려 사유(내부)" })).toHaveValue("");
    expect(within(review).getByRole("button", { name: "승인" })).toHaveAttribute(
      "type",
      "button",
    );
    expect(within(review).getByRole("button", { name: "반려" })).toHaveAttribute(
      "type",
      "button",
    );
    expect(within(review).queryByText("정량 기준 미충족", { selector: "h3" })).not.toBeInTheDocument();

    const delivery = screen.getByRole("region", { name: "심사 결과 전송" });
    expectColumnHeaders(delivery, ["채널", "수신 정보", "상태", "전송 시각"]);
    const emailRow = within(delivery).getByRole("row", { name: /이메일 minji@example.com/ });
    expectStatusTone(emailRow, "전송 대기", "pending");
    expect(within(emailRow).getByText("-")).toBeInTheDocument();
    const alertRow = within(delivery).getByRole("row", { name: /알림톡 010-4821-7326/ });
    expectStatusTone(alertRow, "전송 대기", "pending");
    expect(within(alertRow).getByText("-")).toBeInTheDocument();
    expect(within(delivery).getByRole("button", { name: "심사 결과 전송" })).toHaveAttribute(
      "type",
      "button",
    );
    expect(
      within(delivery).getByText(
        "알림톡 미지원 시 이메일로 발송하며, 반려 사유는 지원자에게 공개하지 않습니다.",
      ),
    ).toBeInTheDocument();
  });

  test("renders the automatic-rejection evidence and failed-alert email fallback without hiding static actions", () => {
    renderRoute("/applicants/ap-003?fixture=auto-rejected");

    expect(screen.getByRole("heading", { name: "지원자 상세 심사" })).toBeInTheDocument();
    expect(screen.getByText("AP102")).toBeInTheDocument();
    const basic = screen.getByRole("region", { name: "기본 정보" });
    expect(within(basic).getByText("윤소라")).toBeInTheDocument();
    expectStatusTone(basic, "자동 반려", "rejected");

    const review = screen.getByRole("region", { name: "심사 처리" });
    expectStatusTone(review, "해당", "rejected");
    expect(within(review).getByRole("heading", { name: "정량 기준 미충족" })).toBeInTheDocument();
    for (const criterion of [
      "팔로워·구독자 1,000명 미만",
      "최근 90일 콘텐츠 3건 미만",
      "최근 90일 활동 없음",
    ]) {
      expect(within(review).getByText(criterion)).toBeInTheDocument();
    }
    expect(within(review).getByText("내부 반려 사유")).toBeInTheDocument();
    expect(
      within(review).getByText(
        "필수 정량 기준 3개 항목 미충족으로 자동 반려되었습니다.",
      ),
    ).toBeInTheDocument();
    expect(within(review).getByRole("combobox", { name: "반려 사유(내부)" })).toHaveValue(
      "정량 기준 미충족",
    );
    expect(within(review).getByRole("button", { name: "승인" })).toBeInTheDocument();
    expect(within(review).getByRole("button", { name: "반려" })).toBeInTheDocument();

    const delivery = screen.getByRole("region", { name: "심사 결과 전송" });
    const alertRow = within(delivery).getByRole("row", { name: /알림톡/ });
    expectStatusTone(alertRow, "전송 실패", "rejected");
    expect(within(alertRow).getByText("2026-08-03 11:07")).toBeInTheDocument();
    const emailRow = within(delivery).getByRole("row", { name: /이메일/ });
    expectStatusTone(emailRow, "전송 완료", "approved");
    expect(within(emailRow).getByText("2026-08-03 11:08")).toBeInTheDocument();
    expect(within(delivery).getByRole("button", { name: "심사 결과 전송" })).toBeInTheDocument();
  });

  test("does not let the automatic-rejection fixture query replace a different applicant identity", () => {
    renderRoute("/applicants/ap-001?fixture=auto-rejected");

    const basic = screen.getByRole("region", { name: "기본 정보" });
    expect(within(basic).getByText("ap-001")).toBeInTheDocument();
    expect(within(basic).getByText("김민지")).toBeInTheDocument();
    expect(within(basic).queryByText("윤소라")).not.toBeInTheDocument();

    const review = screen.getByRole("region", { name: "심사 처리" });
    expectStatusTone(review, "비해당", "neutral");
    expect(
      within(review).queryByRole("heading", { name: "정량 기준 미충족" }),
    ).not.toBeInTheDocument();
  });

  test("keeps a missing applicant missing even when the automatic-rejection fixture query is present", () => {
    renderRoute("/applicants/missing?fixture=auto-rejected");

    expect(screen.getByRole("heading", { name: "대상을 찾을 수 없습니다" })).toBeInTheDocument();
    expect(screen.getByText("요청한 지원자 정보를 확인할 수 없습니다.")).toBeInTheDocument();
    expect(screen.queryByText("윤소라")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "승인" })).not.toBeInTheDocument();
  });

  test("resets editable-looking review fields when the same router moves to another applicant", async () => {
    const { router } = renderRoute("/applicants/ap-001");

    const initialReview = screen.getByRole("region", { name: "심사 처리" });
    fireEvent.change(within(initialReview).getByRole("textbox", { name: "내부 검토 의견" }), {
      target: { value: "관리자가 임시로 편집한 값" },
    });
    fireEvent.change(within(initialReview).getByRole("combobox", { name: "반려 사유(내부)" }), {
      target: { value: "기타" },
    });

    await act(async () => {
      await router.navigate("/applicants/ap-003?fixture=auto-rejected");
    });

    const nextReview = screen.getByRole("region", { name: "심사 처리" });
    expect(within(nextReview).getByRole("textbox", { name: "내부 검토 의견" })).toHaveValue(
      "자동 반려 기준과 수집 지표를 확인했습니다.",
    );
    expect(within(nextReview).getByRole("combobox", { name: "반려 사유(내부)" })).toHaveValue(
      "정량 기준 미충족",
    );
  });

  test("keeps the detail frame and hides applicant actions for an unknown record", () => {
    renderRoute("/applicants/missing");

    expect(screen.getByRole("heading", { name: "지원자 상세 심사" })).toBeInTheDocument();
    expect(screen.getByText("AP102")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "대상을 찾을 수 없습니다" })).toBeInTheDocument();
    expect(screen.getByText("요청한 지원자 정보를 확인할 수 없습니다.")).toBeInTheDocument();
    expect(screen.queryByText("김민지")).not.toBeInTheDocument();
    expect(screen.queryByText("윤소라")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "승인" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "반려" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "심사 결과 전송" })).not.toBeInTheDocument();
  });
});
