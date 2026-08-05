import { Link } from "react-router-dom";
import { type StatusPillProps } from "../../components/ui/StatusPill";
import type { CreatorFixture, ProposalStatus } from "./fixtures";
import { CreatorMediaMosaic } from "./CreatorMediaMosaic";
import { CreatorProfilePhoto } from "./CreatorArtwork";
import { PlatformIcon } from "./PlatformIcon";
import { engagementResultForCreator } from "./CreatorAnalysisReport";

// eslint-disable-next-line react-refresh/only-export-components
export const compactNumber = new Intl.NumberFormat("ko-KR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// eslint-disable-next-line react-refresh/only-export-components
export function proposalAction(creator: CreatorFixture) {
  return {
    label: "제안하기",
    to: `/creators/${creator.id}#proposal`,
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
  const engagement = engagementResultForCreator(creator);
  const primaryMetrics = [
    { label: isInstagram ? "팔로워" : "구독자", value: creator.profile.followers },
    { label: "ER", value: engagement.value === null ? "집계 불가" : `${engagement.value.toFixed(1)}%` },
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
              </p>
              <div aria-label="키워드" className="fuma-creator-card__keywords">
                {creator.keywords.map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
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
                <dd>{typeof metric.value === "number" ? compactNumber.format(metric.value) : metric.value}</dd>
              </div>
            ))}
          </dl>
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
