// The signed-in user's data in Supabase (table public.wwtp_data, see supabase/wwtp-data.sql): one row per user
// holding the whole AppData as JSON, plus a fingerprint and save time so devices can tell who changed what.

import { parseBackup } from "./backup";
import { supabase } from "./supabase";
import type { AppData } from "./types";

const TABLE = "wwtp_data";

export interface CloudMeta {
  savedAt: number; // epoch ms
  fingerprint: string;
  device: string;
}

/** What this device and the account agreed on at the last sync (kept per signed-in user). */
export interface SyncRecord {
  fingerprint: string;
  cloudSavedAt: number;
}

export interface LocalMeta {
  fingerprint: string;
  /** When this device last changed the data (epoch ms), or 0 if it never has (fresh starter tasks). */
  changedAt: number;
}

export type SyncDecision =
  | { kind: "none" } // both sides already agree
  | { kind: "inSync" } // same data, just note it
  | { kind: "upload" } // only this device changed (or the account is empty)
  | { kind: "download" } // only the account changed (another device): take it
  | { kind: "ask" }; // both changed since the last sync: let the user choose

/**
 * Pure sync rules, after Grounds Up's decideSync. Unlike a game save, a task list that only changed on another
 * device is simply loaded; the user is asked only when both sides changed.
 */
export function decideSync(local: LocalMeta, cloud: CloudMeta | null, record: SyncRecord | null): SyncDecision {
  if (!cloud) return { kind: "upload" };
  if (local.fingerprint === cloud.fingerprint) {
    return record && record.fingerprint === local.fingerprint && record.cloudSavedAt === cloud.savedAt ? { kind: "none" } : { kind: "inSync" };
  }
  const localChanged = record ? record.fingerprint !== local.fingerprint : local.changedAt > 0;
  const cloudChanged = !record || record.cloudSavedAt !== cloud.savedAt;
  if (!cloudChanged) return localChanged ? { kind: "upload" } : { kind: "none" };
  return localChanged ? { kind: "ask" } : { kind: "download" };
}

/** A short, stable fingerprint of the data (FNV-1a over its JSON). */
export function fingerprint(data: unknown): string {
  const s = JSON.stringify(data) ?? "";
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x5bd1e995);
  }
  return `${(h1 >>> 0).toString(36)}-${(h2 >>> 0).toString(36)}-${s.length.toString(36)}`;
}

function client() {
  const sb = supabase();
  if (!sb) throw new Error("Sign-in isn't set up in this build.");
  return sb;
}

/** Turns Supabase/network errors into a sentence for the user. */
function fail(error: { message: string; code?: string }): never {
  if (error.code === "42P01" || error.code === "PGRST205" || /relation .*wwtp_data.* does not exist|Could not find the table/i.test(error.message))
    throw new Error("Cloud saving isn't set up yet: the wwtp_data table is missing in Supabase.");
  if (/fetch|network|Load failed/i.test(error.message)) throw new Error("Can't reach your account right now (offline?).");
  throw new Error(`Couldn't sync: ${error.message}`);
}

type Row = { fingerprint: string; saved_at: string; device: string; data?: unknown };

const toMeta = (r: Row): CloudMeta => ({ fingerprint: r.fingerprint, savedAt: Date.parse(r.saved_at), device: r.device });

export async function getCloudMeta(): Promise<CloudMeta | null> {
  const { data, error } = await client().from(TABLE).select("fingerprint, saved_at, device").maybeSingle();
  if (error) fail(error);
  return data ? toMeta(data as Row) : null;
}

export async function getCloudData(): Promise<{ meta: CloudMeta; data: AppData }> {
  const { data, error } = await client().from(TABLE).select("fingerprint, saved_at, device, data").maybeSingle();
  if (error) fail(error);
  if (!data) throw new Error("There's no copy in your account yet.");
  const row = data as Row;
  return { meta: toMeta(row), data: parseBackup(row.data) };
}

export async function putCloudData(userId: string, appData: AppData, device: string): Promise<CloudMeta> {
  const meta = { fingerprint: fingerprint(appData), savedAt: Date.now(), device };
  const { error } = await client()
    .from(TABLE)
    .upsert(
      { user_id: userId, data: appData, fingerprint: meta.fingerprint, saved_at: new Date(meta.savedAt).toISOString(), device },
      { onConflict: "user_id" },
    );
  if (error) fail(error);
  return meta;
}

export function deviceName(): string {
  if (typeof navigator === "undefined") return "";
  return /iPhone|iPad|Android|Mobi/i.test(navigator.userAgent) ? "phone" : "computer";
}
