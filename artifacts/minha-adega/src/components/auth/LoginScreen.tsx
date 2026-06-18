import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

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
  const {
    config,
    error,
    loading,
    requestEmailCode,
    signIn,
    verifyEmailCode,
  } = useAuth();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  useEffect(() => {
    if (!acceptedLegal) {
      if (buttonRef.current) buttonRef.current.innerHTML = "";
      return;
    }
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
  }, [acceptedLegal, config, signIn]);

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailMessage(null);
    await requestEmailCode(email);
    setCodeSent(true);
    setEmailMessage("Código enviado. Verifique seu e-mail.");
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailMessage(null);
    await verifyEmailCode(email, code);
  }

  const emailLoginConfigured = config?.emailLogin?.configured;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <section className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <img
            src="/logo.svg"
            alt="MyCellar"
            className="mb-3 h-14 w-auto max-w-[220px]"
          />
          <p className="text-sm text-muted-foreground">Acesse sua adega</p>
        </div>

        <div className="space-y-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando login...</p>
          ) : config?.configured && acceptedLegal ? (
            <div className="min-h-10" ref={buttonRef} />
          ) : config?.configured ? (
            <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Aceite os termos para liberar o login com Google.
            </p>
          ) : null}

          {config?.configured && emailLoginConfigured ? (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          ) : null}

          {emailLoginConfigured ? (
            codeSent ? (
              <form className="space-y-3" onSubmit={handleVerifyCode}>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Código de 6 dígitos"
                  required
                  value={code}
                />
                <Button
                  className="w-full"
                  disabled={loading || code.length !== 6 || !acceptedLegal}
                >
                  Entrar com código
                </Button>
                <button
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setCodeSent(false);
                    setCode("");
                    setEmailMessage(null);
                  }}
                  type="button"
                >
                  Usar outro e-mail
                </button>
              </form>
            ) : (
              <form className="space-y-3" onSubmit={handleRequestCode}>
                <Input
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  required
                  type="email"
                  value={email}
                />
                <Button className="w-full" disabled={loading || !acceptedLegal}>
                  Receber código por e-mail
                </Button>
              </form>
            )
          ) : !config?.configured && !loading ? (
            <p className="text-sm text-destructive">
              Login por e-mail ainda não configurado no ambiente de produção.
            </p>
          ) : null}
        </div>

        <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <Checkbox
            checked={acceptedLegal}
            onCheckedChange={(checked) => setAcceptedLegal(checked === true)}
          />
          <span>
            Li e concordo com os{" "}
            <a className="text-primary underline-offset-4 hover:underline" href="/termos">
              Termos de Uso
            </a>{" "}
            e com a{" "}
            <a className="text-primary underline-offset-4 hover:underline" href="/privacidade">
              Politica de Privacidade
            </a>
            , incluindo o tratamento dos meus dados para funcionamento do MyCellar.
          </span>
        </label>

        {emailMessage ? (
          <p className="mt-4 text-sm text-muted-foreground">{emailMessage}</p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </section>
    </main>
  );
}
