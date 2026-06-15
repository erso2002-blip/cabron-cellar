import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

import { Shell } from "@/components/layout/Shell";
import { LoadingSpinner } from "@/components/ui/loading";
import InviteGate from "@/pages/InviteGate";
import Dashboard from "@/pages/Dashboard";
import StockList from "@/pages/StockList";
import WineDetail from "@/pages/WineDetail";
import WineForm from "@/pages/WineForm";
import History from "@/pages/History";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Check if the invite cookie is valid by probing a protected endpoint
async function checkInviteAccess(): Promise<boolean> {
  try {
    const resp = await fetch("/api/healthz", { credentials: "include" });
    return resp.status !== 403;
  } catch {
    return false;
  }
}

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/wines" component={StockList} />
        <Route path="/wines/new" component={WineForm} />
        <Route path="/wines/:id/edit" component={WineForm} />
        <Route path="/wines/:id" component={WineDetail} />
        <Route path="/history" component={History} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  const [inviteGranted, setInviteGranted] = useState<boolean | null>(null);

  useEffect(() => {
    checkInviteAccess().then(setInviteGranted);
  }, []);

  if (inviteGranted === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!inviteGranted) {
    return (
      <>
        <Toaster />
        <Sonner />
        <InviteGate onGranted={() => setInviteGranted(true)} />
      </>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
