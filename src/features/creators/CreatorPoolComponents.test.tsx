import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { CreatorCardGrid } from "./CreatorCardGrid";
import { CreatorResultToolbar } from "./CreatorResultToolbar";
import { CREATORS } from "./fixtures";

test("toolbar owns the static sort and mutually exclusive view buttons", async () => {
  const user = userEvent.setup();
  const onViewChange = vi.fn();

  render(
    <CreatorResultToolbar count={4} onViewChange={onViewChange} view="cards" />,
  );

  expect(screen.getByText("크리에이터 목록")).toBeInTheDocument();
  expect(screen.getByText("총 4건")).toBeInTheDocument();
  expect(screen.getByText("ER순").closest("button,select")).toBeNull();
  expect(screen.getByRole("button", { name: "카드 보기" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "목록 보기" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await user.click(screen.getByRole("button", { name: "목록 보기" }));

  expect(onViewChange).toHaveBeenCalledWith("list");
});

test("grid exposes a named list and maps creators to list items", () => {
  render(
    <MemoryRouter>
      <CreatorCardGrid creators={[CREATORS[0]]} />
    </MemoryRouter>,
  );

  const grid = screen.getByRole("list", { name: "크리에이터 목록" });
  expect(grid).toHaveAttribute("data-visual-contract", "creator-card-grid");
  expect(grid.querySelectorAll(':scope > [role="listitem"]')).toHaveLength(1);
  expect(
    within(grid).getByRole("article", { name: "김서연 크리에이터 카드" }),
  ).toBeInTheDocument();
});
