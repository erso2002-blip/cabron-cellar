import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetWine, 
  useCreateWine, 
  useUpdateWine, 
  getGetWineQueryKey 
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageSkeleton } from "@/components/ui/loading";
import { ArrowLeft, Save, Sparkles, Loader2, X } from "lucide-react";
import LabelScanner from "@/components/LabelScanner";
import { authFetch } from "@/lib/auth";
import { isLikelyWebsiteUrl, normalizeWebsiteUrl } from "@/lib/url";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(160),
  producer: z.string().min(1, "Produtor é obrigatório").max(160),
  wineryWebsiteUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .nullable()
    .refine((value) => isLikelyWebsiteUrl(value), {
      message: "Informe um site válido. Ex: vinicola.com.br",
    }),
  country: z.string().max(80).optional(),
  region: z.string().max(120).optional(),
  grape: z.string().max(160).optional(),
  vintage: z.coerce.number().optional().nullable(),
  pricePaid: z.coerce.number().optional().nullable(),
  quantity: z.coerce.number().min(0, "Quantidade inválida"),
  cellarLocation: z.string().max(120).optional(),
  locationPlace: z.string().max(120).optional(),
  cellarName: z.string().max(120).optional(),
  shelf: z.string().max(80).optional(),
  drinkUntil: z.string().optional().nullable(),
  labelPhotoUrl: z.string().max(6_800_000).optional().nullable(),
  notes: z.string().max(2_000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

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

function userFacingSaveError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status?: number }).status === 402
  ) {
    return "Plano Básico permite até 30 garrafas presentes na adega. Para passar disso, use o Pro.";
  }

  return null;
}

