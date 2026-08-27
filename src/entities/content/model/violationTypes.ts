import type { ContentViolationType } from "../api";

export interface ContentViolationTypeOption {
  label: string;
  value: ContentViolationType;
}

export const CONTENT_VIOLATION_TYPE_OPTIONS: readonly ContentViolationTypeOption[] = [
  { value: "AD_DISCLOSURE_INVALID", label: "광고 수수료 안내문구 표시" },
  { value: "AFFILIATE_LINK_INVALID", label: "제휴링크 누락·불일치" },
  { value: "ABUSIVE_LANGUAGE", label: "욕설/비속어" },
  { value: "HATE_DISCRIMINATION", label: "혐오/차별 표현" },
  { value: "VIOLENCE_THREAT", label: "폭력/위협 표현" },
  { value: "SEXUAL_CONTENT", label: "선정적 콘텐츠" },
  { value: "POLITICAL_CONTENT", label: "정치적 콘텐츠" },
  { value: "SOCIAL_CONTROVERSY", label: "사회적 논란" },
  { value: "FALSE_EXAGGERATED_CLAIM", label: "허위/과장 표현" },
  { value: "BRAND_REPUTATION_DAMAGE", label: "브랜드 평판 훼손" },
];
