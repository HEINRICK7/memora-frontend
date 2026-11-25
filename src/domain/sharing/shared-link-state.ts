export type SharedLinkState =
  | "LINK_INVALID"
  | "LINK_EXPIRED"
  | "LINK_REVOKED"
  | "MURAL_REMOVED";

export function sharedLinkState(status: number, code?: string): SharedLinkState {
  if (status === 410 && code === "shared_link_expired") return "LINK_EXPIRED";
  if (status === 410 && code === "shared_link_revoked") return "LINK_REVOKED";
  if (status === 404 && code === "shared_mural_unavailable") return "MURAL_REMOVED";
  return "LINK_INVALID";
}

export function sharedLinkMessage(state: SharedLinkState): string {
  switch (state) {
    case "LINK_EXPIRED":
      return "Este link expirou.";
    case "LINK_REVOKED":
      return "Este link foi revogado. Uma imagem já aberta pode continuar disponível por até 60 segundos.";
    case "MURAL_REMOVED":
      return "Este mural não está disponível.";
    case "LINK_INVALID":
      return "Este link não está disponível.";
  }
}
