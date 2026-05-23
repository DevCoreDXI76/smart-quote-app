/**
 * @file contexts/AuthProvider.tsx
 * @description Supabase Auth 세션 + public.users 프로필(role) 전역 제공
 *
 * [보안 가이드]
 * - isAdmin은 UI·라우팅 보조용입니다. /admin·/api/admin/* 는 미들웨어·RLS가 최종 검증합니다.
 * - profile.role을 클라이언트에서 직접 수정하지 마세요.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabaseClient";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AppUserProfile, UserRole } from "@/types";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: AppUserProfile | null;
  isAdmin: boolean;
  profileLoading: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapProfileRow(row: {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
}): AppUserProfile {
  const role: UserRole = row.role === "admin" ? "admin" : "user";
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role,
    createdAt: row.created_at,
  };
}

/**
 * AuthProvider: 자식 컴포넌트에서 useAuth()로 세션·프로필·로그인 API 사용
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const loadProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("users")
        .select("id, email, display_name, role, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data ? mapProfileRow(data) : null);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    await loadProfile(user.id);
  }, [user, loadProfile]);

  useEffect(() => {
    if (!configured) {
      const timer = window.setTimeout(() => setIsLoading(false), 0);
      return () => window.clearTimeout(timer);
    }

    const supabase = getSupabaseClient();

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
      if (data.session?.user) {
        void loadProfile(data.session.user.id);
      } else {
        setProfile(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
      if (nextSession?.user) {
        void loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [configured, loadProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setProfile(null);
  }, []);

  const isAdmin = profile?.role === "admin";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      isAdmin,
      profileLoading,
      isLoading,
      isConfigured: configured,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      isAdmin,
      profileLoading,
      isLoading,
      configured,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

/**
 * Auth 컨텍스트 훅 (AuthProvider 하위에서만 사용)
 */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext는 AuthProvider 내부에서만 사용할 수 있습니다.");
  }
  return ctx;
}
