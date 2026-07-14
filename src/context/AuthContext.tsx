import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getBackend } from "../services/backend";
import type { OAuthProvider, UserProfile } from "../services/backend/types";

interface AuthContextValue {
  user: UserProfile | null;
  initializing: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ needsConfirmation?: boolean }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const backend = useMemo(() => getBackend(), []);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    backend
      .getCurrentUser()
      .then((u) => {
        if (mounted) setUser(u);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setInitializing(false);
      });

    const unsub = backend.onAuthStateChange((u) => {
      if (mounted) setUser(u);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [backend]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { user } = await backend.signInWithEmail(email, password);
      if (user) setUser(user);
    },
    [backend]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, username: string) => {
      const res = await backend.signUpWithEmail(email, password, username);
      if (res.user) setUser(res.user);
      return { needsConfirmation: res.needsConfirmation };
    },
    [backend]
  );

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      const { user } = await backend.signInWithOAuth(provider);
      if (user) setUser(user);
    },
    [backend]
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      await backend.sendPasswordReset(email);
    },
    [backend]
  );

  const signOut = useCallback(async () => {
    await backend.signOut();
    setUser(null);
  }, [backend]);

  const refreshUser = useCallback(async () => {
    const u = await backend.getCurrentUser();
    setUser(u);
  }, [backend]);

  const value = useMemo(
    () => ({
      user,
      initializing,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      sendPasswordReset,
      signOut,
      refreshUser,
      setUser,
    }),
    [
      user,
      initializing,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      sendPasswordReset,
      signOut,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
