"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContributionItem, MuralAccessGateway } from "../../application/mural-gateway";
import { muralApiGateway } from "../../infrastructure/mural-api-gateway";
import { BrandHeader } from "./brand-header";

type ContributionQueueProps = {
  muralId: string;
  gateway?: MuralAccessGateway;
};

const STATUS_LABEL: Record<ContributionItem["status"], string> = {
  UPLOADING: "Enviando",
  READY: "Privada no álbum do convidado",
  PENDING: "Recebida",
  PUBLISHED: "No álbum",
  APPROVED: "Aprovada",
  REJECTED: "Recusada",
  FAILED: "Falhou",
};

export function ContributionQueue({ muralId, gateway = muralApiGateway }: ContributionQueueProps) {
  const [items, setItems] = useState<ContributionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setItems(await gateway.listContributions(muralId));
  }, [gateway, muralId]);

  useEffect(() => {
    let active = true;
    reload().catch(() => {
      if (active) setError("Não foi possível abrir as contribuições.");
    });
    return () => {
      active = false;
    };
  }, [reload]);

  return (
    <main className="memora-shell">
      <BrandHeader activePage="murals" />
      <header className="mural-studio-heading">
        <p className="eyebrow">Modo Aniversário</p>
        <h1>Fotos dos convidados</h1>
      </header>
      {error && <p role="alert">{error}</p>}
      <ul className="grant-list">
        {items.map((item) => (
          <li key={item.contributionId}>
            {item.previewUrl && <img src={item.previewUrl} alt="" width={96} height={96} />}
            <span>{item.displayName ?? "Sem nome"}</span>
            <span>{STATUS_LABEL[item.status]}</span>
          </li>
        ))}
      </ul>
      {items.length === 0 && !error && <p>Nenhuma contribuição chegou por enquanto.</p>}
    </main>
  );
}
