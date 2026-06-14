import { useEffect } from "react";
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
import { ArrowLeft, Save } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  producer: z.string().min(1, "Produtor é obrigatório"),
  country: z.string().optional(),
  region: z.string().optional(),
  grape: z.string().optional(),
  vintage: z.coerce.number().optional().nullable(),
  pricePaid: z.coerce.number().optional().nullable(),
  quantity: z.coerce.number().min(0, "Quantidade inválida"),
  cellarLocation: z.string().optional(),
  drinkUntil: z.string().optional().nullable(),
  labelPhotoUrl: z.string().optional().nullable(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      producer: "",
      country: "",
      region: "",
      grape: "",
      vintage: null,
      pricePaid: null,
      quantity: 1,
      cellarLocation: "",
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
        country: wine.country || "",
        region: wine.region || "",
        grape: wine.grape || "",
        vintage: wine.vintage || null,
        pricePaid: wine.pricePaid || null,
        quantity: wine.quantity,
        cellarLocation: wine.cellarLocation || "",
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
          onError: () => toast.error("Erro ao atualizar vinho")
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
          onError: () => toast.error("Erro ao adicionar vinho")
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
                  name="cellarLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização na Adega</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Prateleira 2A" {...field} />
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
                      <FormLabel>Beber até (Data ideal limite)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>Quando este vinho começará a perder qualidade?</FormDescription>
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
                      <FormLabel className="flex items-center gap-2">
                        Foto do rótulo (URL)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription className="text-primary/80 italic text-xs">
                        Integração com leitura automática de rótulo em breve.
                      </FormDescription>
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
