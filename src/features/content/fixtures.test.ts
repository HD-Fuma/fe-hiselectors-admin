import { CONTENT_REVIEWS } from "./fixtures";

function allSnapshots() {
  return CONTENT_REVIEWS.flatMap((review) =>
    review.previousSnapshot
      ? [review.previousSnapshot, review.currentSnapshot]
      : [review.currentSnapshot],
  );
}

test("provides local thumbnails without overstating each snapshot media count", () => {
  for (const snapshot of allSnapshots()) {
    expect(snapshot.mediaUrls.length).toBeLessThanOrEqual(snapshot.mediaCount);
    expect(snapshot.mediaKinds).toHaveLength(snapshot.mediaCount);
    expect(snapshot.mediaUrls.length).toBeGreaterThan(0);
    for (const url of snapshot.mediaUrls) {
      expect(url).toMatch(/^\/creator-media\/kr-cr-00[1-3]-0[1-3]\.jpg$/);
    }
  }
});

test("keeps the new-content report free of invented audio and previous-version evidence", () => {
  const review = CONTENT_REVIEWS.find(({ id }) => id === "ct-001")!;

  expect(review.previousSnapshot).toBeNull();
  expect(review.report.extracts.some(({ type }) => type === "STT")).toBe(false);
  expect(review.report.signals).toContainEqual(
    expect.objectContaining({ title: "음성 검사", tone: "pass" }),
  );
  expect(review.report.history.some(({ label }) => label.includes("이전"))).toBe(false);
});

test("shows resolved violations and useful YouTube speech extracts", () => {
  const review = CONTENT_REVIEWS.find(({ id }) => id === "ct-002")!;

  expect(review.report.signals).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ title: "광고 표시 보완", tone: "pass" }),
      expect.objectContaining({ title: "공식 링크로 교체", tone: "pass" }),
    ]),
  );
  expect(review.report.extracts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "STT",
        text: expect.stringContaining("착용감과 사이즈"),
        location: expect.stringContaining("00:"),
      }),
    ]),
  );
});

test("marks an ordinary edit as detected and policy-safe", () => {
  const review = CONTENT_REVIEWS.find(({ id }) => id === "ct-003")!;

  expect(review.report.signals).toContainEqual(
    expect.objectContaining({ title: "변경 감지", tone: "pass" }),
  );
  expect(review.report.history).toEqual(
    expect.arrayContaining([expect.objectContaining({ label: "수정 감지" })]),
  );
});
