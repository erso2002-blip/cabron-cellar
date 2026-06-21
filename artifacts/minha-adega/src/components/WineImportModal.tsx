import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { authFetch } from "@/lib/auth";

interface WineImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

interface ImportResult {
  successful: number;
  failed: number;
  errors: string[];
  wines?: any[];
  message?: string;
}

export function WineImportModal({ open, onOpenChange, onImportSuccess }: WineImportModalProps) {
  const [step, setStep] = useState<"initial" | "uploading" | "success" | "error">("initial");
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      setIsLoading(true);
      const response = await authFetch("/api/wines/template", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Falha ao baixar o template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template-vinhos.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Template baixado com sucesso!");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Erro ao baixar o template");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = [".xlsx", ".xls"];
    const fileName = file.name.toLowerCase();
    const isValidFile = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidFile) {
      toast.error("Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 10MB)");
      return;
    }

    setStep("uploading");
    setIsLoading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = (e.target?.result as string).split(",")[1]; // Extract base64 from data URL

        try {
          const response = await authFetch("/api/wines/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fileData }),
          });

          const result: ImportResult = await response.json();

          if (!response.ok) {
            setImportResult(result);
            setStep("error");
            const errorMessage = (result as any).error || "Erro na validação do arquivo";
            toast.error(errorMessage);
            return;
          }

          setImportResult(result);
          setStep("success");

          if (result.successful > 0) {
            toast.success(
              `${result.successful} vinho${result.successful !== 1 ? "s" : ""} importado${result.successful !== 1 ? "s" : ""} com sucesso!`
            );
            onImportSuccess?.();
          }

          if (result.failed > 0) {
            toast.error(
              `${result.failed} erro${result.failed !== 1 ? "s" : ""} durante a importação`
            );
          }
        } catch (error) {
          console.error("Error uploading file:", error);
          setStep("error");
          setImportResult({
            successful: 0,
            failed: 1,
            errors: ["Erro ao processar o arquivo. Tente novamente."],
          });
          toast.error("Erro ao processar o arquivo");
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setStep("error");
        setIsLoading(false);
        toast.error("Erro ao ler o arquivo");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error handling file:", error);
      setStep("error");
      setIsLoading(false);
      toast.error("Erro ao processar o arquivo");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    setStep("initial");
    setImportResult(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "initial" && (
          <>
            <DialogHeader>
              <DialogTitle>Importar Vinhos em Lote</DialogTitle>
              <DialogDescription>
                Baixe a planilha modelo, preencha com seus vinhos e importe para sua adega
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Use a planilha modelo oficial para garantir que o formato está correto
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  onClick={handleDownloadTemplate}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isLoading ? "Baixando..." : "Baixar Planilha Modelo"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300"></span>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">ou</span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Button
                  onClick={handleFileSelect}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Arquivo
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "uploading" && (
          <>
            <DialogHeader>
              <DialogTitle>Importando...</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-500">Processando seu arquivo...</p>
            </div>
          </>
        )}

        {step === "success" && importResult && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Importação Concluída
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {importResult.successful} vinho{importResult.successful !== 1 ? "s" : ""}{" "}
                  importado{importResult.successful !== 1 ? "s" : ""} com sucesso!
                </AlertDescription>
              </Alert>

              {importResult.failed > 0 && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    {importResult.failed} erro{importResult.failed !== 1 ? "s" : ""} durante a importação
                  </AlertDescription>
                </Alert>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Erros:</p>
                  <ul className="space-y-1">
                    {importResult.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx} className="text-xs text-gray-600">
                        • {error}
                      </li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li className="text-xs text-gray-500 italic">
                        ... e mais {importResult.errors.length - 5} erro{importResult.errors.length - 5 !== 1 ? "s" : ""}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Fechar
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "error" && importResult && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Erro na Importação
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {(importResult as any).error || importResult.errors?.[0] || "Erro ao processar o arquivo"}
                </AlertDescription>
              </Alert>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Detalhes dos erros:</p>
                  <ul className="space-y-1">
                    {importResult.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx} className="text-xs text-gray-600">
                        • {error}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li className="text-xs text-gray-500 italic">
                        ... e mais {importResult.errors.length - 10} erro{importResult.errors.length - 10 !== 1 ? "s" : ""}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("initial")}>
                Tentar Novamente
              </Button>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
