import { useState } from "react";
import { useConsumeWine, getGetWineQueryKey, Wine as WineType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { GlassWater } from "lucide-react";

const consumeSchema = z.object({
  consumedAt: z.string().min(1, "Data é obrigatória"),
  quantity: z.coerce.number().min(1, "Quantidade deve ser pelo menos 1"),
  occasion: z.string().optional(),
  personalNote: z.string().optional(),
  wouldBuyAgain: z.boolean().default(true),
});

type ConsumeFormValues = z.infer<typeof consumeSchema>;

export function ConsumeModal({ wine }: { wine: WineType }) {
  const [open, setOpen] = useState(false);
  const consumeMutation = useConsumeWine();
  const queryClient = useQueryClient();

  const form = useForm<ConsumeFormValues>({
    resolver: zodResolver(consumeSchema),
    defaultValues: {
      consumedAt: new Date().toISOString().split("T")[0],
      quantity: 1,
      occasion: "",
      personalNote: "",
      wouldBuyAgain: true,
    },
  });

  const onSubmit = (data: ConsumeFormValues) => {
    if (data.quantity > wine.quantity) {
      form.setError("quantity", { message: "Quantidade excede o estoque atual" });
      return;
    }

    consumeMutation.mutate({
      id: wine.id,
      data: {
        ...data,
      }
    }, {
      onSuccess: () => {
        toast.success("Vinho marcado como consumido. Saúde!");
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetWineQueryKey(wine.id) });
        queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
        queryClient.invalidateQueries({ queryKey: ["/api/consumption"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      },
      onError: () => {
        toast.error("Erro ao registrar consumo.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full text-base py-6 shadow-md" data-testid="btn-consume-trigger">
          <GlassWater className="mr-2 h-5 w-5" />
          Marcar como Consumida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Consumir Vinho</DialogTitle>
          <DialogDescription>
            Registre a abertura desta garrafa. Saúde!
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="consumedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Consumo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd. Garrafas</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max={wine.quantity} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="occasion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ocasião (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Jantar de aniversário..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas de Degustação (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="O que achou do vinho?" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wouldBuyAgain"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-secondary/30">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium cursor-pointer">
                      Compraria novamente
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={consumeMutation.isPending}>
                {consumeMutation.isPending ? "Salvando..." : "Registrar Consumo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
