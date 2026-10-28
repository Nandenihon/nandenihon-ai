import { resolveUploadImageUrl } from "@/lib/images";
import MainSection from "./MainSection";
import WebinarItem, { type WebinarItemProps } from "./WebinarItem";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import type { Seminar } from "@repo/types";
import type { LandingTranslations } from "@/lib/i18n";
import { whatsappLink } from "@/lib/contact";

type WebinarStatus = keyof LandingTranslations["classPage"]["webinars"]["status"];

const WEBINAR_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop";

function formatDate(value: Date | string, locale: string): string {
  return new Date(value).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

// A webinar is treated as finished this long after its start time, even if admins never set it to "done".
const WEBINAR_ASSUMED_DURATION_MS = 3 * 60 * 60 * 1000;

/** Event start as a real instant: event_date is a calendar date, event_time is WIB (UTC+7). */
function eventStart(date: Date | string, time: string): number {
  const day = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
  return new Date(`${day}T${(time || "00:00:00").slice(0, 8)}+07:00`).getTime();
}

function formatTime(value: string, suffix: string): string {
  return `${value.slice(0, 5)} ${suffix}`;
}

async function getSeminars(
  t: LandingTranslations["classPage"]["webinars"],
): Promise<WebinarItemProps[]> {
  try {
    const rows = await queryMySQL<RowDataPacket[]>(
      "SELECT id, theme, speaker, event_date, event_time, image_banner, status FROM seminar ORDER BY event_date DESC, event_time DESC LIMIT 20"
    );

    const webinars = (rows as Seminar[]).map((item) => {
      const storedStatus = (item.status in t.status ? item.status : "upcoming") as WebinarStatus;
      const start = eventStart(item.event_date, item.event_time);
      const isPast = Number.isFinite(start) && Date.now() > start + WEBINAR_ASSUMED_DURATION_MS;
      const status: WebinarStatus = isPast ? "done" : storedStatus;
      const date = formatDate(item.event_date, t.locale);
      return {
        id: item.id,
        title: item.theme,
        type: t.status[status],
        isFinished: status === "done",
        image: resolveUploadImageUrl(item.image_banner, WEBINAR_IMAGE_FALLBACK),
        date,
        time: formatTime(item.event_time, t.timeSuffix),
        registerHref: status === "done" ? undefined : whatsappLink(`${t.whatsappMessage} "${item.theme}" (${date}).`),
        registerLabel: t.registerButton,
        start,
      };
    });

    // Upcoming and ongoing webinars first (soonest first), then finished ones (most recent first).
    return webinars
      .sort((a, b) => (a.isFinished === b.isFinished ? (a.isFinished ? b.start - a.start : a.start - b.start) : a.isFinished ? 1 : -1))
      .slice(0, 6)
      .map(({ start: _start, ...webinar }) => webinar);
  } catch (error) {
    console.error("Failed to fetch seminars:", error);
    return [];
  }
}

type FeaturedWebinarProps = {
  t: LandingTranslations["classPage"]["webinars"];
};

const FeaturedWebinar = async ({ t }: FeaturedWebinarProps) => {
  const seminars = await getSeminars(t);

  return (
    <MainSection
      title={t.title}
      description={t.description}
    >
      {seminars.length === 0 ? (
        <p className="col-span-full text-center text-gray-400 font-medium italic">
          {t.empty}
        </p>
      ) : seminars.map((item) => (
        <WebinarItem key={item.id} {...item} />
      ))}
    </MainSection>
  );
};

export default FeaturedWebinar;
