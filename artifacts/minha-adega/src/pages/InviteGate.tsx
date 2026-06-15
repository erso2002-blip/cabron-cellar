import { useState } from "react";
import { Wine, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onGranted: () => void;
}

export default function InviteGate({ onGranted }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const resp = await fetch("/api/invite/grant", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (resp.ok) {
        onGranted();
      } else {
        setError(true);
        setCode("");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/aged-paper.png')",
        }}
      />

      <div className="w-full max-w-sm bg-card border shadow-xl rounded-xl p-8 text-center relative z-10 space-y-6">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
          <Wine className="w-8 h-8 text-primary-foreground" />
        </div>

        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-1">
            Cabron Cellar
          </h1>
          <p className="text-muted-foreground font-serif italic text-sm">
            Acesso privado
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Código de acesso"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              className={`pl-9 text-center tracking-widest ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
              autoFocus
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              Código incorreto. Tente novamente.
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!code.trim() || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Entrar
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          Solicite o código de acesso ao proprietário da adega.
        </p>
      </div>
    </div>
  );
}
