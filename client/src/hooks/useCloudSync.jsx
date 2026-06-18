import { useState, useEffect, useRef, useCallback } from 'react';

const DEBOUNCE_MS = 2500;

export function useCloudSync(user, yamlText) {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncReady, setSyncReady] = useState(false);
  const timerRef = useRef(null);
  const lastSavedRef = useRef('');
  const statusTimerRef = useRef(null);

  const saveGraph = useCallback(async (yaml) => {
    try {
      const res = await fetch('/api/graph', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ yaml }),
      });
      if (!res.ok) throw new Error('Save failed');
      lastSavedRef.current = yaml;
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!user || !yamlText || !syncReady || yamlText === lastSavedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setSyncStatus('saving');
      const ok = await saveGraph(yamlText);
      setSyncStatus(ok ? 'saved' : 'error');
      if (ok) {
        statusTimerRef.current = setTimeout(() => setSyncStatus('idle'), 2000);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, [user, yamlText, syncReady, saveGraph]);

  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch('/api/graph', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.graph) {
        lastSavedRef.current = data.graph;
      }
      return data.graph;
    } catch {
      return null;
    }
  }, []);

  const markSyncReady = useCallback(() => {
    setSyncReady(true);
  }, []);

  return { syncStatus, fetchGraph, saveGraph, markSyncReady };
}
