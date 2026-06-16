import { useEffect, useRef } from "react";
import { Wine } from "lucide-react";
import { useAuth } from "@/lib/auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }): void;
          renderButton(
            element: HTMLElement,
            config: { theme: string; size: string; width?: number },
          ): void;
        };
      };
    };
  }
}

function loadGoogleScript() {
  const existingScript = document.querySelector<HTMLScriptElement>(
    "script[src='https://accounts.google.com/gsi/client']",
  );
  if (existingScript) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar o Google SSO"));
    document.head.appendChild(script);
  });
}

export function LoginScreen() {
  const { config, error, loading, signIn } = useAuth();
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!config?.configured || !config.clientId || !buttonRef.current) return;

    let cancelled = false;
    const clientId = config.clientId;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) void signIn(response.credential);
          },
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 280,
        });
      })
      .catch(() => {
        // The message below covers the failure path without exposing internals.
      });

    return () => {
      cancelled = true;
    };
  }, [config, signIn]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <section className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 text-primary">
          <Wine className="h-7 w-7" />
          <div>
            <h1 className="font-serif text-2xl font-bold">MyCellar</h1>
            <p className="text-sm text-muted-foreground">Acesse sua adega</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando login...</p>
        ) : !config?.configured ? (
          <p className="text-sm text-destructive">
            Login Google ainda não configurado no ambiente de produção.
          </p>
        ) : (
          <div className="min-h-10" ref={buttonRef} />
        )}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </section>
    </main>
  );
}
