import { act, fireEvent, screen, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

function expectColumnHeaders(region: HTMLElement, names: string[]) {
  for (const name of names) {
    expect(within(region).getByRole("columnheader", { name })).toBeInTheDocument();
  }
}

function expectButton(button: HTMLElement, disabled = false) {
  expect(button).toHaveAttribute("type", "button");
  if (disabled) {
    expect(button).toBeDisabled();
  } else {
    expect(button).toBeEnabled();
  }
}

function expectSnapshotEditor(
  snapshot: HTMLElement,
  label: string,
  expectedText: string,
) {
  const editor = within(snapshot).getByRole("region", { name: `${label} 본문` });

  expect(editor).toHaveTextContent(`<p>${expectedText}</p>`);
  expect(editor.querySelector("textarea")).not.toBeInTheDocument();
  expect(editor.querySelector("[contenteditable]")).not.toBeInTheDocument();
}

describe("content review queue", () => {
  test("renders all review filters, exact queue rows, and one selected review target", () => {
    renderRoute("/content/reviews");

    expect(screen.getByRole("heading", { name: "콘텐츠 검수" })).toBeInTheDocument();
    expect(screen.getByText("CT101")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    expect(
      within(search).getByRole("textbox", { name: "콘텐츠/작성자" }),
    ).toHaveAttribute("placeholder", "콘텐츠 ID 또는 작성자");
    expect(within(search).getByRole("combobox", { name: "기수" })).toHaveTextContent(
      "전체3기2기",
    );
    expect(
      within(search).getByRole("combobox", { name: "검수 유형" }),
    ).toHaveTextContent("전체신규 콘텐츠위반 수정본일반 수정본");
    expect(
      within(search).getByRole("combobox", { name: "플랫폼" }),
    ).toHaveTextContent("전체InstagramYouTube");
    expect(
      within(search).getByRole("combobox", { name: "검수 상태" }),
    ).toHaveTextContent("전체검수 대기수정 요청승인위반 확정");
    expect(
      within(search).getByRole("combobox", { name: "처리 상태" }),
    ).toHaveTextContent("전체미처리안내 대기처리 완료");
    expectButton(within(search).getByRole("button", { name: "조회" }));
    expectButton(within(search).getByRole("button", { name: "초기화" }));

    expect(screen.getByText("콘텐츠 검수 대기열", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("총 3건")).toBeInTheDocument();
    expect(screen.getByText("선택 1건")).toBeInTheDocument();
    expectButton(screen.getByRole("button", { name: "선택 콘텐츠 검수" }));

    const queue = screen.getByRole("region", { name: "콘텐츠 검수 대기열" });
    expectColumnHeaders(queue, [
      "선택",
      "콘텐츠 ID",
      "검수 유형",
      "작성자",
      "기수",
      "플랫폼",
      "제출 시각",
      "AI 상태",
      "위반 유형",
      "검수 상태",
      "처리 상태",
      "상세",
    ]);

    const newRow = within(queue).getByRole("row", { name: /ct-001 신규 콘텐츠 김서연/ });
    for (const value of [
      "3기",
      "Instagram",
      "2026-08-03 10:42",
      "생성완료",
      "-",
      "검수 대기",
      "미처리",
    ]) {
      expect(within(newRow).getByText(value)).toBeInTheDocument();
    }
    expect(within(newRow).getByRole("checkbox", { name: "ct-001 선택" })).toBeChecked();
    expectButton(within(newRow).getByRole("button", { name: "ct-001 상세 보기" }));

    const correctionRow = within(queue).getByRole("row", {
      name: /ct-002 위반 수정본 박도윤/,
    });
    for (const value of [
      "YouTube",
      "2026-08-03 09:45",
      "필수 광고 표기 누락",
      "처리 완료",
    ]) {
      expect(within(correctionRow).getByText(value)).toBeInTheDocument();
    }
    expect(within(correctionRow).getByRole("checkbox", { name: "ct-002 선택" })).not.toBeChecked();

    const editedRow = within(queue).getByRole("row", { name: /ct-003 일반 수정본 김서연/ });
    expect(within(editedRow).getByText("2026-08-03 16:25")).toBeInTheDocument();
    expect(within(editedRow).getByRole("checkbox", { name: "ct-003 선택" })).not.toBeChecked();
  });

  test("renders the deterministic no-selection state without changing the queue", () => {
    renderRoute("/content/reviews?fixture=no-selection");

    const queue = screen.getByRole("region", { name: "콘텐츠 검수 대기열" });
    expect(within(queue).getAllByRole("row")).toHaveLength(4);
    for (const checkbox of within(queue).getAllByRole("checkbox")) {
      expect(checkbox).not.toBeChecked();
    }
    expect(screen.getByText("선택된 콘텐츠가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("검수할 콘텐츠를 선택해 주세요.")).toBeInTheDocument();
    expectButton(screen.getByRole("button", { name: "선택 콘텐츠 검수" }), true);
  });

  test("resets fixture-derived selection across same-router query transitions", async () => {
    const { router } = renderRoute("/content/reviews");

    let queue = screen.getByRole("region", { name: "콘텐츠 검수 대기열" });
    let checkboxes = within(queue).getAllByRole("checkbox");
    expect(checkboxes.map((checkbox) => (checkbox as HTMLInputElement).checked)).toEqual([
      true,
      false,
      false,
    ]);

    fireEvent.click(checkboxes[1]);
    expect(checkboxes.map((checkbox) => (checkbox as HTMLInputElement).checked)).toEqual([
      true,
      true,
      false,
    ]);

    await act(async () => {
      await router.navigate("/content/reviews?fixture=no-selection");
    });

    queue = screen.getByRole("region", { name: "콘텐츠 검수 대기열" });
    checkboxes = within(queue).getAllByRole("checkbox");
    expect(checkboxes.map((checkbox) => (checkbox as HTMLInputElement).checked)).toEqual([
      false,
      false,
      false,
    ]);
    expect(screen.getByText("선택된 콘텐츠가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("검수할 콘텐츠를 선택해 주세요.")).toBeInTheDocument();
    expectButton(screen.getByRole("button", { name: "선택 콘텐츠 검수" }), true);

    await act(async () => {
      await router.navigate("/content/reviews");
    });

    queue = screen.getByRole("region", { name: "콘텐츠 검수 대기열" });
    checkboxes = within(queue).getAllByRole("checkbox");
    expect(checkboxes.map((checkbox) => (checkbox as HTMLInputElement).checked)).toEqual([
      true,
      false,
      false,
    ]);
  });
});

describe("content review detail", () => {
  test("renders the exact new-content source, four local media tiles, AI result, and inert actions", () => {
    renderRoute("/content/reviews/ct-001");

    expect(screen.getByRole("heading", { name: "콘텐츠 검수 상세" })).toBeInTheDocument();
    expect(screen.getByText("CT102")).toBeInTheDocument();

    const status = screen.getByRole("group", { name: "검수 상태 요약" });
    for (const value of ["신규 콘텐츠", "검수 대기", "미처리"]) {
      expect(within(status).getByText(value)).toBeInTheDocument();
    }

    const basic = screen.getByRole("region", { name: "기본 정보" });
    const expectedPairs = [
      ["콘텐츠 ID", "ct-001"],
      ["검수 유형", "신규 콘텐츠"],
      ["작성자", "김서연"],
      ["기수", "3기"],
      ["플랫폼", "Instagram"],
      ["제출 시각", "2026-08-03 10:42"],
      ["AI 상태", "생성완료"],
      ["검수 상태", "검수 대기"],
      ["처리 상태", "미처리"],
      ["위반 유형", "-"],
    ];
    for (const [label, value] of expectedPairs) {
      expect(within(basic).getByText(label)).toBeInTheDocument();
      expect(within(basic).getByText(value)).toBeInTheDocument();
    }

    const previous = screen.getByRole("region", { name: "이전 콘텐츠" });
    expect(within(previous).getByText("이전 스냅샷이 없습니다.")).toBeInTheDocument();

    const current = screen.getByRole("region", { name: "현재 콘텐츠" });
    expect(within(current).getByText("최초 수집 원본")).toBeInTheDocument();
    expect(within(current).getByText("2026-08-03 10:40")).toBeInTheDocument();
    const sourceText =
      "가을 라운딩을 위한 세인트앤드류스 패딩 팬츠를 소개합니다. 가볍고 편안한 스트레치 소재를 확인해 보세요. #현대홈쇼핑 #셀렉터스 #광고";
    expectSnapshotEditor(current, "최초 수집 원본", sourceText);
    expect(within(current).getByText("https://www.hmall.com/p/2200098405")).toBeInTheDocument();
    const media = within(current).getByRole("region", { name: "최초 수집 원본 미디어" });
    expect(within(media).getAllByRole("img")).toHaveLength(4);
    expect(within(media).getAllByText("이미지")).toHaveLength(4);

    const summary = screen.getByRole("region", { name: "AI 검수 요약" });
    expect(within(summary).getByText("생성완료")).toBeInTheDocument();
    expect(
      within(summary).getByText(
        "상품명과 공식 링크, 광고 표기가 포함되어 있으며 현재 감지된 위반 항목은 없습니다.",
      ),
    ).toBeInTheDocument();
    expect(within(summary).getByText("감지된 위반 없음")).toBeInTheDocument();

    const actions = screen.getByRole("region", { name: "검수 처리" });
    for (const name of ["검수 완료", "수정 요청", "위반 판정"]) {
      expectButton(within(actions).getByRole("button", { name }));
    }
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(current.querySelector("img")).not.toBeInTheDocument();
  });

  test("renders the exact violation-correction before/after differences and actions", () => {
    renderRoute("/content/reviews/ct-002?fixture=violation-correction");

    const basic = screen.getByRole("region", { name: "기본 정보" });
    for (const value of [
      "ct-002",
      "위반 수정본",
      "박도윤",
      "3기",
      "YouTube",
      "2026-08-03 09:45",
      "생성완료",
      "검수 대기",
      "처리 완료",
      "필수 광고 표기 누락",
    ]) {
      expect(within(basic).getByText(value)).toBeInTheDocument();
    }

    const previous = screen.getByRole("region", { name: "이전 콘텐츠" });
    expect(within(previous).getByText("직전 위반 판정본")).toBeInTheDocument();
    expect(within(previous).getByText("2026-08-01 14:30")).toBeInTheDocument();
    expectSnapshotEditor(
      previous,
      "직전 위반 판정본",
      "세인트앤드류스 신상 패딩, 지금 가장 저렴하게 구매하세요.",
    );
    for (const url of [
      "https://short.example/golf",
      "https://www.hmall.com/p/2200098405?ref=old",
    ]) {
      expect(within(previous).getByText(url)).toBeInTheDocument();
    }
    const previousMedia = within(previous).getByRole("region", {
      name: "직전 위반 판정본 미디어",
    });
    expect(within(previousMedia).getAllByRole("img")).toHaveLength(5);
    expect(within(previousMedia).getByText("동영상")).toBeInTheDocument();

    const current = screen.getByRole("region", { name: "현재 콘텐츠" });
    expect(within(current).getByText("위반 후 수정본")).toBeInTheDocument();
    expect(within(current).getByText("2026-08-03 09:40")).toBeInTheDocument();
    expectSnapshotEditor(
      current,
      "위반 후 수정본",
      "유료광고를 포함한 세인트앤드류스 패딩 팬츠 후기입니다. 상품 정보는 공식 링크에서 확인해 주세요. #현대홈쇼핑 #광고",
    );
    expect(within(current).getByText("https://www.hmall.com/p/2200098405")).toBeInTheDocument();
    expect(
      within(within(current).getByRole("region", { name: "위반 후 수정본 미디어" })).getAllByRole(
        "img",
      ),
    ).toHaveLength(4);

    const changes = screen.getByRole("region", { name: "변경 요약" });
    for (const value of ["본문 변경됨", "URL 2 → 1", "미디어 5 → 4"]) {
      expect(within(changes).getByText(value)).toBeInTheDocument();
    }
    const ai = screen.getByRole("region", { name: "AI 검수 요약" });
    expect(
      within(ai).getByText(
        "광고 표기와 공식 상품 링크가 보완되었고 과장 표현이 삭제되었습니다. 미디어는 5개에서 4개로 변경되었습니다.",
      ),
    ).toBeInTheDocument();
    expect(within(ai).getByText("필수 광고 표기 누락")).toBeInTheDocument();
    expect(within(ai).getByText("비공식 단축 URL")).toBeInTheDocument();

    const actions = screen.getByRole("region", { name: "검수 처리" });
    for (const name of ["위반 해제", "재수정 요청", "위반 유지"]) {
      expectButton(within(actions).getByRole("button", { name }));
    }
  });

  test("renders the exact edited-content differences and detected additions", () => {
    renderRoute("/content/reviews/ct-003?fixture=edited");

    const basic = screen.getByRole("region", { name: "기본 정보" });
    for (const value of [
      "ct-003",
      "일반 수정본",
      "김서연",
      "3기",
      "Instagram",
      "2026-08-03 16:25",
      "생성완료",
      "검수 대기",
      "미처리",
      "-",
    ]) {
      expect(within(basic).getByText(value)).toBeInTheDocument();
    }

    const previous = screen.getByRole("region", { name: "이전 콘텐츠" });
    expect(within(previous).getByText("직전 승인본")).toBeInTheDocument();
    expect(within(previous).getByText("2026-08-02 12:10")).toBeInTheDocument();
    expectSnapshotEditor(
      previous,
      "직전 승인본",
      "가을 라운딩 코디로 고른 세인트앤드류스 패딩 팬츠입니다. #현대홈쇼핑 #셀렉터스 #광고",
    );
    expect(
      within(within(previous).getByRole("region", { name: "직전 승인본 미디어" })).getAllByRole(
        "img",
      ),
    ).toHaveLength(3);

    const current = screen.getByRole("region", { name: "현재 콘텐츠" });
    expect(within(current).getByText("수정 감지본")).toBeInTheDocument();
    expect(within(current).getByText("2026-08-03 16:22")).toBeInTheDocument();
    expectSnapshotEditor(
      current,
      "수정 감지본",
      "선선한 아침 라운딩에 입어 본 세인트앤드류스 스트레치 패딩 팬츠입니다. 착용감과 사이즈 팁을 확인해 보세요. #현대홈쇼핑 #셀렉터스 #광고",
    );
    for (const url of [
      "https://www.hmall.com/p/2200098405",
      "https://www.hmall.com/event/golf",
    ]) {
      expect(within(current).getByText(url)).toBeInTheDocument();
    }
    expect(
      within(within(current).getByRole("region", { name: "수정 감지본 미디어" })).getAllByRole(
        "img",
      ),
    ).toHaveLength(4);

    const changes = screen.getByRole("region", { name: "변경 요약" });
    for (const value of ["본문 변경됨", "URL 1 → 2", "미디어 3 → 4"]) {
      expect(within(changes).getByText(value)).toBeInTheDocument();
    }
    const ai = screen.getByRole("region", { name: "AI 검수 요약" });
    expect(
      within(ai).getByText(
        "본문과 링크, 이미지 수 변경을 감지했습니다. 필수 광고 표기와 공식 상품 링크는 유지되었습니다.",
      ),
    ).toBeInTheDocument();
    expect(within(ai).getByText("이벤트 URL 1개 추가")).toBeInTheDocument();
    expect(within(ai).getByText("이미지 1개 추가")).toBeInTheDocument();
    expect(within(ai).getByText("감지된 위반 없음")).toBeInTheDocument();

    const actions = screen.getByRole("region", { name: "검수 처리" });
    for (const name of ["변경 승인", "수정 요청", "위반 판정"]) {
      expectButton(within(actions).getByRole("button", { name }));
    }
  });

  test("bounds an unmatched content ID to the shared missing-detail state", () => {
    renderRoute("/content/reviews/missing");

    expect(screen.getByRole("heading", { name: "콘텐츠 검수 상세" })).toBeInTheDocument();
    expect(screen.getByText("대상을 찾을 수 없습니다.")).toBeInTheDocument();
    expect(
      screen.getByText("요청한 콘텐츠 검수 정보를 확인해 주세요."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "기본 정보" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "현재 콘텐츠" })).not.toBeInTheDocument();
    expect(screen.queryByText("ct-001")).not.toBeInTheDocument();
  });
});

describe("violation management", () => {
  test("renders exact violation filters, notices, status, penalties, and row-scoped actions", () => {
    renderRoute("/content/violations");

    expect(screen.getByRole("heading", { name: "위반 콘텐츠 관리" })).toBeInTheDocument();
    expect(screen.getByText("CT201")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    expect(within(search).getByRole("combobox", { name: "기수" })).toHaveTextContent(
      "전체3기2기",
    );
    expect(
      within(search).getByRole("combobox", { name: "위반 유형" }),
    ).toHaveTextContent("전체상품 링크 누락필수 광고 표기 누락허위·과장 표현");
    expect(
      within(search).getByRole("combobox", { name: "처리 상태" }),
    ).toHaveTextContent("전체미처리처리 중처리 완료");
    expectButton(within(search).getByRole("button", { name: "조회" }));
    expectButton(within(search).getByRole("button", { name: "초기화" }));

    expect(
      screen.getByText("패널티 3회 이상 누적 시 차기 기수 셀렉터스 활동이 제한됩니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("총 3건")).toBeInTheDocument();

    const table = screen.getByRole("region", { name: "위반 콘텐츠 목록" });
    expectColumnHeaders(table, [
      "위반 ID",
      "기수",
      "셀렉터스",
      "콘텐츠 ID",
      "위반 유형",
      "안내 문구",
      "안내 상태",
      "처리 상태",
      "누적 패널티",
      "관리",
    ]);

    const cases = [
      {
        rowName: /vr-001 3기 김서연 ct-005/,
        selector: "김서연",
        values: [
          "상품 링크 누락",
          "공식 상품 링크를 추가한 뒤 수정본을 제출해 주세요.",
          "미발송",
          "미처리",
          "0",
        ],
      },
      {
        rowName: /vr-002 3기 박도윤 ct-002/,
        selector: "박도윤",
        values: [
          "필수 광고 표기 누락",
          "광고 표기를 본문 첫 줄에 추가하고 공식 상품 링크로 수정해 주세요.",
          "발송 대기",
          "처리 중",
          "2",
        ],
      },
      {
        rowName: /vr-003 2기 이지아 ct-004/,
        selector: "이지아",
        values: [
          "허위·과장 표현",
          "최저가를 단정하는 표현을 삭제한 수정본을 제출해 주세요.",
          "발송 완료",
          "처리 완료",
          "3",
          "차기 기수 활동 불가",
        ],
      },
    ];

    for (const item of cases) {
      const row = within(table).getByRole("row", { name: item.rowName });
      for (const value of item.values) {
        expect(within(row).getByText(value)).toBeInTheDocument();
      }
      expectButton(
        within(row).getByRole("button", { name: `${item.selector} 위반사항 안내` }),
      );
      expectButton(
        within(row).getByRole("button", { name: `${item.selector} 패널티 부여` }),
      );
    }
  });
});
