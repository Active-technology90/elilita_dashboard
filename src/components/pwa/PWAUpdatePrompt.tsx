import { useEffect, useRef } from "react";
import { RefreshCw, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const VISIBILITY_CHECK_COOLDOWN_MS = 5 * 60 * 1000;

export function PWAUpdatePrompt() {
  const lastCheckRef = useRef<number>(0);
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration;
      if (!registration) return;

      lastCheckRef.current = Date.now();
      window.setInterval(() => {
        if (navigator.onLine) {
          void registration.update();
        }
      }, UPDATE_CHECK_INTERVAL_MS);
    },
    onRegisterError(error) {
      console.error("PWA service worker registration error:", error);
    },
  });

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (!navigator.onLine) return;
      const reg = registrationRef.current;
      if (!reg) return;

      const now = Date.now();
      if (now - lastCheckRef.current < VISIBILITY_CHECK_COOLDOWN_MS) return;
      lastCheckRef.current = now;
      void reg.update();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] right-4 left-4 z-[95]
        mx-auto flex max-w-md items-center justify-between gap-3
        rounded-2xl border border-[#6750A4]/20 bg-gray-900 px-4 py-3 text-white shadow-2xl
        sm:left-auto sm:w-[380px]
      "
    >
      <div className="min-w-0">
        <p className="text-xs font-bold text-white">Update Available</p>
        <p className="text-[11px] text-gray-300">
          A new version of elilitaadmin is ready.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="
            inline-flex items-center gap-1.5 rounded-xl bg-[#6750A4] px-3 py-1.5
            text-xs font-semibold text-white transition hover:bg-[#7b63bd] cursor-pointer
          "
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>

        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          aria-label="Dismiss update notification"
          className="rounded-lg p-1 text-gray-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

