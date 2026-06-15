import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Wine, 
  LayoutDashboard, 
  History, 
  PlusCircle, 
  LogOut, 
  Menu 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface ShellProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wines", label: "Adega", icon: Wine },
  { href: "/wines/new", label: "Adicionar", icon: PlusCircle },
  { href: "/history", label: "Histórico", icon: History },
];

export function Shell({ children }: ShellProps) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  async function handleExit() {
    try {
      await fetch("/api/invite/revoke", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.reload();
    }
  }

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
      <Button 
        variant="ghost" 
        className="w-full justify-start mt-auto text-muted-foreground hover:text-destructive" 
        onClick={handleExit}
        data-testid="nav-logout"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-card px-4 py-6 md:flex md:flex-col">
        <div className="mb-8 px-4">
          <h1 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
            <Wine className="h-6 w-6" />
            Cabron Cellar
          </h1>
        </div>
        <nav className="flex-1 flex flex-col">
          <NavLinks />
        </nav>
      </aside>

      {/* Mobile Header & Nav */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
          <h1 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
            <Wine className="h-5 w-5" />
            Cabron Cellar
          </h1>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="mobile-menu-trigger">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-10 flex flex-col">
              <NavLinks />
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
