import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";

test("opens and closes work tabs as screens are visited", async () => {
  const user = userEvent.setup();
  const { router } = renderRoute("/creators");

  await act(async () => {
    await router.navigate("/performance/contents");
  });

  const workTabs = screen.getByRole("navigation", { name: "작업 탭" });
  expect(within(workTabs).getByRole("link", { name: "크리에이터 풀" })).toBeInTheDocument();
  expect(await within(workTabs).findByRole("link", { name: "콘텐츠 성과" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await user.click(
    within(workTabs).getByRole("button", { name: "콘텐츠 성과 탭 닫기" }),
  );

  expect(await screen.findByRole(
    "heading",
    { name: "크리에이터 풀" },
    { timeout: 3_000 },
  )).toBeInTheDocument();
});
