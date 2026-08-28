import { Heart, MessageCircle, MoreHorizontal, Music2, Send, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { CreatorProfilePhoto } from "../../components/ui/CreatorProfilePhoto";

interface InstagramReelsCardProps {
  avatarUrl: string;
  children: ReactNode;
  creatorName: string;
  handle: string;
}

export function InstagramReelsCard({
  avatarUrl,
  children,
  creatorName,
  handle,
}: InstagramReelsCardProps) {
  return (
    <>
      <div
        aria-label="릴스 반응"
        className="fuma-platform-inspection-frame__shorts-actions fuma-platform-inspection-frame__reels-actions"
        role="group"
      >
        <button aria-label="좋아요" type="button">
          <Heart aria-hidden="true" size={25} />
          <span>좋아요</span>
        </button>
        <button aria-label="댓글" type="button">
          <MessageCircle aria-hidden="true" size={25} />
          <span>댓글</span>
        </button>
        <button aria-label="공유" type="button">
          <Send aria-hidden="true" size={24} />
          <span>공유</span>
        </button>
        <button aria-label="더보기" type="button">
          <MoreHorizontal aria-hidden="true" size={25} />
          <span>더보기</span>
        </button>
        <span aria-hidden="true" className="fuma-platform-inspection-frame__reels-audio-cover">
          {avatarUrl ? (
            <CreatorProfilePhoto creatorName={creatorName} src={avatarUrl} />
          ) : (
            <Music2 size={18} />
          )}
        </span>
      </div>
      <div className="fuma-platform-inspection-frame__shorts-overlay fuma-platform-inspection-frame__reels-overlay">
        <div className="fuma-platform-inspection-frame__shorts-channel fuma-platform-inspection-frame__reels-channel">
          <span className="fuma-platform-inspection-frame__avatar">
            {avatarUrl ? (
              <CreatorProfilePhoto creatorName={creatorName} src={avatarUrl} />
            ) : (
              <UserRound
                aria-label={`${creatorName} 프로필 이미지 없음`}
                role="img"
                size={19}
              />
            )}
          </span>
          <strong>{handle}</strong>
        </div>
        {children}
      </div>
    </>
  );
}
