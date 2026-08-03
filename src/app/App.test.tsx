import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("renders the FUMA application root", () => {
  render(<App initialEntries={["/login"]} />);
  expect(screen.getByRole("main")).toBeInTheDocument();
});
