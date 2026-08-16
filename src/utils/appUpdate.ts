import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const REFRESH_PARAM = '_refresh';

function openLatestApk() {
  const url = import.meta.env.VITE_APK_URL;
  if (url) window.open(url, '_blank');
}

export function formatBuildId(id: string): string {
  if (/^v?\d+\.\d+/.test(id)) return id;
  return id.length > 7 ? id.slice(0, 7) : id;
}

function stripRefreshParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(REFRESH_PARAM)) return;
  url.searchParams.delete(REFRESH_PARAM);
  const query = url.searchParams.toString();
  window.history.replaceState(null, '', `${url.pathname}${query ? `?${query}` : ''}${url.hash}`);
}

async function clearWebCaches() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

function poisonNavigate() {
  const url = new URL(window.location.href);
  url.searchParams.set(REFRESH_PARAM, Date.now().toString());
  window.location.replace(url.href);
}

async function applyWebUpdate() {
  await clearWebCaches();
  poisonNavigate();
}

export function useAppUpdate() {
  const [available, setAvailable] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(import.meta.env.VITE_BUILD_ID || null);
  const [latestId, setLatestId] = useState<string | null>(null);

  useEffect(() => {
    stripRefreshParam();
    let cancelled = false;
    const buildId = import.meta.env.VITE_BUILD_ID || null;
    if (buildId) setCurrentId(buildId);

    const offer = (latest?: string) => {
      if (cancelled) return;
      if (latest) setLatestId(latest);
      setAvailable(true);
    };

    void import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          offer();
        },
      });
    });

    const manifestUrl = import.meta.env.VITE_UPDATE_MANIFEST;
    if (!manifestUrl || !buildId) {
      return () => {
        cancelled = true;
      };
    }

    void fetch(manifestUrl, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { id?: string } | null) => {
        if (!data?.id || data.id === buildId) return;
        offer(data.id);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    available,
    currentId,
    latestId,
    apply() {
      setAvailable(false);
      if (Capacitor.isNativePlatform()) {
        openLatestApk();
        return;
      }
      void applyWebUpdate();
    },
  };
}
