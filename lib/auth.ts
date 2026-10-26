"use client";

import type { User } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";

// Optional Google sign-in through Supabase (same setup as Grounds Up). Signed in, the data syncs to the account.

export type AuthStatus = "off" | "loading" | "signedOut" | "signedIn";
export type Account = { id: string; name: string; email: string; avatarUrl: string | null };
export type AuthState = { status: AuthStatus; account: Account | null; error: string | null; busy: boolean };

const INITIAL: AuthState = { status: "loading", account: null, error: null, busy: false };
let state: AuthState = INITIAL;
const listeners = new Set<() => void>();

function set(patch: Partial<AuthState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function toAccount(user: User): Account {
  const meta = user.user_metadata ?? {};
  const email = user.email ?? "";
  const name = (meta.full_name ?? meta.name ?? email.split("@")[0] ?? "You") as string;
  const avatarUrl = (meta.avatar_url ?? meta.picture ?? null) as string | null;
  return { id: user.id, name, email, avatarUrl };
}

/** An OAuth error sent back in the URL (e.g. sign-in cancelled at Google). Removes it from the address bar. */
function takeUrlError(): string | null {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const message = url.searchParams.get("error_description") ?? hash.get("error_description");
  if (!message) return null;
  for (const k of ["error", "error_code", "error_description"]) url.searchParams.delete(k);
  if (hash.has("error_description")) url.hash = "";
  window.history.replaceState(window.history.state, "", url.toString());
  return message.replace(/\+/g, " ");
}

let started = false;

function init() {
  if (started || typeof window === "undefined") return;
  started = true;
  const sb = supabase();
  if (!sb) return set({ status: "off" });
  const urlError = takeUrlError();
  if (urlError) set({ error: `Google sign-in didn't finish: ${urlError}` });
  sb.auth.onAuthStateChange((_event, session) => {
    set({ status: session ? "signedIn" : "signedOut", account: session ? toAccount(session.user) : null, busy: false });
  });
  // getSession waits for the client to finish starting up, including the ?code= exchange after the redirect.
  sb.auth.getSession().then(({ data, error }) => {
    const session = data.session;
    set({
      status: session ? "signedIn" : "signedOut",
      account: session ? toAccount(session.user) : null,
      ...(error ? { error: `Google sign-in didn't finish: ${error.message}` } : {}),
    });
  });
}

export async function signIn() {
  const sb = supabase();
  if (!sb) return;
  set({ busy: true, error: null });
  // Come back to this app's address (localhost, the Vercel domain…).
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}${base}/`, queryParams: { prompt: "select_account" } },
  });
  if (error) set({ busy: false, error: `Couldn't start Google sign-in: ${error.message}` });
}

export async function signOut() {
  const sb = supabase();
  if (!sb) return;
  set({ busy: true });
  const { error } = await sb.auth.signOut();
  set(error ? { busy: false, error: `Couldn't sign out: ${error.message}` } : { busy: false, status: "signedOut", account: null });
}

export function clearAuthError() {
  set({ error: null });
}

function subscribe(l: () => void) {
  init();
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, () => state, () => INITIAL);
}
