import type { CreatorMediaVisual, CreatorPortraitVariant } from "./fixtures";

const portraitPalettes: Record<
  CreatorPortraitVariant,
  readonly [string, string, string, string]
> = {
  sage: ["#dfe9df", "#55766a", "#f1c9a8", "#303c38"],
  navy: ["#dce5ef", "#29425d", "#d6a47d", "#182635"],
  coral: ["#f4dfda", "#b85f55", "#f0c1a2", "#6b3938"],
  amber: ["#f3e7cf", "#ae7136", "#d89a6a", "#4b3429"],
};

const mediaPalettes: Record<
  CreatorMediaVisual,
  readonly [string, string, string, string]
> = {
  beauty: ["#f6d9df", "#b94f70", "#fff4ef", "#713249"],
  fashion: ["#dbe4ef", "#385b7c", "#f5e0c6", "#24394f"],
  skincare: ["#dcece8", "#43877c", "#f7f1db", "#28584f"],
  cooking: ["#efe0d2", "#9b5437", "#f6c766", "#613527"],
  coffee: ["#eadfd6", "#76503c", "#d9ad78", "#493327"],
  table: ["#e3ead7", "#6e7b4a", "#f4d9b2", "#48512f"],
  coast: ["#d9ebef", "#2e7d88", "#f3d9aa", "#205761"],
  city: ["#dfe2e9", "#59647b", "#d9aa78", "#30394b"],
  packing: ["#ece1d5", "#a0603e", "#6b8796", "#573825"],
  dessert: ["#f5dfd6", "#be6754", "#f2c66d", "#793d34"],
};

export function CreatorPortrait({
  creatorName,
  variant,
}: {
  creatorName: string;
  variant: CreatorPortraitVariant;
}) {
  const [background, clothes, skin, hair] = portraitPalettes[variant];

  return (
    <svg aria-label={`${creatorName} 프로필 이미지`} role="img" viewBox="0 0 96 96">
      <rect fill={background} height="96" width="96" />
      <path d="M12 96c4-23 18-35 36-35s32 12 36 35H12Z" fill={clothes} />
      <circle cx="48" cy="41" fill={skin} r="23" />
      <path
        d="M26 41c0-19 9-29 24-29 16 0 25 12 23 31-5-6-10-13-15-21-8 9-18 14-32 19Z"
        fill={hair}
      />
      <circle cx="40" cy="43" fill={hair} r="1.7" />
      <circle cx="56" cy="43" fill={hair} r="1.7" />
      <path
        d="M41 53c4 3 10 3 14 0"
        fill="none"
        stroke={hair}
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function CreatorMediaArtwork({
  creatorName,
  title,
  visual,
}: {
  creatorName: string;
  title: string;
  visual: CreatorMediaVisual;
}) {
  const [background, primary, accent, foreground] = mediaPalettes[visual];

  return (
    <svg
      aria-label={`${creatorName} 인기 콘텐츠: ${title}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      viewBox="0 0 180 150"
    >
      <rect fill={background} height="150" width="180" />
      <circle cx="139" cy="34" fill={accent} opacity=".82" r="34" />
      <rect
        fill={primary}
        height="98"
        opacity=".92"
        rx="22"
        transform="rotate(16 44 85)"
        width="42"
        x="23"
        y="36"
      />
      <rect
        fill={foreground}
        height="74"
        opacity=".32"
        rx="14"
        transform="rotate(-12 124 91)"
        width="54"
        x="97"
        y="54"
      />
      <path
        d="M0 126c32-25 54-31 79-20 26 12 50 11 101-16v60H0v-24Z"
        fill={foreground}
        opacity=".88"
      />
    </svg>
  );
}
