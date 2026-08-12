import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { CREATORS } from "../../entities/creator";
import { CreatorEvidenceCard } from "./CreatorEvidenceCard";

const creator = CREATORS[0];
const cardName = `${creator.profile.handle} 크리에이터 카드`;

test("opens details from the card and keeps only the proposal action visible", async () => {
  const user = userEvent.setup();
  const onOpen = vi.fn();

  render(
    <MemoryRouter>
      <ul><CreatorEvidenceCard creator={creator} onOpen={onOpen} /></ul>
    </MemoryRouter>,
  );

  expect(screen.queryByText("상세 보기")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: `${creator.profile.handle} 제안하기` }))
    .toHaveTextContent("제안하기");

  await user.click(screen.getByRole("button", { name: cardName }));
  expect(onOpen).toHaveBeenCalledWith(creator);
});

test("selects from the whole card while selection mode is active", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();

  render(
    <MemoryRouter>
      <ul>
        <CreatorEvidenceCard
          creator={creator}
          onSelect={onSelect}
          selectionMode
        />
      </ul>
    </MemoryRouter>,
  );

  const card = screen.getByRole("button", { name: cardName });
  await user.click(card);
  card.focus();
  await user.keyboard("{Enter}");

  expect(onSelect).toHaveBeenNthCalledWith(1, creator.id);
  expect(onSelect).toHaveBeenNthCalledWith(2, creator.id);
});
