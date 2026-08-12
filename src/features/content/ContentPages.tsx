import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Captions,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Images,
  Maximize,
  MessageCircle,
  MoreHorizontal,
  Play,
  Repeat2,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import "../../styles/content-review.css";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, SegmentedControl, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { paginate } from "../../lib/pagination";
import { CreatorCardProfileHeader } from "../../entities/creator/ui/CreatorCardProfileHeader";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { SOCIAL_PLATFORM_FILTER_OPTIONS } from "../../components/social/platforms";
import {
  CONTENT_REVIEWS,
  REVIEW_TYPE_LABELS,
  findContentReviewFixture,
  type ContentAnnotation,
  type ContentAnnotationTarget,
  type ContentFormat,
  type ContentReviewFixture,
  type ContentSnapshot,
  type ReviewStatus,
} from "./fixtures";

const CONTENT_REVIEW_PAGE_SIZE = 20;
type ContentReviewCategory = "신규" | "수정" | "검수 완료";

interface QueueFilterValues {
  keyword: string;
  platform: string;
}

const CONTENT_REVIEW_CATEGORIES: readonly ContentReviewCategory[] = [
  "신규",
  "수정",
  "검수 완료",
];

function contentReviewCategory(content: ContentReviewFixture): ContentReviewCategory {
  if (content.reviewStatus === "승인" || content.reviewStatus === "위반 확정") return "검수 완료";
  if (content.reviewType !== "NEW") return "수정";
  return "신규";
}

function contentReviewCategoryTone(
  category: ContentReviewCategory,
): NonNullable<StatusPillProps["tone"]> {
  if (category === "검수 완료") return "approved";
  if (category === "수정") return "pending";
  return "neutral";
}

function reviewStatusTone(status: ReviewStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "승인") return "approved";
  if (status === "검수 대기") return "pending";
  return "rejected";
}

function contentPlatform(platform: string) {
  return platform === "YouTube" ? "YouTube" : "Instagram";
}

function contentFormatKey(format: ContentFormat) {
  if (format === "유튜브 롱폼") return "youtube-long";
  if (format === "유튜브 쇼츠") return "youtube-shorts";
  if (format === "인스타 릴스") return "instagram-reels";
  if (format === "인스타 피드") return "instagram-feed";
  return "instagram-image";
}

function QueueFilters({
  appliedFilters,
  onApply,
  onReset,
}: {
  appliedFilters: QueueFilterValues;
  onApply: (filters: QueueFilterValues) => void;
  onReset: () => void;
}) {
  const [keyword, setKeyword] = useState(appliedFilters.keyword);
  const [platform, setPlatform] = useState(appliedFilters.platform);

  const applyFilters = () => onApply({ keyword, platform });
  const resetFilters = () => {
    setKeyword("");
    setPlatform("");
    onReset();
  };
  const applyOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFilters();
    }
  };

  return (
    <div className="fuma-operations-search fuma-settlement-search fuma-content-review-search">
      <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
        <FilterField htmlFor="content-review-keyword" label="콘텐츠/작성자">
          <TextInput
            aria-label="콘텐츠/작성자"
            id="content-review-keyword"
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={applyOnEnter}
            placeholder="콘텐츠 ID 또는 작성자"
            value={keyword}
          />
        </FilterField>
        <FilterField htmlFor="content-review-platform" label="플랫폼">
          <Select
            id="content-review-platform"
            onChange={(event) => setPlatform(event.target.value)}
            options={SOCIAL_PLATFORM_FILTER_OPTIONS}
            value={platform}
          />
        </FilterField>
      </SearchPanel>
    </div>
  );
}

const CONTENT_REVIEW_AUTHORS = [
  "김서연", "박도윤", "이지아", "오하늘", "한유진", "정하린", "윤채원", "서민준", "배수아", "임도현",
  "최가은", "문지후", "유나영", "강태윤", "신예린", "장서준", "노아린", "홍지민", "백승현", "송하윤",
] as const;

const CONTENT_REVIEW_SNS_IDS = [
  "@seoyeon", "@doyoon", "@zia", "@haneul", "@yujin", "@harin", "@chaewon", "@minjun", "@sua", "@dohyun",
  "@gaeun", "@jihoo", "@nayoung", "@taeyoon", "@yerin", "@seojun", "@arin", "@jimin", "@seunghyun", "@hayoon",
] as const;

interface ContentReviewTemplateIssue {
  detail: string;
  evidence: string;
  guidance: string;
  source: "본문" | "OCR" | "STT";
  title: string;
}

interface ContentReviewTemplate {
  contentFormat: ContentFormat;
  duration?: string;
  issue?: ContentReviewTemplateIssue;
  mediaKinds: readonly ("이미지" | "동영상")[];
  platform: "Instagram" | "YouTube";
  text: string;
  title: string;
  youtubeVideoId?: string;
}

