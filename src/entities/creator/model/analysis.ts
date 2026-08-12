import type { CreatorFixture } from "./fixtures";

export interface EngagementSample {
  audience: number;
  likes: number;
  comments: number | null;
}

const ENGAGEMENT_SAMPLES: Record<string, readonly EngagementSample[]> = {
  "cr-001": Array.from({ length: 29 }, () => ({ audience: 82_400, likes: 3_050, comments: 228 })),
  "cr-002": Array.from({ length: 20 }, () => ({ audience: 76_200, likes: 1_130, comments: null })),
  "cr-003": Array.from({ length: 18 }, () => ({ audience: 32_700, likes: 900, comments: 81 })),
  "cr-004": Array.from({ length: 24 }, () => ({ audience: 486_000, likes: 12_000, comments: 636 })),
};

export function deriveCadence(postDates: readonly string[], updatedAt: string, windowDays: number) {
  const toDay = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000;
  const updatedDay = toDay(updatedAt);
  const firstDay = updatedDay - windowDays + 1;
  const sortedDays = postDates
    .map(toDay)
    .filter((day) => day >= firstDay && day <= updatedDay)
    .sort((left, right) => right - left);
  const longestGapDays = sortedDays.slice(1).reduce(
    (longest, day, index) => Math.max(longest, sortedDays[index] - day - 1),
    0,
  );
  return {
    dailyAverage: Number((sortedDays.length / windowDays).toFixed(2)),
    weeklyAverage: Number(((sortedDays.length / windowDays) * 7).toFixed(1)),
    longestGapDays,
  };
}

export function deriveEngagementRate(samples: readonly EngagementSample[]) {
  const eligible = samples.filter(
    (sample): sample is EngagementSample & { comments: number } =>
      sample.audience > 0 && sample.comments !== null,
  );
  if (eligible.length === 0) return { value: null, sampleSize: 0 };

  const totalRate = eligible.reduce(
    (sum, sample) => sum + ((sample.likes + sample.comments) / sample.audience) * 100,
    0,
  );
  return { value: Number((totalRate / eligible.length).toFixed(2)), sampleSize: eligible.length };
}

export function engagementResultForCreator(creator: CreatorFixture) {
  return deriveEngagementRate(ENGAGEMENT_SAMPLES[creator.id] ?? []);
}
