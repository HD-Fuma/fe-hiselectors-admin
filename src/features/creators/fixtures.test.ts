import { CREATORS, type CreatorPlatform } from "./fixtures";

// @ts-expect-error Facebook is not a supported creator profile platform.
const unsupportedPlatform: CreatorPlatform = "Facebook";
void unsupportedPlatform;

test("stores one Instagram or YouTube profile per creator", () => {
  expect(CREATORS).toHaveLength(70);
  expect(new Set(CREATORS.map(({ id }) => id)).size).toBe(CREATORS.length);

  expect(CREATORS.slice(0, 4).map(({ id, profile }) => ({ id, ...profile }))).toEqual([
    {
      id: "cr-001",
      platform: "Instagram",
      handle: "@seo.yeon",
      profileUrl: "https://www.instagram.com/seo.yeon",
      followers: 82_400,
      averageViews: 48_200,
      averageReactions: 3_278,
      engagementRate: 4,
      profileImageUrl: "/creator-media/kr-cr-001-profile.jpg",
    },
    {
      id: "cr-002",
      platform: "YouTube",
      handle: "도윤의 집밥",
      profileUrl: "https://www.youtube.com/@doyoonhome",
      followers: 76_200,
      averageViews: 26_800,
      averageReactions: 1_320,
      engagementRate: 1.7,
      profileImageUrl: "/creator-media/kr-cr-002-profile.jpg",
    },
    {
      id: "cr-003",
      platform: "Instagram",
      handle: "@zia.trip",
      profileUrl: "https://www.instagram.com/zia.trip",
      followers: 32_700,
      averageViews: 17_900,
      averageReactions: 980,
      engagementRate: 3,
      profileImageUrl: "/creator-media/kr-cr-003-profile.jpg",
    },
    {
      id: "cr-004",
      platform: "Instagram",
      handle: "@today_haneul",
      profileUrl: "https://www.instagram.com/today_haneul",
      followers: 486_000,
      averageViews: 154_200,
      averageReactions: 12_860,
      engagementRate: 2.6,
      profileImageUrl: "/creator-media/kr-cr-004-profile.jpg",
    },
  ]);

  expect(CREATORS.slice(0, 4).map(({ id, featuredContents }) => ({
    id,
    thumbnailUrls: featuredContents.map(({ thumbnailUrl }) => thumbnailUrl),
  }))).toEqual([
    {
      id: "cr-001",
      thumbnailUrls: [
        "/creator-media/kr-cr-001-01.jpg",
        "/creator-media/kr-cr-001-02.jpg",
        "/creator-media/kr-cr-001-03.jpg",
      ],
    },
    {
      id: "cr-002",
      thumbnailUrls: [
        "/creator-media/kr-cr-002-01.jpg",
        "/creator-media/kr-cr-002-02.jpg",
        "/creator-media/kr-cr-002-03.jpg",
      ],
    },
    {
      id: "cr-003",
      thumbnailUrls: [
        "/creator-media/kr-cr-003-01.jpg",
        "/creator-media/kr-cr-003-02.jpg",
        "/creator-media/kr-cr-003-03.jpg",
      ],
    },
    {
      id: "cr-004",
      thumbnailUrls: [
        "/creator-media/kr-cr-004-01.jpg",
        "/creator-media/kr-cr-004-02.jpg",
        "/creator-media/kr-cr-004-03.jpg",
      ],
    },
  ]);

  for (const creator of CREATORS) {
    expect(creator).toMatchObject({ keywords: expect.any(Array) });
    expect(creator.keywords.length).toBeGreaterThan(0);
    expect(creator.profile).toMatchObject({
      profileUrl: expect.stringMatching(/^https:\/\//),
      engagementRate: expect.any(Number),
    });
    expect(creator.profile.engagementRate).toBeGreaterThan(0);
    expect(creator).not.toHaveProperty("platforms");
    expect(creator).not.toHaveProperty("channels");
    expect(creator).not.toHaveProperty("followers");
    expect(creator).not.toHaveProperty("portrait");
    creator.featuredContents.forEach((content) =>
      expect(content).not.toHaveProperty("platform"),
    );
  }
});
