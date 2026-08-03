export interface CohortFixture {
  id: string;
  name: string;
  recruitmentPeriod: string;
  activityPeriod: string;
  status: "모집 예정" | "모집 중" | "마감";
  participantCount: number;
}

export interface SelectorFixture {
  id: string;
  name: string;
  cohort: string;
  sns: string;
  status: "활동 중" | "경고" | "박탈" | "수료";
  contentCount: number;
  violationCount: number;
  clicks: number;
  conversions: number;
  recentActivity: string;
}

export interface QualificationFixture {
  selectorId: string;
  name: string;
  cohort: string;
  currentStatus: SelectorFixture["status"];
  proposedStatus: SelectorFixture["status"];
  penaltyCount: number;
  revocationReason: string;
  blacklisted: boolean;
  nextCohortRestricted: boolean;
  changeReason: string;
}

export const COHORTS: CohortFixture[] = [
  {
    id: "cohort-04",
    name: "4기",
    recruitmentPeriod: "2026-08-10 ~ 2026-08-24",
    activityPeriod: "2026-09-01 ~ 2026-11-30",
    status: "모집 예정",
    participantCount: 0,
  },
  {
    id: "cohort-03",
    name: "3기",
    recruitmentPeriod: "2026-07-20 ~ 2026-08-10",
    activityPeriod: "2026-08-17 ~ 2026-11-16",
    status: "모집 중",
    participantCount: 38,
  },
  {
    id: "cohort-02",
    name: "2기",
    recruitmentPeriod: "2026-03-01 ~ 2026-03-15",
    activityPeriod: "2026-04-01 ~ 2026-06-30",
    status: "마감",
    participantCount: 54,
  },
];

export const SELECTORS: SelectorFixture[] = [
  {
    id: "sl-001",
    name: "김서연",
    cohort: "3기",
    sns: "Instagram / YouTube",
    status: "활동 중",
    contentCount: 18,
    violationCount: 0,
    clicks: 12840,
    conversions: 428,
    recentActivity: "2026-08-02",
  },
  {
    id: "sl-002",
    name: "박도윤",
    cohort: "3기",
    sns: "YouTube",
    status: "경고",
    contentCount: 11,
    violationCount: 2,
    clicks: 7640,
    conversions: 206,
    recentActivity: "2026-08-01",
  },
  {
    id: "sl-003",
    name: "이지아",
    cohort: "2기",
    sns: "Instagram",
    status: "박탈",
    contentCount: 7,
    violationCount: 3,
    clicks: 3120,
    conversions: 54,
    recentActivity: "2026-07-18",
  },
  {
    id: "sl-004",
    name: "오하늘",
    cohort: "2기",
    sns: "Instagram",
    status: "수료",
    contentCount: 24,
    violationCount: 0,
    clicks: 18600,
    conversions: 711,
    recentActivity: "2026-07-31",
  },
];

const DOYOON_QUALIFICATION: QualificationFixture = {
  selectorId: "sl-002",
  name: "박도윤",
  cohort: "3기",
  currentStatus: "경고",
  proposedStatus: "경고",
  penaltyCount: 2,
  revocationReason: "-",
  blacklisted: false,
  nextCohortRestricted: false,
  changeReason: "패널티 2회 경고 상태 유지",
};

export const SELECTED_QUALIFICATION: QualificationFixture = {
  selectorId: "sl-003",
  name: "이지아",
  cohort: "2기",
  currentStatus: "박탈",
  proposedStatus: "활동 중",
  penaltyCount: 3,
  revocationReason: "콘텐츠 운영 기준 위반 3회 누적",
  blacklisted: true,
  nextCohortRestricted: true,
  changeReason: "위반 콘텐츠 삭제 및 소명 확인",
};

const HANEUL_QUALIFICATION: QualificationFixture = {
  selectorId: "sl-004",
  name: "오하늘",
  cohort: "2기",
  currentStatus: "수료",
  proposedStatus: "수료",
  penaltyCount: 0,
  revocationReason: "-",
  blacklisted: false,
  nextCohortRestricted: false,
  changeReason: "2기 활동 기간 종료",
};

export const QUALIFICATIONS: QualificationFixture[] = [
  DOYOON_QUALIFICATION,
  SELECTED_QUALIFICATION,
  HANEUL_QUALIFICATION,
];
