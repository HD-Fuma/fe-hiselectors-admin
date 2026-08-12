import { CREATORS } from "../../entities/creator/model/fixtures";
import {
  deriveCadence,
  deriveEngagementRate,
  rankTopTwoN,
} from "../../entities/creator/model/analysis";

describe("creator analysis derivations", () => {
  test("derives cadence and longest gap from posting dates", () => {
    expect(
      deriveCadence(["2026-08-05", "2026-08-01", "2026-07-29", "2026-05-01"], "2026-08-05", 90),
    ).toEqual({ dailyAverage: 0.03, weeklyAverage: 0.2, longestGapDays: 3 });
  });

  test("excludes zero-audience samples from engagement rate", () => {
    expect(
      deriveEngagementRate([
        { audience: 100, likes: 5, comments: 5 },
        { audience: 0, likes: 99, comments: 99 },
      ]),
    ).toEqual({ value: 10, sampleSize: 1 });
    expect(deriveEngagementRate([{ audience: 0, likes: 1, comments: 1 }])).toEqual({
      value: null,
      sampleSize: 0,
    });
  });

  test("ranks Top 2N candidates before category adjustment", () => {
    expect(rankTopTwoN(CREATORS, 2).map(({ id }) => id)).toEqual(["cr-001", "cr-004", "cr-003"]);
  });
});
