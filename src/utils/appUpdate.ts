import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

function openLatestApk() {
  const url = import.meta.env.VITE_APK_URL;
  if (url) window.open(url, '_blank');
}

export function useAppUpdate() {
  const [available, setAvailable] = useState(false);
  const applyRef = useRef(() => {
    if (Capacitor.isNativePlatform()) openLatestApk();
    else window.location.reload();
  });

  useEffect(() => {
    let cancelled = false;

    const offer = (apply: () => void) => {
      if (cancelled) return;
      applyRef.current = apply;
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
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    available,
    apply() {
      applyRef.current();
    },
  };
}
