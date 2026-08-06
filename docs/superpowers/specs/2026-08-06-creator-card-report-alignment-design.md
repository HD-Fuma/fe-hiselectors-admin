# Creator Card and Analysis Report Alignment

## Purpose

Align the creator-pool UI with the updated functional specification. The pool card is a compact discovery surface; it shows only the evidence needed to compare creators before opening the detail report.

## Card contract

Each creator card represents exactly one SNS profile: Instagram or YouTube.

1. **Representative posts** — keep three square thumbnails at the top under the accessible label `대표 게시글`; each tile retains its image/video cue.
2. **Identity** — overlapping profile photo with a single platform badge, creator name, and platform-native account ID/channel name.
3. **Analysis labels** — category and keyword chips. Categories use the current business taxonomy: 뷰티, 패션, 푸드, 리빙/라이프, 유아동/패밀리, 컬처/서비스, 스포츠/레저, 여행, 반려생활, 아울렛.
4. **Comparable metrics** — exactly two visible metrics: 팔로워 (Instagram) or 구독자 (YouTube), and ER. Values use the same compact-number and percentage formats across cards.
5. **Out of card** — tier, AI fit score, and AI-report state do not belong in the discovery card. Proposal actions remain because the administrator specification includes creator proposal, but the card must not claim unsupported delivery-channel behavior.

## Report measurement contract

All collected-content aggregates are explicitly scoped to the report’s `updatedAt` date and a preceding 90-day analysis window.

- **SNS account information:** platform, username/channel name, public profile URL.
- **Follower/subscriber count:** snapshot as of `updatedAt`.
- **Cadence:** `collectedPosts / 90 days`, weekly average, collected-post count, and longest publication gap.
- **Counts:** distinguish `public content count` (channel-level total when available) from `collected posts in analysis window` (90 days), rather than using ambiguous `content count`.
- **Last post date:** latest public content inside the collection result.
- **Average views/likes/comments:** calculate only on eligible media types and label unavailable values instead of treating them as zero. Views are not comparable for Instagram image posts that do not expose a view metric.
- **Format mix:** platform-native types, e.g. YouTube Shorts/long-form and Instagram feed image/feed video/Reels.
- **ER (Engagement Rate):** primary cross-platform definition is the average of eligible post-level `(likes + comments) / followerOrSubscriberSnapshot × 100`. Do not include shares/saves in the primary cross-platform number because those fields are not consistently available across both APIs; show them as platform-specific supplemental interactions when available. Exclude zero-audience records from calculation and label the sample size.

## AI analysis contract

AI analysis uses the available text, audio transcription (STT), image OCR, and visual/video-frame analysis. Every AI-produced claim for summary, category, keyword, brand collaboration, style, tone, risk, and strengths/cautions includes one or more supporting content URLs. Keyword output is a ranked tag list with optional share percentage only when the method has a defined denominator.

## Selection contract

The first shortlist is Top 2N, ranked by a documented score that multiplies ER by `log(1 + followerOrSubscriberCount)` so audience-scale differences do not dominate. Final Top N applies category-distribution constraints after the score ranking; the quota/rule must be displayed with the selection result rather than implied.

## Acceptance checks

- Card exposes representative posts, profile image, account ID, name, category, keywords, follower/subscriber count, and ER.
- Card does not expose tier or AI fit score.
- Search controls follow the creator-pool spec: keyword, platform, and follower/subscriber range.
- Detail/report terminology follows the measurement contract above.
- Existing sidebar and app shell are unchanged.
