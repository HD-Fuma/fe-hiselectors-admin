import { Link } from "react-router-dom";
import type { CreatorFixture } from "./fixtures";
import { CreatorMediaMosaic } from "./CreatorMediaMosaic";
import { CreatorProfilePhoto } from "./CreatorArtwork";
import { PlatformIcon } from "./PlatformIcon";

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
  const channelScore = creator.aiReport.fitnessScore === null ? "-" : `${creator.aiReport.fitnessScore}점`;

  return (
    <li className="fuma-creator-card" data-selected={selected} role="listitem">
      <article
        aria-label={`${creator.name} 크리에이터 카드`}
        className="fuma-creator-card__article"
        onClick={() => selectionMode ? onSelect(creator.id) : onOpen(creator)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectionMode ? onSelect(creator.id) : onOpen(creator);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <header className="fuma-creator-card__header">
          <span className="fuma-creator-card__portrait">
            <CreatorProfilePhoto
              creatorName={creator.name}
              src={creator.profile.profileImageUrl}
            />
          </span>
          <div className="fuma-creator-card__identity">
            <div className="fuma-creator-card__badges">
              <span>{creator.category}</span>
              <span className="fuma-creator-card__platform">
                <PlatformIcon platform={creator.profile.platform} />
                {creator.profile.platform}
              </span>
            </div>
            <h2 className="fuma-creator-card__name">{creator.name} <span aria-hidden="true">›</span></h2>
          </div>
        </header>
        <CreatorMediaMosaic contents={creator.featuredContents} creatorName={creator.name} />
        <section aria-label="채널 정보" className="fuma-creator-card__channel-info">
          <h3>채널 정보</h3>
          <dl>
            <div>
              <dt>채널 스코어</dt>
              <dd className="fuma-creator-card__score">{channelScore}</dd>
            </div>
            <div>
              <dt>채널 카테고리</dt>
              <dd>{creator.category}</dd>
            </div>
            <div>
              <dt>{audienceLabel}</dt>
              <dd>{compactNumber.format(creator.profile.followers)}명</dd>
            </div>
            <div>
              <dt>평균 좋아요수</dt>
              <dd>{compactNumber.format(creator.profile.averageReactions)}개</dd>
            </div>
          </dl>
        </section>
        <footer className="fuma-creator-card__actions">
          <Link
            aria-label={`${creator.name} 제안하기`}
            className="fuma-creator-card__action fuma-creator-card__action--primary"
            onClick={(event) => event.stopPropagation()}
            to={action.to}
          >
            제안하기
          </Link>
        </footer>
      </article>
    </li>
  );
}
