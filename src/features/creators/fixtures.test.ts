import { CREATORS, type CreatorPlatform } from "./fixtures";

// @ts-expect-error Facebook is not a supported creator profile platform.
const unsupportedPlatform: CreatorPlatform = "Facebook";
void unsupportedPlatform;

test("stores one Instagram or YouTube profile per creator", () => {
  expect(CREATORS.map(({ id, profile }) => ({ id, ...profile }))).toEqual([
    {
      id: "cr-001",
      platform: "Instagram",
      handle: "@seo.yeon",
      followers: 82_400,
      averageViews: 48_200,
      averageReactions: 3_278,
      profileImageUrl: "/creator-media/cr-001-profile.jpg",
    },
    {
      id: "cr-002",
      platform: "YouTube",
      handle: "도윤의 집밥",
      followers: 76_200,
      averageViews: 26_800,
      averageReactions: 1_320,
      profileImageUrl: "/creator-media/cr-002-profile.jpg",
    },
    {
      id: "cr-003",
      platform: "Instagram",
      handle: "@zia.trip",
      followers: 32_700,
      averageViews: 17_900,
      averageReactions: 980,
      profileImageUrl: "/creator-media/cr-003-profile.jpg",
    },
    {
      id: "cr-004",
      platform: "Instagram",
      handle: "@today_haneul",
      followers: 486_000,
      averageViews: 154_200,
      averageReactions: 12_860,
      profileImageUrl: "/creator-media/cr-004-profile.jpg",
    },
  ]);

  for (const creator of CREATORS) {
    expect(creator).not.toHaveProperty("platforms");
    expect(creator).not.toHaveProperty("channels");
    expect(creator).not.toHaveProperty("followers");
    expect(creator).not.toHaveProperty("portrait");
    creator.featuredContents.forEach((content) =>
      expect(content).not.toHaveProperty("platform"),
    );
  }
});