const CONTENT_REVIEW_TEMPLATES: readonly ContentReviewTemplate[] = [
  {
    contentFormat: "유튜브 롱폼",
    duration: "12:48",
    mediaKinds: ["동영상"],
    platform: "YouTube",
    youtubeVideoId: "7xsLcM1WtAQ",
    title: "7일 입어본 가을 골프웨어 솔직 리뷰",
    text: "본 영상은 현대홈쇼핑의 유료광고를 포함합니다.\n세인트앤드류스 스트레치 패딩 팬츠를 일주일 동안 출근과 라운딩에 입어보고 보온감, 활동성, 사이즈 팁을 정리했습니다.\n00:00 착용 핏 · 03:24 소재와 보온감 · 08:10 코디 팁\n#현대홈쇼핑 #셀렉터스 #골프웨어 #광고",
  },
  {
    contentFormat: "유튜브 롱폼",
    duration: "16:05",
    issue: {
      detail: "비교 근거 없이 보온 성능이 가장 우수하다고 단정한 음성이 포함되어 있습니다.",
      evidence: "이 제품이 무조건 가장 따뜻합니다",
      guidance: "개인적인 착용 경험임을 밝히고 객관적인 비교로 오해될 표현을 수정해 주세요.",
      source: "STT",
      title: "성능 단정 표현",
    },
    mediaKinds: ["동영상"],
    platform: "YouTube",
    youtubeVideoId: "7xsLcM1WtAQ",
    title: "겨울 패딩 3종 직접 비교해 봤습니다",
    text: "두께가 다른 겨울 패딩 세 가지를 같은 날 착용해 핏과 움직임을 비교했습니다. 제품별 장단점과 추천 체형은 영상 후반에 정리해 두었어요.\n#현대홈쇼핑 #패딩비교 #유료광고 #광고",
  },
  {
    contentFormat: "유튜브 롱폼",
    duration: "18:22",
    mediaKinds: ["동영상"],
    platform: "YouTube",
    youtubeVideoId: "7xsLcM1WtAQ",
    title: "민감성 피부의 일주일 홈케어 루틴",
    text: "저녁 세안부터 보습 마무리까지 실제로 사용한 순서대로 보여드립니다. 피부 타입에 따라 사용감은 다를 수 있으니 전성분과 사용법을 함께 확인해 주세요.\n#현대홈쇼핑 #뷰티루틴 #스킨케어 #유료광고 #광고",
  },
  {
    contentFormat: "유튜브 쇼츠",
    duration: "00:34",
    mediaKinds: ["동영상"],
    platform: "YouTube",
    youtubeVideoId: "0i5p6WE58Jc",
    title: "30초 만에 완성하는 출근 룩",
    text: "셔츠 하나로 월요일부터 금요일까지 돌려 입는 세 가지 방법. 저장해 두고 바쁜 아침에 꺼내 보세요.\n#Shorts #출근룩 #데일리코디 #현대홈쇼핑 #광고",
  },
  {
    contentFormat: "유튜브 쇼츠",
    duration: "00:27",
    issue: {
      detail: "검증 가능한 가격 비교 자료 없이 최저가를 단정하고 있습니다.",
      evidence: "오늘이 무조건 최저가",
      guidance: "행사 기간과 실제 할인 조건만 안내하도록 문구를 수정해 주세요.",
      source: "본문",
      title: "최저가 단정 표현",
    },
    mediaKinds: ["동영상"],
    platform: "YouTube",
    youtubeVideoId: "0i5p6WE58Jc",
    title: "주말 특가 핵심만 27초 정리",
    text: "이번 주말 혜택과 쿠폰 적용 방법을 빠르게 정리했어요. 오늘이 무조건 최저가, 프로필의 공식 상품 링크에서 확인하세요.\n#Shorts #주말특가 #현대홈쇼핑 #광고",
  },
  {
    contentFormat: "유튜브 쇼츠",
    duration: "00:41",
    mediaKinds: ["동영상"],
    platform: "YouTube",
    youtubeVideoId: "0i5p6WE58Jc",
    title: "좁은 주방 수납 전후 비교",
    text: "자주 쓰는 조리도구만 남기고 동선을 바꿔 봤어요. 설치 순서와 실제 수납량을 40초 안에 보여드립니다.\n#Shorts #주방정리 #수납팁 #현대홈쇼핑 #광고",
  },
  {
    contentFormat: "인스타 릴스",
    duration: "00:22",
    mediaKinds: ["동영상"],
    platform: "Instagram",
    title: "휴양지 원피스 한 벌로 세 가지 무드",
    text: "햇빛 아래에서는 단독으로, 저녁에는 얇은 셔츠와 함께 입어봤어요. 키 165cm 기준 기장과 움직임도 영상에서 확인해 보세요.\n#여름코디 #원피스 #릴스 #현대홈쇼핑 #셀렉터스 #광고",
  },
  {
    contentFormat: "인스타 릴스",
    duration: "00:31",
    issue: {
      detail: "착용만으로 신체 비율이 크게 달라진다고 오해할 수 있는 음성 표현입니다.",
      evidence: "입기만 하면 다리가 5cm 길어 보여요",
      guidance: "실제 디자인 특징과 개인적인 착용 인상으로 표현해 주세요.",
      source: "STT",
      title: "과장된 착용 효과",
    },
    mediaKinds: ["동영상"],
    platform: "Instagram",
    title: "다리가 길어 보이는 데님 핏 비교",
    text: "스트레이트와 와이드 핏을 같은 상의에 매치해 실루엣 차이를 비교했습니다. 체형과 사이즈에 따라 핏은 달라질 수 있어요.\n#데님코디 #릴스 #현대홈쇼핑 #광고",
  },
  {
    contentFormat: "인스타 릴스",
    duration: "00:26",
    mediaKinds: ["동영상"],
    platform: "Instagram",
    title: "집에서 만드는 복숭아 아이스티",
    text: "복숭아청 한 스푼과 탄산수로 완성한 여름 홈카페 메뉴입니다. 정확한 용량과 보관 방법은 본문 하단에 적어두었어요.\n#홈카페 #여름음료 #릴스 #현대홈쇼핑 #광고",
  },
  {
    contentFormat: "인스타 피드",
    mediaKinds: ["이미지", "이미지", "이미지", "이미지"],
    platform: "Instagram",
    title: "오늘의 라운딩 룩과 실제 착용 후기",
    text: "아침에는 쌀쌀하고 낮에는 따뜻했던 날이라 얇은 이너와 패딩 팬츠를 함께 입었습니다. 2번 사진에서 허리 밴딩, 4번 사진에서 뒷모습 핏을 확인할 수 있어요.\n#라운딩룩 #골프웨어 #현대홈쇼핑 #셀렉터스 #광고",
  },
  {
    contentFormat: "인스타 피드",
    issue: {
      detail: "이미지 문구가 실제 면적 측정 없이 수납 공간이 두 배 증가한다고 표현합니다.",
      evidence: "공간이 두 배 넓어지는 수납법",
      guidance: "수납 전후의 실제 수치나 개인 사용 후기로 표현을 바꿔 주세요.",
      source: "OCR",
      title: "효과 과장 문구",
    },
    mediaKinds: ["이미지", "이미지", "이미지", "이미지", "이미지"],
    platform: "Instagram",
    title: "작은 집을 위한 현관 수납 정리",
    text: "자주 신는 신발과 계절용품을 구분해 현관장을 다시 정리했습니다. 사진을 넘기면 사용한 수납함 규격과 배치 순서를 볼 수 있어요.\n#정리수납 #리빙 #인스타피드 #현대홈쇼핑 #광고",
  },
  {
    contentFormat: "인스타 피드",
    mediaKinds: ["이미지", "이미지", "이미지"],
    platform: "Instagram",
    title: "반려견과 다녀온 주말 산책 코스",
    text: "그늘이 많고 쉬어 갈 벤치가 있는 2.4km 코스입니다. 사용한 리드줄과 휴대용 물병은 마지막 사진에 정리했습니다.\n#반려생활 #산책기록 #주말일상 #현대홈쇼핑 #광고",
  },
  {
    contentFormat: "인스타 이미지",
    mediaKinds: ["이미지"],
    platform: "Instagram",
    title: "체형별 팬츠 사이즈 선택 가이드",
    text: "허리와 힙 실측값을 기준으로 정리한 사이즈표입니다. 평소 착용 사이즈보다 제품 상세 치수를 먼저 확인해 주세요.\n#사이즈가이드 #골프웨어 #현대홈쇼핑 #광고",
  },
  {
    contentFormat: "인스타 이미지",
    issue: {
      detail: "동일 조건의 시장 가격 비교 근거 없이 업계 최저가를 보장하고 있습니다.",
      evidence: "업계 최저가 보장",
      guidance: "적용 쿠폰과 행사 가격 등 확인 가능한 혜택만 표기해 주세요.",
      source: "본문",
      title: "가격 보장 표현",
    },
    mediaKinds: ["이미지"],
    platform: "Instagram",
    title: "주말 한정 쿠폰 안내",
    text: "금요일 오전 10시부터 일요일 자정까지 사용할 수 있는 앱 전용 쿠폰입니다. 업계 최저가 보장 문구와 함께 자세한 조건은 공식 링크에서 확인해 주세요.\n#주말쿠폰 #쇼핑혜택 #현대홈쇼핑 #광고",
  },
  {
    contentFormat: "인스타 이미지",
    mediaKinds: ["이미지"],
    platform: "Instagram",
    title: "8월 라이브 방송 일정",
    text: "이번 달 셀렉터스 라이브 방송 일정을 한 장에 정리했습니다. 관심 상품의 방송 시간을 저장하고 알림을 설정해 주세요.\n#라이브커머스 #방송일정 #현대홈쇼핑 #셀렉터스 #광고",
  },
] as const;

const CONTENT_REVIEW_MEDIA = [
  "/creator-media/kr-cr-001-01.jpg",
  "/creator-media/kr-cr-001-02.jpg",
  "/creator-media/kr-cr-001-03.jpg",
  "/creator-media/kr-cr-002-01.jpg",
  "/creator-media/kr-cr-002-02.jpg",
  "/creator-media/kr-cr-002-03.jpg",
  "/creator-media/kr-cr-003-01.jpg",
  "/creator-media/kr-cr-003-02.jpg",
  "/creator-media/kr-cr-003-03.jpg",
  "/creator-media/kr-cr-004-01.jpg",
  "/creator-media/kr-cr-004-02.jpg",
  "/creator-media/kr-cr-004-03.jpg",
] as const;

const CONTENT_REVIEW_PRODUCT_URLS = [
  "https://www.hmall.com/p/2200098405",
  "https://www.hmall.com/p/2200089867",
  "https://www.hmall.com/p/2200089740",
] as const;

