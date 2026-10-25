import { BrandWordmark } from "./brand-wordmark";

const collagePhotos = [
  ["/brand/v2/photos/gallery/campus-friends.webp", ""],
  ["/brand/v2/photos/murals/roadtrip-van.webp", ""],
  ["/brand/v2/photos/murals/summer-beach.webp", ""],
] as const;

export function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <img
          className="landing-mobile-photo"
          src="/brand/v2/photos/hero/festival-selfie.webp"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
        />
        <header className="landing-header">
          <a className="landing-brand" href="/" aria-label="Memora, início">
            <BrandWordmark />
          </a>
          <nav className="landing-nav" aria-label="Navegação principal">
            <a href="/meus-murais">Meus murais</a>
            <a href="/templates">Templates</a>
          </nav>
          <a className="landing-header-cta" href="/criar">
            criar mural
          </a>
        </header>

        <div className="landing-hero-body">
          <div className="landing-copy">
            <p className="landing-eyebrow">Memora</p>
            <h1 id="landing-title" aria-label="seu rolê. suas memórias.">
              seu rolê.
              <br />
              suas <span>memórias.</span>
            </h1>
            <p className="landing-support">
              <span className="landing-support-mobile">memórias feitas pra compartilhar.</span>
              <span className="landing-support-desktop">
                junta a galera, cria um mural e salva tudo que importa.
              </span>
            </p>
            <div className="landing-actions">
              <a className="landing-primary-action" href="/criar">
                criar mural
              </a>
              <a className="landing-secondary-action" href="/biblioteca">
                escolher fotos
              </a>
            </div>
          </div>

          <figure className="landing-collage" aria-label="Momentos para guardar">
            <img
              className="landing-collage-main"
              src="/brand/v2/photos/hero/festival-selfie.webp"
              alt="Amigos celebrando em um festival"
              fetchPriority="high"
            />
            {collagePhotos.map(([src, alt], index) => (
              <img
                className={`landing-collage-photo landing-collage-photo-${index + 1}`}
                src={src}
                alt={alt}
                aria-hidden="true"
                key={src}
              />
            ))}
            <span className="landing-decoration landing-decoration-star" aria-hidden="true">
              ✳
            </span>
            <span className="landing-decoration landing-decoration-note" aria-hidden="true">
              memories, together
            </span>
          </figure>
        </div>
      </section>

      <section className="landing-story-band" aria-label="Sobre a Memora">
        <img
          className="landing-story-photo landing-story-photo-left"
          src="/brand/v2/photos/gallery/beach-campfire.webp"
          alt=""
          aria-hidden="true"
        />
        <p>
          criou. compartilhou. <span>virou memória.</span>
        </p>
        <img
          className="landing-story-photo landing-story-photo-right"
          src="/brand/v2/photos/gallery/festival-lights.webp"
          alt=""
          aria-hidden="true"
        />
      </section>
    </main>
  );
}
