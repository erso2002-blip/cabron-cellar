import { useState, useEffect } from "react";
import {
  Switch,
  Route,
  Router as WouterRouter,
  useLocation,
  Redirect,
} from "wouter";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  ClerkLoading,
  ClerkLoaded,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useClerk } from "@clerk/react";
import { Wine } from "lucide-react";

import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/layout/Shell";
import { LoadingSpinner } from "@/components/ui/loading";
import InviteGate from "@/pages/InviteGate";
import Dashboard from "@/pages/Dashboard";
import StockList from "@/pages/StockList";
import WineDetail from "@/pages/WineDetail";
import WineForm from "@/pages/WineForm";
import History from "@/pages/History";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#66101F",
    colorForeground: "#2D2525",
    colorMutedForeground: "#6B6262",
    colorDanger: "#DC2626",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#2D2525",
    colorNeutral: "#D2CCBF",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.3rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[#E4DFD2]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#2D2525] text-2xl font-semibold",
    headerSubtitle: "text-[#6B6262]",
    socialButtonsBlockButton:
      "border border-[#D2CCBF] text-[#2D2525] hover:bg-[#F5F1E7]",
    socialButtonsBlockButtonText: "text-[#2D2525] font-medium",
    dividerText: "text-[#6B6262]",
    dividerLine: "bg-[#E4DFD2]",
    formFieldLabel: "text-[#2D2525] font-medium",
    formFieldInput:
      "bg-white border border-[#D2CCBF] text-[#2D2525] focus:border-[#66101F]",
    formButtonPrimary:
      "bg-[#66101F] hover:bg-[#7d1526] text-white normal-case font-medium",
    footerActionText: "text-[#6B6262]",
    footerActionLink: "text-[#66101F] hover:text-[#7d1526] font-medium",
    identityPreviewEditButton: "text-[#66101F]",
    formFieldSuccessText: "text-[#15803d]",
    formFieldErrorText: "text-[#DC2626]",
    alertText: "text-[#2D2525]",
    otpCodeFieldInput: "border border-[#D2CCBF] text-[#2D2525]",
    logoBox: "justify-center mb-2",
    logoImage: "h-10 w-10",
  },
};

const clerkLocalization = {
  signIn: {
    start: {
      title: "Bem-vindo de volta",
      subtitle: "Entre para acessar a sua adega",
    },
  },
  signUp: {
    start: {
      title: "Crie a sua conta",
      subtitle: "Comece a montar a sua adega pessoal",
    },
  },
};

function FullScreenLoader() {
  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
      <LoadingSpinner />
    </div>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function Welcome() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
          <Wine className="w-8 h-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-1">
            Cabron Cellar
          </h1>
          <p className="text-muted-foreground font-serif italic text-sm">
            A sua adega pessoal
          </p>
        </div>
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => setLocation("/sign-in")}
            data-testid="button-signin"
          >
            Entrar
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => setLocation("/sign-up")}
            data-testid="button-signup"
          >
            Criar conta
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Entre com Google ou e-mail. Cada pessoa tem a própria adega.
        </p>
      </div>
    </div>
  );
}

function AuthedApp() {
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

// Clears the React Query cache when the signed-in user changes, so one user's
// data never leaks into another's view on the same device.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={clerkLocalization}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <ClerkLoading>
            <FullScreenLoader />
          </ClerkLoading>
          <ClerkLoaded>
            <Switch>
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route>
                <Show when="signed-in">
                  <AuthedApp />
                </Show>
                <Show when="signed-out">
                  <Welcome />
                </Show>
              </Route>
            </Switch>
          </ClerkLoaded>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

// Probes a protected endpoint to see if the invite cookie is still valid.
async function checkInviteAccess(): Promise<boolean> {
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}api/healthz`, {
      credentials: "include",
    });
    return resp.status !== 403;
  } catch {
    return false;
  }
}

function App() {
  const [inviteGranted, setInviteGranted] = useState<boolean | null>(null);

  useEffect(() => {
    checkInviteAccess().then(setInviteGranted);
  }, []);

  if (inviteGranted === null) {
    return <FullScreenLoader />;
  }

  if (!inviteGranted) {
    return (
      <>
        <InviteGate onGranted={() => setInviteGranted(true)} />
        <Toaster />
        <Sonner />
      </>
    );
  }

  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
