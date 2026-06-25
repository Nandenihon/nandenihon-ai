import MainSection from "./MainSection";
import ClassItem, { type ClassItemProps } from "./ClassItem";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import type { Class } from "@repo/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://192.168.187.21:3002";

function resolveImageUrl(image: string): string {
  if (!image) {
    return "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop";
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${BACKEND_URL}${image}`;
}

function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

async function getClasses(): Promise<ClassItemProps[]> {
  try {
    const rows = await queryMySQL<RowDataPacket[]>(
      "SELECT id, class_name, level, description, register_fee, status, image_banner FROM `class` ORDER BY id DESC LIMIT 6"
    );

    return (rows as Class[]).map((item) => ({
      id: item.id,
      title: item.class_name,
      type: item.level,
      image: resolveImageUrl(item.image_banner),
      price: formatCurrency(item.register_fee),
      description: item.description,
      slot: item.status === "active",
    }));
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    return [];
  }
}

const FeaturedClass = async () => {
  const classes = await getClasses();

  return (
    <MainSection
      title="Kelas Insentif"
      description="Kelas intensif dengan mentor yang asik dan materi daging!"
    >
      {classes.length === 0 ? (
        <p className="col-span-full text-center text-gray-400 font-medium italic">
          Data kelas belum tersedia.
        </p>
      ) : classes.map((item) => (
        <ClassItem key={item.id} {...item} />
      ))}
    </MainSection>
  );
};

export default FeaturedClass;