export default function WineForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const isEditing = !!params.id && params.id !== "new";
  const wineId = parseInt(params.id || "0");

  const { data: wine, isLoading } = useGetWine(wineId, {
    query: {
      enabled: isEditing,
      queryKey: getGetWineQueryKey(wineId)
    }
  });

  const createMutation = useCreateWine();
  const updateMutation = useUpdateWine();

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [drinkUntilHint, setDrinkUntilHint] = useState<string | null>(null);

  function buildFallbackWineName(data: LabelData) {
    const parts = [data.producer, data.grape, data.vintage ? String(data.vintage) : null]
      .map((part) => part?.trim())
      .filter(Boolean);
    return parts.length >= 2 ? parts.join(" ") : null;
  }

  function handleLabelExtracted(data: LabelData) {
    const name = data.name?.trim() || buildFallbackWineName(data);
    if (name) form.setValue("name", name, { shouldValidate: true });
    if (data.producer) form.setValue("producer", data.producer, { shouldValidate: true });
    if (data.wineryWebsiteUrl) {
      form.setValue("wineryWebsiteUrl", normalizeWebsiteUrl(data.wineryWebsiteUrl), { shouldValidate: true });
    }
    if (data.vintage) form.setValue("vintage", data.vintage, { shouldValidate: true });
    if (data.grape) form.setValue("grape", data.grape);
    if (data.country) form.setValue("country", data.country);
    if (data.region) form.setValue("region", data.region);
  }

  function handlePhotoUploaded(url: string) {
    form.setValue("labelPhotoUrl", url);
    toast.success("Foto do rótulo salva!");
  }

  async function handleSuggestDrinkUntil() {
    const values = form.getValues();
    if (!values.name && !values.grape && !values.country) {
      toast.warning("Preencha ao menos nome, uva ou país para receber uma sugestão");
      return;
    }
    setIsSuggesting(true);
    setDrinkUntilHint(null);
    try {
      const resp = await authFetch("/api/wines/suggest-drink-until", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name || undefined,
          producer: values.producer || undefined,
          grape: values.grape || undefined,
          vintage: values.vintage || undefined,
          country: values.country || undefined,
          region: values.region || undefined,
        }),
      });
      if (resp.status === 402) {
        throw new Error("Sugestão de data ideal de consumo está disponível no plano Pro.");
      }
      if (!resp.ok) throw new Error("Falha na sugestão");
      const data = (await resp.json()) as { suggestedDate: string; reason: string };
      form.setValue("drinkUntil", data.suggestedDate);
      setDrinkUntilHint(data.reason);
      toast.success("Sugestão aplicada!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar uma sugestão agora");
    } finally {
      setIsSuggesting(false);
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      producer: "",
      wineryWebsiteUrl: "",
      country: "",
      region: "",
      grape: "",
      vintage: null,
      pricePaid: null,
      quantity: 1,
      cellarLocation: "",
      locationPlace: "",
      cellarName: "",
      shelf: "",
      drinkUntil: null,
      labelPhotoUrl: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (wine && isEditing) {
      form.reset({
        name: wine.name,
        producer: wine.producer,
        wineryWebsiteUrl: normalizeWebsiteUrl(wine.wineryWebsiteUrl),
        country: wine.country || "",
        region: wine.region || "",
        grape: wine.grape || "",
        vintage: wine.vintage || null,
        pricePaid: wine.pricePaid || null,
        quantity: wine.quantity,
        cellarLocation: wine.cellarLocation || "",
        locationPlace: wine.locationPlace || "",
        cellarName: wine.cellarName || "",
        shelf: wine.shelf || "",
        drinkUntil: wine.drinkUntil || null,
        labelPhotoUrl: wine.labelPhotoUrl || "",
        notes: wine.notes || "",
      });
    }
  }, [wine, isEditing, form]);

  const onSubmit = (data: FormValues) => {
    // Clean up empty strings to null for API
    const cleanData = {
      ...data,
      vintage: data.vintage || undefined,
      pricePaid: data.pricePaid || undefined,
      wineryWebsiteUrl: normalizeWebsiteUrl(data.wineryWebsiteUrl) || undefined,
      drinkUntil: data.drinkUntil || undefined,
      labelPhotoUrl: data.labelPhotoUrl || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: wineId, data: cleanData },
        {
          onSuccess: (updatedWine) => {
            toast.success("Vinho atualizado com sucesso");
            queryClient.invalidateQueries({ queryKey: getGetWineQueryKey(wineId) });
            queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
            setLocation(`/wines/${updatedWine.id}`);
          },
          onError: (error) => toast.error(userFacingSaveError(error) ?? "Erro ao atualizar vinho")
        }
      );
    } else {
      createMutation.mutate(
        { data: cleanData as any },
        {
          onSuccess: (newWine) => {
            toast.success("Vinho adicionado à adega");
            queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            setLocation(`/wines/${newWine.id}`);
          },
          onError: (error) => toast.error(userFacingSaveError(error) ?? "Erro ao adicionar vinho")
        }
      );
    }
  };

  if (isEditing && isLoading) return <PageSkeleton />;

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="pl-0 mr-4 text-muted-foreground hover:text-foreground"
          onClick={() => setLocation(isEditing ? `/wines/${wineId}` : "/wines")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">
            {isEditing ? "Editar Vinho" : "Adicionar à Adega"}
          </h2>
        </div>
      </div>

      {!isEditing && (
        <div className="mb-6">
          <LabelScanner
            onExtracted={handleLabelExtracted}
            onPhotoUploaded={handlePhotoUploaded}
          />
        </div>
      )}

      <div className="bg-card border shadow-sm rounded-xl p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h3 className="font-serif text-lg font-bold border-b pb-2">Informações Principais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome do Vinho *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Catena Zapata Malbec Argentino" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="producer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produtor *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Catena Zapata" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wineryWebsiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site da vitícola</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.viticola.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>Aceita com ou sem https://. Ex: vinicola.com.br</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vintage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Safra (Ano)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 2019" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grape"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Uva(s)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Malbec, Cabernet Sauvignon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <h3 className="font-serif text-lg font-bold border-b pb-2">Origem</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Argentina" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Região</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mendoza" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <h3 className="font-serif text-lg font-bold border-b pb-2">Estoque e Aquisição</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pricePaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Pago (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="drinkUntil"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <div className="flex items-center justify-between">
                        <FormLabel>Beber até (Data ideal limite)</FormLabel>
                        <button
                          type="button"
                          onClick={handleSuggestDrinkUntil}
                          disabled={isSuggesting}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSuggesting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          {isSuggesting ? "Consultando sommelier…" : "Sugerir com IA"}
                        </button>
                      </div>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      {drinkUntilHint ? (
                        <p className="text-xs text-primary/80 italic flex gap-1">
                          <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                          {drinkUntilHint}
                        </p>
                      ) : (
                        <FormDescription>Quando este vinho começará a perder qualidade?</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <h3 className="font-serif text-lg font-bold border-b pb-2">Localização</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="locationPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Casa, Escritório" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cellarName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adega</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Adega Principal" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shelf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prateleira</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Prateleira 2A" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <h3 className="font-serif text-lg font-bold border-b pb-2">Detalhes Adicionais</h3>
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="labelPhotoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto do rótulo</FormLabel>
                      <div className="flex gap-4 items-start">
                        {field.value && (
                          <div className="relative shrink-0">
                            <img
                              src={field.value}
                              alt="Foto do rótulo"
                              className="w-16 h-20 object-cover rounded border shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => field.onChange("")}
                              className="absolute -top-2 -right-2 bg-background border rounded-full p-0.5 shadow-sm hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="https://... (use o scanner acima para preencher automaticamente)"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription className="mt-1">
                            Use o scanner de rótulo acima para salvar a foto automaticamente, ou cole uma URL.
                          </FormDescription>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Pessoais</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Onde comprou? De quem ganhou? Espectativas..." 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => setLocation(isEditing ? `/wines/${wineId}` : "/wines")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Salvar Alterações" : "Adicionar à Adega"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
