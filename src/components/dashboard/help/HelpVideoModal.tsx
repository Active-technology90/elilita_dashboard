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
} from "lucide-react";
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
}

export const HelpVideoModal: React.FC<HelpVideoModalProps> = ({
  isOpen,
  onClose,
  userRole = "staff",
  isSuperAdmin = false,
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
    if (isSuperAdmin || normalizedRole === "owner") {
      return ["owner", "admin", "staff"];
    }
    if (normalizedRole === "admin") {
      return ["admin", "staff"];
    }
    return ["staff"];
  }, [normalizedRole, isSuperAdmin]);

  const [selectedRole, setSelectedRole] = useState<"owner" | "admin" | "staff">(normalizedRole);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync selected role when modal opens or user switches company context
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(normalizedRole);
      setIsPlaying(false);
    }
  }, [isOpen, normalizedRole]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
        return <Shield className="h-4 w-4" />;
      case "admin":
        return <Users className="h-4 w-4" />;
      case "staff":
        return <Truck className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-100 shadow-sm">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                Help & Video Guides
              </h3>
              <p className="text-xs text-gray-500">
                Onboarding and operational guides tailored to your active role
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Tabs / Links Navigation Bar */}
        <div className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-white border-b border-gray-100 overflow-x-auto">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
            Role Guides:
          </span>

          <div className="flex items-center gap-2">
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
                    flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shrink-0
                    ${isSelected
                      ? "bg-secondary text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                >
                  {getRoleIcon(roleKey)}
                  <span>{video.roleLabel}</span>
                  {isCurrentActiveRole && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Video Player & Details */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Responsive 16:9 Video Container */}
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-md group">
            {isPlaying && youtubeEmbedId ? (
              <iframe
                src={embedUrl}
                title={currentVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              /* Lite Video Facade (Instant Thumbnail) */
              <div
                className="relative w-full h-full cursor-pointer flex items-center justify-center bg-gray-900 overflow-hidden"
                onClick={() => setIsPlaying(true)}
              >
                {youtubeEmbedId ? (
                  <img
                    src={`https://img.youtube.com/vi/${youtubeEmbedId}/hqdefault.jpg`}
                    alt={currentVideo.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-105 transition-all duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 text-gray-300">
                    <Video className="h-12 w-12 text-gray-500 mb-2" />
                    <p className="text-sm font-semibold">Video preview ready</p>
                    <p className="text-xs text-gray-400">Click to play tutorial</p>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors" />

                {/* Pulsing Play Button */}
                <div className="absolute flex items-center justify-center w-16 h-16 rounded-full bg-red-600 text-white shadow-xl group-hover:scale-110 group-hover:bg-red-700 transition-all duration-200">
                  <Play className="h-7 w-7 fill-white ml-1" />
                </div>

                {currentVideo.duration && (
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-white text-[11px] font-medium backdrop-blur-xs">
                    {currentVideo.duration}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video Metadata & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                  {currentVideo.roleLabel} Guide
                </span>
                {/* {selectedRole === normalizedRole && (
                  <span className="text-[11px] text-gray-400 font-medium">
                    (Recommended for your current role)
                  </span>
                )} */}
              </div>

              {/* <h2 className="text-lg font-bold text-gray-900 leading-snug">
                {currentVideo.title}
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl">
                {currentVideo.description}
              </p> */}
            </div>

            {/* External YouTube Link Button */}
            <a
              href={currentVideo.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-lg shrink-0 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Watch on YouTube
            </a>
          </div>

          {/* Topics Covered Checklist */}
          {/* {currentVideo.topics && currentVideo.topics.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                Topics Covered in this Guide:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentVideo.topics.map((topic, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-gray-700 font-medium"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};
