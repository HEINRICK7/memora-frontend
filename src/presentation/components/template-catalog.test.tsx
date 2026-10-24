import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateCatalog } from "./template-catalog";

const ORIGINAL_VIEWPORT_WIDTH = window.innerWidth;

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

function countFilters() {
  return screen.getByRole("group", { name: "Quantidade de fotos" });
}

function ratioFilters() {
  return screen.getByRole("group", { name: "Proporção" });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setViewportWidth(ORIGINAL_VIEWPORT_WIDTH);
});

describe("TemplateCatalog (MEM-003-AC01..08)", () => {
  it("renders the eight photo-free previews with accessible name, orientation, and count", () => {
    render(<TemplateCatalog />);
    expect(screen.getByRole("link", { name: "Templates" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const cards = [
      /Single.*1 foto.*Quadrado/i,
      /Duo.*2 fotos.*Paisagem/i,
      /Trio.*3 fotos.*Paisagem/i,
      /Classic strip.*4 fotos.*Retrato/i,
      /Grid.*4 fotos.*Quadrado/i,
      /Polaroid.*1 foto.*Retrato/i,
      /Grid 6.*6 fotos.*Paisagem/i,
      /Story trio.*3 fotos.*Retrato/i,
    ];
    for (const accessibleName of cards) {
      expect(screen.getByRole("button", { name: accessibleName })).toBeInTheDocument();
    }

    expect(screen.queryAllByRole("button", { name: /Selecionado/i })).toHaveLength(0);
    expect(document.querySelectorAll("img[src]")).toHaveLength(0);
  });

  it("does not call fetch when mounted, filtered, or selected", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<TemplateCatalog />);

    await user.click(within(countFilters()).getByRole("button", { name: "4 fotos" }));
    await user.click(within(ratioFilters()).getByRole("button", { name: "1:1" }));
    await user.click(screen.getByRole("button", { name: /Grid.*4 fotos.*Quadrado/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("combines exact photo count and ratio filters and exposes pressed state", async () => {
    const user = userEvent.setup();
    render(<TemplateCatalog />);

    const fourPhotos = within(countFilters()).getByRole("button", {
      name: "4 fotos",
    });
    const square = within(ratioFilters()).getByRole("button", {
      name: "1:1",
    });
    await user.click(fourPhotos);
    await user.click(square);

    expect(fourPhotos).toHaveAttribute("aria-pressed", "true");
    expect(square).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Grid.*4 fotos.*Quadrado/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Classic strip.*4 fotos/i }),
    ).not.toBeInTheDocument();
  });

  it("announces an empty combined result and clears both filters accessibly", async () => {
    const user = userEvent.setup();
    render(<TemplateCatalog />);

    await user.click(within(countFilters()).getByRole("button", { name: "6 fotos" }));
    await user.click(within(ratioFilters()).getByRole("button", { name: "1:1" }));

    expect(await screen.findByText(/nenhum template/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /limpar filtros/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /limpar filtros/i }));

    expect(within(countFilters()).getByRole("button", { name: "Todos" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(ratioFilters()).getByRole("button", { name: /todas as proporções|todos/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getAllByRole("button", { name: /Quadrado|Paisagem|Retrato/i }),
    ).toHaveLength(8);
  });

  it("keeps selection unique, textual, and keyboard operable at a narrow viewport", async () => {
    setViewportWidth(360);
    const user = userEvent.setup();
    render(<TemplateCatalog />);

    const landscape = within(ratioFilters()).getByRole("button", { name: "4:3" });
    for (let tab = 0; tab < 30 && document.activeElement !== landscape; tab += 1) {
      await user.tab();
    }
    expect(landscape).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(landscape).toHaveFocus();
    expect(landscape).toHaveAttribute("aria-pressed", "true");

    const duo = screen.getByRole("button", { name: /Duo.*2 fotos.*Paisagem/i });
    for (let tab = 0; tab < 30 && document.activeElement !== duo; tab += 1) {
      await user.tab();
    }
    expect(duo).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(duo).toHaveFocus();
    expect(duo).toHaveAttribute("aria-pressed", "true");
    expect(duo).toHaveTextContent(/selecionado/i);
    expect(screen.getByRole("status")).toHaveTextContent(/duo.*2 fotos/i);
    expect(screen.getByRole("button", { name: /Trio.*3 fotos/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.keyboard("{Enter}");
    expect(duo).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("clears and announces a selected template when a filter hides it", async () => {
    const user = userEvent.setup();
    render(<TemplateCatalog />);

    const polaroid = screen.getByRole("button", {
      name: /Polaroid.*1 foto.*Retrato/i,
    });
    await user.click(polaroid);
    expect(polaroid).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent(/polaroid.*1 foto/i);

    await user.click(within(ratioFilters()).getByRole("button", { name: "4:3" }));

    expect(screen.queryByRole("button", { name: /Polaroid/i })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/seleção.*removida/i);
    expect(
      screen.getByRole("button", { name: /Duo.*2 fotos.*Paisagem/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
