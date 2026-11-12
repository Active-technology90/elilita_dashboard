import { createContext, useContext } from "react";

export type InstallTriggerResult =
  | "accepted"
  | "dismissed"
  | "ios-guide"
  | "unavailable";

export interface PWAInstallContextValue {
  isStandalone: boolean;
  isIOS: boolean;
  isMobile: boolean;
  canPromptNative: boolean;
  isIOSInstallEligible: boolean;
  isInstallable: boolean;
  isBannerDismissed: boolean;
  showIOSGuide: boolean;
  openIOSGuide: () => void;
  closeIOSGuide: () => void;
  dismissBanner: () => void;
  triggerInstall: () => Promise<InstallTriggerResult>;
}

export const PWAInstallContext = createContext<
  PWAInstallContextValue | undefined
>(undefined);

export function usePWAInstall(): PWAInstallContextValue {
  const ctx = useContext(PWAInstallContext);
  if (!ctx) {
    throw new Error("usePWAInstall must be used within PWAInstallProvider");
  }
  return ctx;
}

