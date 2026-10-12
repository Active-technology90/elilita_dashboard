// src/constants/helpVideos.ts

export interface HelpVideo {
  id: string;
  role: "owner" | "admin" | "staff";
  roleLabel: string;
  title: string;
  description: string;
  youtubeId?: string;
  youtubeUrl: string;
  duration?: string;
  topics: string[];
}

/**
 * Safely extracts the 11-character YouTube video ID from various URL formats or raw IDs
 * (e.g., https://youtu.be/6yO7MxZSI6w, https://www.youtube.com/watch?v=6yO7MxZSI6w&t=3s, or "6yO7MxZSI6w")
 */
export function extractYoutubeId(urlOrId?: string): string {
  if (!urlOrId) return "";
  const trimmed = urlOrId.trim();

  // Ignore placeholder text
  if (trimmed.includes("YOUR_")) return "";

  // Standard full YouTube watch URL (handles &t=..., &feature=..., etc.)
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  // Short URL (youtu.be/...) or embed URL (youtube.com/embed/...)
  const shortOrEmbedMatch = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed|v)\/)([a-zA-Z0-9_-]{11})/,
  );
  if (shortOrEmbedMatch && shortOrEmbedMatch[1]) {
    return shortOrEmbedMatch[1];
  }

  // Direct 11-character alphanumeric ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return "";
}

/**
 * Extracts start time in seconds from YouTube URL parameter (e.g. &t=3s or ?t=30)
 */
export function extractYoutubeStartSeconds(urlOrId?: string): number | null {
  if (!urlOrId) return null;
  const match = urlOrId.match(/[?&]t=(\d+)s?/);
  return match && match[1] ? parseInt(match[1], 10) : null;
}

export const ROLE_HELP_VIDEOS: Record<"owner" | "admin" | "staff", HelpVideo> = {
  // -------------------------------------------------------------------------
  // Company Owner — https://youtu.be/C71wNbptvV4
  // -------------------------------------------------------------------------
  owner: {
    id: "owner-guide",
    role: "owner",
    roleLabel: "Company Owner",
    title: "Elilita Help for Company Owners",
    description:
      "This is help for company owners to get a clue for their own dashboard at first instance for the platform or any time to get started.",
    youtubeId: "C71wNbptvV4",
    youtubeUrl: "https://youtu.be/C71wNbptvV4",
    duration: "",
    topics: [
      "Company Profile & KYC setup",
      "Bank Account & Settlement Configuration",
      "Inviting Admins and Dispatchers",
      "Subscription Plans & Billing",
    ],
  },

  // -------------------------------------------------------------------------
  // Company Admin — https://youtu.be/FvYD_wqMasM
  // -------------------------------------------------------------------------
  admin: {
    id: "admin-guide",
    role: "admin",
    roleLabel: "Company Admin",
    title: "Elilita Help for Company Admin",
    description:
      "This is help for company administrators to get a clue for their own dashboard at first instance for the platform or any time to get started.",
    youtubeId: "FvYD_wqMasM",
    youtubeUrl: "https://youtu.be/FvYD_wqMasM",
    duration: "",
    topics: [
      "Creating and Managing Products & Categories",
      "Managing Service Offerings & Availability",
      "Reviewing Orders & Handling Customer Inquiries",
      "Branch Staff & Availability Schedules",
    ],
  },

  // -------------------------------------------------------------------------
  // Company Dispatcher — https://youtu.be/3UHIaKv6_Nc
  // -------------------------------------------------------------------------
  staff: {
    id: "dispatcher-guide",
    role: "staff",
    roleLabel: "Dispatcher",
    title: "Elilita Help for Company Dispatcher",
    description:
      "This is help for the company dispatcher to get a clue for their own dashboard at first instance for the platform or any time to get started.",
    youtubeId: "3UHIaKv6_Nc",
    youtubeUrl: "https://youtu.be/3UHIaKv6_Nc",
    duration: "",
    topics: [
      "Real-time Order Monitoring & Queue Management",
      "Assigning Deliveries to Couriers",
      "Tracking Live Locations",
      "Updating Order Statuses & Handling Escalations",
    ],
  },
};