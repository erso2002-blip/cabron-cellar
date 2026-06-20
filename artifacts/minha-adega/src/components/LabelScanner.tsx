import { useRef, useState } from "react";
import { Camera, Upload, Loader2, Sparkles, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authFetch } from "@/lib/auth";
import { compactImage, MAX_LABEL_PHOTO_FILE_SIZE, uploadPhotoToStorage } from "@/lib/labelPhoto";

interface LabelData {
  name: string | null;
  producer: string | null;
  vintage: number | null;
  grape: string | null;
  country: string | null;
  region: string | null;
  alcoholContent: string | null;
  wineryWebsiteUrl: string | null;
}

interface Props {
  onExtracted: (data: LabelData) => void;
  onPhotoUploaded?: (url: string) => void;
}

export default function LabelScanner({ onExtracted, onPhotoUploaded }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<LabelData | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > MAX_LABEL_PHOTO_FILE_SIZE) {
      toast.error("Imagem muito grande. Máximo 4MB.");
      return;
    }

    try {
      const { dataUrl, mimeType } = await compactImage(file);
      setPreview(dataUrl);
      setExtracted(null);

      const base64 = dataUrl.split(",")[1];

      // Run AI analysis and photo upload in parallel
      setIsAnalyzing(true);
      setIsUploading(true);

      const [analysisResult, uploadedUrl] = await Promise.allSettled([
        authFetch("/api/wines/analyze-label", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        }).then(async (resp) => {
          if (!resp.ok) {
            const err = (await resp.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(err.error ?? "Erro na análise");
          }
          return resp.json() as Promise<LabelData>;
        }),
        uploadPhotoToStorage(file),
      ]);

      setIsAnalyzing(false);
      setIsUploading(false);

      // Handle analysis result
      if (analysisResult.status === "fulfilled") {
        const data = analysisResult.value;
        setExtracted(data);
        const fieldsFound = Object.values(data).filter(Boolean).length;
        if (fieldsFound === 0) {
          toast.warning("Não foi possível identificar dados no rótulo");
        } else {
          toast.success(
            `${fieldsFound} campo${fieldsFound > 1 ? "s" : ""} identificado${fieldsFound > 1 ? "s" : ""}`
          );
        }
      } else {
        const msg =
          analysisResult.reason instanceof Error
            ? analysisResult.reason.message
            : "Erro ao analisar rótulo";
        toast.error(msg);
      }

      // Handle photo upload result
      if (uploadedUrl.status === "fulfilled" && uploadedUrl.value && onPhotoUploaded) {
        onPhotoUploaded(uploadedUrl.value);
      } else if (onPhotoUploaded) {
        onPhotoUploaded(dataUrl);
      }
    } catch {
      toast.error("Não foi possível ler a imagem selecionada");
      setIsAnalyzing(false);
      setIsUploading(false);
    }
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
    wineryWebsiteUrl: "Site oficial",
  };

  const isBusy = isAnalyzing || isUploading;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          Leitura automática de rótulo
        </span>
      </div>

      {!preview && !isBusy && (
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

      {isBusy && (
        <div className="flex items-center gap-3 py-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {isAnalyzing
              ? "Analisando rótulo com IA…"
              : "Salvando foto…"}
          </span>
        </div>
      )}

      {preview && !isBusy && (
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
                {(
                  Object.entries(extracted) as [
                    keyof LabelData,
                    string | number | null,
                  ][]
                )
                  .filter(([, v]) => v !== null)
                  .map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-xs">
                      <span className="text-muted-foreground w-24 shrink-0">
                        {fieldLabels[key]}:
                      </span>
                      <span className="font-medium truncate">{String(value)}</span>
                    </div>
                  ))}
                {Object.values(extracted).every((v) => v === null) && (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum campo identificado. Tente com uma foto mais nítida.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  size="sm"
                  className="w-full sm:flex-1"
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
                  className="w-full sm:w-auto"
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
