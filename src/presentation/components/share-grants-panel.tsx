"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GrantScope, MuralAccessGateway, MuralSummary, ViewGrant } from "../../application/mural-gateway";
import { muralApiGateway } from "../../infrastructure/mural-api-gateway";
import { createUuid } from "../../infrastructure/uuid";
import { BrandHeader } from "./brand-header";
import { BirthdayQrDesigner } from "./birthday-qr-designer";
import panelStyles from "./share-grants-panel.module.css";

type ShareGrantsPanelProps = {
  muralId: string;
  autoCreate?: boolean;
  gateway?: MuralAccessGateway;
};

export function ShareGrantsPanel({ muralId, autoCreate = false, gateway = muralApiGateway }: ShareGrantsPanelProps) {
  const [grants, setGrants] = useState<ViewGrant[]>([]);
  const [mural, setMural] = useState<MuralSummary | null>(null);
  const [freshUrl, setFreshUrl] = useState<string | null>(null);
  const [freshScope, setFreshScope] = useState<GrantScope | null>(null);
  const [creatingGrant, setCreatingGrant] = useState(false);
  const [grantKey, setGrantKey] = useState(createUuid);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoCreateAttempted = useRef(false);

  const reload = useCallback(async () => {
    const [nextGrants, nextMural] = await Promise.all([
      gateway.listViewGrants(muralId),
      gateway.getMural(muralId),
    ]);
    setGrants(nextGrants.map((grant) => ({
      grantId: grant.grantId,
      scope: grant.scope,
      status: grant.status,
      createdAt: grant.createdAt,
      expiresAt: grant.expiresAt,
      revokedAt: grant.revokedAt,
    })));
    setMural(nextMural);
  }, [gateway, muralId]);

  useEffect(() => {
    let active = true;
    reload().catch(() => {
      if (active) setError("Não foi possível listar os links.");
    });
    return () => {
      active = false;
    };
  }, [reload]);

  async function createGrantLink(scope: GrantScope) {
    if (creatingGrant) return;
    setCreatingGrant(true);
    setError(null);
    setMessage(null);
    try {
      const created = await gateway.createViewGrant(muralId, grantKey, null, scope);
      if (created.tokenReturned && created.shareUrl) {
        setFreshUrl(created.shareUrl);
        setFreshScope(created.scope);
        setGrantKey(createUuid());
        setMessage(created.scope === "CONTRIBUTE"
          ? "Convite do Modo Niver criado. O QR e o endereço ficam disponíveis só enquanto esta resposta estiver aberta."
          : "Link criado. Ele aparece completo só nesta resposta.");
        await reload().catch(() => {
          setError("O link foi criado, mas a lista não foi atualizada.");
        });
        return;
      }

      setFreshUrl(null);
      setFreshScope(null);
      setGrantKey(createUuid());
      setMessage("Este pedido já tinha sido enviado. O segredo não pode ser recuperado. Revogue e crie outro link.");
      await reload().catch(() => {
        setError("Não foi possível atualizar a lista de links.");
      });
    } finally {
      setCreatingGrant(false);
    }
  }

  useEffect(() => {
    if (!autoCreate || autoCreateAttempted.current) return;
    autoCreateAttempted.current = true;
    window.history.replaceState(window.history.state, "", window.location.pathname);
    void createGrantLink("CONTRIBUTE").catch(() => setError("A festa foi publicada, mas não foi possível gerar o QR. Tente novamente."));
  }, [autoCreate, createGrantLink]);

  function closeFreshLink() {
    setFreshUrl(null);
    setFreshScope(null);
  }

  async function copyFreshUrl() {
    if (!freshUrl) return;
    try {
      await navigator.clipboard.writeText(freshUrl);
      setMessage("Link copiado.");
    } catch {
      setMessage("Não foi possível copiar sozinho. Selecione o link no campo.");
    }
  }

  async function shareFreshUrl() {
    if (!freshUrl) return;
    if (typeof navigator.share !== "function") {
      await copyFreshUrl();
      return;
    }
    try {
      await navigator.share({ url: freshUrl });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setMessage("Não foi possível abrir o compartilhamento. O link continua no campo para copiar.");
    }
  }

  return (
    <main className="memora-shell share-screen">
      <BrandHeader activePage="murals" />
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {freshUrl && (
        <section className={`share-success ${panelStyles.freshLink}`} aria-label="Link recém-criado">
          <div className="share-success-toolbar">
            <p className="eyebrow">compartilhar</p>
            <button className="button button-secondary" type="button" onClick={closeFreshLink}>
              Fechar
            </button>
          </div>
          <h1>QR do Modo Niver pronto</h1>
          <p>
            {mural?.title ?? "Mural publicado"}. {freshScope === "CONTRIBUTE"
              ? "Cada convidado envia fotos para seu álbum privado e escolhe quais compartilhar com todos."
              : "Agora dá para mandar o link. Fechar esconde este endereço."}
          </p>
          {freshScope === "CONTRIBUTE" && (
            <BirthdayQrDesigner muralId={muralId} eventName={mural?.title ?? "Aniversário"} shareUrl={freshUrl} />
          )}
          <details className={panelStyles.shareLink}>
            <summary>Ver o endereço do convite</summary>
            <label htmlFor="fresh-share-url">endereço do convite</label>
            <input id="fresh-share-url" readOnly value={freshUrl} />
          </details>
          <button className="button button-primary share-copy" type="button" onClick={() => void copyFreshUrl()}>
            copiar link
          </button>
          <button className="button button-secondary" type="button" onClick={() => void shareFreshUrl()}>
            compartilhar
          </button>
        </section>
      )}
      <header className="mural-studio-heading">
        <p className="eyebrow">Modo Aniversário</p>
        <h1>QR para os convidados</h1>
        <p>Escaneie, toque em Começar e crie seu álbum. Você escolhe quais fotos compartilhar com todos.</p>
      </header>
      <button
        className="button button-primary"
        type="button"
        disabled={creatingGrant}
        onClick={() => void createGrantLink("CONTRIBUTE").catch(() => setError("Não foi possível criar o QR."))}
      >
        {creatingGrant ? "Gerando QR…" : "Gerar QR do Modo Niver"}
      </button>
      <ul className="grant-list">
        {grants.map((grant) => (
          <li key={grant.grantId}>
            <span>{grant.scope === "CONTRIBUTE" ? "Modo Niver" : "Visualização"}</span>
            <span>{grant.status === "ACTIVE" ? "Ativo" : grant.status === "REVOKED" ? "Revogado" : "Expirado"}</span>
            <time dateTime={grant.createdAt}>{grant.createdAt}</time>
            {confirming === grant.grantId ? (
              <div role="group" aria-label="Confirmar revogação">
                <p>
                  Novas aberturas deste link serão bloqueadas. Uma URL de imagem já emitida pode continuar válida por até 60 segundos.
                </p>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() =>
                    void gateway.revokeViewGrant(muralId, grant.grantId).then(async () => {
                      setConfirming(null);
                      setFreshUrl(null);
                      setFreshScope(null);
                      setMessage("Novas resoluções deste link foram bloqueadas.");
                      await reload();
                    })
                  }
                >
                  Confirmar revogação
                </button>
                <button className="button button-secondary" type="button" onClick={() => setConfirming(null)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button className="button button-secondary" type="button" onClick={() => setConfirming(grant.grantId)}>
                Revogar
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
