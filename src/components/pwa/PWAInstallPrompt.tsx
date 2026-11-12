import { Download, Share, PlusSquare, X, Smartphone } from "lucide-react";
import { useLocation } from "react-router-dom";
import { usePWAInstall } from "../../hooks/usePWAInstall";

export function PWAInstallPrompt() {
  const { pathname } = useLocation();
  const {
    isMobile,
    isInstallable,
    isBannerDismissed,
    isIOSInstallEligible,
    showIOSGuide,
    closeIOSGuide,
    dismissBanner,
    triggerInstall,
  } = usePWAInstall();

  const showFloatingBanner =
    isMobile && isInstallable && !isBannerDismissed && !showIOSGuide;

  if (!showFloatingBanner && !showIOSGuide) {
    return null;
  }

  const topOffsetClass = pathname.startsWith("/dashboard")
    ? "top-[72px]"
    : "top-4";

  return (
    <>
      {showFloatingBanner && (
        <div
          role="dialog"
          aria-label="Install elilitaadmin app"
          className={`
            fixed ${topOffsetClass} inset-x-3 z-40 mx-auto max-w-md
            rounded-2xl border border-[#6750A4]/20 bg-white/95 backdrop-blur-xl
            p-3.5 shadow-[0_12px_36px_rgba(59,30,112,0.16)]
            sm:inset-x-auto sm:right-4 sm:w-[360px]
          `}
        >
          <div className="flex items-start gap-3">
            <img
              src="/icons/pwa-192x192.png"
              alt="elilitaadmin icon"
              className="h-11 w-11 shrink-0 rounded-xl border border-gray-100 object-cover shadow-xs"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold leading-tight text-gray-900">
                    Install elilitaadmin
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-gray-500">
                    {isIOSInstallEligible
                      ? "Add to your iPhone Home Screen for quick app access and push alerts."
                      : "Install on your phone for instant full-screen access from your home screen."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={dismissBanner}
                  aria-label="Dismiss install banner"
                  className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void triggerInstall()}
                  className="
                    inline-flex items-center gap-1.5 rounded-xl bg-[#6750A4]
                    px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm
                    transition hover:bg-[#574096] active:scale-[0.98] cursor-pointer
                  "
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isIOSInstallEligible ? "How to Install" : "Install App"}</span>
                </button>

                <button
                  type="button"
                  onClick={dismissBanner}
                  className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-[2px] p-3 sm:items-center"
          onClick={closeIOSGuide}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-install-title"
            className="w-full max-w-md rounded-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/pwa-192x192.png"
                  alt="elilitaadmin"
                  className="h-11 w-11 rounded-xl border border-gray-100 object-cover shadow-xs"
                />
                <div>
                  <h2
                    id="ios-pwa-install-title"
                    className="text-base font-bold text-gray-900"
                  >
                    Install elilitaadmin
                  </h2>
                  <p className="text-xs text-gray-500">
                    Add to iPhone / iPad Home Screen
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeIOSGuide}
                aria-label="Close instructions"
                className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ol className="mt-4 space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#6750A4]/10 text-[#6750A4]">
                  <Share className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-gray-900">
                    1. Tap the Share button
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Open in Safari and tap the Share icon at the bottom or top bar.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#6750A4]/10 text-[#6750A4]">
                  <PlusSquare className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-gray-900">
                    2. Choose &ldquo;Add to Home Screen&rdquo;
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Scroll the share menu and select Add to Home Screen.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#6750A4]/10 text-[#6750A4]">
                  <Smartphone className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-gray-900">
                    3. Tap &ldquo;Add&rdquo;
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Launch <strong>elilitaadmin</strong> directly from your home screen like a native app.
                  </p>
                </div>
              </li>
            </ol>

            <button
              type="button"
              onClick={closeIOSGuide}
              className="mt-4 w-full rounded-xl bg-[#6750A4] py-2.5 text-sm font-semibold text-white transition hover:bg-[#574096] active:scale-[0.99] cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
