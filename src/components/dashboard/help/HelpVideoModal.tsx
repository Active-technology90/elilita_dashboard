import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Play,
  ExternalLink,
  HelpCircle,
  Shield,
  Users,
  Truck,
  Video,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ROLE_HELP_VIDEOS,
  type HelpVideo,
  extractYoutubeId,
  extractYoutubeStartSeconds,
} from "../../../constants/helpVideos";

interface HelpVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string; // "owner" | "admin" | "staff" | "viewer"
  isSuperAdmin?: boolean;
  isMarketing?: boolean;
}


export const HelpVideoModal: React.FC<HelpVideoModalProps> = ({
  isOpen,
  onClose,
  userRole = "staff",
  isSuperAdmin = false,
  isMarketing = false,
}) => {
  // Normalize role: staff is dispatcher
  const normalizedRole: "owner" | "admin" | "staff" = useMemo(() => {
    if (userRole === "owner" || userRole === "admin" || userRole === "staff") {
      return userRole;
    }
    return "staff";
  }, [userRole]);

  // Determine available links based on role hierarchy
  // Owner & SuperAdmin: see all 3 links
  // Admin: sees Admin & Dispatcher links
  // Dispatcher (staff): strictly sees Dispatcher link
  const availableRoles: ("owner" | "admin" | "staff")[] = useMemo(() => {
    if (isSuperAdmin || isMarketing || normalizedRole === "owner") {
      return ["owner", "admin", "staff"];
    }
    if (normalizedRole === "admin") {
      return ["admin", "staff"];
    }
    return ["staff"];
  }, [normalizedRole, isSuperAdmin, isMarketing]);

  const [selectedRole, setSelectedRole] = useState<"owner" | "admin" | "staff">(normalizedRole);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync selected role when modal opens or user switches company context
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(normalizedRole);
      setIsPlaying(false);
    }
  }, [isOpen, normalizedRole]);

  // Handle escape key to close + lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  const currentVideo: HelpVideo =
    ROLE_HELP_VIDEOS[selectedRole] || ROLE_HELP_VIDEOS.staff;
  const youtubeEmbedId =
    extractYoutubeId(currentVideo.youtubeUrl) ||
    extractYoutubeId(currentVideo.youtubeId);
  const startSeconds = extractYoutubeStartSeconds(currentVideo.youtubeUrl);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeEmbedId}?autoplay=1&rel=0${
    startSeconds ? `&start=${startSeconds}` : ""
  }`;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Shield className="h-3.5 w-3.5" />;
      case "admin":
        return <Users className="h-3.5 w-3.5" />;
      case "staff":
        return <Truck className="h-3.5 w-3.5" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-video-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-gray-900/5 sm:max-h-[92vh] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ========== MOBILE DRAG HANDLE ========== */}
            <div className="flex justify-center pt-2.5 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            {/* ========== HEADER ========== */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/90 to-white px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 shadow-sm sm:h-10 sm:w-10">
                  <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="help-video-title"
                    className="text-sm font-bold leading-tight text-gray-900 sm:text-base"
                  >
                    Help & Video Guides
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 sm:text-xs">
                    Onboarding guides tailored to your role
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* ========== ROLE TABS ========== */}
            <div className="border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="hidden shrink-0 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:inline">
                  Role
                </span>

                {/* Mobile: equal-width segmented control; Desktop: inline chips */}
                <div className="-mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1 pb-0.5 sm:gap-2">
                  {availableRoles.map((roleKey) => {
                    const video = ROLE_HELP_VIDEOS[roleKey];
                    const isCurrentActiveRole = roleKey === normalizedRole;
                    const isSelected = roleKey === selectedRole;

                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => {
                          setSelectedRole(roleKey);
                          setIsPlaying(false);
                        }}
                        className={`
                          relative flex min-w-0 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 sm:px-3.5
                          ${
                            isSelected
                              ? "bg-secondary text-white shadow-sm"
                              : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          }
                        `}
                      >
                        <span className={isSelected ? "text-white" : "text-gray-400"}>
                          {getRoleIcon(roleKey)}
                        </span>
                        <span className="truncate">{video.roleLabel}</span>

                        {isCurrentActiveRole && (
                          <span
                            className={`ml-0.5 hidden rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:inline ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-secondary/10 text-secondary"
                            }`}
                          >
                            You
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ========== BODY ========== */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
                {/* Video Player */}
                <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-black/5">
                  {isPlaying && youtubeEmbedId ? (
                    <iframe
                      src={embedUrl}
                      title={currentVideo.title}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsPlaying(true)}
                      aria-label={`Play ${currentVideo.title}`}
                      className="relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden bg-gray-900"
                    >
                      {youtubeEmbedId ? (
                        <img
                          src={`https://img.youtube.com/vi/${youtubeEmbedId}/hqdefault.jpg`}
                          alt={currentVideo.title}
                          className="h-full w-full object-cover opacity-80 transition-all duration-300 group-hover:scale-105 group-hover:opacity-95"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-gray-300">
                          <Video className="mb-2 h-12 w-12 text-gray-500" />
                          <p className="text-sm font-semibold">Video preview ready</p>
                          <p className="text-xs text-gray-400">Click to play tutorial</p>
                        </div>
                      )}

                      <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-colors group-hover:from-black/50" />

                      {/* Play button */}
                      <span className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl ring-4 ring-white/20 transition-all duration-200 group-hover:scale-110 group-hover:bg-red-700 sm:h-16 sm:w-16">
                        <Play className="ml-0.5 h-6 w-6 fill-white sm:h-7 sm:w-7" />
                      </span>

                      {/* Duration chip */}
                      {currentVideo.duration && (
                        <span className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                          {currentVideo.duration}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Meta + Action row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary">
                      {getRoleIcon(selectedRole)}
                      {currentVideo.roleLabel} Guide
                    </span>
                    {selectedRole === normalizedRole && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        <Sparkles className="h-3 w-3" />
                        Recommended for you
                      </span>
                    )}
                  </div>

                  <a
                    href={currentVideo.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 sm:w-auto sm:text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Watch on YouTube
                  </a>
                </div>

                {/* Title + Description */}
                {(currentVideo.title || currentVideo.description) && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                    {currentVideo.title && (
                      <h2 className="text-sm font-bold leading-snug text-gray-900 sm:text-base">
                        {currentVideo.title}
                      </h2>
                    )}
                    {currentVideo.description && (
                      <p className="mt-1.5 text-[12px] leading-relaxed text-gray-600 sm:text-sm">
                        {currentVideo.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ========== FOOTER (MOBILE STICKY CLOSE) ========== */}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
              <p className="hidden text-[11px] text-gray-400 sm:block">
                Press <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">Esc</kbd> to close
              </p>
              <button
                type="button"
                onClick={onClose}
                className="ml-auto inline-flex h-10 w-full items-center justify-center rounded-xl bg-secondary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90 sm:w-auto"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};