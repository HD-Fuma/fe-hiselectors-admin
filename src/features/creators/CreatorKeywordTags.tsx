export function CreatorKeywordTags({
  keywords,
  limit = 3,
}: {
  keywords: readonly string[];
  limit?: number;
}) {
  return (
    <span className="fuma-creator-keyword-tags">
      {keywords.slice(0, limit).map((keyword) => <span key={keyword}>{keyword}</span>)}
    </span>
  );
}
