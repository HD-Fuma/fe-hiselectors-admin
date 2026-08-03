import { screen } from "@testing-library/react";
import { renderRoute } from "../test/renderRoute";
import {
  ADMIN_REQUIREMENT_COVERAGE,
  type AdminRequirementCoverageCase,
} from "./requirementCoverage";

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

function visibleRequirementCandidates(text: string) {
  return [
    ...screen.queryAllByText(text, { exact: true }),
    ...screen.queryAllByPlaceholderText(text, { exact: true }),
    ...screen.queryAllByDisplayValue(text, { exact: true }),
  ];
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
    }
  });

  test.each(ADMIN_REQUIREMENT_COVERAGE)(
    "$route exposes rows $rows through visible fields and actions",
    ({ expectedActions, expectedTexts, primaryRole, route, rows }) => {
      const { container } = renderRoute(route);
      const roleOptions = "name" in primaryRole ? { name: primaryRole.name } : undefined;

      expect(
        screen.getByRole(primaryRole.role, roleOptions),
      ).toBeInTheDocument();

      for (const text of expectedTexts) {
        const candidates = visibleRequirementCandidates(text);
        expect(candidates.length, `Missing visible requirement text: ${text}`).toBeGreaterThan(0);
        expect(candidates[0]).toBeVisible();
      }

      for (const action of expectedActions) {
        expect(screen.getAllByRole("button", { name: action }).length).toBeGreaterThan(0);
      }

      expect(container.querySelector("[data-requirement-rows]")).toHaveAttribute(
        "data-requirement-rows",
        rows.join(","),
      );
    },
  );
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

  test("renders the mega-menu fixture as a modal overlay", () => {
    renderRoute("/?fixture=mega-menu");

    expect(screen.getByRole("dialog", { name: "전체메뉴" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
  });
});
