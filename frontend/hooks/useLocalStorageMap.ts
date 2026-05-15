"use client";

/**
 * Small typed wrapper around localStorage for a `Record<string, T>` namespaced
 * by a key (e.g. `interview-review:cybersecurity`). Survives reloads, syncs
 * across tabs via the `storage` event.
 *
 * Returns a tuple: the current map and a setter for a single key.
 */

import { useCallback, useEffect, useState } from "react";

export function useLocalStorageMap<T>(
  storageKey: string
): [Record<string, T>, (key: string, value: T | undefined) => void, () => void] {
  const [map, setMap] = useState<Record<string, T>>({});

  // Load on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setMap(JSON.parse(raw) as Record<string, T>);
    } catch {
      /* corrupt entry — ignore */
    }
  }, [storageKey]);

  // Cross-tab sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onStorage(e: StorageEvent) {
      if (e.key !== storageKey) return;
      try {
        setMap(e.newValue ? (JSON.parse(e.newValue) as Record<string, T>) : {});
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const setOne = useCallback(
    (key: string, value: T | undefined) => {
      setMap((cur) => {
        const next = { ...cur };
        if (value === undefined) delete next[key];
        else next[key] = value;
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* private mode / quota */
        }
        return next;
      });
    },
    [storageKey]
  );

  const clear = useCallback(() => {
    setMap({});
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  return [map, setOne, clear];
}
