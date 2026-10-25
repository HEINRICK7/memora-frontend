import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingPage } from "./landing-page";

describe("LandingPage", () => {
  it("FE-M01-AC01 / FE-W01-AC04 usa a mensagem de boas-vindas e fotografia local da marca", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: "seu rolê. suas memórias.",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("memórias feitas pra compartilhar.")).toBeInTheDocument();
    expect(screen.getByText(/junta a galera, cria um mural e salva tudo que importa/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Amigos celebrando em um festival" })).toHaveAttribute(
      "src",
      "/brand/v2/photos/hero/festival-selfie.webp",
    );
  });

  it("FE-M01-AC02 / FE-W01-AC03 leva a destinos existentes sem sugerir integração ausente", () => {
    const { container } = render(<LandingPage />);
    const page = within(container);

    const createLinks = page.getAllByRole("link", { name: "criar mural" });
    expect(createLinks.length).toBeGreaterThan(0);
    createLinks.forEach((link) => expect(link).toHaveAttribute("href", "/criar"));
    const navigation = page.getByRole("navigation", { name: "Navegação principal" });
    expect(within(navigation).getByRole("link", { name: "Meus murais" })).toHaveAttribute(
      "href",
      "/meus-murais",
    );
    expect(within(navigation).getByRole("link", { name: "Templates" })).toHaveAttribute(
      "href",
      "/templates",
    );
    expect(within(navigation).queryByRole("link", { name: /perfil|entrar|explorar/i })).toBeNull();
  });

  it("FE-W01-AC05 não exibe prova social sem fonte e oculta adornos decorativos", () => {
    const { container } = render(<LandingPage />);

    expect(container.querySelector("[data-testid='social-proof']")).toBeNull();
    expect(container.querySelector(".landing-decoration")).toHaveAttribute("aria-hidden", "true");
  });
});
