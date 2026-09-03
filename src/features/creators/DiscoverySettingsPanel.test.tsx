import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CreatorListPage } from "./CreatorPages";

const fashion = {
  id: 1,
  code: "FASHION",
  name: "패션",
  displayOrder: 1,
  enabled: true,
  keywords: [{ id: 10, keyword: "데일리룩", enabled: true, priority: 5, lastRunAt: null }],
};

const creatorPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };

const taskRun = {
  runId: "creator-sync-category-1",
  taskType: "CREATOR_SYNC",
  triggerType: "ADMIN_TRIGGERED",
  status: "QUEUED",
};

const fashionCoverage = {
  categoryId: 1,
  categoryCode: "FASHION",
  categoryName: "패션",
  executedKeywordCount: 1,
  minimumKeywordCount: 3,
  observedCreators: 8,
  estimatedCreators: null,
  coveragePercent: null,
  singletonCreators: 8,
  doubletonCreators: 0,
  status: "INSUFFICIENT_DATA",
  recommendation: "최소 3개 키워드가 필요합니다. 현재 1개가 실행됐습니다.",
  keywords: [{
    keywordId: 10,
    keyword: "데일리룩",
    lastRunAt: "2026-08-25T10:00:00",
    discoveredCreators: 8,
    exclusiveCreators: 8,
    overlapCreators: 0,
    overlapPercent: 0,
  }],
};

afterEach(() => localStorage.clear());

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, code: "OK", message: null, data }), { status });
}

test("hides category creation and edits an existing category", async () => {
  const user = userEvent.setup();
  const beauty = { ...fashion, id: 2, code: "BEAUTY", name: "뷰티", displayOrder: 2, enabled: false, keywords: [] };
  const updated = { ...fashion, name: "패션/잡화" };
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(ok(creatorPage))
    .mockResolvedValueOnce(ok([fashion, beauty]))
    .mockResolvedValueOnce(ok([fashion, beauty]))
    .mockResolvedValueOnce(ok([fashionCoverage]))
    .mockResolvedValueOnce(ok(updated))
    .mockResolvedValueOnce(ok([updated, beauty]))
    .mockResolvedValueOnce(ok([fashionCoverage])));

  render(
    <MemoryRouter initialEntries={["/creators"]}>
      <CreatorListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "발굴 설정" }));
  const panel = await screen.findByRole("dialog", { name: "크리에이터 발굴 키워드 설정" });
  expect(within(panel).getByRole("button", { name: /패션.*키워드 1개/ })).toBeInTheDocument();
  expect(within(panel).queryByText("FASHION")).not.toBeInTheDocument();
  expect(within(panel).getByText("데일리룩")).toBeInTheDocument();
  const coverage = panel.querySelector('[aria-label="패션 발굴 포화도"]');
  expect(coverage).toBeInTheDocument();
  expect(coverage).not.toBeVisible();
  expect(within(panel).queryByRole("button", { name: "카테고리 추가" })).not.toBeInTheDocument();
  expect(within(panel).queryByText("활성")).not.toBeInTheDocument();
  expect(within(panel).getByText("비활성")).toBeInTheDocument();

  const edit = within(panel).getByRole("button", { name: "패션 카테고리 수정" });
  await user.click(within(panel).getByLabelText("패션 카테고리 메뉴"));
  await user.click(edit);
  expect(within(panel).queryByLabelText("카테고리 코드")).not.toBeInTheDocument();
  await user.clear(within(panel).getByLabelText("카테고리명"));
  await user.type(within(panel).getByLabelText("카테고리명"), "패션/잡화");
  await user.click(within(panel).getByRole("button", { name: "저장" }));

  expect(await within(panel).findByText("카테고리를 수정했습니다.")).toBeInTheDocument();
  expect(within(panel).getByRole("button", { name: /패션\/잡화.*키워드 1개/ })).toBeInTheDocument();
  expect(vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === "PATCH")?.[1]).toMatchObject({
    method: "PATCH",
    body: JSON.stringify({ name: "패션/잡화", displayOrder: 1, enabled: true }),
  });
});

