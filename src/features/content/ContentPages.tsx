import { useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Captions,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Images,
  LayoutGrid,
  List,
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
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { PlatformIcon } from "../creators/PlatformIcon";
import {
  CONTENT_REVIEWS,
  REVIEW_TYPE_LABELS,
  findContentReviewFixture,
  type ContentFormat,
  type ContentReviewFixture,
  type ContentSnapshot,
  type ReviewStatus,
} from "./fixtures";

const REVIEW_TYPE_OPTIONS = ["전체", "신규 콘텐츠", "위반 수정본", "일반 수정본"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);
const PLATFORM_OPTIONS = ["전체", "Instagram", "YouTube"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
type ContentReviewCategory = "전체" | "신규 등록" | "수정 제출" | "위반 감지" | "검수 완료";

const CONTENT_REVIEW_CATEGORIES: readonly ContentReviewCategory[] = [
  "전체",
  "신규 등록",
  "수정 제출",
  "위반 감지",
  "검수 완료",
];

function contentReviewCategory(content: ContentReviewFixture): Exclude<ContentReviewCategory, "전체"> {
  if (content.reviewStatus === "승인") return "검수 완료";
  if (content.reviewStatus === "위반 확정") return "위반 감지";
  if (content.reviewType !== "NEW" || content.reviewStatus === "수정 요청") return "수정 제출";
  return "신규 등록";
}

function contentReviewCategoryTone(
  category: Exclude<ContentReviewCategory, "전체">,
): NonNullable<StatusPillProps["tone"]> {
  if (category === "검수 완료") return "approved";
  if (category === "위반 감지") return "rejected";
  if (category === "수정 제출") return "pending";
  return "neutral";
}

interface FilterFieldProps {
  children: ReactNode;
  htmlFor: string;
  label: string;
}

function FilterField({ children, htmlFor, label }: FilterFieldProps) {
  return (
    <label className="fuma-filter-field" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function SearchActions() {
  return (
    <>
      <Button variant="primary">조회</Button>
      <Button>초기화</Button>
    </>
  );
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

function QueueFilters() {
  return (
    <SearchPanel actions={<SearchActions />}>
      <FilterField htmlFor="content-review-keyword" label="콘텐츠/작성자">
        <TextInput
          aria-label="콘텐츠/작성자"
          id="content-review-keyword"
          placeholder="콘텐츠 ID 또는 작성자"
        />
      </FilterField>
      <FilterField htmlFor="content-review-type" label="검수 유형">
        <Select id="content-review-type" options={REVIEW_TYPE_OPTIONS} />
      </FilterField>
      <FilterField htmlFor="content-review-platform" label="플랫폼">
        <Select id="content-review-platform" options={PLATFORM_OPTIONS} />
      </FilterField>
    </SearchPanel>
  );
}

const CONTENT_REVIEW_AUTHORS = [
  "김서연", "박도윤", "이지아", "오하늘", "한유진", "정하린", "윤채원", "서민준", "배수아", "임도현",
  "최가은", "문지후", "유나영", "강태윤", "신예린", "장서준", "노아린", "홍지민", "백승현", "송하윤",
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
      annotations: undefined,
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
      className="fuma-content-collection__card"
      data-content-format={contentFormatKey(content.contentFormat)}
      onClick={() => onSelect(content)}
      type="button"
    >
      <header className="fuma-content-collection__card-header">
        <span aria-hidden="true" className="fuma-content-collection__avatar">{content.author.slice(0, 1)}</span>
        <span className="fuma-content-collection__author">
          <strong>{content.author}</strong>
          <small>{content.cohort}</small>
        </span>
        <PlatformIcon platform={contentPlatform(content.sourcePlatform)} />
        <StatusPill tone={reviewStatusTone(content.reviewStatus)}>{content.reviewStatus}</StatusPill>
      </header>
      <div className="fuma-content-collection__media">
        <span className="fuma-content-collection__format">{content.contentFormat}</span>
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
        <span>{issueCount ? `검수 항목 ${issueCount}개` : "검수 항목 없음"}</span>
      </footer>
    </button>
  );
}

function ContentReviewCollection({
  contents,
  onChangeView,
  onChangeViolationOnly,
  onSelect,
  onSelectCategory,
  selectedCategory,
  violationOnly,
  viewMode,
}: {
  contents: readonly ContentReviewFixture[];
  onChangeView: (viewMode: "grid" | "list") => void;
  onChangeViolationOnly: (violationOnly: boolean) => void;
  onSelect: (content: ContentReviewFixture) => void;
  onSelectCategory: (category: ContentReviewCategory) => void;
  selectedCategory: ContentReviewCategory;
  violationOnly: boolean;
  viewMode: "grid" | "list";
}) {
  return (
    <section aria-label="수집 콘텐츠 목록" className="fuma-content-collection">
      <header className="fuma-content-collection__header">
        <div>
          <strong>수집 콘텐츠 {contents.length}건</strong>
          <span>카드를 선택하면 콘텐츠 원본과 검수 결과를 확인할 수 있습니다.</span>
        </div>
      </header>
      <ContentReviewCategoryTabs selectedCategory={selectedCategory} onSelect={onSelectCategory} />
      <div className="fuma-content-collection__controls">
        <label className="fuma-content-collection__violation-toggle">
          <input
            checked={violationOnly}
            onChange={(event) => onChangeViolationOnly(event.target.checked)}
            type="checkbox"
          />
          <span aria-hidden="true" />
          <b>위반 항목만</b>
        </label>
        <div aria-label="보기 방식" className="fuma-content-collection__view-switch" role="group">
          <button
            aria-pressed={viewMode === "grid"}
            onClick={() => onChangeView("grid")}
            type="button"
          >
            <LayoutGrid aria-hidden="true" size={16} /> 그리드 보기
          </button>
          <button
            aria-pressed={viewMode === "list"}
            onClick={() => onChangeView("list")}
            type="button"
          >
            <List aria-hidden="true" size={16} /> 리스트 보기
          </button>
        </div>
      </div>
      {viewMode === "grid" ? (
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
  selectedCategory,
  onSelect,
}: {
  selectedCategory: ContentReviewCategory;
  onSelect: (category: ContentReviewCategory) => void;
}) {
  return (
    <nav aria-label="콘텐츠 처리 구분" className="fuma-content-review-status-tabs">
      {CONTENT_REVIEW_CATEGORIES.map((category) => (
        <button
          aria-pressed={selectedCategory === category}
          key={category}
          onClick={() => onSelect(category)}
          type="button"
        >
          {category}
        </button>
      ))}
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
  ) ?? "전체";
  const violationOnly = searchParams.get("issues") === "1";
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const visibleContents = CONTENT_REVIEW_LIST_ITEMS.filter((content) => {
    const matchesCategory = selectedCategory === "전체"
      || contentReviewCategory(content) === selectedCategory;
    const hasViolation = content.report.signals.some((signal) => signal.tone !== "pass");
    return matchesCategory && (!violationOnly || hasViolation);
  });

  const updateListParam = (key: "category" | "issues" | "view", value: string, defaultValue: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === defaultValue) nextParams.delete(key);
    else nextParams.set(key, value);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <section className="fuma-page" data-visual-contract="content-review">
      <PageHeader screenCode="CT101" title="콘텐츠 검수" />
      <div className="fuma-page__body">
        <QueueFilters />
        <ContentReviewCollection
          contents={visibleContents}
          onChangeView={(nextViewMode) => updateListParam("view", nextViewMode, "grid")}
          onChangeViolationOnly={(nextViolationOnly) => (
            updateListParam("issues", nextViolationOnly ? "1" : "0", "0")
          )}
          onSelect={(content) => navigate(`/content/reviews/${content.id}`, {
            state: { from: `${location.pathname}${location.search}` },
          })}
          onSelectCategory={(category) => updateListParam("category", category, "전체")}
          selectedCategory={selectedCategory}
          violationOnly={violationOnly}
          viewMode={viewMode}
        />
      </div>
    </section>
  );
}

function ReviewHistory({ content }: { content: ContentReviewFixture }) {
  return (
    <section aria-label="검수 이력" className="fuma-text-review-section">
      <header className="fuma-text-review-section__header">
        <div><span>HISTORY</span><h3>검수 이력</h3></div>
      </header>
      <ol className="fuma-text-review-history">
        {content.report.history.map((item) => (
          <li key={`${item.at}-${item.label}`}>
            <Clock3 aria-hidden="true" size={15} />
            <div><strong>{item.label}</strong><span>{item.actor}</span></div>
            <time>{item.at}</time>
          </li>
        ))}
      </ol>
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

function MinimalVersionCard({
  content,
  label,
  snapshot,
}: {
  content: ContentReviewFixture;
  label: string;
  snapshot: ContentSnapshot;
}) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
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

  return (
    <article
      className="fuma-minimal-version-card"
      data-content-format={contentFormatKey(content.contentFormat)}
      data-platform={platform.toLowerCase()}
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
            <img alt={`${content.author} ${label} 미디어 ${visibleIndex + 1}`} src={activeMedia.url} />
          ) : (
            <Images aria-hidden="true" size={26} />
          )}
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
              <p><b>{handle}</b> {snapshot.text}</p>
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
              <p>{snapshot.text}</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function MinimalVersionComparison({ content }: { content: ContentReviewFixture }) {
  return (
    <section className="fuma-minimal-review-section">
      <header className="fuma-minimal-review-section__header">
        <h3>{content.previousSnapshot ? "수정 전·후 변경 내용" : "등록 콘텐츠"}</h3>
        <span>{content.previousSnapshot ? `${content.changeItems.length}건 수정됨` : "최초 등록"}</span>
      </header>
      {content.previousSnapshot && content.changeItems.length > 0 ? (
        <ul className="fuma-minimal-version-changes">
          {content.changeItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}
      <div className={`fuma-minimal-version-grid${content.previousSnapshot ? "" : " is-single"}`}>
        {content.previousSnapshot ? (
          <MinimalVersionCard content={content} label="수정 전" snapshot={content.previousSnapshot} />
        ) : null}
        <MinimalVersionCard content={content} label={content.previousSnapshot ? "수정 후" : "등록 콘텐츠"} snapshot={content.currentSnapshot} />
      </div>
    </section>
  );
}

function MinimalAnalysisReport({ content }: { content: ContentReviewFixture }) {
  const ocrExtract = content.report.extracts.find((extract) => extract.type === "OCR");
  const sttExtract = content.report.extracts.find((extract) => extract.type === "STT");
  const violations = content.report.signals.filter((signal) => signal.tone !== "pass");
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

  return (
    <section aria-label="분석 리포트" className="fuma-minimal-review-section">
      <header className="fuma-minimal-review-section__header">
        <h3>분석 리포트</h3>
        <time>{content.report.generatedAt}</time>
      </header>

      <div className="fuma-minimal-context-summary">
        <strong>STT 텍스트 기반 맥락 요약</strong>
        <p>{sttExtract
          ? `${content.contentTitle}의 특징과 사용 경험을 설명하고 구매 정보를 안내하는 내용입니다. 음성 문장에 포함된 단정적 표현과 광고 고지를 함께 확인해야 합니다.`
          : "추출된 음성 문장이 없어 화면 글자와 게시물 본문을 기준으로 검수합니다."}</p>
      </div>

      <div className="fuma-minimal-extract-grid">
        <article>
          <header><strong>OCR 화면 글자</strong><span>{ocrExtract?.location ?? "추출 결과 없음"}</span></header>
          <p>{ocrExtract?.text ?? "추출된 화면 글자가 없습니다."}</p>
        </article>
        <article>
          <header><strong>STT 음성 문장</strong><span>{sttExtract?.location ?? "추출 결과 없음"}</span></header>
          <p>{sttExtract?.text ?? "추출된 음성 문장이 없습니다."}</p>
        </article>
      </div>

      <section className="fuma-minimal-safety-checks">
        <h4>안전성 확인</h4>
        <div>
          {safetyChecks.map((check) => (
            <article data-detected={check.detected} key={check.label}>
              <span>{check.label}</span>
              <strong>{check.detected ? "검토 필요" : "미감지"}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="fuma-minimal-ad-check">
        <header><h4>광고 표시 상태</h4><StatusPill tone={adSignalPassed || captionAdDetected ? "approved" : "rejected"}>{adSignalPassed || captionAdDetected ? "표시 확인" : "확인 필요"}</StatusPill></header>
        <dl>
          <div><dt>게시물 본문</dt><dd>{captionAdDetected ? "광고 문구 확인" : "광고 문구 미확인"}</dd></div>
          <div><dt>OCR 화면 글자</dt><dd>{ocrAdDetected ? "광고 문구 확인" : "광고 문구 미확인"}</dd></div>
        </dl>
      </section>

      <section className="fuma-minimal-violations">
        <header><h4>수정 필요 내용</h4><span>{violations.length}건</span></header>
        {violations.length > 0 ? (
          <div>
            {violations.map((signal) => (
              <article key={`${signal.source}-${signal.title}`}>
                <div><strong>{signal.title}</strong><span>{signal.source}</span></div>
                <blockquote>“{signal.evidence}”</blockquote>
                <p>{signal.guidance ?? signal.detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="fuma-minimal-violations__clear"><CheckCircle2 aria-hidden="true" size={15} /> 수정이 필요한 위반 내역이 없습니다.</p>
        )}
      </section>
    </section>
  );
}

function MinimalFinalReview({ content }: { content: ContentReviewFixture }) {
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
        <header><strong>위반 여부 선택</strong><span>{decidedCount}/{candidates.length}</span></header>
        {candidates.length > 0 ? candidates.map((candidate, index) => {
          const key = `${candidate.source}-${candidate.title}`;
          const candidateDecision = candidateDecisions[key];
          return (
            <article key={key}>
              <div><span>{index + 1}</span><strong>{candidate.title}</strong></div>
              <blockquote>“{candidate.evidence}”</blockquote>
              <small>{candidate.source}</small>
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
  return (
    <div className="fuma-minimal-review-layout">
      <main className="fuma-minimal-review-main">
        <MinimalReviewOverview content={content} />
        <MinimalVersionComparison content={content} />
        <MinimalAnalysisReport content={content} />
        <ReviewHistory content={content} />
      </main>
      <aside className="fuma-minimal-review-sidebar">
        <MinimalFinalReview content={content} key={content.id} />
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
  const pendingContents = CONTENT_REVIEW_LIST_ITEMS.filter((item) => item.reviewStatus === "검수 대기");
  const currentPendingIndex = pendingContents.findIndex((item) => item.id === contentId);
  const nextContent = currentPendingIndex >= 0
    ? pendingContents[currentPendingIndex + 1]
    : pendingContents[0];
  const remainingCount = currentPendingIndex >= 0
    ? Math.max(0, pendingContents.length - currentPendingIndex - 1)
    : pendingContents.length;

  return (
    <section className="fuma-page fuma-content-review-detail" data-visual-contract="content-review">
      <PageHeader screenCode="CT102" title="콘텐츠 검수 상세" />
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
