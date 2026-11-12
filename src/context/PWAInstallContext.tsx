import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  PWAInstallContext,
  type InstallTriggerResult,
  type PWAInstallContextValue,
} from "../hooks/usePWAInstall";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

const DISMISS_STORAGE_KEY = "elilita_pwa_install_dismissed_at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isAppleMobile = /iPhone|iPad|iPod/i.test(ua);
  // iPadOS 13+ reports Macintosh with multi-touch points
  const isIPadOS =
    /Macintosh/i.test(ua) &&
    typeof window.navigator.maxTouchPoints === "number" &&
    window.navigator.maxTouchPoints > 1;
  return isAppleMobile || isIPadOS;
}

function detectMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    detectIOS() ||
    /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent,
    ) ||
    window.innerWidth < 768
  );
}

function readIsDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp)) return false;
    return Date.now() - timestamp < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function PWAInstallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(detectStandalone);
  const [isIOS] = useState<boolean>(detectIOS);
  const [isMobile, setIsMobile] = useState<boolean>(detectMobileViewport);
  const [isBannerDismissed, setIsBannerDismissed] =
    useState<boolean>(readIsDismissed);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowIOSGuide(false);
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setDeferredPrompt(null);
        setShowIOSGuide(false);
      } else {
        setIsStandalone(detectStandalone());
      }
    };

    const handleResize = () => {
      setIsMobile(detectMobileViewport());
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("resize", handleResize);
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("resize", handleResize);
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const canPromptNative = !isStandalone && deferredPrompt !== null;
  const isIOSInstallEligible = !isStandalone && isIOS && !canPromptNative;
  const isInstallable = !isStandalone && (canPromptNative || isIOSInstallEligible);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore storage failures */
    }
  }, []);

  const openIOSGuide = useCallback(() => {
    setShowIOSGuide(true);
  }, []);

  const closeIOSGuide = useCallback(() => {
    setShowIOSGuide(false);
  }, []);

  const triggerInstall = useCallback(async (): Promise<InstallTriggerResult> => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === "accepted") {
        setIsStandalone(true);
        return "accepted";
      }
      return "dismissed";
    }

    if (isIOS && !isStandalone) {
      setShowIOSGuide(true);
      return "ios-guide";
    }

    return "unavailable";
  }, [deferredPrompt, isIOS, isStandalone]);

  const value = useMemo<PWAInstallContextValue>(
    () => ({
      isStandalone,
      isIOS,
      isMobile,
      canPromptNative,
      isIOSInstallEligible,
      isInstallable,
      isBannerDismissed,
      showIOSGuide,
      openIOSGuide,
      closeIOSGuide,
      dismissBanner,
      triggerInstall,
    }),
    [
      isStandalone,
      isIOS,
      isMobile,
      canPromptNative,
      isIOSInstallEligible,
      isInstallable,
      isBannerDismissed,
      showIOSGuide,
      openIOSGuide,
      closeIOSGuide,
      dismissBanner,
      triggerInstall,
    ],
  );

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
    </PWAInstallContext.Provider>
  );
}
