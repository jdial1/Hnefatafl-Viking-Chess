import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

function openLatestApk() {
  const url = import.meta.env.VITE_APK_URL;
  if (url) window.open(url, '_blank');
}

export function formatBuildId(id: string): string {
  if (/^v?\d+\.\d+/.test(id)) return id;
  return id.length > 7 ? id.slice(0, 7) : id;
}

export function useAppUpdate() {
  const [available, setAvailable] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(import.meta.env.VITE_BUILD_ID || null);
  const [latestId, setLatestId] = useState<string | null>(null);
  const applyRef = useRef(() => {
    if (Capacitor.isNativePlatform()) openLatestApk();
    else window.location.reload();
  });

  useEffect(() => {
    let cancelled = false;

    const offer = (apply: () => void, latest?: string) => {
      if (cancelled) return;
      applyRef.current = apply;
      if (latest) setLatestId(latest);
      setAvailable(true);
    };

    void import('virtual:pwa-register').then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          offer(() => {
            void updateSW(true);
          });
        },
      });
    });

    const manifestUrl = import.meta.env.VITE_UPDATE_MANIFEST;
    const buildId = import.meta.env.VITE_BUILD_ID;
    if (buildId) setCurrentId(buildId);
    if (!manifestUrl || !buildId) return () => {
      cancelled = true;
    };

    void fetch(manifestUrl, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { id?: string } | null) => {
        if (!data?.id || data.id === buildId) return;
        offer(() => {
          if (Capacitor.isNativePlatform()) openLatestApk();
          else window.location.reload();
        }, data.id);
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
      applyRef.current();
    },
  };
}
