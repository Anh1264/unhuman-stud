import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProjectSummary } from "@/server/services/content.service";

/**
 * next/image needs the framework's image pipeline; a plain <img> keeps the test
 * about what ProjectCard itself renders (src, alt, and the surrounding copy).
 */
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const { ProjectCard } = await import("@/components/site/ProjectCard");

afterEach(cleanup);

function project(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    slug: "ember-line",
    title: "Ember Line",
    tagline: "A study in heat",
    summary: "A short film shot entirely with generative tools.",
    year: 2025,
    accentColor: "#d4af37",
    cover: {
      url: "/images/ember-cover.webp",
      width: 1600,
      height: 900,
      blurDataUrl: null,
      alt: "A figure lit by embers",
      caption: null,
    },
    tags: ["Short film", "AI"],
    ...overrides,
  };
}

describe("ProjectCard", () => {
  it("links to the project and renders its title, tagline and summary", () => {
    render(<ProjectCard project={project()} />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/work/ember-line");
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      "Ember Line",
    );
    expect(screen.getByText("A study in heat")).toBeTruthy();
    expect(
      screen.getByText("A short film shot entirely with generative tools."),
    ).toBeTruthy();
    expect(link.textContent).toContain("View project");
  });

  it("gives the cover image the alt text stored with the asset", () => {
    render(<ProjectCard project={project()} />);

    const image = screen.getByRole("img");
    expect(image.getAttribute("src")).toBe("/images/ember-cover.webp");
    expect(image.getAttribute("alt")).toBe("A figure lit by embers");
  });

  it("renders every tag", () => {
    render(<ProjectCard project={project()} />);

    expect(screen.getByText("Short film")).toBeTruthy();
    expect(screen.getByText("AI")).toBeTruthy();
  });

  it("omits the image and the tagline when the project has neither", () => {
    render(<ProjectCard project={project({ cover: null, tagline: null })} />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByText("A study in heat")).toBeNull();
    expect(screen.getByRole("heading", { level: 3 })).toBeTruthy();
  });
});
