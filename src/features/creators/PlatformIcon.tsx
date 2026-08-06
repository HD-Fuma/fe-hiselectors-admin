import type { ReactNode } from "react";
import type { CreatorPlatform } from "./fixtures";

const iconPaths: Record<CreatorPlatform, ReactNode> = {
  Instagram: (
    <>
      <rect
        fill="none"
        height="13"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        width="13"
        x="3.5"
        y="3.5"
      />
      <circle
        cx="10"
        cy="10"
        fill="none"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="14.4" cy="5.7" fill="currentColor" r="1" />
    </>
  ),
  YouTube: (
    <>
      <rect fill="currentColor" height="12" rx="3.5" width="18" x="1" y="4" />
      <path d="m8 7 5 3-5 3V7Z" fill="white" />
    </>
  ),
};

export function PlatformIcon({
  decorative = false,
  platform,
}: {
  decorative?: boolean;
  platform: CreatorPlatform;
}) {
  return (
    <span
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : `${platform} 플랫폼`}
      className={`fuma-platform-icon fuma-platform-icon--${platform.toLowerCase()}`}
      role={decorative ? undefined : "img"}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20">
        {iconPaths[platform]}
      </svg>
    </span>
  );
}
