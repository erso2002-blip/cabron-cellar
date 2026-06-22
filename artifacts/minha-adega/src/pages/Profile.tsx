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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { authFetch, useAuth } from "@/lib/auth";

const supportEmail = "contato@mycellar.com.br";

type AccountProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profileImage: string | null;
};

type NotificationPreferences = {
  cellarReminders: boolean;
  emailUpdates: boolean;
  productUpdates: boolean;
  pushEnabled: boolean;
};

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await authFetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Não foi possível concluir a ação");
  }

  return response.json() as Promise<T>;
}

function ProfileRow({
  children,
  description,
  href,
  icon: Icon,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  description?: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
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

  if (onClick) {
    return (
      <button type="button" className="block w-full" onClick={onClick}>
        {content}
      </button>
    );
  }

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
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [notifications, setNotifications] =
    useState<NotificationPreferences | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      try {
        const [nextProfile, nextNotifications] = await Promise.all([
          apiJson<AccountProfile>("/api/account/profile"),
          apiJson<NotificationPreferences>("/api/account/notifications"),
        ]);

        if (cancelled) return;
        setProfile(nextProfile);
        setProfileForm({
          name: nextProfile.name || "",
          phone: nextProfile.phone || "",
        });
        setNotifications(nextNotifications);
      } catch {
        if (!cancelled) toast.error("Não foi possível carregar dados da conta.");
      }
    }

    loadAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const updated = await apiJson<AccountProfile>("/api/account/profile", {
        method: "PUT",
        body: JSON.stringify(profileForm),
      });
      setProfile(updated);
      setProfileForm({
        name: updated.name || "",
        phone: updated.phone || "",
      });
      setProfileOpen(false);
      toast.success("Perfil atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifications(next: NotificationPreferences) {
    setNotifications(next);
    try {
      const updated = await apiJson<NotificationPreferences>(
        "/api/account/notifications",
        {
          method: "PUT",
          body: JSON.stringify(next),
        },
      );
      setNotifications(updated);
      toast.success("Preferências salvas.");
    } catch {
      toast.error("Não foi possível salvar notificações.");
    }
  }

  async function requestAccountDeletion() {
    setSaving(true);
    try {
      await apiJson("/api/account/deletion-request", { method: "POST" });
      setDeleteOpen(false);
      toast.success("Solicitação registrada para validação.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a solicitação.",
      );
    } finally {
      setSaving(false);
    }
  }

  const displayName = profile?.name || user?.name || "Usuário MyCellar";
  const displayEmail = profile?.email || user?.email || "E-mail não informado";
  const displayPhone = profile?.phone || "Não informado";

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
              {displayName}
            </CardTitle>
            <CardDescription className="truncate">
              {displayEmail}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto sm:shrink-0"
            onClick={() => setProfileOpen(true)}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Editar perfil
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
                {displayName}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">E-mail</div>
              <div className="mt-1 font-medium">
                {displayEmail}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Telefone</div>
              <div className="mt-1 font-medium">{displayPhone}</div>
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
              onClick={() => setNotificationsOpen(true)}
              description="Preferências de comunicação do app."
            >
              Notificações
            </ProfileRow>
            <ProfileRow
              icon={Trash2}
              onClick={() => setDeleteOpen(true)}
              tone="danger"
              description="Registre uma solicitação para validação e tratamento seguro dos dados."
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
            <ProfileRow
              icon={LogOut}
              onClick={signOut}
              description="Encerrar sessão neste dispositivo."
            >
              Sair da conta
            </ProfileRow>
          </CardContent>
        </Card>
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>
              Atualize os dados principais vinculados à conta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome</Label>
              <Input
                id="profile-name"
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Telefone</Label>
              <Input
                id="profile-phone"
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveProfile} disabled={saving}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notificações</DialogTitle>
            <DialogDescription>
              Escolha quais comunicações deseja receber.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {notifications ? (
              [
                ["cellarReminders", "Lembretes da adega", "Alertas sobre consumo e organização."],
                ["emailUpdates", "Atualizações por e-mail", "Comunicados importantes da conta."],
                ["productUpdates", "Novidades do produto", "Recursos e melhorias do MyCellar."],
                ["pushEnabled", "Push no dispositivo", "Permissão técnica para notificações do app."],
              ].map(([key, title, description]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 rounded-md border p-3"
                >
                  <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                  </div>
                  <Switch
                    checked={notifications[key as keyof NotificationPreferences]}
                    onCheckedChange={(checked) =>
                      saveNotifications({
                        ...notifications,
                        [key]: checked,
                      })
                    }
                  />
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solicitar exclusão da conta?</AlertDialogTitle>
            <AlertDialogDescription>
              A solicitação será registrada para validação. A exclusão ou
              anonimização dos dados não será executada sem tratamento seguro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                requestAccountDeletion();
              }}
            >
              Solicitar exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
