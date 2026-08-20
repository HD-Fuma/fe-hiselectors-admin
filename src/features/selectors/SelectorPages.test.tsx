import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

const summary = {
  id: 7,
  selectorsCode: "SEL0007",
  nickname: "홍길동",
  roleId: "ACTIVE",
  roleName: "활성",
  snsCode: "INSTAGRAM",
  snsAccountId: "hong.selector",
  followerCount: 12345,
  profileImageUrl: null,
  createdAt: "2026-08-19T10:00:00",
};

const detail = {
  id: 7,
  selectorsCode: "SEL0007",
  nickname: "홍길동",
  roleId: "ACTIVE",
  roleName: "활성",
  applicationId: 70,
  userId: 700,
  createdAt: "2026-08-19T10:00:00",
  updatedAt: "2026-08-20T09:00:00",
  generations: [{
    generationId: 3,
    generationName: "3기",
    startDate: "2026-07-01T00:00:00",
    endDate: "2026-08-31T23:59:59",
    status: "ACTIVE",
    joinedAt: "2026-07-02T12:00:00",
  }],
  snsAccounts: [{
    id: 11,
    snsCode: "INSTAGRAM",
    accountId: "hong.selector",
    followerCount: 12345,
    profileImageUrl: null,
    lastCollectedAt: "2026-08-20T08:00:00",
  }],
};

function json(data: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify({
    success: status < 400,
    code: status < 400 ? "OK" : "ERROR",
    message: status < 400 ? null : "조회에 실패했습니다.",
    data: status < 400 ? data : null,
  }), { status, headers: { "Content-Type": "application/json" } }));
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (/\/api\/admin\/selectors\/7$/.test(url)) return json(detail);
    if (url.includes("/api/admin/generations")) return json([{ id: 3, generationName: "3기" }]);
    return json({ content: [summary], number: 0, size: 20, totalElements: 1, totalPages: 1 });
  }));
});

describe("selector api pages", () => {
  test("requests list filters and renders server results", async () => {
    renderRoute("/selectors");
    const search = await screen.findByRole("search", { name: "검색 조건" });

    expect(await screen.findByText("SEL0007")).toBeInTheDocument();
    fireEvent.change(within(search).getByRole("textbox", { name: "닉네임" }), {
      target: { value: "홍길동" },
    });
    fireEvent.change(within(search).getByRole("combobox", { name: "SNS" }), {
      target: { value: "INSTAGRAM" },
    });
    fireEvent.change(within(search).getByRole("combobox", { name: "기수" }), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "활동중" }));
    fireEvent.click(within(search).getByRole("button", { name: "조회" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/roleId=ACTIVE.*generationId=3.*nickname=.*snsCode=INSTAGRAM/),
      expect.anything(),
    ));
    expect(screen.getByText("총 1건")).toBeInTheDocument();
  });

  test("renders selector detail accounts and generation history", async () => {
    renderRoute("/selectors/7");
    const panel = await screen.findByRole("dialog", { name: "셀렉터스 상세" });

    expect(await within(panel).findByRole("heading", { name: "홍길동" })).toBeInTheDocument();
    expect(within(panel).getByRole("region", { name: "셀렉터스 SNS 계정" })).toHaveTextContent("hong.selector");
    expect(within(panel).getByRole("region", { name: "셀렉터스 참여 기수 이력" })).toHaveTextContent("3기");
  });

  test("shows the backend list error", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => (
      String(input).includes("/api/admin/generations")
        ? json([])
        : json(null, 500)
    )));

    renderRoute("/selectors");

    expect(await screen.findByRole("heading", { name: "목록을 불러오지 못했습니다" })).toBeInTheDocument();
    expect(screen.getByText("조회에 실패했습니다.")).toBeInTheDocument();
  });
});
