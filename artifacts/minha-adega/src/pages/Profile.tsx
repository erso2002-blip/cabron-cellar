import {
  Bell,
  ChevronRight,
  Edit3,
  FileText,
  HelpCircle,
  LogOut,
  Mail,
  ShieldCheck,
  Trash2,
  UserCircle,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";

const supportEmail = "contato@mycellar.com.br";

function ProfileRow({
  children,
  description,
  href,
  icon: Icon,
  tone = "default",
}: {
  children: React.ReactNode;
  description?: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "danger";
}) {
  const content = (
    <div className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-muted/70">
      <div
        className={
          tone === "danger"
            ? "rounded-md bg-destructive/10 p-2 text-destructive"
            : "rounded-md bg-muted p-2 text-muted-foreground"
        }
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={
            tone === "danger"
              ? "font-medium text-destructive"
              : "font-medium text-foreground"
          }
        >
          {children}
        </div>
        {description ? (
          <div className="mt-0.5 text-sm text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>
      {href ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
    </div>
  );

  if (!href) return content;

  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const editProfileHref = `mailto:${supportEmail}?subject=${encodeURIComponent(
    "Atualização de perfil MyCellar",
  )}&body=${encodeURIComponent(
    `Olá, quero atualizar meus dados de perfil no MyCellar.\n\nNome atual: ${
      user?.name || ""
    }\nE-mail da conta: ${user?.email || ""}\nTelefone: \n\nNovos dados:\nNome: \nTelefone: `,
  )}`;
  const deleteAccountHref = `mailto:${supportEmail}?subject=${encodeURIComponent(
    "Solicitação de exclusão de conta MyCellar",
  )}&body=${encodeURIComponent(
    `Olá, quero solicitar a exclusão da minha conta MyCellar e dos dados associados.\n\nNome: ${
      user?.name || ""
    }\nE-mail da conta: ${
      user?.email || ""
    }\n\nConfirmo que estou solicitando a exclusão/análise dos dados vinculados a esta conta.`,
  )}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight">Perfil</h2>
        <p className="mt-1 text-muted-foreground">
          Gerencie sua conta, preferências, suporte e privacidade.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex-col gap-4 space-y-0 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <CardTitle className="truncate font-serif text-2xl">
              {user?.name || "Usuário MyCellar"}
            </CardTitle>
            <CardDescription className="truncate">
              {user?.email || "E-mail não informado"}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto sm:shrink-0">
            <a href={editProfileHref}>
              <Edit3 className="mr-2 h-4 w-4" />
              Editar perfil
            </a>
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Meus dados</CardTitle>
            <CardDescription>
              Informações principais da sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Nome</div>
              <div className="mt-1 font-medium">
                {user?.name || "Não informado"}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">E-mail</div>
              <div className="mt-1 font-medium">
                {user?.email || "Não informado"}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Telefone</div>
              <div className="mt-1 font-medium text-muted-foreground">
                Não informado
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Acesso, suporte e ações da conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 p-3 pt-0">
            <ProfileRow
              href={`mailto:${supportEmail}?subject=${encodeURIComponent("Suporte MyCellar")}`}
              icon={HelpCircle}
              description="Fale com o atendimento do MyCellar."
            >
              Suporte
            </ProfileRow>
            <ProfileRow
              icon={Bell}
              description="Preferências de comunicação do app."
            >
              Notificações
            </ProfileRow>
            <ProfileRow
              href={deleteAccountHref}
              icon={Trash2}
              tone="danger"
              description="Envie a solicitação por e-mail para validação e tratamento seguro dos dados."
            >
              Excluir conta
            </ProfileRow>
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle>Privacidade e documentos</CardTitle>
            <CardDescription>
              Termos, política de privacidade e contato oficial.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1 p-3 pt-0 md:grid-cols-2">
            <ProfileRow
              href="/privacidade"
              icon={ShieldCheck}
              description="Como seus dados são coletados e usados."
            >
              Política de Privacidade
            </ProfileRow>
            <ProfileRow
              href="/termos"
              icon={FileText}
              description="Regras de uso do MyCellar."
            >
              Termos de Uso
            </ProfileRow>
            <ProfileRow
              href={`mailto:${supportEmail}`}
              icon={Mail}
              description={supportEmail}
            >
              Contato oficial
            </ProfileRow>
            <button type="button" className="block w-full" onClick={signOut}>
              <ProfileRow
                icon={LogOut}
                description="Encerrar sessão neste dispositivo."
              >
                Sair da conta
              </ProfileRow>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
