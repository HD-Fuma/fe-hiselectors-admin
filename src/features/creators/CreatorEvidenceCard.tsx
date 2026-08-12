import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import type { CreatorFixture } from "./fixtures";
import { CreatorMediaMosaic } from "./CreatorMediaMosaic";
import { CreatorCardProfileHeader } from "./CreatorCardProfileHeader";
import { CreatorKeywordTags } from "./CreatorKeywordTags";

// eslint-disable-next-line react-refresh/only-export-components
export const compactNumber = new Intl.NumberFormat("ko-KR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// eslint-disable-next-line react-refresh/only-export-components
export function proposalAction(creator: CreatorFixture) {
  return {
    label: "제안 보내기",
    to: `/proposals/new?creator=${creator.id}`,
  };
}

export function CreatorEvidenceCard({
  actionFor = proposalAction,
  creator,
  onOpen = () => undefined,
  onSelect = () => undefined,
  selected = false,
  selectionMode = false,
}: {
  actionFor?: (creator: CreatorFixture) => { label: string; to: string };
  creator: CreatorFixture;
  onOpen?: (creator: CreatorFixture) => void;
  onSelect?: (creatorId: string) => void;
  selected?: boolean;
  selectionMode?: boolean;
}) {
  const action = actionFor(creator);
  const isInstagram = creator.profile.platform === "Instagram";
  const audienceLabel = isInstagram ? "팔로워" : "구독자";
  const displayName = creator.profile.handle;

  return (
    <li className="fuma-creator-card" data-selected={selected} role="listitem">
      {selectionMode ? (
        <span
          aria-hidden="true"
          className="fuma-creator-card__selection-indicator"
          data-selected={selected}
        >
          <Check size={14} strokeWidth={2.5} />
        </span>
      ) : null}
      <article
        aria-label={`${displayName} 크리에이터 카드`}
        className="fuma-creator-card__article"
        onClick={() => selectionMode ? onSelect(creator.id) : onOpen(creator)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (selectionMode) onSelect(creator.id);
            else onOpen(creator);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <CreatorCardProfileHeader
          badgeLabel={creator.category}
          displayName={displayName}
          platform={creator.profile.platform}
          profileImageUrl={creator.profile.profileImageUrl}
        />
        <CreatorMediaMosaic contents={creator.featuredContents} creatorName={displayName} />
        <section aria-label="주요 지표" className="fuma-creator-card__channel-info">
          <dl>
            <div>
              <dt>{audienceLabel}</dt>
              <dd>{compactNumber.format(creator.profile.followers)}명</dd>
            </div>
            <div>
              <dt>평균 좋아요수</dt>
              <dd>{compactNumber.format(creator.profile.averageReactions)}개</dd>
            </div>
            <div>
              <dt>ER 지수</dt>
              <dd>{creator.profile.engagementRate.toFixed(1)}%</dd>
            </div>
            <div className="fuma-creator-card__keyword-row">
              <dt>키워드</dt>
              <dd><CreatorKeywordTags keywords={creator.keywords} /></dd>
            </div>
            <div>
              <dt>최근 활동일</dt>
              <dd>{creator.recentActivity}</dd>
            </div>
          </dl>
        </section>
        <footer className="fuma-creator-card__actions">
          {selectionMode ? (
            <span className={`fuma-creator-card__selection-state${selected ? " is-selected" : ""}`}>
              {selected ? <Check aria-hidden="true" size={14} strokeWidth={2.5} /> : null}
              {selected ? "선택됨" : "선택하기"}
            </span>
          ) : (
            <Link
              aria-label={`${displayName} 제안하기`}
              className="fuma-creator-card__action fuma-creator-card__action--primary"
              onClick={(event) => event.stopPropagation()}
              to={action.to}
            >
              제안하기
            </Link>
          )}
        </footer>
      </article>
    </li>
  );
}
