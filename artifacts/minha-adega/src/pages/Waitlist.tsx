import { FormEvent, useState } from "react";
import { Check, Clock, Sparkles, Wine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SubmitState = "idle" | "loading" | "success" | "error";

export default function Waitlist() {
  const [state, setState] = useState<SubmitState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const bottleRange = formData.get("bottleRange");
    const useType = formData.get("useType");
    const currentControl = formData.get("currentControl");
    const betaIntent = formData.get("betaIntent");
    const painNotes = formData.get("painNotes");

    const notes = [
      `Garrafas: ${bottleRange || "nao informado"}`,
      `Uso: ${useType || "nao informado"}`,
      `Controle atual: ${currentControl || "nao informado"}`,
      `Interesse beta: ${betaIntent || "nao informado"}`,
      painNotes ? `Dor/observacoes: ${painNotes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    setState("loading");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          whatsapp: formData.get("whatsapp"),
          notes,
          source: "waitlist-public",
        }),
      });

      if (!response.ok) throw new Error("waitlist failed");

      form.reset();
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f1e7] text-[#2d2525]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 md:px-8">
        <header className="flex items-center justify-between">
          <img src="/logo.svg" alt="MyCellar" className="h-11 w-auto md:h-14" />
          <span className="rounded-md border border-[#d8c9a4] px-3 py-2 text-sm font-medium text-[#7a7068]">
            App em beta fechado
          </span>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8f6c28]">
                Lista de espera
              </p>
              <h1 className="max-w-3xl font-serif text-5xl leading-[1.02] text-[#2d2525] md:text-7xl">
                Organize sua adega e evite perder garrafas.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#5e5550] md:text-xl">
                O MyCellar ajuda você a catalogar vinhos, controlar estoque e
                descobrir o melhor momento para beber cada garrafa.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Wine, title: "Controle", text: "Garrafas, safras e locais em um só lugar." },
                { icon: Clock, title: "Momento certo", text: "Janela de consumo para beber melhor." },
                { icon: Sparkles, title: "IA", text: "Leitura de rótulo e apoio nas decisões." },
              ].map((item) => (
                <div key={item.title} className="rounded-md border border-[#dfd2b4] bg-white/65 p-4">
                  <item.icon className="mb-3 h-5 w-5 text-[#66101f]" />
                  <h2 className="font-serif text-xl">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6b625b]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-[#d8c9a4] bg-white p-5 shadow-sm md:p-7">
            {state === "success" ? (
              <div className="flex min-h-[430px] flex-col items-start justify-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#66101f] text-white">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-serif text-3xl">Entrada confirmada.</h2>
                  <p className="mt-3 leading-7 text-[#6b625b]">
                    Você está na lista de espera do MyCellar. Vamos avisar sobre
                    beta, novidades e abertura de acesso.
                  </p>
                </div>
                <Button onClick={() => setState("idle")} variant="outline">
                  Cadastrar outro contato
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="font-serif text-3xl">Entre na lista.</h2>
                  <p className="mt-2 leading-7 text-[#6b625b]">
                    Receba acesso antecipado quando abrirmos o beta.
                  </p>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Nome</span>
                  <Input name="name" required minLength={2} placeholder="Seu nome" />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">E-mail</span>
                  <Input name="email" type="email" required placeholder="voce@email.com" />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">WhatsApp</span>
                  <Input name="whatsapp" inputMode="tel" placeholder="Opcional" />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Quantas garrafas você tem?</span>
                    <select
                      name="bottleRange"
                      required
                      className="flex h-10 w-full rounded-md border border-[#d8c9a4] bg-white px-3 py-2 text-sm outline-none focus:border-[#66101f] focus:ring-1 focus:ring-[#66101f]"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Selecione
                      </option>
                      <option value="1-9">1 a 9</option>
                      <option value="10-24">10 a 24</option>
                      <option value="25-49">25 a 49</option>
                      <option value="50-99">50 a 99</option>
                      <option value="100+">100 ou mais</option>
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Tipo de uso</span>
                    <select
                      name="useType"
                      required
                      className="flex h-10 w-full rounded-md border border-[#d8c9a4] bg-white px-3 py-2 text-sm outline-none focus:border-[#66101f] focus:ring-1 focus:ring-[#66101f]"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Selecione
                      </option>
                      <option value="adega-pessoal">Adega pessoal</option>
                      <option value="restaurante">Restaurante/bar</option>
                      <option value="loja">Loja/empório</option>
                      <option value="profissional-vinho">Profissional do vinho</option>
                      <option value="outro">Outro</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Como controla hoje?</span>
                    <select
                      name="currentControl"
                      required
                      className="flex h-10 w-full rounded-md border border-[#d8c9a4] bg-white px-3 py-2 text-sm outline-none focus:border-[#66101f] focus:ring-1 focus:ring-[#66101f]"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Selecione
                      </option>
                      <option value="memoria">Memória</option>
                      <option value="fotos">Fotos no celular</option>
                      <option value="planilha">Planilha</option>
                      <option value="app">Outro app</option>
                      <option value="sem-controle">Não controlo</option>
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Quer testar o beta?</span>
                    <select
                      name="betaIntent"
                      required
                      className="flex h-10 w-full rounded-md border border-[#d8c9a4] bg-white px-3 py-2 text-sm outline-none focus:border-[#66101f] focus:ring-1 focus:ring-[#66101f]"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Selecione
                      </option>
                      <option value="sim-agora">Sim, quero testar</option>
                      <option value="talvez">Talvez</option>
                      <option value="acompanhar">Só quero acompanhar</option>
                    </select>
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Qual é sua maior dificuldade?</span>
                  <Textarea
                    name="painNotes"
                    maxLength={500}
                    placeholder="Ex.: não lembro o que tenho, perco o ponto de consumo, compro repetido..."
                  />
                </label>

                {state === "error" ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    Não consegui salvar agora. Tente novamente em instantes.
                  </p>
                ) : null}

                <Button className="w-full" size="lg" disabled={state === "loading"}>
                  {state === "loading" ? "Enviando..." : "Entrar na lista de espera"}
                </Button>

                <p className="text-xs leading-5 text-[#7a7068]">
                  Sem promessa de investimento ou valorização de vinhos. O foco é
                  organização, consumo inteligente e experiência.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