const CONTENT_REVIEW_LIST_ITEMS: readonly ContentReviewFixture[] = Array.from({ length: 50 }, (_, index) => {
  const source = CONTENT_REVIEWS[index % CONTENT_REVIEWS.length];
  const template = CONTENT_REVIEW_TEMPLATES[index % CONTENT_REVIEW_TEMPLATES.length];
  const day = String(1 + (index % 10)).padStart(2, "0");
  const hour = String(9 + (index % 10)).padStart(2, "0");
  const minute = String((index * 7) % 60).padStart(2, "0");
  const capturedAt = "2026-08-" + day + " " + hour + ":" + minute;
  const isRevision = index % 10 === 9;
  const issue = template.issue;
  const issueSource = issue?.source === "본문"
    ? "게시물 본문(TEXT)"
    : issue?.source === "OCR"
      ? "OCR · 이미지 1"
      : "STT · 00:05–00:09";
  const signals: ContentReviewFixture["report"]["signals"] = [
    {
      title: "광고 표시",
      detail: "본문에서 유료광고 및 광고 해시태그를 확인했습니다.",
      source: "게시물 본문(TEXT)",
      evidence: "#광고",
      tone: "pass",
    },
    {
      title: "공식 상품 링크",
      detail: "연결된 URL이 Hmall 공식 상품 주소와 일치합니다.",
      source: "URL",
      evidence: "hmall.com",
      tone: "pass",
    },
  ];

  if (issue) {
    signals.push({
      title: issue.title,
      detail: issue.detail,
      source: issueSource,
      evidence: issue.evidence,
      guidance: issue.guidance,
      tone: "critical",
    });
  }

  const issueAnnotation: ContentAnnotation | undefined = issue ? {
    guidance: issue.guidance,
    id: `ct-${String(index + 1).padStart(3, "0")}-violation-1`,
    location: issue.source === "본문"
      ? "게시물 본문"
      : issue.source === "OCR"
        ? "이미지 1 · 중앙 문구"
        : "동영상 1 · 00:05–00:09",
    reason: issue.detail,
    severity: "critical",
    source: "자동 감지",
    state: "active",
    target: issue.source === "본문"
      ? {
          endIndex: template.text.indexOf(issue.evidence) + issue.evidence.length,
          kind: "text",
          occurrence: 1,
          quote: issue.evidence,
          startIndex: template.text.indexOf(issue.evidence),
        }
      : {
          box: issue.source === "OCR"
            ? { x: 14, y: 31, width: 72, height: 18 }
            : { x: 7, y: 70, width: 86, height: 15 },
          kind: "media",
          mediaIndex: 0,
          quote: issue.evidence,
          ...(issue.source === "STT"
            ? { timeRange: { start: "00:05", end: "00:09" } }
            : {}),
        },
    title: issue.title,
  } : undefined;

  const extracts: ContentReviewFixture["report"]["extracts"] = [];
  if (template.mediaKinds.includes("이미지")) {
    extracts.push({
      type: "OCR",
      text: issue?.source === "OCR" ? issue.evidence : template.title + " · 상품 정보와 사이즈 안내",
      location: "이미지 1 · 중앙",
    });
  }
  if (template.mediaKinds.includes("동영상")) {
    extracts.push({
      type: "STT",
      text: issue?.source === "STT" ? issue.evidence : template.title + "의 주요 특징과 실제 사용 후기를 소개합니다.",
      location: "동영상 1 · 00:00–00:12",
    });
  }

  const reviewStatus: ReviewStatus = issue
    ? index % 3 === 0 ? "위반 확정" : index % 3 === 1 ? "수정 요청" : "검수 대기"
    : index % 4 === 0 ? "검수 대기" : "승인";
  const mediaUrls = Array.from(
    { length: template.mediaKinds.length },
    (_, mediaIndex) => CONTENT_REVIEW_MEDIA[(index + mediaIndex) % CONTENT_REVIEW_MEDIA.length],
  );

  return {
    ...source,
    id: "ct-" + String(index + 1).padStart(3, "0"),
    contentTitle: template.title,
    contentFormat: template.contentFormat,
    duration: template.duration,
    author: CONTENT_REVIEW_AUTHORS[index % CONTENT_REVIEW_AUTHORS.length],
    cohort: String(2 + (index % 3)) + "기",
    sourcePlatform: template.platform,
    submittedAt: capturedAt,
    reviewType: isRevision ? "VIOLATION_CORRECTION" : "NEW",
    previousSnapshot: isRevision ? {
      ...source.currentSnapshot,
      annotations: undefined,
      capturedAt: `2026-08-${day} 08:${minute}`,
      label: "이전 버전",
      text: template.text.replaceAll("#광고", ""),
      urls: [CONTENT_REVIEW_PRODUCT_URLS[index % CONTENT_REVIEW_PRODUCT_URLS.length]],
      mediaCount: template.mediaKinds.length,
      mediaKinds: [...template.mediaKinds],
      mediaUrls,
      youtubeVideoId: template.youtubeVideoId,
    } : null,
    reviewStatus,
    processingState: reviewStatus === "승인"
      ? "처리 완료"
      : reviewStatus === "수정 요청"
        ? "안내 대기"
        : "미처리",
    aiStatus: "ready",
    aiSummary: issue
      ? template.contentFormat + " 콘텐츠에서 " + issue.title + " 후보 1건을 확인했습니다."
      : "광고 표기와 공식 상품 링크가 확인되었으며 현재 감지된 위반 후보가 없습니다.",
    detectedIssues: issue ? [issue.title + " 1건"] : ["감지된 위반 없음"],
    violationType: issue?.title ?? null,
    availableActions: ["검수 완료", "수정 요청", "위반 판정"],
    changeItems: isRevision
      ? ["광고 해시태그 추가", "본문 문구 수정", `미디어 ${template.mediaKinds.length}개 유지`]
      : ["이전 비교 대상 없음", "미디어 " + template.mediaKinds.length + "개"],
    currentSnapshot: {
      ...source.currentSnapshot,
      annotations: issueAnnotation ? [issueAnnotation] : undefined,
      capturedAt,
      label: template.contentFormat,
      text: template.text,
      urls: [CONTENT_REVIEW_PRODUCT_URLS[index % CONTENT_REVIEW_PRODUCT_URLS.length]],
      mediaCount: template.mediaKinds.length,
      mediaKinds: [...template.mediaKinds],
      mediaUrls,
      youtubeVideoId: template.youtubeVideoId,
    },
    report: {
      generatedAt: capturedAt,
      signals,
      extracts,
      history: [
        { at: capturedAt, label: "콘텐츠 수집", actor: "수집 시스템" },
        { at: capturedAt, label: "자동 검수 완료", actor: "검수 시스템" },
      ],
    },
  };
});

function contentAuthorProfileImage(contentId: string) {
  const sequence = Number.parseInt(contentId.replace(/\D/g, ""), 10) || 1;
  const profileIndex = ((sequence - 1) % 4) + 1;
  return `/creator-media/kr-cr-${String(profileIndex).padStart(3, "0")}-profile.jpg`;
}

function contentAuthorSnsId(contentId: string) {
  const sequence = Number.parseInt(contentId.replace(/\D/g, ""), 10) || 1;
  return CONTENT_REVIEW_SNS_IDS[(sequence - 1) % CONTENT_REVIEW_SNS_IDS.length];
}

function reviewRequiredContents() {
  return CONTENT_REVIEW_LIST_ITEMS
    .filter((content) => content.reviewStatus === "검수 대기")
    .slice()
    .sort((left, right) => (
      left.submittedAt.localeCompare(right.submittedAt) || left.id.localeCompare(right.id)
    ));
}

function CollectionCard({
  content,
  onSelect,
}: {
  content: ContentReviewFixture;
  onSelect: (content: ContentReviewFixture) => void;
}) {
  const snapshot = content.currentSnapshot;
  const mainMedia = snapshot.mediaUrls[0];
  const issueCount = content.report.signals.filter((signal) => signal.tone !== "pass").length;
  const hasVideo = snapshot.mediaKinds[0] === "동영상";

  return (
    <button
      aria-label={`${content.author} ${content.contentTitle} 검수 상세 보기`}
      className="fuma-content-collection__card fuma-creator-card"
      data-content-format={contentFormatKey(content.contentFormat)}
      onClick={() => onSelect(content)}
      type="button"
    >
      <CreatorCardProfileHeader
        badgeLabel={content.cohort}
        displayName={content.author}
        platform={contentPlatform(content.sourcePlatform)}
        profileImageUrl={contentAuthorProfileImage(content.id)}
        snsId={contentAuthorSnsId(content.id)}
      />
      <StatusPill
        className="fuma-content-collection__review-status"
        tone={reviewStatusTone(content.reviewStatus)}
      >
        {content.reviewStatus}
      </StatusPill>
      <div className="fuma-content-collection__media">
        {mainMedia ? (
          <img alt={`${content.contentTitle} 썸네일`} src={mainMedia} />
        ) : (
          <span className="fuma-content-collection__media-empty"><Images aria-hidden="true" size={24} /></span>
        )}
        {hasVideo ? <span className="fuma-content-collection__play"><Play aria-hidden="true" size={15} /></span> : null}
        {content.duration ? <span className="fuma-content-collection__duration">{content.duration}</span> : null}
        {snapshot.mediaCount > 1 ? <span className="fuma-content-collection__media-count">1 / {snapshot.mediaCount}</span> : null}
      </div>
      <div className="fuma-content-collection__copy">
        <strong>{content.contentTitle}</strong>
        <p className="fuma-content-collection__caption">{snapshot.text}</p>
      </div>
      <footer className="fuma-content-collection__meta">
        <span>{content.submittedAt.slice(0, 10)}</span>
        <span
          className="fuma-content-collection__violation-count"
          data-has-violation={issueCount > 0}
        >
          {issueCount ? `위반 항목 ${issueCount}개` : "위반 항목 없음"}
        </span>
      </footer>
    </button>
  );
}

