import { isInaccessible, screen, within } from "@testing-library/react";
import { renderRoute } from "../test/renderRoute";
import {
  ADMIN_REQUIREMENT_COVERAGE,
  type AdminRequirementCoverageCase,
} from "./requirementCoverage";
import { findRequirementCoverage } from "./requirementRows";

void ({
  route: "/type-check/empty-rows",
  // @ts-expect-error requirement row metadata must never be empty
  rows: [],
  expectedTexts: ["필드"],
  expectedActions: ["액션"],
  primaryRole: { role: "main" },
} satisfies AdminRequirementCoverageCase);

void ({
  route: "/type-check/empty-texts",
  rows: [1],
  // @ts-expect-error visible requirement coverage must never be empty
  expectedTexts: [],
  expectedActions: ["액션"],
  primaryRole: { role: "main" },
} satisfies AdminRequirementCoverageCase);

void ({
  route: "/type-check/empty-actions",
  rows: [1],
  expectedTexts: ["필드"],
  // @ts-expect-error action requirement coverage must never be empty
  expectedActions: [],
  primaryRole: { role: "main" },
} satisfies AdminRequirementCoverageCase);

const REQUIRED_ROUTES = [
  "/login",
  "/creators",
  "/creators/cr-001",
  "/proposals",
  "/cohorts",
  "/selectors",
  "/selectors/qualifications",
  "/applicants",
  "/applicants/ap-001",
  "/applicants/ap-003?fixture=auto-rejected",
  "/campaigns",
  "/campaigns/new",
  "/campaigns/cp-001/edit",
  "/content/reviews",
  "/content/reviews/ct-001",
  "/content/reviews/ct-002?fixture=violation-correction",
  "/content/reviews/ct-003?fixture=edited",
  "/content/violations",
  "/performance",
  "/performance/creators",
  "/performance/contents",
  "/settlements",
  "/system/notices",
] as const;

const SEMANTIC_ROUTE_CONTRACTS = [
  {
    route: "/creators",
    expectedControls: [
      { role: "textbox", name: "키워드" },
      { role: "combobox", name: "카테고리" },
      { role: "combobox", name: "티어" },
      { role: "combobox", name: "플랫폼" },
    ],
    expectedTables: [
      {
        region: "크리에이터 목록",
        columns: ["이름", "팔로워·구독자", "콘텐츠 수", "최근 활동일"],
      },
    ],
  },
  {
    route: "/proposals",
    expectedControls: [
      { role: "combobox", name: "채널" },
      { role: "combobox", name: "상태" },
    ],
    expectedTables: [
      {
        region: "제안 이력 목록",
        columns: ["대상", "채널", "발송 방식", "발송 시각", "상태"],
      },
    ],
  },
  {
    route: "/selectors",
    expectedControls: [
      { role: "textbox", name: "셀렉터스명" },
      { role: "combobox", name: "기수" },
      { role: "combobox", name: "활동 상태" },
    ],
    expectedTables: [
      {
        region: "셀렉터스 목록",
        columns: ["SNS", "활동 상태", "콘텐츠 수", "위반 횟수", "클릭", "전환"],
      },
    ],
  },
  {
    route: "/applicants",
    expectedControls: [
      { role: "textbox", name: "검색어" },
      { role: "combobox", name: "SNS 채널" },
      { role: "combobox", name: "심사 상태" },
      { role: "combobox", name: "자동 반려" },
      { role: "combobox", name: "결과 전송" },
    ],
    expectedTables: [
      {
        region: "지원자 목록",
        columns: [
          "지원자 ID",
          "SNS 채널",
          "팔로워·구독자",
          "콘텐츠 수",
          "최근 활동일",
          "심사 상태",
        ],
      },
    ],
  },
  {
    route: "/content/reviews",
    expectedControls: [
      { role: "textbox", name: "콘텐츠/작성자" },
      { role: "combobox", name: "기수" },
      { role: "combobox", name: "검수 유형" },
      { role: "combobox", name: "플랫폼" },
      { role: "combobox", name: "검수 상태" },
      { role: "combobox", name: "처리 상태" },
    ],
    expectedTables: [
      {
        region: "콘텐츠 검수 대기열",
        columns: ["검수 유형", "작성자", "기수", "플랫폼", "AI 상태", "검수 상태", "처리 상태"],
      },
    ],
  },
  {
    route: "/content/violations",
    expectedControls: [
      { role: "combobox", name: "기수" },
      { role: "combobox", name: "위반 유형" },
      { role: "combobox", name: "처리 상태" },
    ],
    expectedTables: [
      {
        region: "위반 콘텐츠 목록",
        columns: ["안내 문구", "안내 상태", "누적 패널티"],
      },
    ],
  },
  {
    route: "/performance",
    expectedControls: [
      { role: "combobox", name: "기수" },
      { role: "combobox", name: "캠페인" },
      { name: "집계 시작일" },
      { name: "집계 종료일" },
    ],
    expectedTables: [
      {
        region: "캠페인별 성과",
        columns: ["캠페인명", "클릭 수", "구매 전환 수", "전환율"],
      },
      {
        region: "셀렉터스별 성과",
        columns: ["셀렉터스", "클릭 수", "구매 전환 수", "전환율"],
      },
    ],
  },
  {
    route: "/performance/creators",
    expectedControls: [
      { role: "textbox", name: "크리에이터명" },
      { role: "combobox", name: "기수" },
      { role: "combobox", name: "캠페인" },
    ],
    expectedTables: [
      {
        region: "크리에이터 영향력",
        columns: ["구매 전환 수", "조회 수", "좋아요", "댓글"],
      },
    ],
  },
  {
    route: "/performance/contents",
    expectedControls: [
      { role: "textbox", name: "콘텐츠/작성자" },
      { role: "combobox", name: "기수" },
      { role: "combobox", name: "캠페인" },
    ],
    expectedTables: [
      {
        region: "콘텐츠 영향력",
        columns: ["구매 전환 수", "조회 수", "좋아요", "댓글"],
      },
    ],
  },
  {
    route: "/settlements",
    expectedControls: [
      { name: "귀속월" },
      { role: "textbox", name: "셀렉터스" },
      { role: "combobox", name: "수정 가능 여부" },
      { role: "combobox", name: "확정 상태" },
      { role: "combobox", name: "지급 상태" },
    ],
    expectedTables: [
      {
        region: "정산 지급 목록",
        columns: ["귀속월", "셀렉터스", "예상액", "확정액", "수정 가능 여부", "확정 상태", "지급 상태"],
      },
    ],
  },
] as const;

