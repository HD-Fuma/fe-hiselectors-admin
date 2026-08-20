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

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, code: "OK", message: null, data }), { status });
}

test("opens discovery settings and creates a category through the real API contract", async () => {
  const user = userEvent.setup();
  const beauty = { ...fashion, id: 2, code: "BEAUTY", name: "뷰티", displayOrder: 2, keywords: [] };
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(ok(creatorPage))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok(beauty, 201))
    .mockResolvedValueOnce(ok([fashion, beauty])));

  render(
    <MemoryRouter initialEntries={["/creators"]}>
      <CreatorListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "발굴 설정" }));
  const panel = await screen.findByRole("dialog", { name: "발굴 카테고리·키워드 설정" });
  expect(within(panel).getByRole("button", { name: /패션FASHION/ })).toBeInTheDocument();
  expect(within(panel).getByText("데일리룩")).toBeInTheDocument();

  await user.click(within(panel).getByRole("button", { name: "카테고리 추가" }));
  await user.type(within(panel).getByLabelText("카테고리 코드"), "beauty");
  await user.type(within(panel).getByLabelText("카테고리명"), "뷰티");
  await user.clear(within(panel).getByLabelText("노출 순서"));
  await user.type(within(panel).getByLabelText("노출 순서"), "2");
  await user.click(within(panel).getByRole("button", { name: "저장" }));

  expect(await within(panel).findByText("카테고리를 추가했습니다.")).toBeInTheDocument();
  expect(within(panel).getByRole("button", { name: /뷰티BEAUTY/ })).toBeInTheDocument();
  expect(vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === "POST")?.[1]).toMatchObject({
    method: "POST",
    body: JSON.stringify({ code: "BEAUTY", name: "뷰티", displayOrder: 2 }),
  });
});

test("closes a successful create form even when the following reload fails", async () => {
  const user = userEvent.setup();
  const beauty = { ...fashion, id: 2, code: "BEAUTY", name: "뷰티", displayOrder: 2, keywords: [] };
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(ok(creatorPage))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok([fashion]))
    .mockResolvedValueOnce(ok(beauty, 201))
    .mockResolvedValueOnce(new Response(JSON.stringify({ message: "목록 조회 실패" }), { status: 503 })));

  render(
    <MemoryRouter initialEntries={["/creators"]}>
      <CreatorListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "발굴 설정" }));
  const panel = await screen.findByRole("dialog", { name: "발굴 카테고리·키워드 설정" });
  await user.click(within(panel).getByRole("button", { name: "카테고리 추가" }));
  await user.type(within(panel).getByLabelText("카테고리 코드"), "BEAUTY");
  await user.type(within(panel).getByLabelText("카테고리명"), "뷰티");
  await user.click(within(panel).getByRole("button", { name: "저장" }));

  expect(await within(panel).findByRole("alert")).toHaveTextContent(
    "변경사항은 저장됐지만 목록을 새로고침하지 못했습니다.",
  );
  expect(within(panel).getByText("카테고리를 추가했습니다.")).toBeInTheDocument();
  expect(within(panel).queryByLabelText("카테고리 코드")).not.toBeInTheDocument();
  expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
});
