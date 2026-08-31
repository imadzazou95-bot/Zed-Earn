/**
 * pwa.ts — web-only progressive-web-app helpers:
 * service-worker registration, install prompt, online/offline + update state.
 * All calls are no-ops on native.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

let deferredPrompt: any = null;

export function registerServiceWorker(onUpdate?: () => void) {
  if (!isWeb || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .register('/sw.js')
    .then((reg) => {
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) onUpdate?.();
        });
      });
    })
    .catch(() => undefined);
}

export function applyUpdate() {
  if (!isWeb || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistration().then((reg) => {
    reg?.waiting?.postMessage('SKIP_WAITING');
    setTimeout(() => window.location.reload(), 250);
  });
}

/** Injects the manifest link at runtime as a fallback (build script also injects it). */
export function ensureManifestLink() {
  if (!isWeb) return;
  if (document.querySelector('link[rel="manifest"]')) return;
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = '/manifest.json';
  document.head.appendChild(link);
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (!isWeb) return;
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (!isWeb) return;
    const standalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches || (window.navigator as any).standalone === true;
    setInstalled(!!standalone);
    if (deferredPrompt) setCanInstall(true);

    const onPrompt = (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferredPrompt = null;
      setCanInstall(false);
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
    return outcome;
  };

  return { canInstall, installed, promptInstall, isWeb };
}
