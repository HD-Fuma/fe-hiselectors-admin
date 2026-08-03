export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];

export interface AdminRequirementRows {
  route: string;
  rows: NonEmptyReadonlyArray<number>;
}

export const ADMIN_REQUIREMENT_ROWS = [
  { route: "/login", rows: [2] },
  { route: "/creators", rows: [3, 4] },
  { route: "/creators/cr-001", rows: [5, 6, 7, 8] },
  { route: "/proposals", rows: [9, 10] },
  { route: "/cohorts", rows: [11] },
  { route: "/selectors", rows: [12] },
  { route: "/selectors/qualifications", rows: [13, 14] },
  { route: "/applicants", rows: [15] },
  { route: "/applicants/ap-001", rows: [16, 17, 18, 20] },
  { route: "/applicants/ap-003?fixture=auto-rejected", rows: [19] },
  { route: "/campaigns", rows: [23] },
  { route: "/campaigns/new", rows: [21, 22] },
  { route: "/campaigns/cp-001/edit", rows: [21, 22] },
  { route: "/content/reviews", rows: [24, 25, 26] },
  { route: "/content/reviews/ct-001", rows: [24] },
  { route: "/content/reviews/ct-002?fixture=violation-correction", rows: [25] },
  { route: "/content/reviews/ct-003?fixture=edited", rows: [26] },
  { route: "/content/violations", rows: [27, 28, 29] },
  { route: "/performance", rows: [30] },
  { route: "/performance/creators", rows: [31] },
  { route: "/performance/contents", rows: [32] },
  { route: "/settlements", rows: [33, 34, 35] },
  { route: "/system/notices", rows: [36] },
] as const satisfies readonly AdminRequirementRows[];

function splitRequirementRoute(route: string) {
  const [pathname, rawSearch = ""] = route.split("?", 2);

  return {
    pathname,
    search: new URLSearchParams(rawSearch),
  };
}

function containsRequiredSearch(
  actualSearch: URLSearchParams,
  requiredSearch: URLSearchParams,
) {
  return [...requiredSearch].every(([key, value]) =>
    actualSearch.getAll(key).includes(value),
  );
}

export function findRequirementCoverage(pathname: string, search = "") {
  const actualSearch = new URLSearchParams(search);
  const candidates = ADMIN_REQUIREMENT_ROWS.filter(
    (item) => splitRequirementRoute(item.route).pathname === pathname,
  );
  const fixtureMatch = candidates
    .map((item) => ({ item, route: splitRequirementRoute(item.route) }))
    .filter(({ route }) => route.search.size > 0)
    .filter(({ route }) => containsRequiredSearch(actualSearch, route.search))
    .sort((left, right) => right.route.search.size - left.route.search.size)[0];

  if (fixtureMatch) return fixtureMatch.item;

  return candidates.find((item) => splitRequirementRoute(item.route).search.size === 0);
}
