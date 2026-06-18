import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setAuthTokenGetter, type AuthUser } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";

const TOKEN_STORAGE_KEY = "mycellar.authToken";
const LEGACY_GOOGLE_TOKEN_STORAGE_KEY = "mycellar.googleIdToken";

type AuthConfig = {
  configured: boolean;
  clientId: string | null;
  closedBeta?: {
    enabled: boolean;
  };
  emailLogin?: {
    configured: boolean;
  };
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  config: AuthConfig | null;
  loading: boolean;
  error: string | null;
  signIn: (token: string) => Promise<void>;
  requestEmailCode: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function readStoredToken() {
  try {
    return (
      localStorage.getItem(TOKEN_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_GOOGLE_TOKEN_STORAGE_KEY) ??
      sessionStorage.getItem(TOKEN_STORAGE_KEY) ??
      sessionStorage.getItem(LEGACY_GOOGLE_TOKEN_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

function storeToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.removeItem(LEGACY_GOOGLE_TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(LEGACY_GOOGLE_TOKEN_STORAGE_KEY);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(LEGACY_GOOGLE_TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(LEGACY_GOOGLE_TOKEN_STORAGE_KEY);
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

  if (!response.ok) throw new Error("Sessão inválida ou expirada");
  return response.json();
}

async function createGoogleSession(token: string): Promise<{ token: string; user: AuthUser }> {
  const response = await fetch("/api/auth/google/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) throw await responseError(response, "Falha no login com Google");
  return response.json();
}

async function responseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error === "Access is restricted to closed beta testers") {
      return new Error("Este e-mail ainda não está liberado na beta fechada.");
    }
    if (data.error) return new Error(data.error);
  } catch {
    // Keep the user-facing fallback when the API does not return JSON.
  }

  return new Error(fallback);
}

export function getAuthToken() {
  return readStoredToken();
}

export function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getAuthToken();
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
    setAuthTokenGetter(() => getAuthToken());
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
          const session = await createGoogleSession(nextToken);
          storeToken(session.token);
          setToken(session.token);
          setUser(session.user);
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
      async requestEmailCode(email: string) {
        setLoading(true);
        setError(null);

        try {
          const response = await fetch("/api/auth/email/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) throw await responseError(response, "Não foi possível enviar o código por e-mail");
        } catch (nextError) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Não foi possível enviar o código por e-mail",
          );
          throw nextError;
        } finally {
          setLoading(false);
        }
      },
      async verifyEmailCode(email: string, code: string) {
        setLoading(true);
        setError(null);

        try {
          const response = await fetch("/api/auth/email/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
          });

          if (!response.ok) throw await responseError(response, "Código inválido ou expirado");

          const data = await response.json();
          storeToken(data.token);
          setToken(data.token);
          setUser(data.user);
          queryClient.clear();
        } catch (nextError) {
          storeToken(null);
          setToken(null);
          setUser(null);
          setError(
            nextError instanceof Error ? nextError.message : "Falha no login",
          );
          throw nextError;
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
