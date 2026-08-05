import { Link } from "react-router-dom";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import type { CreatorFixture, ProposalStatus } from "./fixtures";
import { CreatorMediaMosaic } from "./CreatorMediaMosaic";
import { CreatorPortrait } from "./CreatorArtwork";
import { PlatformIcon } from "./PlatformIcon";

// eslint-disable-next-line react-refresh/only-export-components
export const compactNumber = new Intl.NumberFormat("ko-KR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// eslint-disable-next-line react-refresh/only-export-components
export function averageViews(creator: CreatorFixture) {
  if (creator.channels.length === 0) {
    return 0;
  }

  const totalViews = creator.channels.reduce((sum, item) => sum + item.views, 0);
  return Math.round(totalViews / creator.channels.length);
}

// eslint-disable-next-line react-refresh/only-export-components
export function engagementRate(creator: CreatorFixture) {
  const views = creator.channels.reduce((sum, item) => sum + item.views, 0);

  if (views === 0) {
    return 0;
  }

  const reactions = creator.channels.reduce((sum, item) => sum + item.reactions, 0);
  return (reactions / views) * 100;
}

// eslint-disable-next-line react-refresh/only-export-components
export function proposalAction(creator: CreatorFixture) {
  if (creator.proposalStatus === "미제안") {
    return {
      label: "영입 제안",
      to: `/creators/${creator.id}#proposal`,
    };
  }

  if (creator.proposalStatus === "발송 실패") {
    return {
      label: "다시 제안",
      to: `/creators/${creator.id}#proposal`,
    };
  }

  return {
    label: "제안 이력",
    to: `/proposals?creator=${creator.id}`,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function proposalTone(
  status: ProposalStatus | "미제안",
): NonNullable<StatusPillProps["tone"]> {
  if (status === "발송 완료" || status === "셀렉터스 전환") {
    return "approved";
  }

  if (status === "발송 대기") {
    return "pending";
  }

  if (status === "발송 실패") {
    return "rejected";
  }

  return "neutral";
}

export function CreatorEvidenceCard({ creator }: { creator: CreatorFixture }) {
  const action = proposalAction(creator);
  const handle = creator.channels[0]?.handle ?? "채널 정보 없음";

  return (
    <li className="fuma-creator-card" role="listitem">
      <article
        aria-label={`${creator.name} 크리에이터 카드`}
        className="fuma-creator-card__article"
      >
        <CreatorMediaMosaic
          contents={creator.featuredContents}
          creatorName={creator.name}
        />
        <div className="fuma-creator-card__body">
          <header className="fuma-creator-card__identity">
            <span className="fuma-creator-card__portrait">
              <CreatorPortrait creatorName={creator.name} variant={creator.portrait} />
            </span>
            <div className="fuma-creator-card__identity-copy">
              <h2 className="fuma-creator-card__name">{creator.name}</h2>
              <p className="fuma-creator-card__handle">{handle}</p>
              <p className="fuma-creator-card__categories">
                {creator.categories.join(" / ")}
                <span>콘텐츠 {creator.contentCount}개</span>
              </p>
            </div>
            <ul
              aria-label={`${creator.name} 플랫폼`}
              className="fuma-creator-card__platforms"
              role="list"
            >
              {creator.platforms.map((platform) => (
                <li key={platform}>
                  <PlatformIcon platform={platform} />
                </li>
              ))}
            </ul>
          </header>
          <dl className="fuma-creator-card__metrics">
            <div className="fuma-creator-card__metric">
              <dt>팔로워·구독자</dt>
              <dd>{compactNumber.format(creator.followers)}</dd>
            </div>
            <div className="fuma-creator-card__metric">
              <dt>평균 조회</dt>
              <dd>{compactNumber.format(averageViews(creator))}</dd>
            </div>
            <div className="fuma-creator-card__metric">
              <dt>평균 반응률</dt>
              <dd>{engagementRate(creator).toFixed(1)}%</dd>
            </div>
          </dl>
          <div className="fuma-creator-card__meta">
            <strong className="fuma-creator-card__ai">
              {creator.aiReport.fitnessScore === null
                ? "생성 대기"
                : `AI 적합도 ${creator.aiReport.fitnessScore}점`}
            </strong>
            <span>{creator.tier}</span>
            <StatusPill tone={proposalTone(creator.proposalStatus)}>
              {creator.proposalStatus}
            </StatusPill>
            <span className="fuma-creator-card__recent">
              최근 활동일 {creator.recentActivity}
            </span>
          </div>
        </div>
        <footer className="fuma-creator-card__actions">
          <Link
            aria-label={`${creator.name} 상세 보기`}
            className="fuma-creator-card__action"
            to={`/creators/${creator.id}`}
          >
            상세 보기
          </Link>
          <Link
            aria-label={`${creator.name} ${action.label}`}
            className="fuma-creator-card__action fuma-creator-card__action--primary"
            to={action.to}
          >
            {action.label}
          </Link>
        </footer>
      </article>
    </li>
  );
}
