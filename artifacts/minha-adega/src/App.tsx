import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";

import { Shell } from "@/components/layout/Shell";
import { LoadingSpinner } from "@/components/ui/loading";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import StockList from "@/pages/StockList";
import WineDetail from "@/pages/WineDetail";
import WineForm from "@/pages/WineForm";
import History from "@/pages/History";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Shell>
      <Component />
    </Shell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/wines" component={() => <ProtectedRoute component={StockList} />} />
      <Route path="/wines/new" component={() => <ProtectedRoute component={WineForm} />} />
      <Route path="/wines/:id/edit" component={() => <ProtectedRoute component={WineForm} />} />
      <Route path="/wines/:id" component={() => <ProtectedRoute component={WineDetail} />} />
      <Route path="/history" component={() => <ProtectedRoute component={History} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
