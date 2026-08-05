import type { StatusPillProps } from "../../components/ui/StatusPill";
import type { CreatorFixture, ProposalStatus } from "./fixtures";

export const compactNumber = new Intl.NumberFormat("ko-KR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function averageViews(creator: CreatorFixture) {
  if (creator.channels.length === 0) {
    return 0;
  }

  const totalViews = creator.channels.reduce((sum, item) => sum + item.views, 0);
  return Math.round(totalViews / creator.channels.length);
}

export function engagementRate(creator: CreatorFixture) {
  const views = creator.channels.reduce((sum, item) => sum + item.views, 0);

  if (views === 0) {
    return 0;
  }

  const reactions = creator.channels.reduce((sum, item) => sum + item.reactions, 0);
  return (reactions / views) * 100;
}

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