function ContentReviewCollection({
  contents,
  onChangeView,
  onChangeViolationOnly,
  onSelect,
  totalCount,
  violationOnly,
  viewMode,
}: {
  contents: readonly ContentReviewFixture[];
  onChangeView: (viewMode: "grid" | "list") => void;
  onChangeViolationOnly: (violationOnly: boolean) => void;
  onSelect: (content: ContentReviewFixture) => void;
  totalCount: number;
  violationOnly: boolean;
  viewMode: "grid" | "list";
}) {
  return (
    <section aria-label="수집 콘텐츠 목록" className="fuma-content-collection">
      <div className="fuma-result-toolbar fuma-simple-result-toolbar fuma-applicant-result-toolbar fuma-content-review-toolbar">
        <div className="fuma-applicant-minimum-filter">
          <label className="fuma-applicant-minimum-toggle">
            <input
              checked={violationOnly}
              onChange={(event) => onChangeViolationOnly(event.target.checked)}
              type="checkbox"
            />
            <span aria-hidden="true" />
            <b>위반 항목만</b>
          </label>
        </div>
        <div className="fuma-settlement-result-meta">
          <span>총 {totalCount}건</span>
        </div>
        <div className="fuma-creator-toolbar fuma-creator-toolbar__controls">
          <span aria-hidden="true" className="fuma-creator-toolbar__divider" />
          <SegmentedControl
            ariaLabel="보기 방식"
            onChange={(nextView) => onChangeView(nextView as "grid" | "list")}
            options={[
              { label: "카드", value: "grid" },
              { label: "목록", value: "list" },
            ]}
            value={viewMode}
          />
        </div>
      </div>
      {contents.length === 0 ? (
        <EmptyState title="검색 결과가 없습니다." />
      ) : viewMode === "grid" ? (
        <div className="fuma-content-collection__track is-grid">
          {contents.map((content) => <CollectionCard content={content} key={content.id} onSelect={onSelect} />)}
        </div>
      ) : (
        <div aria-label="수집 콘텐츠 리스트" className="fuma-wide-table fuma-content-collection__list" role="region">
          <DenseTable
            columns={queueColumns()}
            onRowClick={onSelect}
            rowKey={(content) => content.id}
            rows={[...contents]}
          />
        </div>
      )}
    </section>
  );
}

