import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setAuthTokenGetter, type AuthUser } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";

const TOKEN_STORAGE_KEY = "mycellar.googleIdToken";

type AuthConfig = {
  configured: boolean;
  clientId: string | null;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  config: AuthConfig | null;
  loading: boolean;
  error: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function readStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Browser storage can be unavailable in restricted contexts.
  }
}

async function fetchAuthConfig(): Promise<AuthConfig> {
  const response = await fetch("/api/auth/config");
  if (!response.ok) throw new Error("Não foi possível carregar configuração de login");
  return response.json();
}

async function fetchUser(token: string): Promise<AuthUser> {
  const response = await fetch("/api/auth/user", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Sessão Google inválida ou expirada");
  return response.json();
}

export function getGoogleIdToken() {
  return readStoredToken();
}

export function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getGoogleIdToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthTokenGetter(() => getGoogleIdToken());
    return () => setAuthTokenGetter(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextConfig = await fetchAuthConfig();
        if (cancelled) return;

        setConfig(nextConfig);

        const storedToken = readStoredToken();
        if (!storedToken) {
          setUser(null);
          setToken(null);
          return;
        }

        const nextUser = await fetchUser(storedToken);
        if (cancelled) return;

        setUser(nextUser);
        setToken(storedToken);
      } catch (nextError) {
        if (cancelled) return;

        storeToken(null);
        setToken(null);
        setUser(null);
        setError(nextError instanceof Error ? nextError.message : "Falha no login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      config,
      loading,
      error,
      async signIn(nextToken: string) {
        setLoading(true);
        setError(null);

        try {
          const nextUser = await fetchUser(nextToken);
          storeToken(nextToken);
          setToken(nextToken);
          setUser(nextUser);
          queryClient.clear();
        } catch (nextError) {
          storeToken(null);
          setToken(null);
          setUser(null);
          setError(nextError instanceof Error ? nextError.message : "Falha no login");
        } finally {
          setLoading(false);
        }
      },
      signOut() {
        storeToken(null);
        setToken(null);
        setUser(null);
        queryClient.clear();
      },
    }),
    [config, error, loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
