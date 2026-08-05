import { Link } from "react-router-dom";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import type { CreatorFixture, ProposalStatus } from "./fixtures";
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
  const isInstagram = creator.profile.platform === "Instagram";
  const primaryMetrics = isInstagram
    ? [
        { label: "평균 반응", value: creator.profile.averageReactions },
        { label: "팔로워", value: creator.profile.followers },
      ]
    : [
        { label: "평균 조회", value: creator.profile.averageViews },
        { label: "구독자", value: creator.profile.followers },
      ];

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
          <div className="fuma-creator-card__profile">
            <span className="fuma-creator-card__portrait">
              <CreatorProfilePhoto
                creatorName={creator.name}
                src={creator.profile.profileImageUrl}
              />
              <span className="fuma-creator-card__platform-badge">
                <PlatformIcon platform={creator.profile.platform} />
              </span>
            </span>
          </div>
          <header className="fuma-creator-card__identity">
            <div className="fuma-creator-card__identity-copy">
              <h2 className="fuma-creator-card__name">{creator.name}</h2>
              <p className="fuma-creator-card__handle">{creator.profile.handle}</p>
              <p className="fuma-creator-card__categories">
                {creator.categories.join(" / ")}
                <span>콘텐츠 {creator.contentCount}개</span>
              </p>
            </div>
          </header>
          <dl className="fuma-creator-card__metrics">
            {primaryMetrics.map((metric, index) => (
              <div className="fuma-creator-card__metric" key={metric.label}>
                <dt>
                  {index === 0 ? (
                    <span className="hsas-visually-hidden">팔로워·구독자</span>
                  ) : null}
                  {metric.label}
                </dt>
                <dd>{compactNumber.format(metric.value)}</dd>
              </div>
            ))}
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
