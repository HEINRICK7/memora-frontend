"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { BrandHeader } from "./brand-header";

type AdminSession = { email: string };
type GateState = "checking" | "signed-out" | "signed-in";

async function readCsrfToken(): Promise<string> {
  const response = await fetch("/api/v1/auth/csrf", {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("csrf_unavailable");
  const payload = await response.json() as { token?: unknown };
  if (typeof payload.token !== "string" || payload.token.length === 0) {
    throw new Error("csrf_unavailable");
  }
  return payload.token;
}

export function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (response.status === 401) {
          if (active) setState("signed-out");
          return;
        }
        if (!response.ok) throw new Error("session_unavailable");
        const payload = await response.json() as AdminSession;
        await readCsrfToken();
        if (!active) return;
        setSession(payload);
        setState("signed-in");
      })
      .catch(() => {
        if (active) {
          setError("Não foi possível conectar ao servidor do Memora.");
          setState("signed-out");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const csrfToken = await readCsrfToken();
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        setError(response.status === 401
          ? "E-mail ou senha inválidos."
          : "Não foi possível entrar agora. Tente novamente.");
        return;
      }
      const payload = await response.json() as AdminSession;
      setSession(payload);
      setPassword("");
      setState("signed-in");
    } catch {
      setError("Não foi possível conectar ao servidor do Memora.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      const csrfToken = await readCsrfToken();
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "X-XSRF-TOKEN": csrfToken },
      });
      if (!response.ok) throw new Error("logout_failed");
      setSession(null);
      setPassword("");
      setState("signed-out");
    } catch {
      setError("Não foi possível encerrar a sessão.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking") {
    return (
      <main className="memora-shell">
        <BrandHeader activePage="murals" />
        <p role="status">Verificando acesso…</p>
      </main>
    );
  }

  if (state === "signed-in") {
    return (
      <>
        <div className="publish-toolbar" aria-label="Sessão administrativa">
          <p>Administrador: {session?.email}</p>
          <button className="button button-secondary" type="button" disabled={busy} onClick={() => void signOut()}>
            Sair
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
        {children}
      </>
    );
  }

  return (
    <main className="memora-shell">
      <BrandHeader activePage="murals" />
      <section className="mural-create-panel" aria-labelledby="admin-login-title">
        <div className="mural-panel-heading">
          <p className="eyebrow">Modo Aniversário</p>
          <h1 id="admin-login-title">Acesso do administrador</h1>
        </div>
        <form className="mural-form" onSubmit={(event) => void signIn(event)}>
          <div className="mural-field">
            <label htmlFor="admin-email">E-mail</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              disabled={busy}
            />
          </div>
          <div className="mural-field">
            <label htmlFor="admin-password">Senha</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              disabled={busy}
            />
          </div>
          {error && <p role="alert">{error}</p>}
          <button className="button button-primary" type="submit" disabled={busy}>
            {busy ? "Entrando…" : "Entrar para criar aniversários"}
          </button>
        </form>
      </section>
    </main>
  );
}
