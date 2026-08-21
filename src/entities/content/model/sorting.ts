import type { ContentInspectionFixture } from "./fixtures";

export function sortContentInspectionsNewestFirst(
  contents: readonly ContentInspectionFixture[],
) {
  return [...contents].sort((left, right) => (
    right.submittedAt.localeCompare(left.submittedAt) || right.id.localeCompare(left.id)
  ));
}
