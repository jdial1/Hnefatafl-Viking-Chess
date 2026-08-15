import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Maps the Android hardware back button onto in-app navigation.
 * `onBack` returns false once there is nothing left to dismiss, which exits the app.
 */
export function useBackButton(onBack: () => boolean): void {
  const handlerRef = useRef(onBack);
  handlerRef.current = onBack;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('backButton', () => {
      if (!handlerRef.current()) App.exitApp();
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, []);
}
