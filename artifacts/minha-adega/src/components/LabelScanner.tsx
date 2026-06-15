import { useRef, useState } from "react";
import { Camera, Upload, Loader2, Sparkles, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LabelData {
  name: string | null;
  producer: string | null;
  vintage: number | null;
  grape: string | null;
  country: string | null;
  region: string | null;
  alcoholContent: string | null;
}

interface Props {
  onExtracted: (data: LabelData) => void;
}

export default function LabelScanner({ onExtracted }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<LabelData | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("Imagem muito grande. Máximo 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setExtracted(null);

      const base64 = dataUrl.split(",")[1];
      const mimeType = file.type;

      setIsAnalyzing(true);
      try {
        const resp = await fetch("/api/wines/analyze-label", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error ?? "Erro na análise");
        }

        const data = (await resp.json()) as LabelData;
        setExtracted(data);

        const fieldsFound = Object.values(data).filter(Boolean).length;
        if (fieldsFound === 0) {
          toast.warning("Não foi possível identificar dados no rótulo");
        } else {
          toast.success(`${fieldsFound} campo${fieldsFound > 1 ? "s" : ""} identificado${fieldsFound > 1 ? "s" : ""}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao analisar rótulo";
        toast.error(msg);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function applyToForm() {
    if (extracted) {
      onExtracted(extracted);
      toast.success("Campos preenchidos! Revise antes de salvar.");
    }
  }

  function clear() {
    setPreview(null);
    setExtracted(null);
  }

  const fieldLabels: Record<keyof LabelData, string> = {
    name: "Nome",
    producer: "Produtor",
    vintage: "Safra",
    grape: "Uva",
    country: "País",
    region: "Região",
    alcoholContent: "Teor alcoólico",
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">Leitura automática de rótulo</span>
      </div>

      {!preview && !isAnalyzing && (
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 min-w-[140px] border-primary/30 hover:bg-primary/10"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="mr-2 h-4 w-4" />
            Tirar foto
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 min-w-[140px] border-primary/30 hover:bg-primary/10"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Escolher arquivo
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {isAnalyzing && (
        <div className="flex items-center gap-3 py-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Analisando rótulo com IA…</span>
        </div>
      )}

      {preview && !isAnalyzing && (
        <div className="flex gap-4 items-start">
          <div className="relative shrink-0">
            <img
              src={preview}
              alt="Rótulo"
              className="w-24 h-32 object-cover rounded-lg border shadow-sm"
            />
            <button
              type="button"
              onClick={clear}
              className="absolute -top-2 -right-2 bg-background border rounded-full p-0.5 shadow-sm hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {extracted && (
            <div className="flex-1 min-w-0">
              <div className="space-y-1 mb-3">
                {(Object.entries(extracted) as [keyof LabelData, string | number | null][])
                  .filter(([, v]) => v !== null)
                  .map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-xs">
                      <span className="text-muted-foreground w-24 shrink-0">{fieldLabels[key]}:</span>
                      <span className="font-medium truncate">{String(value)}</span>
                    </div>
                  ))}
                {Object.values(extracted).every((v) => v === null) && (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum campo identificado. Tente com uma foto mais nítida.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  onClick={applyToForm}
                  disabled={Object.values(extracted).every((v) => v === null)}
                >
                  <CheckCircle className="mr-2 h-3 w-3" />
                  Preencher formulário
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                >
                  Nova foto
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
