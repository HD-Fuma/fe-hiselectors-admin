import { CONTENT_INSPECTIONS } from "../../entities/content";

test("keeps annotation targets valid and resolved content free of active violations", () => {
  const inspection = CONTENT_INSPECTIONS.find(({ id }) => id === "ct-002")!;
  const previous = inspection.previousSnapshot!;
  const activeAnnotations = previous.annotations?.filter(({ state }) => state === "active") ?? [];

  for (const annotation of activeAnnotations) {
    const { target } = annotation;
    if (target.kind === "text") {
      const occurrenceCount = previous.text.split(target.quote).length - 1;
      expect(target.quote).not.toBe("");
      expect(occurrenceCount).toBeGreaterThanOrEqual(target.occurrence ?? 1);
    } else if (target.kind === "url") {
      expect(previous.urls[target.targetIndex]).toBeDefined();
    } else {
      if (target.mediaIndex !== undefined) {
        expect(previous.mediaKinds[target.mediaIndex]).toBeDefined();
      }
    }
  }

  expect(inspection.currentSnapshot.annotations?.some(({ state }) => state === "active")).toBe(false);
});

test("marks an ordinary edit as detected and policy-safe", () => {
  const inspection = CONTENT_INSPECTIONS.find(({ id }) => id === "ct-003")!;
  expect(inspection.report.signals).toContainEqual(
    expect.objectContaining({ title: "변경 감지", tone: "pass" }),
  );
  expect(inspection.report.history).toEqual(
    expect.arrayContaining([expect.objectContaining({ label: "수정 감지" })]),
  );
});
