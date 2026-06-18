import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Wine, 
  FileText,
  LayoutDashboard, 
  History, 
  ShieldCheck,
  PlusCircle, 
  Menu 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { APP_VERSION } from "@/config/app";
import { useAuth } from "@/lib/auth";

interface ShellProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wines", label: "Adega", icon: Wine },
  { href: "/wines/new", label: "Adicionar", icon: PlusCircle },
  { href: "/history", label: "Histórico", icon: History },
];

const legalItems = [
  { href: "/termos", label: "Termos de Uso", icon: FileText },
  { href: "/privacidade", label: "Privacidade", icon: ShieldCheck },
];

export function Shell({ children }: ShellProps) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { config, user, signOut } = useAuth();
  const ssoEnabled = config?.configured ?? false;

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={location === item.href ? "secondary" : "ghost"}
            className="w-full justify-start mb-2"
            onClick={() => setOpen(false)}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        </Link>
      ))}
    </>
  );

  const LegalLinks = () => (
    <div className="space-y-1 border-t pt-3">
      {legalItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
            data-testid={`legal-${item.href.slice(1)}`}
          >
            <item.icon className="mr-2 h-3.5 w-3.5" />
            {item.label}
          </Button>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-card px-4 py-6 md:flex md:flex-col">
        <div className="mb-8 px-4">
          <Link href="/" aria-label="MyCellar">
            <img
              src="/logo.svg"
              alt="MyCellar"
              className="h-12 w-auto max-w-[176px]"
            />
          </Link>
        </div>
        <nav className="flex-1 flex flex-col">
          <NavLinks />
        </nav>
        <div className="space-y-3 px-4 text-xs text-muted-foreground">
          <LegalLinks />
          <PwaInstallButton compact />
          {ssoEnabled ? (
            <>
              <div>
                <div className="truncate font-medium text-foreground">{user?.name}</div>
                <div className="truncate">{user?.email}</div>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
                Sair
              </Button>
            </>
          ) : null}
          <div>v{APP_VERSION}</div>
        </div>
      </aside>

      {/* Mobile Header & Nav */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
          <Link href="/" aria-label="MyCellar">
            <img
              src="/logo.svg"
              alt="MyCellar"
              className="h-9 w-auto max-w-[136px]"
            />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="mobile-menu-trigger">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-10 flex flex-col">
              <nav className="flex-1 flex flex-col">
                <NavLinks />
              </nav>
              <div className="space-y-3 text-xs text-muted-foreground">
                <LegalLinks />
                <PwaInstallButton compact />
                {ssoEnabled ? (
                  <>
                    <div>
                      <div className="truncate font-medium text-foreground">{user?.name}</div>
                      <div className="truncate">{user?.email}</div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
                      Sair
                    </Button>
                  </>
                ) : null}
                <div>v{APP_VERSION}</div>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
