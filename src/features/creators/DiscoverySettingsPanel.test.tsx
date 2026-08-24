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

test("hides category creation and edits an existing category", async () => {
  const user = userEvent.setup();
  const beauty = { ...fashion, id: 2, code: "BEAUTY", name: "뷰티", displayOrder: 2, enabled: false, keywords: [] };
  const updated = { ...fashion, name: "패션/잡화" };
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(ok(creatorPage))
    .mockResolvedValueOnce(ok([fashion, beauty]))
    .mockResolvedValueOnce(ok([fashion, beauty]))
    .mockResolvedValueOnce(ok(updated))
    .mockResolvedValueOnce(ok([updated, beauty])));

  render(
    <MemoryRouter initialEntries={["/creators"]}>
      <CreatorListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "발굴 설정" }));
  const panel = await screen.findByRole("dialog", { name: "발굴 카테고리·키워드 설정" });
  expect(within(panel).getByRole("button", { name: /패션FASHION/ })).toBeInTheDocument();
  expect(within(panel).getByText("데일리룩")).toBeInTheDocument();
  expect(within(panel).queryByRole("button", { name: "카테고리 추가" })).not.toBeInTheDocument();
  expect(within(panel).queryByText("활성")).not.toBeInTheDocument();
  expect(within(panel).getByText("비활성")).toBeInTheDocument();

  const edit = within(panel).getByRole("button", { name: "패션 카테고리 수정" });
  expect(edit).toHaveClass("hsas-button--secondary");
  expect(edit).not.toHaveClass("hsas-button--ghost");
  await user.click(edit);
  expect(within(panel).queryByLabelText("카테고리 코드")).not.toBeInTheDocument();
  await user.clear(within(panel).getByLabelText("카테고리명"));
  await user.type(within(panel).getByLabelText("카테고리명"), "패션/잡화");
  await user.click(within(panel).getByRole("button", { name: "저장" }));

  expect(await within(panel).findByText("카테고리를 수정했습니다.")).toBeInTheDocument();
  expect(within(panel).getByRole("button", { name: /패션\/잡화FASHION/ })).toBeInTheDocument();
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
    .mockResolvedValueOnce(ok(updated))
    .mockResolvedValueOnce(new Response(JSON.stringify({ message: "목록 조회 실패" }), { status: 503 })));

  render(
    <MemoryRouter initialEntries={["/creators"]}>
      <CreatorListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "발굴 설정" }));
  const panel = await screen.findByRole("dialog", { name: "발굴 카테고리·키워드 설정" });
  await user.click(within(panel).getByRole("button", { name: "패션 카테고리 수정" }));
  await user.click(within(panel).getByRole("button", { name: "저장" }));

  expect(await within(panel).findByRole("alert")).toHaveTextContent(
    "변경사항은 저장됐지만 목록을 새로고침하지 못했습니다.",
  );
  expect(within(panel).getByText("카테고리를 수정했습니다.")).toBeInTheDocument();
  expect(within(panel).queryByLabelText("카테고리명")).not.toBeInTheDocument();
  expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1);
});