test("closes a successful edit form even when the following reload fails", async () => {
  const user = userEvent.setup();
  const updated = { ...fashion, name: "패션/잡화" };
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(ok(creatorPage))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok([fashionCoverage]))
    .mockResolvedValueOnce(ok(updated))
    .mockResolvedValueOnce(new Response(JSON.stringify({ message: "목록 조회 실패" }), { status: 503 }))
    .mockResolvedValueOnce(ok([fashionCoverage])));

  render(
    <MemoryRouter initialEntries={["/creators"]}>
      <CreatorListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "발굴 설정" }));
  const panel = await screen.findByRole("dialog", { name: "크리에이터 발굴 키워드 설정" });
  await user.click(within(panel).getByLabelText("패션 카테고리 메뉴"));
  await user.click(within(panel).getByRole("button", { name: "패션 카테고리 수정" }));
  await user.click(within(panel).getByRole("button", { name: "저장" }));

  expect(await within(panel).findByRole("alert")).toHaveTextContent(
    "변경사항은 저장됐지만 목록을 새로고침하지 못했습니다.",
  );
  expect(within(panel).getByText("카테고리를 수정했습니다.")).toBeInTheDocument();
  expect(within(panel).queryByLabelText("카테고리명")).not.toBeInTheDocument();
  expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1);
});

test("starts discovery for only the selected category", async () => {
  const user = userEvent.setup();
  const idempotencyKey = "00000000-0000-4000-8000-000000000010";
  localStorage.setItem("creator-discovery-current-month-only", "true");
  vi.spyOn(crypto, "randomUUID").mockReturnValue(idempotencyKey);
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(ok(creatorPage))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok([fashionCoverage]))
    .mockResolvedValueOnce(ok(taskRun, 202)));

  render(
    <MemoryRouter initialEntries={["/creators"]}>
      <CreatorListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "발굴 설정" }));
  const panel = await screen.findByRole("dialog", { name: "크리에이터 발굴 키워드 설정" });
  expect(within(panel).queryByLabelText("인기 영상 업로드 기간")).not.toBeInTheDocument();
  await user.click(within(panel).getByRole("button", { name: "패션만 발굴" }));

  expect(await within(panel).findByRole("status")).toHaveTextContent(
    "패션 발굴 작업을 시작했습니다. 완료 여부는 알림센터에서 확인하세요.",
  );
  const discoveryCall = vi.mocked(fetch).mock.calls.find(([input]) => (
    new URL(String(input)).pathname === "/api/admin/discovery/categories/1/run"
  ));
  expect(new URL(String(discoveryCall?.[0])).searchParams.get("currentMonthOnly")).toBe("true");
  expect(discoveryCall?.[1]).toMatchObject({ method: "POST" });
  expect(new Headers(discoveryCall?.[1]?.headers).get("Idempotency-Key")).toBe(idempotencyKey);
});

test("restores stored creators instead of discovering in FAST mode", async () => {
  const user = userEvent.setup();
  localStorage.setItem("selectors-content-fast-mode", "true");
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(ok(creatorPage))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok([fashionCoverage]))
    .mockResolvedValueOnce(ok({ restoredCount: 2, restoredCreatorIds: [11, 12] }))
    .mockResolvedValue(ok(creatorPage)));

  render(
    <MemoryRouter initialEntries={["/creators"]}>
      <CreatorListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "발굴 설정" }));
  const panel = await screen.findByRole("dialog", { name: "크리에이터 발굴 키워드 설정" });
  await user.click(within(panel).getByRole("button", { name: "패션만 발굴" }));

  expect(await within(panel).findByRole("status", {}, { timeout: 5000 })).toHaveTextContent(
    "패션 크리에이터 2명을 발굴했습니다.",
  );
  const demoCall = vi.mocked(fetch).mock.calls.find(([input]) => (
    new URL(String(input)).pathname === "/api/admin/creators/demo/categories/1"
  ));
  expect(demoCall?.[1]).toMatchObject({ method: "POST" });
  expect(vi.mocked(fetch).mock.calls.some(([input]) => (
    new URL(String(input)).pathname === "/api/admin/discovery/categories/1/run"
  ))).toBe(false);
  expect(JSON.parse(localStorage.getItem("selectors-fast-demo-glow") ?? "{}").ids).toEqual([11, 12]);
});

test("deletes a discovery keyword", async () => {
  const user = userEvent.setup();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(ok(creatorPage))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok([fashionCoverage]))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(ok([{ ...fashion, keywords: [] }]))
    .mockResolvedValueOnce(ok([])));

  render(
    <MemoryRouter initialEntries={["/creators"]}>
      <CreatorListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "발굴 설정" }));
  const panel = await screen.findByRole("dialog", { name: "크리에이터 발굴 키워드 설정" });
  await user.click(within(panel).getByRole("button", { name: "데일리룩 키워드 삭제" }));

  expect(window.confirm).toHaveBeenCalledWith("'데일리룩' 키워드를 삭제할까요?");
  expect(await within(panel).findByText("키워드를 삭제했습니다.")).toBeInTheDocument();
  const deleteCall = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === "DELETE");
  expect(new URL(String(deleteCall?.[0])).pathname).toBe("/api/admin/categories/1/keywords/10");
});
