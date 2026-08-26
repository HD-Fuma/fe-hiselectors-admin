import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";

const api = vi.hoisted(() => ({
  adaptContentInspection: vi.fn((content: { inspectionStatus: string | null }) => ({
    inspectionStatus: content.inspectionStatus === "APPROVED" ? "승인" : "검수 대기",
  })),
  getAdminApplications: vi.fn(),
  getCampaigns: vi.fn(),
  getContentPerformanceSummary: vi.fn(),
  getCurrentGenerationContents: vi.fn(),
  getSelectors: vi.fn(),
}));

vi.mock("../../entities/application", () => ({
  getAdminApplications: api.getAdminApplications,
}));
vi.mock("../../entities/campaign", () => ({ getCampaigns: api.getCampaigns }));
vi.mock("../../entities/content", () => ({
  adaptContentInspection: api.adaptContentInspection,
  getCurrentGenerationContents: api.getCurrentGenerationContents,
}));
vi.mock("../../entities/performance", () => ({
  getContentPerformanceSummary: api.getContentPerformanceSummary,
}));
vi.mock("../../entities/selectors", () => ({ getSelectors: api.getSelectors }));

const page = (content: unknown[], totalElements: number) => ({
  content,
  number: 0,
  size: 100,
  totalElements,
  totalPages: 1,
});

beforeEach(() => {
  const today = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).format(new Date());
  const campaign = {
    createdAt: `${today}T00:00:00`,
    description: "캠페인",
    endDate: today,
    id: 1,
    productIds: [],
    products: [],
    startDate: today,
    status: "ACTIVE",
    thumbnailUrl: null,
    title: "오늘 캠페인",
    updatedAt: `${today}T00:00:00`,
  };

  api.getAdminApplications.mockResolvedValue(page([], 4));
  api.getCurrentGenerationContents.mockResolvedValue([
    { inspectionStatus: "PENDING" },
    { inspectionStatus: "APPROVED" },
  ]);
  api.getCampaigns.mockImplementation((input: { status?: string }) => Promise.resolve(
    input.status === "ACTIVE" ? page([], 3) : page([campaign], 1),
  ));
  api.getSelectors.mockResolvedValue(page([], 12));
  api.getContentPerformanceSummary.mockResolvedValue({
    currentGenerationContentCount: 28,
    currentGenerationName: "3기",
  });
});

test("shows database-backed tasks, statistics, and shortcuts", async () => {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);

  expect(await screen.findByRole("link", { name: /승인 대기 지원자.*4건/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /검수 대기 콘텐츠.*1건/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /오늘 시작·종료하는 캠페인.*1건/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /진행 중 캠페인.*3/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /전체 셀렉터스.*12/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /현재 기수 콘텐츠.*28.*3기/ })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "관리자 바로가기" })).toBeInTheDocument();
  expect(screen.queryByText(/오늘 확인할 업무/)).not.toBeInTheDocument();
  expect(screen.queryByText(/DB 조회 결과/)).not.toBeInTheDocument();
});
