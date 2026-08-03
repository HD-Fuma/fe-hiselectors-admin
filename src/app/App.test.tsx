import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("renders the FUMA application root", () => {
  const { container } = render(<App initialEntries={["/login"]} />);
  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(container.querySelector('[data-app-ready="true"]')).toBeInTheDocument();
});
