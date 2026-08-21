import {
  CONTENT_INSPECTIONS,
  sortContentInspectionsNewestFirst,
} from ".";

test("sorts equal submission times by descending content id without mutating input", () => {
  const source = CONTENT_INSPECTIONS[0];
  const contents = [
    { ...source, id: "ct-010", submittedAt: "2026-08-18 10:00" },
    { ...source, id: "ct-030", submittedAt: "2026-08-18 11:00" },
    { ...source, id: "ct-020", submittedAt: "2026-08-18 11:00" },
  ];

  expect(sortContentInspectionsNewestFirst(contents).map(({ id }) => id)).toEqual([
    "ct-030",
    "ct-020",
    "ct-010",
  ]);
  expect(contents.map(({ id }) => id)).toEqual(["ct-010", "ct-030", "ct-020"]);
});
