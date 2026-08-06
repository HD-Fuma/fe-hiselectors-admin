import type { ReactNode } from "react";
import type { CreatorPlatform } from "./fixtures";

const iconPaths: Record<CreatorPlatform, ReactNode> = {
  Instagram: (
    <>
      <rect
        fill="none"
        height="15"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        width="15"
        x="2.5"
        y="2.5"
      />
      <circle
        cx="10"
        cy="10"
        fill="none"
        r="3.3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="14.6" cy="5.5" fill="currentColor" r="1.1" />
    </>
  ),
  YouTube: (
    <>
      <path d="M18.2 6.05a2.52 2.52 0 0 0-1.77-1.78C14.87 3.85 10 3.85 10 3.85s-4.87 0-6.43.42A2.52 2.52 0 0 0 1.8 6.05C1.38 7.61 1.38 10 1.38 10s0 2.39.42 3.95a2.52 2.52 0 0 0 1.77 1.78c1.56.42 6.43.42 6.43.42s4.87 0 6.43-.42a2.52 2.52 0 0 0 1.77-1.78c.42-1.56.42-3.95.42-3.95s0-2.39-.42-3.95Z" fill="currentColor" />
      <path d="m8.4 12.92 4.05-2.92L8.4 7.08v5.84Z" fill="white" />
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
