"use client";

// Keeps the signed-in user's account in step with this device. The device stays the source of truth while
// you work: a change is sent up a few seconds after it happens (right away when the app goes to the background),
// the account is checked again whenever the app comes back to the front, and a newer copy from another device is
// loaded automatically. Only when both sides changed since the last sync does it ask which copy to keep.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Account } from "./auth";
import { decideSync, deviceName, fingerprint, getCloudData, getCloudMeta, putCloudData, type CloudMeta, type SyncRecord } from "./cloud";
import type { AppData } from "./types";

const UPLOAD_DELAY_MS = 3000;
const RECHECK_MS = 120_000;
const CHANGED_AT_KEY = "wwtp-tm-changed-at";
const recordKey = (userId: string) => `wwtp-tm-sync:${userId}`;

export type SyncStatus = "off" | "checking" | "saving" | "synced" | "waiting" | "paused" | "error";

export interface SyncPrompt {
  cloud: CloudMeta;
  localChangedAt: number;
}

export interface CloudSync {
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  prompt: SyncPrompt | null;
  busy: boolean;
  syncNow: () => void;
  resolve: (choice: "cloud" | "local" | "later") => Promise<void>;
}

function read<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: the next sync just checks again.
  }
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function useCloudSync(data: AppData, ready: boolean, account: Account | null, replaceAll: (d: AppData) => void): CloudSync {
  const [status, setStatus] = useState<SyncStatus>("off");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<SyncPrompt | null>(null);
  const [busy, setBusy] = useState(false);

  const userId = account?.id ?? null;
  const dataRef = useRef(data);
  const userRef = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  const again = useRef(false);
  /** The account copy the user chose to "decide later" about: no prompt and no upload until it changes. */
  const pausedOn = useRef<number | null>(null);
  /** Fingerprint of data we just loaded from the account, so loading it doesn't count as a local change. */
  const applied = useRef<string | null>(null);

  dataRef.current = data;

  const sync = useCallback(async () => {
    const uid = userRef.current;
    if (!uid) return;
    if (running.current) return void (again.current = true);
    running.current = true;
    setStatus("checking");
    try {
      const current = dataRef.current;
      const local = { fingerprint: fingerprint(current), changedAt: read<number>(CHANGED_AT_KEY) ?? 0 };
      const cloud = await getCloudMeta();
      if (uid !== userRef.current) return;
      const record = read<SyncRecord>(recordKey(uid));
      const d = decideSync(local, cloud, record);
      const done = () => {
        setStatus("synced");
        setPrompt(null);
        setError(null);
        setLastSyncedAt(Date.now());
      };
      if (d.kind === "none") done();
      else if (d.kind === "inSync") {
        write(recordKey(uid), { fingerprint: local.fingerprint, cloudSavedAt: cloud!.savedAt } satisfies SyncRecord);
        done();
      } else if (d.kind === "upload") {
        setStatus("saving");
        const meta = await putCloudData(uid, current, deviceName());
        if (uid !== userRef.current) return;
        write(recordKey(uid), { fingerprint: meta.fingerprint, cloudSavedAt: meta.savedAt } satisfies SyncRecord);
        done();
      } else if (d.kind === "download") {
        const { meta, data: next } = await getCloudData();
        if (uid !== userRef.current) return;
        // The user may have changed something while this was loading; then compare again next round.
        if (fingerprint(dataRef.current) !== local.fingerprint) {
          again.current = true;
          return;
        }
        applied.current = fingerprint(next);
        replaceAll(next);
        write(recordKey(uid), { fingerprint: applied.current, cloudSavedAt: meta.savedAt } satisfies SyncRecord);
        done();
      } else if (pausedOn.current === cloud!.savedAt) {
        setStatus("paused");
        setPrompt(null);
      } else {
        setStatus("waiting");
        setError(null);
        setPrompt({ cloud: cloud!, localChangedAt: local.changedAt });
      }
    } catch (e) {
      if (uid === userRef.current) {
        setStatus("error");
        setError(errorText(e));
      }
    } finally {
      running.current = false;
      if (again.current) {
        again.current = false;
        schedule(1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replaceAll]);

  const schedule = useCallback(
    (ms: number) => {
      if (!userRef.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        void sync();
      }, ms);
    },
    [sync],
  );

  // Sign-in / sign-out.
  useEffect(() => {
    if (!ready) return;
    userRef.current = userId;
    pausedOn.current = null;
    if (timer.current) clearTimeout(timer.current);
    setPrompt(null);
    setError(null);
    setLastSyncedAt(null);
    setStatus(userId ? "checking" : "off");
    if (userId) void sync();
  }, [userId, ready, sync]);

  // Local edits: remember when, and send them up shortly after.
  const prevData = useRef<AppData | null>(null);
  useEffect(() => {
    if (!ready) return;
    const prev = prevData.current;
    prevData.current = data;
    if (!prev || prev === data) return;
    if (applied.current && applied.current === fingerprint(data)) {
      applied.current = null;
      return;
    }
    write(CHANGED_AT_KEY, Date.now());
    schedule(UPLOAD_DELAY_MS);
  }, [data, ready, schedule]);

  // Leaving the app sends pending changes; coming back (or reconnecting) checks for changes from other devices.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
          void sync();
        }
      } else schedule(0);
    };
    const onOnline = () => schedule(0);
    const interval = setInterval(() => document.visibilityState === "visible" && schedule(0), RECHECK_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      clearInterval(interval);
    };
  }, [schedule, sync]);

  const syncNow = useCallback(() => {
    pausedOn.current = null;
    schedule(0);
  }, [schedule]);

  const resolve = useCallback(
    async (choice: "cloud" | "local" | "later") => {
      const uid = userRef.current;
      if (!prompt || !uid) return;
      if (choice === "later") {
        pausedOn.current = prompt.cloud.savedAt;
        setPrompt(null);
        setStatus("paused");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        if (choice === "cloud") {
          const { meta, data: next } = await getCloudData();
          applied.current = fingerprint(next);
          replaceAll(next);
          write(recordKey(uid), { fingerprint: applied.current, cloudSavedAt: meta.savedAt } satisfies SyncRecord);
        } else {
          const meta = await putCloudData(uid, dataRef.current, deviceName());
          write(recordKey(uid), { fingerprint: meta.fingerprint, cloudSavedAt: meta.savedAt } satisfies SyncRecord);
        }
        pausedOn.current = null;
        setPrompt(null);
        setStatus("synced");
        setLastSyncedAt(Date.now());
      } catch (e) {
        setError(errorText(e));
      } finally {
        setBusy(false);
      }
    },
    [prompt, replaceAll],
  );

  return { status, lastSyncedAt, error, prompt, busy, syncNow, resolve };
}
