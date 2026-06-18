import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Shell } from "@/components/layout/Shell";
import Dashboard from "@/pages/Dashboard";
import StockList from "@/pages/StockList";
import WineDetail from "@/pages/WineDetail";
import WineForm from "@/pages/WineForm";
import History from "@/pages/History";
import Waitlist from "@/pages/Waitlist";
import { PrivacyPolicy, TermsOfUse } from "@/pages/Legal";
import NotFound from "@/pages/not-found";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function PublicApp() {
  const { config, user, loading } = useAuth();
  const [location] = useLocation();

  const publicRoutes = (
    <Switch>
      <Route path="/waitlist" component={Waitlist} />
      <Route path="/login" component={LoginScreen} />
      <Route path="/termos" component={TermsOfUse} />
      <Route path="/privacidade" component={PrivacyPolicy} />
    </Switch>
  );

  if (["/waitlist", "/login", "/termos", "/privacidade"].includes(location)) {
    return publicRoutes;
  }

  if (loading) return <LoginScreen />;
  if (config && !config.configured) {
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
  if (!user) return <Waitlist />;

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
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <PublicApp />
          </AuthProvider>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
