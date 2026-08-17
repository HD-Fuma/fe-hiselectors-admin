import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

test("shows fixture contents newest first while keeping inspection start oldest first", async () => {
  const { router } = renderRoute("/content/inspections?view=list");

  const list = await screen.findByRole("region", { name: "수집 콘텐츠 리스트" });
  const visibleIds = within(list).getAllByRole("row").slice(1, 6).map((row) => (
    within(row).getAllByRole("cell")[0].textContent
  ));
  expect(visibleIds).toEqual(["ct-009", "ct-049", "ct-029", "ct-008", "ct-038"]);

  fireEvent.click(screen.getByRole("button", { name: "검수 시작" }));
  await waitFor(() => {
    expect(router.state.location.pathname).toBe("/content/inspections/ct-001");
  });
});
