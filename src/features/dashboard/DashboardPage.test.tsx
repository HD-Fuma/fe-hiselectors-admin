import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, test, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";

function json(data: unknown) {
  return new Response(JSON.stringify({ code: "OK", data, message: null, success: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("오늘 지표를 표시하고 기존 하단 지표 카드를 제거한다", () => {
  const { container } = render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "대시보드" })).toHaveClass("hsas-visually-hidden");
  expect(container.querySelector(".fuma-dashboard")).toBeInTheDocument();
  expect(screen.getByText("오늘 접수된 콘텐츠")).toBeInTheDocument();
  expect(screen.getByText("오늘 발생한 매출")).toBeInTheDocument();
  expect(screen.getByText("매출·정산 추이")).toBeInTheDocument();
  expect(screen.queryByText("검수 완료율")).not.toBeInTheDocument();
  expect(screen.queryByText("평균 검수시간")).not.toBeInTheDocument();
  expect(screen.queryByText("지원자 처리율")).not.toBeInTheDocument();
  expect(screen.queryByText("콘텐츠 증감률")).not.toBeInTheDocument();
  expect(screen.queryByText("진행 중 캠페인")).not.toBeInTheDocument();
  expect(screen.queryByText("현재 기수 콘텐츠")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();

  const inspectionCard = screen.getByText("검수가 필요한 콘텐츠").closest(".fuma-dashboard-card");
  expect(inspectionCard).not.toBeNull();
  expect(within(inspectionCard as HTMLElement).getByText("Instagram")).toBeInTheDocument();
  expect(within(inspectionCard as HTMLElement).getByText("YouTube")).toBeInTheDocument();
  expect(within(inspectionCard as HTMLElement).queryByText("신규")).not.toBeInTheDocument();
  expect(within(inspectionCard as HTMLElement).queryByText("수정")).not.toBeInTheDocument();
  expect(within(inspectionCard as HTMLElement).queryByText("위반")).not.toBeInTheDocument();
});

test("최근 7일 매출과 정산 추이를 기간 API 한 번으로 조회한다", async () => {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://localhost");
    if (url.pathname === "/api/admin/contents") {
      return json({ content: [], totalPages: 1 });
    }
    if (url.pathname === "/api/admin/applications") {
      return json({ content: [], totalElements: 0, totalPages: 0 });
    }
    if (url.pathname === "/api/admin/dashboard/sales-settlement-trend") {
      const startDate = url.searchParams.get("startDate") ?? "";
      const endDate = url.searchParams.get("endDate") ?? "";
      return json({
        endDate,
        points: [
          {
            date: endDate,
            salesAmount: 1_000,
            settlementAmount: 50,
          },
        ],
        startDate,
      });
    }
    return new Response(null, { status: 404 });
  }));

  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

  await waitFor(() => expect(screen.getByLabelText(/최근 7일 매출 및 정산액 추이/))
    .toBeInTheDocument());

  const performanceRequests = vi.mocked(fetch).mock.calls
    .map(([input]) => new URL(String(input), "http://localhost"))
    .filter((url) => url.pathname === "/api/admin/dashboard/sales-settlement-trend");
  expect(performanceRequests).toHaveLength(1);
  expect(performanceRequests[0].pathname).toBe("/api/admin/dashboard/sales-settlement-trend");
  expect(performanceRequests[0].searchParams.get("startDate")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(performanceRequests[0].searchParams.get("endDate")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(
    Date.parse(performanceRequests[0].searchParams.get("endDate") ?? "")
      - Date.parse(performanceRequests[0].searchParams.get("startDate") ?? ""),
  ).toBe(6 * 86_400_000);
  const latestRevenue = screen.getByRole("list", { name: "오늘 매출 및 정산액" });
  expect(within(latestRevenue).getByText("1,000원")).toBeInTheDocument();
  expect(within(latestRevenue).getByText("50원")).toBeInTheDocument();
});
