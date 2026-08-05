import { CREATORS, type CreatorFixture } from "./fixtures";
import {
  averageViews,
  engagementRate,
  proposalAction,
  proposalTone,
} from "./CreatorEvidenceCard";

const zia = CREATORS[2];
const withStatus = (status: CreatorFixture["proposalStatus"]): CreatorFixture => ({
  ...zia,
  proposalStatus: status,
});

describe("creator evidence-card helpers", () => {
  test("computes channel averages and a zero-safe weighted reaction rate", () => {
    expect(averageViews(zia)).toBe(13_600);
    expect(engagementRate(zia)).toBeCloseTo(5.147, 2);

    const empty = { ...zia, channels: [] } as CreatorFixture;
    const zero = {
      ...zia,
      channels: zia.channels.map((channel) => ({ ...channel, views: 0 })),
    } as CreatorFixture;

    expect(averageViews(empty)).toBe(0);
    expect(engagementRate(empty)).toBe(0);
    expect(engagementRate(zero)).toBe(0);
  });

  test.each([
    ["미제안", "영입 제안", "/creators/cr-003#proposal", "neutral"],
    ["발송 실패", "다시 제안", "/creators/cr-003#proposal", "rejected"],
    ["발송 대기", "제안 이력", "/proposals?creator=cr-003", "pending"],
    ["발송 완료", "제안 이력", "/proposals?creator=cr-003", "approved"],
    ["셀렉터스 전환", "제안 이력", "/proposals?creator=cr-003", "approved"],
  ] as const)("maps %s to its exact action", (status, label, to, tone) => {
    const creator = withStatus(status);

    expect(proposalAction(creator)).toEqual({ label, to });
    expect(proposalTone(status)).toBe(tone);
  });
});
