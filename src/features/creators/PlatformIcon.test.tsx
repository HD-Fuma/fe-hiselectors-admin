import { render, screen } from "@testing-library/react";
import { PlatformIcon } from "../../components/social/PlatformIcon";

test.each(["Instagram", "YouTube"] as const)(
  "renders an accessible %s platform icon",
  (platform) => {
    const { container, rerender } = render(<PlatformIcon platform={platform} />);
    expect(screen.getByRole("img", { name: `${platform} 플랫폼` })).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    rerender(<PlatformIcon decorative platform={platform} />);
    expect(screen.queryByRole("img", { name: `${platform} 플랫폼` })).not.toBeInTheDocument();
  },
);
