import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/site/SiteFooter";

afterEach(cleanup);

describe("SiteFooter", () => {
  it("renders a contentinfo landmark with the studio credit", () => {
    render(<SiteFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain("Unhuman Stud · Aiden Vu");
  });

  it("shows the current year in the copyright line", () => {
    render(<SiteFooter />);

    expect(
      screen.getByText(new RegExp(`© ${new Date().getFullYear()}`)),
    ).toBeTruthy();
  });

  it("links to work and contact", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "Work" }).getAttribute("href")).toBe(
      "/work",
    );
    expect(
      screen.getByRole("link", { name: "Contact" }).getAttribute("href"),
    ).toBe("/contact");
  });
});
