
type SupportedDateLanguage = "am" | "en";

type DateInput = string | Date | number;

const TIME_ZONE = "Africa/Addis_Ababa";

const getLanguage = (
  language: string,
): SupportedDateLanguage => {
  return language.toLowerCase().startsWith("am") ? "am" : "en";
};

const getValidDate = (value: DateInput): Date | null => {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getLocale = (language: SupportedDateLanguage) => {
  return language === "am"
    ? "am-ET-u-ca-ethiopic"
    : "en-ET-u-ca-gregory";
};

// Full date: 24 November 2026 / 16 ህዳር 2019
export const formatDate = (
  value: DateInput,
  language: string = "en",
): string => {
  const date = getValidDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(getLocale(getLanguage(language)), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
};

// Time: 4:30 PM / 10:30 ማታ
export const formatTime = (
  value: DateInput,
  language: string = "en",
): string => {
  const date = getValidDate(value);
  if (!date) return "—";

  if (getLanguage(language) === "en") {
    return new Intl.DateTimeFormat("en-ET", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: TIME_ZONE,
    }).format(date);
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TIME_ZONE,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";

  const ethiopianHour = ((hour + 5) % 12) + 1;

  const period =
    hour >= 6 && hour < 12
      ? "ጠዋት"
      : hour >= 12 && hour < 18
        ? "ቀን"
        : hour >= 18
          ? "ማታ"
          : "ሌሊት";

  return `${ethiopianHour}:${minute} ${period}`;
};

// Full date and time
export const formatDateTime = (
  value: DateInput,
  language: string = "en",
): string => {
  const date = getValidDate(value);
  if (!date) return "—";

  if (getLanguage(language) === "am") {
    return `${formatDate(date, language)}, ${formatTime(date, language)}`;
  }

  return new Intl.DateTimeFormat("en-ET", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIME_ZONE,
  }).format(date);
};

// Short date: 24 Nov 2026 / 16 ህዳር 2019
export const formatShortDate = (
  value: DateInput,
  language: string = "en",
): string => {
  const date = getValidDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(getLocale(getLanguage(language)), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
};

// Date without year
export const formatMonthDay = (
  value: DateInput,
  language: string = "en",
): string => {
  const date = getValidDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(getLocale(getLanguage(language)), {
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(date);
};
