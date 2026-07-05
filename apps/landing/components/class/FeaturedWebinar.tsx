import { resolveUploadImageUrl } from "@/lib/images";
import MainSection from "./MainSection";
import WebinarItem, { type WebinarItemProps } from "./WebinarItem";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import type { Seminar } from "@repo/types";
import type { LandingTranslations } from "@/lib/i18n";

const WEBINAR_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop";

function formatDate(value: Date | string, locale: string): string {
  return new Date(value).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string, suffix: string): string {
  return `${value.slice(0, 5)} ${suffix}`;
}

async function getSeminars(
  t: LandingTranslations["classPage"]["webinars"],
): Promise<WebinarItemProps[]> {
  try {
    const rows = await queryMySQL<RowDataPacket[]>(
      "SELECT id, theme, speaker, event_date, event_time, image_banner, status FROM seminar ORDER BY event_date DESC, event_time DESC LIMIT 6"
    );

    return (rows as Seminar[]).map((item) => ({
      id: item.id,
      title: item.theme,
      type: item.status,
      image: resolveUploadImageUrl(item.image_banner, WEBINAR_IMAGE_FALLBACK),
      date: formatDate(item.event_date, t.locale),
      time: formatTime(item.event_time, t.timeSuffix),
    }));
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
