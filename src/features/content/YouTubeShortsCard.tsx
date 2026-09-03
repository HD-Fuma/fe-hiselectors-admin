import { MessageCircle, Share2, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { CreatorProfilePhoto } from "../../components/ui/CreatorProfilePhoto";

interface YouTubeShortsCardProps {
  accountName: string;
  avatarUrl: string;
  children: ReactNode;
  creatorName: string;
}

export function YouTubeShortsCard({
  accountName,
  avatarUrl,
  children,
  creatorName,
}: YouTubeShortsCardProps) {
  return (
    <>
      <div className="fuma-platform-inspection-frame__shorts-brand">
        <PlatformIcon platform="YouTube" />
        <strong>Shorts</strong>
      </div>
      <div
        aria-label="쇼츠 반응"
        className="fuma-platform-inspection-frame__shorts-actions"
        role="group"
      >
        <button aria-label="좋아요" type="button">
          <ThumbsUp aria-hidden="true" size={22} />
          <span>좋아요</span>
        </button>
        <button aria-label="싫어요" type="button">
          <ThumbsDown aria-hidden="true" size={22} />
          <span>싫어요</span>
        </button>
        <button aria-label="댓글" type="button">
          <MessageCircle aria-hidden="true" size={22} />
          <span>댓글</span>
        </button>
        <button aria-label="공유" type="button">
          <Share2 aria-hidden="true" size={22} />
          <span>공유</span>
        </button>
      </div>
      <div className="fuma-platform-inspection-frame__shorts-overlay">
        <div className="fuma-platform-inspection-frame__shorts-channel">
          <span className="fuma-platform-inspection-frame__avatar">
            {avatarUrl ? (
              <CreatorProfilePhoto creatorName={creatorName} src={avatarUrl} />
            ) : (
              <UserRound
                aria-label={`${creatorName} 프로필 이미지 없음`}
                role="img"
                size={18}
              />
            )}
          </span>
          <strong>{accountName}</strong>
          <button type="button">구독</button>
        </div>
        {children}
      </div>
    </>
  );
}