function ContentReviewCategoryTabs({
  onStartReview,
  pendingCount,
  selectedCategory,
  onSelect,
}: {
  onStartReview: () => void;
  pendingCount: number;
  selectedCategory: ContentReviewCategory;
  onSelect: (category: ContentReviewCategory) => void;
}) {
  return (
    <nav aria-label="콘텐츠 처리 구분" className="fuma-creator-category-filter fuma-list-action-toolbar">
      <div>
        {CONTENT_REVIEW_CATEGORIES.map((category) => (
          <button
            aria-pressed={selectedCategory === category}
            className="fuma-creator-category-filter__option"
            key={category}
            onClick={() => onSelect(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>
      <Button
        className="fuma-content-review-start-button"
        disabled={pendingCount === 0}
        onClick={onStartReview}
        variant="primary"
      >
        검수 시작
      </Button>
    </nav>
  );
}

function queueColumns(): DenseTableColumn<ContentReviewFixture>[] {
  return [
    { key: "id", header: "콘텐츠 ID", width: 96 },
    { key: "contentTitle", header: "콘텐츠 제목", width: 280 },
    { key: "contentFormat", header: "형식", width: 110, align: "center" },
    {
      key: "reviewType",
      header: "검수 유형",
      width: 120,
      render: (content) => REVIEW_TYPE_LABELS[content.reviewType],
    },
    { key: "author", header: "작성자", width: 100 },
    {
      key: "sourcePlatform",
      header: "플랫폼",
      width: 100,
      align: "center",
      render: (content) => <PlatformIcon platform={contentPlatform(content.sourcePlatform)} />,
    },
    { key: "submittedAt", header: "수집 시각", width: 160, align: "center" },
    {
      key: "aiStatus",
      header: "리포트 상태",
      width: 120,
      align: "center",
      render: (content) => (
        <StatusPill tone={content.aiStatus === "ready" ? "approved" : "pending"}>
          {content.aiStatus === "ready" ? "생성 완료" : "생성 대기"}
        </StatusPill>
      ),
    },
    {
      key: "reviewStatus",
      header: "처리 구분",
      width: 110,
      align: "center",
      render: (content) => {
        const category = contentReviewCategory(content);
        return <StatusPill tone={contentReviewCategoryTone(category)}>{category}</StatusPill>;
      },
    },
  ];
}

export function ContentReviewListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = CONTENT_REVIEW_CATEGORIES.find(
    (category) => category === searchParams.get("category"),
  ) ?? "신규";
  const violationOnly = searchParams.get("issues") === "1";
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const appliedFilters: QueueFilterValues = {
    keyword: searchParams.get("q") ?? "",
    platform: SOCIAL_PLATFORM_FILTER_OPTIONS.some(({ value }) => value === searchParams.get("platform"))
      ? searchParams.get("platform") ?? ""
      : "",
  };
  const normalizedKeyword = appliedFilters.keyword.trim().toLocaleLowerCase("ko-KR");
  const filteredContents = CONTENT_REVIEW_LIST_ITEMS.filter((content) => {
    const matchesCategory = contentReviewCategory(content) === selectedCategory;
    const hasViolation = content.report.signals.some((signal) => signal.tone !== "pass");
    const matchesKeyword = !normalizedKeyword || [
      content.id,
      content.contentTitle,
      content.author,
    ].some((value) => value.toLocaleLowerCase("ko-KR").includes(normalizedKeyword));
    const matchesPlatform = !appliedFilters.platform
      || contentPlatform(content.sourcePlatform) === appliedFilters.platform;
    return matchesCategory
      && (!violationOnly || hasViolation)
      && matchesKeyword
      && matchesPlatform;
  });
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const { currentPage, pagedItems: pageContents, totalPages } = paginate(
    filteredContents,
    requestedPage,
    CONTENT_REVIEW_PAGE_SIZE,
  );
  const pendingContents = reviewRequiredContents();

  const updateListParam = (
    key: "category" | "issues" | "page" | "view",
    value: string,
    defaultValue: string,
    resetPage = false,
  ) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === defaultValue) nextParams.delete(key);
    else nextParams.set(key, value);
    if (resetPage) nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  };

  const applyQueueFilters = (filters: QueueFilterValues) => {
    const nextParams = new URLSearchParams(searchParams);
    const values = {
      q: filters.keyword.trim(),
      platform: filters.platform,
    };

    nextParams.delete("reviewType");

    Object.entries(values).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  };

  const resetQueueFilters = () => {
    const nextParams = new URLSearchParams(searchParams);
    ["q", "platform", "reviewType", "category", "issues", "page"].forEach((key) => {
      nextParams.delete(key);
    });
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <section className="fuma-page" data-visual-contract="content-review">
      <PageHeader title="콘텐츠 검수" />
      <div className="fuma-page__body">
        <QueueFilters
          appliedFilters={appliedFilters}
          key={JSON.stringify(appliedFilters)}
          onApply={applyQueueFilters}
          onReset={resetQueueFilters}
        />
        <ContentReviewCategoryTabs
          onStartReview={() => {
            const firstPendingContent = pendingContents[0];
            if (!firstPendingContent) return;
            navigate(`/content/reviews/${firstPendingContent.id}`, {
              state: { from: `${location.pathname}${location.search}`, reviewSession: true },
            });
          }}
          onSelect={(category) => updateListParam("category", category, "신규", true)}
          pendingCount={pendingContents.length}
          selectedCategory={selectedCategory}
        />
        <ContentReviewCollection
          contents={pageContents}
          onChangeView={(nextViewMode) => updateListParam("view", nextViewMode, "grid")}
          onChangeViolationOnly={(nextViolationOnly) => (
            updateListParam("issues", nextViolationOnly ? "1" : "0", "0", true)
          )}
          onSelect={(content) => navigate(`/content/reviews/${content.id}`, {
            state: { from: `${location.pathname}${location.search}` },
          })}
          totalCount={filteredContents.length}
          violationOnly={violationOnly}
          viewMode={viewMode}
        />
        {filteredContents.length > 0 ? (
          <Pagination
            onPageChange={(page) => updateListParam("page", String(page), "1")}
            page={currentPage}
            pageSize={CONTENT_REVIEW_PAGE_SIZE}
            totalPages={totalPages}
          />
        ) : null}
      </div>
    </section>
  );
}

type ReviewHistoryItem = ContentReviewFixture["report"]["history"][number];

const REVIEW_HISTORY_COLUMNS: DenseTableColumn<ReviewHistoryItem>[] = [
  { key: "at", header: "처리 일시", width: "34%", align: "center" },
  { key: "label", header: "처리 내용", align: "center" },
  { key: "actor", header: "처리 주체", width: "24%", align: "center" },
];

function ReviewHistory({ content }: { content: ContentReviewFixture }) {
  return (
    <section
      aria-label="검수 이력"
      className="fuma-creator-analysis-report fuma-content-analysis-report fuma-content-review-history-report"
    >
      <header className="fuma-minimal-review-section__header fuma-content-analysis-report__header">
        <div><span>HISTORY</span><h3>검수 이력</h3></div>
      </header>
      <div className="fuma-creator-analysis-report__content">
        <div
          aria-label="검수 이력 목록"
          className="fuma-wide-table fuma-settlement-table fuma-proposal-history-table"
          role="region"
        >
          <DenseTable
            columns={REVIEW_HISTORY_COLUMNS}
            rowKey={(item) => `${item.at}-${item.label}`}
            rows={[...content.report.history]}
          />
        </div>
      </div>
    </section>
  );
}

function MinimalReviewOverview({ content }: { content: ContentReviewFixture }) {
  return (
    <section className="fuma-minimal-review-overview">
      <header>
        <div>
          <span>{REVIEW_TYPE_LABELS[content.reviewType]}</span>
          <h2>{content.contentTitle}</h2>
          <p>{content.author} · {content.sourcePlatform} · {content.contentFormat}</p>
        </div>
        <StatusPill tone={reviewStatusTone(content.reviewStatus)}>{content.reviewStatus}</StatusPill>
      </header>
      <dl>
        <div><dt>제출일</dt><dd>{content.submittedAt}</dd></div>
        <div><dt>리포트 생성일</dt><dd>{content.report.generatedAt}</dd></div>
      </dl>
    </section>
  );
}

function youtubeEmbedUrl(videoId?: string) {
  return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
    : null;
}

interface IndexedContentAnnotation extends ContentAnnotation {
  ordinal: number;
}

function annotationQuote(target: ContentAnnotationTarget) {
  return target.kind === "text" || target.kind === "media" ? target.quote : null;
}

function annotationMatchesSignal(
  annotation: ContentAnnotation,
  signal: ContentReviewFixture["report"]["signals"][number],
) {
  const quote = annotationQuote(annotation.target);
  return annotation.title === signal.title || (quote !== null && quote === signal.evidence);
}

function mediaIndexFromSource(source: string, snapshot: ContentSnapshot) {
  const numberedMedia = /(?:이미지|동영상)\s*(\d+)/.exec(source);
  if (numberedMedia) return Math.max(0, Number(numberedMedia[1]) - 1);
  const videoIndex = snapshot.mediaKinds.findIndex((kind) => kind === "동영상");
  return Math.max(0, videoIndex);
}

function timeRangeFromSource(source: string) {
  const range = /(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})/.exec(source);
  return range ? { start: range[1], end: range[2] } : undefined;
}

function annotationFromSignal(
  signal: ContentReviewFixture["report"]["signals"][number],
  snapshot: ContentSnapshot,
  ordinal: number,
): IndexedContentAnnotation {
  const startIndex = snapshot.text.indexOf(signal.evidence);
  const sourceIsText = signal.source.includes("본문") && startIndex >= 0;
  const timeRange = timeRangeFromSource(signal.source);

  return {
    guidance: signal.guidance ?? "표시된 근거를 확인해 주세요.",
    id: `signal-${ordinal}-${signal.title}`,
    location: signal.source,
    ordinal,
    reason: signal.detail,
    severity: signal.tone === "warning" ? "warning" : "critical",
    source: "자동 감지",
    state: "active",
    target: sourceIsText
      ? {
          endIndex: startIndex + signal.evidence.length,
          kind: "text",
          occurrence: 1,
          quote: signal.evidence,
          startIndex,
        }
      : {
          box: timeRange
            ? { x: 7, y: 70, width: 86, height: 15 }
            : { x: 14, y: 31, width: 72, height: 18 },
          kind: "media",
          mediaIndex: mediaIndexFromSource(signal.source, snapshot),
          quote: signal.evidence,
          ...(timeRange ? { timeRange } : {}),
        },
    title: signal.title,
  };
}

function indexedViolationAnnotations(
  content: ContentReviewFixture,
  snapshot: ContentSnapshot,
): IndexedContentAnnotation[] {
  const candidates = content.report.signals.filter((signal) => signal.tone !== "pass");
  const annotations = (snapshot.annotations ?? [])
    .filter((annotation) => annotation.state === "active")
    .map((annotation, annotationIndex) => {
      const candidateIndex = candidates.findIndex((signal) => annotationMatchesSignal(annotation, signal));
      return {
        ...annotation,
        ordinal: candidateIndex >= 0 ? candidateIndex + 1 : annotationIndex + 1,
      };
    });

  if (snapshot === content.currentSnapshot) {
    candidates.forEach((signal, candidateIndex) => {
      if (!annotations.some((annotation) => annotationMatchesSignal(annotation, signal))) {
        annotations.push(annotationFromSignal(signal, snapshot, candidateIndex + 1));
      }
    });
  }

  return annotations.sort((left, right) => left.ordinal - right.ordinal);
}

function findQuoteRange(text: string, quote: string, occurrence = 1) {
  let fromIndex = 0;
  let matchedIndex = -1;

  for (let match = 0; match < occurrence; match += 1) {
    matchedIndex = text.indexOf(quote, fromIndex);
    if (matchedIndex < 0) return null;
    fromIndex = matchedIndex + quote.length;
  }

  return { end: matchedIndex + quote.length, start: matchedIndex };
}

function ViolationHighlightedText({
  anchorPrefix,
  annotations,
  text,
  useStoredIndexes = false,
}: {
  anchorPrefix?: string;
  annotations: readonly IndexedContentAnnotation[];
  text: string;
  useStoredIndexes?: boolean;
}) {
  const ranges = annotations.flatMap((annotation) => {
    const target = annotation.target;
    if (target.kind === "url") return [];
    const storedRange = target.kind === "text"
      && useStoredIndexes
      && target.startIndex !== undefined
      && target.endIndex !== undefined
      && target.startIndex >= 0
      && target.endIndex <= text.length
      && target.startIndex < target.endIndex
        ? { end: target.endIndex, start: target.startIndex }
        : null;
    const range = storedRange ?? findQuoteRange(
      text,
      target.quote,
      target.kind === "text" ? target.occurrence : 1,
    );
    return range ? [{ ...range, annotation }] : [];
  }).sort((left, right) => left.start - right.start || left.end - right.end);

  if (ranges.length === 0) return <>{text}</>;

  const nodes: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(({ annotation, end, start }) => {
    if (start < cursor) return;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <mark
        aria-label={`위반 ${annotation.ordinal}: ${annotation.title}`}
        className="fuma-review-text-violation"
        data-ordinal={annotation.ordinal}
        data-severity={annotation.severity}
        data-violation-anchor={anchorPrefix ? annotation.ordinal : undefined}
        id={anchorPrefix ? `${anchorPrefix}-violation-${annotation.ordinal}` : undefined}
        key={`${annotation.id}-${start}`}
        tabIndex={anchorPrefix ? -1 : undefined}
        title={`${annotation.title}: ${annotation.reason}`}
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <>{nodes}</>;
}

function MinimalVersionCard({
  content,
  focusedViolation,
  label,
  snapshot,
}: {
  content: ContentReviewFixture;
  focusedViolation?: { ordinal: number; requestId: number } | null;
  label: string;
  snapshot: ContentSnapshot;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const annotations = useMemo(
    () => indexedViolationAnnotations(content, snapshot),
    [content, snapshot],
  );
  const firstAnnotatedMediaIndex = annotations.find((annotation) => annotation.target.kind === "media")?.target;
  const [activeMediaIndex, setActiveMediaIndex] = useState(
    firstAnnotatedMediaIndex?.kind === "media" ? firstAnnotatedMediaIndex.mediaIndex : 0,
  );
  const [mediaAspectRatios, setMediaAspectRatios] = useState<Record<number, number>>({});
  const mediaItems = Array.from({ length: snapshot.mediaCount }, (_, index) => ({
    kind: snapshot.mediaKinds[index] ?? "이미지",
    url: snapshot.mediaUrls[index] ?? snapshot.mediaUrls[0],
  }));
  const visibleIndex = mediaItems.length > 0 ? activeMediaIndex % mediaItems.length : 0;
  const activeMedia = mediaItems[visibleIndex];
  const platform = contentPlatform(content.sourcePlatform);
  const isInstagram = platform === "Instagram";
  const embedUrl = isInstagram ? null : youtubeEmbedUrl(snapshot.youtubeVideoId);
  const isVerticalVideo = content.contentFormat === "인스타 릴스" || content.contentFormat === "유튜브 쇼츠";
  const activeMediaAnnotations = annotations.filter((annotation) => (
    annotation.target.kind === "media" && annotation.target.mediaIndex === visibleIndex
  ));
  const frameAspectRatio = isVerticalVideo ? 9 / 16 : isInstagram ? 4 / 5 : 16 / 9;
  const mediaAspectRatio = embedUrl
    ? 16 / 9
    : mediaAspectRatios[visibleIndex] ?? (isVerticalVideo ? 9 / 16 : isInstagram ? 1 : 16 / 9);
  const mediaStageFit = embedUrl ? "fill" : mediaAspectRatio >= frameAspectRatio ? "width" : "height";
  const contentNumber = Number(content.id.replace(/\D/g, "")) || 1;
  const handle = content.author.replaceAll(" ", "").toLowerCase();
  const avatarUrl = `/creator-media/kr-cr-${String(((contentNumber - 1) % 4) + 1).padStart(3, "0")}-profile.jpg`;
  const instagramLikes = (180 + contentNumber * 37).toLocaleString("ko-KR");
  const instagramComments = 12 + (contentNumber % 24);
  const youtubeViews = (12_000 + contentNumber * 8_431).toLocaleString("ko-KR");
  const youtubeLikes = (320 + contentNumber * 83).toLocaleString("ko-KR");
  const [month, day] = snapshot.capturedAt.slice(5, 10).split("-");
  const postDate = `${Number(month)}월 ${Number(day)}일`;

  const moveMedia = (direction: -1 | 1) => {
    setActiveMediaIndex((current) => (current + direction + mediaItems.length) % mediaItems.length);
  };

  useEffect(() => {
    if (!focusedViolation) return;
    const annotation = annotations.find(({ ordinal }) => ordinal === focusedViolation.ordinal);
    if (!annotation) return;
    const animationFrame = window.requestAnimationFrame(() => {
      if (annotation.target.kind === "media" && visibleIndex !== annotation.target.mediaIndex) {
        setActiveMediaIndex(annotation.target.mediaIndex);
        return;
      }
      const target = cardRef.current?.querySelector<HTMLElement>(
        `[data-violation-anchor="${focusedViolation.ordinal}"]`,
      );
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [annotations, focusedViolation, visibleIndex]);

  return (
    <article
      className="fuma-minimal-version-card"
      data-content-format={contentFormatKey(content.contentFormat)}
      data-platform={platform.toLowerCase()}
      ref={cardRef}
    >
      <header><strong>{label}</strong><time>{snapshot.capturedAt}</time></header>
      <div className="fuma-platform-review-frame">
        {isInstagram ? (
          <div className="fuma-platform-review-frame__instagram-header">
            <span className="fuma-platform-review-frame__avatar"><img alt={`${content.author} 프로필`} src={avatarUrl} /></span>
            <div><strong>{handle}</strong><small>현대홈쇼핑 셀렉터스 · 4일</small></div>
            <button aria-label="게시물 메뉴" type="button"><MoreHorizontal aria-hidden="true" size={20} /></button>
          </div>
        ) : null}

        <div className={`fuma-platform-review-frame__media${isVerticalVideo ? " is-vertical" : ""}${embedUrl ? " has-youtube-embed" : ""}`}>
          <div
            className="fuma-platform-review-frame__asset-stage"
            data-fit={mediaStageFit}
            style={mediaStageFit === "fill" ? undefined : { aspectRatio: String(mediaAspectRatio) }}
          >
            {embedUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="fuma-platform-review-frame__youtube-embed"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                src={embedUrl}
                title={`${content.contentTitle} YouTube 영상`}
              />
            ) : activeMedia?.url ? (
              <img
                alt={`${content.author} ${label} 미디어 ${visibleIndex + 1}`}
                onLoad={(event) => {
                  const { naturalHeight, naturalWidth } = event.currentTarget;
                  if (naturalHeight > 0 && naturalWidth > 0) {
                    setMediaAspectRatios((current) => ({
                      ...current,
                      [visibleIndex]: naturalWidth / naturalHeight,
                    }));
                  }
                }}
                src={activeMedia.url}
              />
            ) : (
              <Images aria-hidden="true" size={26} />
            )}
            {activeMediaAnnotations.length > 0 ? (
              <div aria-label="미디어 위반 위치" className="fuma-platform-review-frame__violation-layer">
                {activeMediaAnnotations.map((annotation) => {
                  if (annotation.target.kind !== "media") return null;
                  const { box, timeRange } = annotation.target;
                  return (
                    <span
                      aria-label={`위반 ${annotation.ordinal}: ${annotation.title}`}
                      className="fuma-platform-review-frame__violation-box"
                      data-violation-anchor={focusedViolation !== undefined ? annotation.ordinal : undefined}
                      data-severity={annotation.severity}
                      id={focusedViolation !== undefined ? `${content.id}-violation-${annotation.ordinal}` : undefined}
                      key={annotation.id}
                      role="note"
                      style={{
                        height: `${box.height}%`,
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                      }}
                      tabIndex={focusedViolation !== undefined ? -1 : undefined}
                    >
                      <span className="fuma-review-annotation-pin">{annotation.ordinal}</span>
                      <small>{timeRange ? `${timeRange.start}–${timeRange.end}` : annotation.title}</small>
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
          {activeMedia?.kind === "동영상" ? (
            <span aria-label="동영상" className="fuma-platform-review-frame__play">
              <Play aria-hidden="true" size={20} />
            </span>
          ) : null}
          {activeMedia?.kind === "동영상" && content.duration ? (
            <span className="fuma-platform-review-frame__duration">{content.duration}</span>
          ) : null}
          {mediaItems.length > 1 ? (
            <>
              <button aria-label="이전 사진" className="is-prev" onClick={() => moveMedia(-1)} type="button"><ChevronLeft aria-hidden="true" size={17} /></button>
              <button aria-label="다음 사진" className="is-next" onClick={() => moveMedia(1)} type="button"><ChevronRight aria-hidden="true" size={17} /></button>
              <span className="fuma-platform-review-frame__count">{visibleIndex + 1} / {mediaItems.length}</span>
            </>
          ) : null}
          {!isInstagram && !embedUrl ? (
            <div className="fuma-platform-review-frame__player-controls">
              <div className="fuma-platform-review-frame__progress"><span /></div>
              <div>
                <span>
                  <button aria-label="재생" type="button"><Play aria-hidden="true" size={17} fill="currentColor" /></button>
                  <button aria-label="음량" type="button"><Volume2 aria-hidden="true" size={18} /></button>
                  <small>0:00 / {content.duration ?? "00:30"}</small>
                </span>
                <span>
                  <button aria-label="자막" type="button"><Captions aria-hidden="true" size={18} /></button>
                  <button aria-label="설정" type="button"><Settings aria-hidden="true" size={18} /></button>
                  <button aria-label="전체 화면" type="button"><Maximize aria-hidden="true" size={18} /></button>
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {isInstagram && mediaItems.length > 1 ? (
          <div aria-label="사진 목록" className="fuma-platform-review-frame__carousel-dots" role="group">
            {mediaItems.map((media, index) => (
              <button
                aria-label={`${index + 1}번 ${media.kind} 보기`}
                aria-pressed={visibleIndex === index}
                data-has-violation={annotations.some((annotation) => (
                  annotation.target.kind === "media" && annotation.target.mediaIndex === index
                ))}
                key={`${media.url}-${index}`}
                onClick={() => setActiveMediaIndex(index)}
                type="button"
              />
            ))}
          </div>
        ) : null}

        {isInstagram ? (
          <>
            <div className="fuma-platform-review-frame__instagram-actions">
              <span>
                <button aria-label="좋아요" type="button"><Heart aria-hidden="true" size={23} /></button>
                <button aria-label="댓글" type="button"><MessageCircle aria-hidden="true" size={23} /></button>
                <button aria-label="리포스트" type="button"><Repeat2 aria-hidden="true" size={23} /></button>
                <button aria-label="공유" type="button"><Send aria-hidden="true" size={22} /></button>
              </span>
              <button aria-label="저장" type="button"><Bookmark aria-hidden="true" size={23} /></button>
            </div>
            <div className="fuma-platform-review-frame__instagram-copy">
              <strong>좋아요 {instagramLikes}개</strong>
              <p><b>{handle}</b>{" "}<ViolationHighlightedText anchorPrefix={focusedViolation !== undefined ? content.id : undefined} annotations={annotations} text={snapshot.text} useStoredIndexes /></p>
              <button type="button">댓글 {instagramComments}개 모두 보기</button>
              <time>{postDate}</time>
            </div>
          </>
        ) : (
          <div className={`fuma-platform-review-frame__youtube-copy${embedUrl ? " is-embedded" : ""}`}>
            <h4>{content.contentTitle}</h4>
            <div className="fuma-platform-review-frame__youtube-toolbar">
              <div className="fuma-platform-review-frame__youtube-channel">
                <span className="fuma-platform-review-frame__avatar"><img alt={`${content.author} 채널 프로필`} src={avatarUrl} /></span>
                <span><strong>{content.author}</strong><small>구독자 2.5만명</small></span>
                <button type="button">구독</button>
              </div>
              <div className="fuma-platform-review-frame__youtube-actions">
                <button type="button"><ThumbsUp aria-hidden="true" size={17} /> {youtubeLikes}</button>
                <button aria-label="싫어요" type="button"><ThumbsDown aria-hidden="true" size={17} /></button>
                <button type="button"><Share2 aria-hidden="true" size={17} /> 공유</button>
                <button type="button"><Bookmark aria-hidden="true" size={17} /> 저장</button>
                <button aria-label="더보기" type="button"><MoreHorizontal aria-hidden="true" size={18} /></button>
              </div>
            </div>
            <div className="fuma-platform-review-frame__youtube-description">
              <strong>조회수 {youtubeViews}회 · {postDate}</strong>
              <p><ViolationHighlightedText anchorPrefix={focusedViolation !== undefined ? content.id : undefined} annotations={annotations} text={snapshot.text} useStoredIndexes /></p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function MinimalVersionComparison({
  content,
  focusedViolation,
}: {
  content: ContentReviewFixture;
  focusedViolation: { ordinal: number; requestId: number } | null;
}) {
  const isRevision = Boolean(content.previousSnapshot);

  return (
    <section className="fuma-minimal-review-section">
      <header className="fuma-minimal-review-section__header">
        <h3>{isRevision ? "수정 콘텐츠 비교" : "등록 콘텐츠"}</h3>
        <span>{isRevision ? `${content.changeItems.length}건 수정됨` : "신규 등록"}</span>
      </header>
      {content.previousSnapshot && content.changeItems.length > 0 ? (
        <ul className="fuma-minimal-version-changes">
          {content.changeItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}
      <div className={`fuma-minimal-version-grid${content.previousSnapshot ? "" : " is-single"}`}>
        {content.previousSnapshot ? (
          <MinimalVersionCard key={`${content.id}-previous`} content={content} label="수정 전" snapshot={content.previousSnapshot} />
        ) : null}
        <MinimalVersionCard
          key={`${content.id}-current`}
          content={content}
          focusedViolation={focusedViolation}
          label={isRevision ? "수정 후" : "신규 등록"}
          snapshot={content.currentSnapshot}
        />
      </div>
    </section>
  );
}

function MinimalAnalysisReport({ content }: { content: ContentReviewFixture }) {
  const ocrExtract = content.report.extracts.find((extract) => extract.type === "OCR");
  const sttExtract = content.report.extracts.find((extract) => extract.type === "STT");
  const annotations = indexedViolationAnnotations(content, content.currentSnapshot);
  const safetyText = [
    content.currentSnapshot.text,
    ...content.report.extracts.map((extract) => extract.text),
    ...content.report.signals.flatMap((signal) => [signal.title, signal.detail, signal.evidence]),
  ].join(" ");
  const safetyChecks = [
    { label: "욕설", detected: /욕설|비속어|모욕/.test(safetyText) },
    { label: "폭력성", detected: /폭력|상해|위협/.test(safetyText) },
    { label: "음란물", detected: /음란|선정성|성적 표현/.test(safetyText) },
  ];
  const captionAdDetected = /#광고|유료광고|협찬/.test(content.currentSnapshot.text);
  const ocrAdDetected = /#광고|유료광고|협찬/.test(ocrExtract?.text ?? "");
  const adSignalPassed = content.report.signals.some((signal) => signal.title.includes("광고 표시") && signal.tone === "pass");
  const analysisSummary = sttExtract
    ? `${content.contentTitle}의 특징과 사용 경험을 설명하고 구매 정보를 안내하는 내용입니다. 음성 문장에 포함된 단정적 표현과 광고 고지를 함께 확인해야 합니다.`
    : "추출된 음성 문장이 없어 화면 글자와 게시물 본문을 기준으로 검수합니다.";
  const analysisSignals = [
    ...safetyChecks.map((check) => ({
      alert: check.detected,
      label: check.label,
      meta: "안전성",
      value: check.detected ? "검토 필요" : "미감지",
    })),
    {
      alert: !(adSignalPassed || captionAdDetected),
      label: "본문 광고 표시",
      meta: "TEXT",
      value: adSignalPassed || captionAdDetected ? "표시 확인" : "확인 필요",
    },
    {
      alert: !ocrAdDetected,
      label: "OCR 광고 표시",
      meta: "OCR",
      value: ocrAdDetected ? "표시 확인" : "확인 필요",
    },
  ];

  return (
    <section
      aria-label="분석 리포트"
      className="fuma-minimal-review-section fuma-creator-analysis-report fuma-content-analysis-report"
    >
      <header className="fuma-minimal-review-section__header fuma-content-analysis-report__header">
        <div><span>CONTENT REPORT</span><h3>분석 리포트</h3></div>
        <time>{content.report.generatedAt}</time>
      </header>

      <div className="fuma-creator-analysis-report__content">
        <section aria-label="분석 요약" className="fuma-content-analysis-summary">
          <span>분석 요약</span>
          <p>{analysisSummary}</p>
        </section>

        <section aria-label="추출 내용" className="fuma-creator-analysis-block">
          <div className="fuma-creator-analysis-block__heading">
            <h3>추출 내용</h3><span>OCR · STT 기반</span>
          </div>
          <dl className="fuma-creator-analysis-claims fuma-content-analysis-extracts">
            <div data-has-content={ocrExtract ? "true" : "false"}>
              <dt><span>OCR 화면 글자</span><small>{ocrExtract?.location ?? "추출 결과 없음"}</small></dt>
              <dd>
                {ocrExtract
                  ? <ViolationHighlightedText annotations={annotations} text={ocrExtract.text} />
                  : "추출된 화면 글자가 없습니다."}
              </dd>
            </div>
            <div data-has-content={sttExtract ? "true" : "false"}>
              <dt><span>STT 음성 문장</span><small>{sttExtract?.location ?? "추출 결과 없음"}</small></dt>
              <dd>
                {sttExtract
                  ? <ViolationHighlightedText annotations={annotations} text={sttExtract.text} />
                  : "추출된 음성 문장이 없습니다."}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-label="위험/광고 요소" className="fuma-creator-analysis-block">
          <div className="fuma-creator-analysis-block__heading">
            <h3>위험/광고 요소</h3><span>본문 및 추출 데이터 기준</span>
          </div>
          <div className="fuma-analysis-engagement__grid fuma-content-analysis-signal-grid">
            {analysisSignals.map((signal) => (
              <article
                className="fuma-analysis-engagement__card fuma-content-analysis-signal-card"
                data-alert={signal.alert}
                key={signal.label}
              >
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
                <small>{signal.meta}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function MinimalFinalReview({
  content,
  onNavigateToViolation,
}: {
  content: ContentReviewFixture;
  onNavigateToViolation: (ordinal: number) => void;
}) {
  const [decision, setDecision] = useState<"승인" | "반려" | null>(null);
  const candidates = content.report.signals.filter((signal) => signal.tone !== "pass");
  const [candidateDecisions, setCandidateDecisions] = useState<Record<string, "위반" | "위반 아님">>({});
  const decidedCount = candidates.filter((candidate) => candidateDecisions[`${candidate.source}-${candidate.title}`]).length;
  const allCandidatesDecided = decidedCount === candidates.length;

  const decideCandidate = (key: string, candidateDecision: "위반" | "위반 아님") => {
    setCandidateDecisions((current) => ({ ...current, [key]: candidateDecision }));
    setDecision(null);
  };

  return (
    <section aria-label="최종 검수" className="fuma-minimal-final-review">
      <header>
        <div><span>FINAL REVIEW</span><h3>최종 검수</h3></div>
        <ShieldCheck aria-hidden="true" size={22} />
      </header>
      <dl>
        <div><dt>검수 상태</dt><dd>{decision ?? "검수 전"}</dd></div>
        <div><dt>후보 판정</dt><dd>{decidedCount} / {candidates.length}</dd></div>
      </dl>
      <section className="fuma-minimal-final-review__candidates">
        <header><strong>위반 여부 판정</strong><span>{decidedCount}/{candidates.length}</span></header>
        {candidates.length > 0 ? candidates.map((candidate, index) => {
          const key = `${candidate.source}-${candidate.title}`;
          const candidateDecision = candidateDecisions[key];
          return (
            <article key={key}>
              <button
                aria-label={`${candidate.title} 위반 위치로 이동`}
                className="fuma-minimal-final-review__candidate-jump"
                onClick={() => onNavigateToViolation(index + 1)}
                type="button"
              >
                <span><span>{index + 1}</span><strong>{candidate.title}</strong></span>
                <blockquote>“{candidate.evidence}”</blockquote>
                <small>{candidate.source}</small>
              </button>
              <div className="fuma-minimal-final-review__candidate-actions">
                <Button
                  aria-pressed={candidateDecision === "위반"}
                  className={candidateDecision === "위반" ? "is-violation" : undefined}
                  onClick={() => decideCandidate(key, "위반")}
                >
                  위반
                </Button>
                <Button
                  aria-pressed={candidateDecision === "위반 아님"}
                  className={candidateDecision === "위반 아님" ? "is-clear" : undefined}
                  onClick={() => decideCandidate(key, "위반 아님")}
                >
                  위반 아님
                </Button>
              </div>
            </article>
          );
        }) : (
          <p><CheckCircle2 aria-hidden="true" size={15} /> 판정할 위반 후보가 없습니다.</p>
        )}
      </section>
      <div className="fuma-minimal-final-review__actions">
        <Button
          aria-pressed={decision === "반려"}
          className={decision === "반려" ? "is-rejected" : undefined}
          disabled={!allCandidatesDecided}
          onClick={() => setDecision("반려")}
        >
          반려
        </Button>
        <Button
          aria-pressed={decision === "승인"}
          className={decision === "승인" ? "is-approved" : undefined}
          disabled={!allCandidatesDecided}
          onClick={() => setDecision("승인")}
        >
          승인
        </Button>
      </div>
      {!allCandidatesDecided ? <p>모든 위반 후보를 먼저 판정해 주세요.</p> : decision ? <p>{decision}으로 선택했습니다.</p> : null}
    </section>
  );
}

function ContentReviewDetailContent({ content }: { content: ContentReviewFixture }) {
  const [focusedViolation, setFocusedViolation] = useState<{
    ordinal: number;
    requestId: number;
  } | null>(null);

  const navigateToViolation = (ordinal: number) => {
    setFocusedViolation((current) => ({
      ordinal,
      requestId: (current?.requestId ?? 0) + 1,
    }));
  };

  return (
    <div className="fuma-minimal-review-layout">
      <main className="fuma-minimal-review-main">
        <MinimalReviewOverview content={content} />
        <MinimalVersionComparison content={content} focusedViolation={focusedViolation} />
        <MinimalAnalysisReport content={content} />
        <ReviewHistory content={content} />
      </main>
      <aside className="fuma-minimal-review-sidebar">
        <MinimalFinalReview content={content} key={content.id} onNavigateToViolation={navigateToViolation} />
      </aside>
    </div>
  );
}

export function ContentReviewDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { contentId } = useParams();
  const content = CONTENT_REVIEW_LIST_ITEMS.find((item) => item.id === contentId)
    ?? findContentReviewFixture(contentId);
  const returnPath = (location.state as { from?: unknown } | null)?.from;
  const pendingContents = reviewRequiredContents();
  const currentPendingIndex = pendingContents.findIndex((item) => item.id === contentId);
  const nextContent = currentPendingIndex >= 0
    ? pendingContents[currentPendingIndex + 1]
    : pendingContents[0];
  const remainingCount = currentPendingIndex >= 0
    ? Math.max(0, pendingContents.length - currentPendingIndex - 1)
    : pendingContents.length;

  return (
    <section className="fuma-page fuma-content-review-detail" data-visual-contract="content-review">
      <PageHeader title="콘텐츠 검수 상세" />
      <div className="fuma-page__body">
        {content ? (
          <>
            <div className="fuma-detail-toolbar fuma-minimal-review-toolbar">
              <button
                className="hsas-button fuma-detail-toolbar__link"
                onClick={() => typeof returnPath === "string" ? navigate(-1) : navigate("/content/reviews")}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.8} />
                대기열
              </button>
              <div>
                <span><strong>{remainingCount}건</strong>의 콘텐츠가 남았습니다.</span>
                <Button
                  className="fuma-content-review-next-button"
                  disabled={!nextContent}
                  onClick={() => nextContent && navigate(`/content/reviews/${nextContent.id}`, { state: location.state })}
                  variant="primary"
                >
                  다음 콘텐츠 <ChevronRight aria-hidden="true" size={14} />
                </Button>
              </div>
            </div>
            <ContentReviewDetailContent content={content} />
          </>
        ) : (
          <EmptyState
            description="요청한 콘텐츠 검수 정보를 확인해 주세요."
            title="대상을 찾을 수 없습니다."
          />
        )}
      </div>
    </section>
  );
}
