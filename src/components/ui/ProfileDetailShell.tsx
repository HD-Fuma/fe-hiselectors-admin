import { useState, type ReactNode } from "react";
import { PlatformIcon, type SocialPlatform } from "../social/PlatformIcon";
import { assetUrl } from "../../lib/assetUrl";
import { EmptyState } from "./EmptyState";
import { SidePanel } from "./SidePanel";

export interface ProfileDetailGalleryItem {
  id: string;
  imageUrl: string;
  title: string;
}

export interface ProfileDetailInfoField {
  label: string;
  value: ReactNode;
}

export interface ProfileDetailProfile {
  audienceLabel: string;
  audienceValue: ReactNode;
  contentCount: ReactNode;
  engagementValue: ReactNode;
  gallery: readonly ProfileDetailGalleryItem[];
  handle: string;
  infoFields: readonly ProfileDetailInfoField[];
  name: string;
  platform: SocialPlatform;
  profileImageUrl: string;
  profileUrl: string;
  status: ReactNode;
}

interface ProfileDetailShellProps {
  actionSection: ReactNode;
  children: ReactNode;
  emptyDescription: string;
  emptyRole?: "alert" | "status";
  emptyTitle?: string;
  onClose: () => void;
  profile?: ProfileDetailProfile;
  title: string;
}

function ProfilePhoto({ name, src }: { name: string; src: string }) {
  const resolvedSrc = assetUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !resolvedSrc || failedSrc === resolvedSrc;

  if (failed) {
    return (
      <span aria-label={`${name} 프로필 이미지 없음`} className="fuma-creator-profile-fallback" role="img">
        {name.slice(0, 1)}
      </span>
    );
  }

  return <img alt={`${name} 프로필 이미지`} onError={() => setFailedSrc(resolvedSrc)} src={resolvedSrc} />;
}

function GalleryImage({ item, name }: { item: ProfileDetailGalleryItem; name: string }) {
  const resolvedSrc = assetUrl(item.imageUrl);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !resolvedSrc || failedSrc === resolvedSrc;

  if (failed) {
    return (
      <span aria-label={`${name} 대표 게시글: ${item.title} 이미지 없음`} className="fuma-creator-media__fallback" role="img">
        <span>{item.title}</span>
      </span>
    );
  }

  return <img alt={`${name} 대표 게시글: ${item.title}`} onError={() => setFailedSrc(resolvedSrc)} src={resolvedSrc} />;
}

function ProfileDetailSidebar({
  actionSection,
  profile,
}: {
  actionSection: ReactNode;
  profile: ProfileDetailProfile;
}) {
  return (
    <aside className="fuma-creator-detail-sidebar">
      <section className="fuma-creator-detail-sidebar__profile">
        <div className="fuma-social-profile__identity">
          <div className="fuma-creator-detail-sidebar__portrait">
            <ProfilePhoto name={profile.name} src={profile.profileImageUrl} />
            <PlatformIcon platform={profile.platform} />
          </div>
          <div>
            {profile.status}
            <h2>{profile.name}</h2>
            <a href={profile.profileUrl} rel="noreferrer" target="_blank">{profile.handle} ↗</a>
          </div>
        </div>
        <dl className="fuma-social-profile__metrics">
          <div><dt>게시물</dt><dd>{profile.contentCount}</dd></div>
          <div><dt>{profile.audienceLabel}</dt><dd>{profile.audienceValue}</dd></div>
          <div><dt>ER</dt><dd>{profile.engagementValue}</dd></div>
        </dl>
        <div aria-label="대표 콘텐츠" className="fuma-social-profile__gallery">
          {profile.gallery.map((item) => <GalleryImage item={item} key={item.id} name={profile.name} />)}
        </div>
      </section>

      <section className="fuma-creator-detail-sidebar__info">
        <h3>기본 정보</h3>
        <dl>
          {profile.infoFields.map((field) => (
            <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>
          ))}
        </dl>
      </section>

      {actionSection}
    </aside>
  );
}

export function ProfileDetailShell({
  actionSection,
  children,
  emptyDescription,
  emptyRole,
  emptyTitle = "대상을 찾을 수 없습니다",
  onClose,
  profile,
  title,
}: ProfileDetailShellProps) {
  return (
    <SidePanel onClose={onClose} title={title}>
      <div className="fuma-detail-panel__content fuma-creator-detail-page">
        {profile ? (
          <div className="fuma-creator-detail-workspace">
            <ProfileDetailSidebar actionSection={actionSection} profile={profile} />
            <main className="fuma-creator-detail-main">{children}</main>
          </div>
        ) : (
          <div aria-live={emptyRole === "status" ? "polite" : undefined} role={emptyRole}>
            <EmptyState description={emptyDescription} title={emptyTitle} />
          </div>
        )}
      </div>
    </SidePanel>
  );
}
