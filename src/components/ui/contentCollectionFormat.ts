export type ContentCollectionFormat =
  | "유튜브 롱폼"
  | "유튜브 쇼츠"
  | "인스타 릴스"
  | "인스타 피드"
  | "인스타 이미지";

export function contentCollectionFormatKey(format: ContentCollectionFormat) {
  if (format === "유튜브 롱폼") return "youtube-long";
  if (format === "유튜브 쇼츠") return "youtube-shorts";
  if (format === "인스타 릴스") return "instagram-reels";
  if (format === "인스타 피드") return "instagram-feed";
  return "instagram-image";
}
