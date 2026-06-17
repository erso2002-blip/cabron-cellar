import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosBrowser() {
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return isIos;
}

interface PwaInstallButtonProps {
  className?: string;
  compact?: boolean;
  onAction?: () => void;
}

export function PwaInstallButton({ className, compact = false, onAction }: PwaInstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [canShowIosHelp, setCanShowIosHelp] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());
    const iosBrowser = isIosBrowser();
    setCanShowIosHelp(iosBrowser);
    setShowIosHelp(iosBrowser);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowIosHelp(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isInstalled || (!installPrompt && !canShowIosHelp)) {
    return null;
  }

  const handleInstall = async () => {
    onAction?.();

    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
        setIsInstalled(true);
      }

      return;
    }

    setShowIosHelp((current) => !current);
  };

  return (
    <div
      className={cn(
        "rounded-md border border-primary/20 bg-primary/5 p-3 text-sm",
        compact && "p-2",
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className="w-full justify-start"
        onClick={handleInstall}
        data-testid="pwa-install-button"
      >
        {installPrompt ? <Download className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
        Instalar app
      </Button>
      {showIosHelp ? (
        <p className="mt-2 leading-snug text-muted-foreground">
          No iPhone: toque em Compartilhar no Safari e depois em Adicionar à Tela de Início.
        </p>
      ) : null}
    </div>
  );
}
