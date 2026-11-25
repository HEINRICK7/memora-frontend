import { BrandWordmark } from "./brand-wordmark";

type BrandHeaderProps = {
  activePage: "home" | "murals" | "templates";
};

export function BrandHeader({ activePage }: BrandHeaderProps) {
  return (
    <header className="masthead">
      <a className="brand-link" href="/" aria-label="Memora, início">
        <BrandWordmark />
      </a>
      <nav className="primary-nav" aria-label="Navegação principal">
        <a href="/" aria-current={activePage === "home" ? "page" : undefined}>
          Início
        </a>
        <a
          href="/meus-murais"
          aria-current={activePage === "murals" ? "page" : undefined}
        >
          Meus murais
        </a>
        <a
          href="/criar"
          aria-current={activePage === "templates" ? "page" : undefined}
        >
          Modo Aniversário
        </a>
      </nav>
      <span className="masthead-note">álbum da festa</span>
    </header>
  );
}
