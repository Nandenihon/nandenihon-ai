import MainSection from "./MainSection";
import WebinarItem, { type WebinarItemProps } from "./WebinarItem";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import type { Seminar } from "@repo/types";

const UPLOAD_BASE_URL =
  process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://nandenihon.com";

function resolveImageUrl(image: string): string {
  if (!image) {
    return "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop";
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${UPLOAD_BASE_URL}${image.startsWith("/") ? image : `/${image}`}`;
}

function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  return value.slice(0, 5) + " WIB";
}

async function getSeminars(): Promise<WebinarItemProps[]> {
  try {
    const rows = await queryMySQL<RowDataPacket[]>(
      "SELECT id, theme, speaker, event_date, event_time, image_banner, status FROM seminar ORDER BY event_date DESC, event_time DESC LIMIT 6"
    );

    return (rows as Seminar[]).map((item) => ({
      id: item.id,
      title: item.theme,
      type: item.status,
      image: resolveImageUrl(item.image_banner),
      date: formatDate(item.event_date),
      time: formatTime(item.event_time),
    }));
  } catch (error) {
    console.error("Failed to fetch seminars:", error);
    return [];
  }
}

const FeaturedWebinar = async () => {
  const seminars = await getSeminars();

  return (
    <MainSection
      title="Webinar"
      description="Webinar padat ilmu dengan penyampaian yang gak ngebosenin."
    >
      {seminars.length === 0 ? (
        <p className="col-span-full text-center text-gray-400 font-medium italic">
          Data webinar belum tersedia.
        </p>
      ) : seminars.map((item) => (
        <WebinarItem key={item.id} {...item} />
      ))}
    </MainSection>
  );
};

export default FeaturedWebinar;