function visibleRequirementCandidates(text: string) {
  return [
    ...screen.queryAllByText(text, { exact: true }),
    ...screen.queryAllByPlaceholderText(text, { exact: true }),
    ...screen.queryAllByDisplayValue(text, { exact: true }),
  ];
}

function hasAccessibleVisibleCandidate(candidates: readonly HTMLElement[]) {
  return candidates.some((candidate) => !isInaccessible(candidate));
}

describe("admin requirement route coverage", () => {
  test("keeps a non-empty, explicit route-to-Excel requirement matrix", () => {
    expect(ADMIN_REQUIREMENT_COVERAGE.length).toBeGreaterThan(0);
    expect(ADMIN_REQUIREMENT_COVERAGE.map(({ route }) => route)).toEqual(REQUIRED_ROUTES);
    expect(new Set(ADMIN_REQUIREMENT_COVERAGE.map(({ route }) => route)).size).toBe(
      ADMIN_REQUIREMENT_COVERAGE.length,
    );

    for (const requirement of ADMIN_REQUIREMENT_COVERAGE) {
      expect(requirement.rows.length, `${requirement.route}: rows`).toBeGreaterThan(0);
      expect(
        requirement.expectedTexts.length,
        `${requirement.route}: expectedTexts`,
      ).toBeGreaterThan(0);
      expect(
        requirement.expectedActions.length,
        `${requirement.route}: expectedActions`,
      ).toBeGreaterThan(0);
      if ("expectedControls" in requirement) {
        expect(
          requirement.expectedControls.length,
          `${requirement.route}: expectedControls`,
        ).toBeGreaterThan(0);
      }
      if ("expectedTables" in requirement) {
        expect(
          requirement.expectedTables.length,
          `${requirement.route}: expectedTables`,
        ).toBeGreaterThan(0);
        for (const table of requirement.expectedTables) {
          expect(
            table.columns.length,
            `${requirement.route}: ${table.region} columns`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  test("declares semantic control and scoped table contracts for list requirements", () => {
    for (const contract of SEMANTIC_ROUTE_CONTRACTS) {
      expect(
        ADMIN_REQUIREMENT_COVERAGE.find(({ route }) => route === contract.route),
      ).toMatchObject(contract);
    }
  });

  test.each(ADMIN_REQUIREMENT_COVERAGE)(
    "$route exposes rows $rows through visible fields and actions",
    (requirement: AdminRequirementCoverageCase) => {
      const {
        expectedActions,
        expectedControls,
        expectedTables,
        expectedTexts,
        primaryRole,
        route,
        rows,
      } = requirement;
      const { container } = renderRoute(route);
      const roleOptions = "name" in primaryRole ? { name: primaryRole.name } : undefined;

      expect(
        screen.getByRole(primaryRole.role, roleOptions),
      ).toBeInTheDocument();

      for (const text of expectedTexts) {
        const candidates = visibleRequirementCandidates(text);
        expect(
          hasAccessibleVisibleCandidate(candidates),
          `Missing visible requirement text: ${text}`,
        ).toBe(true);
      }

      if (expectedControls) {
        const search = screen.getByRole("search", { name: "검색 조건" });

        for (const control of expectedControls) {
          const candidates = control.role
            ? within(search).getAllByRole(control.role, { name: control.name })
            : within(search).getAllByLabelText(control.name);

          expect(
            hasAccessibleVisibleCandidate(candidates),
            `Missing visible search control: ${control.name}`,
          ).toBe(true);
        }
      }

      for (const expectedTable of expectedTables ?? []) {
        const region = screen.getByRole("region", { name: expectedTable.region });
        const table = within(region).getByRole("table");

        for (const column of expectedTable.columns) {
          expect(
            within(table).getByRole("columnheader", { name: column }),
          ).toBeVisible();
        }
      }

      for (const action of expectedActions) {
        expect(
          hasAccessibleVisibleCandidate(
            screen.queryAllByRole("button", { name: action }),
          ),
          `Missing visible action: ${action}`,
        ).toBe(true);
      }

      expect(container.querySelector("[data-requirement-rows]")).toHaveAttribute(
        "data-requirement-rows",
        rows.join(","),
      );
    },
  );
});

describe("requirement row route resolution", () => {
  test("matches an applicant fixture regardless of query order or unrelated params", () => {
    expect(
      findRequirementCoverage(
        "/applicants/ap-003",
        "?utm=x&fixture=auto-rejected",
      )?.rows,
    ).toEqual([19]);
  });

  test.each([
    [
      "/content/reviews/ct-002",
      "?preview=1&fixture=violation-correction&utm=x",
      [25],
    ],
    ["/content/reviews/ct-003", "?utm=x&fixture=edited", [26]],
  ])("matches fixture metadata for %s with extra params", (pathname, search, rows) => {
    expect(findRequirementCoverage(pathname, search)?.rows).toEqual(rows);
  });

  test.each([
    ["/applicants/ap-003", "?fixture=edited", [19]],
    ["/content/reviews/ct-002", "?fixture=edited", [25]],
    ["/content/reviews/ct-003", "?fixture=violation-correction", [26]],
  ])("does not grant fixture-specific rows for a mismatch on %s", (pathname, search, rows) => {
    expect(findRequirementCoverage(pathname, search)?.rows).not.toEqual(rows);
  });

  test("falls back to queryless route metadata when only unrelated params exist", () => {
    expect(findRequirementCoverage("/creators", "?utm=x")?.rows).toEqual([3, 4]);
    expect(findRequirementCoverage("/creators")?.rows).toEqual([3, 4]);
  });
});

describe("deterministic fixture route states", () => {
  test.each([
    ["/creators?fixture=empty", "검색 결과가 없습니다."],
    ["/proposals?fixture=empty", "등록된 제안 이력이 없습니다."],
    ["/creators/cr-001?fixture=ai-pending", "AI 리포트 생성 전"],
    ["/content/reviews?fixture=no-selection", "선택된 콘텐츠가 없습니다."],
    ["/content/reviews/ct-002?fixture=violation-correction", "URL 2 → 1"],
    ["/content/reviews/ct-003?fixture=edited", "URL 1 → 2"],
    ["/creators/missing", "요청한 크리에이터 정보를 확인할 수 없습니다."],
    ["/applicants/missing", "요청한 지원자 정보를 확인할 수 없습니다."],
    ["/campaigns/missing/edit", "요청한 캠페인 정보를 확인할 수 없습니다."],
    ["/content/reviews/missing", "요청한 콘텐츠 검수 정보를 확인해 주세요."],
  ])("renders %s with its exact fixture state", (route, message) => {
    renderRoute(route);

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  test("renders the product fixture as a named dialog", () => {
    renderRoute("/campaigns/new?fixture=product-modal");

    expect(screen.getByRole("dialog", { name: "상품 선택" })).toBeInTheDocument();
  });
});
