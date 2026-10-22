import { resolveUploadImageUrl } from "@/lib/images";
import MainSection from "./MainSection";
import ClassItem, { type ClassItemProps, type RegistrationState } from "./ClassItem";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import type { Class } from "@repo/types";
import type { LandingTranslations } from "@/lib/i18n";

const CLASS_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop";

function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(
    new Date(value)
  );
}

/** Registration is open only for active classes inside their registration window. */
function getRegistrationState(item: Class, now = Date.now()): RegistrationState {
  if (item.status !== "active") return "closed";
  const start = new Date(item.register_start).getTime();
  const end = new Date(item.register_end).getTime();
  if (Number.isFinite(start) && now < start) return "upcoming";
  if (Number.isFinite(end) && now > end) return "closed";
  return "open";
}

async function getClasses(): Promise<ClassItemProps[]> {
  try {
    // Draft and finished classes are internal; only active and closed ones are public.
    const rows = await queryMySQL<RowDataPacket[]>(
      `SELECT id, class_name, level, description, register_start, register_end, register_fee, status, image_banner
       FROM \`class\`
       WHERE status IN ('active', 'closed')
       ORDER BY FIELD(status, 'active', 'closed'), register_start DESC, id DESC
       LIMIT 6`
    );

    return (rows as Class[]).map((item) => ({
      id: item.id,
      title: item.class_name,
      type: item.level,
      image: resolveUploadImageUrl(item.image_banner, CLASS_IMAGE_FALLBACK),
      price: formatCurrency(item.register_fee),
      description: item.description,
      registration: getRegistrationState(item),
      registrationStart: formatDate(item.register_start),
      registrationEnd: formatDate(item.register_end),
    }));
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    return [];
  }
}

type FeaturedClassProps = {
  t: LandingTranslations["classPage"]["classes"];
};

const FeaturedClass = async ({ t }: FeaturedClassProps) => {
  const classes = await getClasses();

  return (
    <MainSection
      title={t.title}
      description={t.description}
    >
      {classes.length === 0 ? (
        <p className="col-span-full text-center text-gray-400 font-medium italic">
          {t.empty}
        </p>
      ) : classes.map((item) => (
        <ClassItem key={item.id} {...item} t={t} />
      ))}
    </MainSection>
  );
};

export default FeaturedClass;
